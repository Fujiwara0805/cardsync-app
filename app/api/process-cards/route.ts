import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { nextAuthConfiguration } from "@/app/api/auth/[...nextauth]/route"; // パスを確認
import { supabase } from '@/lib/supabaseClient';
import { getDriveClient, getSheetsClient, getVisionClient } from '@/lib/googleAuth'; // Visionクライアントも追加
import { google } from 'googleapis'; // googleオブジェクトも使う可能性があるのでインポート

// OCR結果整形関数を大幅に簡略化
function parseOcrResult(texts: any[]): { textInfo: string; userNotes: string } {
  const extractedData: { textInfo: string; userNotes: string } = {
    textInfo: '', // 名刺情報 (OCR全文)
    userNotes: '', // 将来ユーザーが入力するメモ用 (今回は空)
  };
  
  if (texts && texts.length > 0 && texts[0] && texts[0].description) {
    extractedData.textInfo = texts[0].description.replace(/\n/g, ' '); // 改行をスペースに置換して1行にまとめる
  } else {
    extractedData.textInfo = 'OCRでテキスト抽出不可';
  }
  
  return extractedData;
}


export async function POST(request: Request) {
  const session = await getServerSession(nextAuthConfiguration);
  if (!session?.user?.id) {
    return NextResponse.json({ error: '認証されていません。' }, { status: 401 });
  }

  try {
    console.log('Card processing started for user:', session.user.id);

    const { data: userSettings, error: dbError } = await supabase
      .from('user_drive_settings')
      .select('google_folder_id, google_spreadsheet_id') // 'sheet_name' を select から削除
      .eq('user_id', session.user.id)
      .single();

    if (dbError || !userSettings?.google_folder_id || !userSettings?.google_spreadsheet_id) {
      console.error('DBエラーまたは設定未完了:', dbError);
      console.error('Supabase error details (process-cards):', JSON.stringify(dbError, null, 2));
      return NextResponse.json({ error: 'Google DriveのフォルダIDまたはスプレッドシートIDが設定されていません。' }, { status: 400 });
    }
    
    const { google_folder_id: folderId, google_spreadsheet_id: spreadsheetId } = userSettings;
    const sheetName = '名刺管理データベース'; // 固定値を使用
    
    console.log(`Using Folder ID: ${folderId}, Spreadsheet ID: ${spreadsheetId}, Sheet Name: ${sheetName}`);

    const sheets = await getSheetsClient();
    const headerRow = [ 
        '名刺情報', 
        '更新日', 
        'メモ',
        'ファイル名',
        'File ID'
    ];
    const expectedHeaderColumnCount = headerRow.length;

    // --- ヘッダー行の書き込み処理 ---
    try {
        const getHeaderRes = await sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: `\'${sheetName}\'!A1:${String.fromCharCode(64 + expectedHeaderColumnCount)}1`, // <--- 範囲を更新
        });

        let needsHeader = true;
        if (getHeaderRes.data.values && getHeaderRes.data.values.length > 0) {
            const existingHeader = getHeaderRes.data.values[0];
            // ヘッダーが完全に一致するか確認
            if (existingHeader.length === expectedHeaderColumnCount && 
                existingHeader.every((val, index) => val === headerRow[index])) { // より堅牢な比較
                console.log('Header row already exists and matches.');
                needsHeader = false;
            } else if (existingHeader.length > 0) {
                 console.log('Header row exists but does not match. It will be overwritten.');
            }
        }
        
        if (needsHeader) {
            try {
                await sheets.spreadsheets.get({ spreadsheetId: spreadsheetId, ranges: [`\'${sheetName}\'!A1`] });
            } catch (getSheetError: any) {
                 if (getSheetError.code === 400 && getSheetError.message?.includes('Unable to parse range')) {
                    console.log(`Sheet \'${sheetName}\' does not exist. Creating it...`);
                    await sheets.spreadsheets.batchUpdate({
                        spreadsheetId: spreadsheetId,
                        requestBody: { requests: [{ addSheet: { properties: { title: sheetName } } }] },
                    });
                    console.log(`Sheet \'${sheetName}\' created.`);
                 } else {
                    throw getSheetError; 
                 }
            }
            await sheets.spreadsheets.values.clear({
                spreadsheetId: spreadsheetId,
                range: `\'${sheetName}\'!A1:${String.fromCharCode(64 + expectedHeaderColumnCount)}1`, 
            });
            console.log('Writing new header row to the sheet.');
            await sheets.spreadsheets.values.update({
                spreadsheetId: spreadsheetId,
                range: `\'${sheetName}\'!A1`,
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: [headerRow] },
            });
        }
    } catch (headerError: any) {
        console.error('Error processing or writing header row:', headerError.message);
        // ここで処理を中断させないように、エラーをログに出力するだけにするか、
        // または、より詳細なエラーハンドリングを行う
    }
    // --- ヘッダー行書き込み処理ここまで ---

    const drive = await getDriveClient();
    const listRes = await drive.files.list({
      q: `\'${folderId}\' in parents and trashed = false and (mimeType=\'image/jpeg\' or mimeType=\'image/png\')`,
      fields: 'files(id, name, webViewLink, mimeType)', 
      pageSize: 10,
    });
    console.log('Drive API list response files:', JSON.stringify(listRes.data.files, null, 2));


    const files = listRes.data.files;
    if (!files || files.length === 0) {
      console.log('No new image files found in Drive folder (JPEG/PNG only).');
      return NextResponse.json({ message: '処理対象の新しいJPEG/PNG画像ファイルが見つかりませんでした。ヘッダー行は確認・作成されました。' }, { status: 200 });
    }
    console.log(`Found ${files.length} JPEG/PNG files to process.`);

    const dataForSheet: any[] = []; // スプレッドシート書き込み用のデータを格納する配列
    const vision = getVisionClient();

    for (const file of files) {
      if (!file.id || !file.name) continue;
      
      let ocrTextInfo = '';
      let userNotesInfo = '';
      let sourceFileNameInfo = file.name;
      let fileIdInfo = file.id; // file.id を取得

      if (file.name.toLowerCase().endsWith('.heic') || (file.mimeType && file.mimeType.toLowerCase().includes('heic'))) {
          console.log(`Skipping HEIC file: ${file.name}`);
          ocrTextInfo = `HEICファイルは処理対象外です (${file.name})`;
      } else if (file.mimeType === 'image/jpeg' || file.mimeType === 'image/png') {
        console.log(`Processing file: ${file.name} (ID: ${file.id}, Type: ${file.mimeType})`);
        try {
          const fileRes = await drive.files.get(
            { fileId: file.id, alt: 'media' },
            { responseType: 'arraybuffer' } 
          );
          const imageBuffer = Buffer.from(fileRes.data as ArrayBuffer);
          
          const [ocrResult] = await vision.textDetection({
            image: { content: imageBuffer },
          });
          
          const texts = ocrResult.textAnnotations;
          const parsedOcr = parseOcrResult(texts || []);
          ocrTextInfo = parsedOcr.textInfo;
          userNotesInfo = parsedOcr.userNotes; // parseOcrResult に userNotes があればそれを使う

        } catch (fileProcessingError: any) {
          console.error(`Error processing file ${file.name} (ID: ${file.id}):`, fileProcessingError.message);
          ocrTextInfo = `ファイル処理エラー (${file.name}): ${fileProcessingError.message}`;
        }
      } else {
        console.log(`Skipping non-JPEG/PNG file: ${file.name} (MIME: ${file.mimeType})`);
        ocrTextInfo = `非対応ファイル形式 (${file.name})`;
      }
      
      dataForSheet.push([
        ocrTextInfo,
        new Date().toISOString(),
        userNotesInfo,
        sourceFileNameInfo,
        fileIdInfo // <--- File ID をデータに追加
      ]);
    }

    if (dataForSheet.length > 0) {
      await sheets.spreadsheets.values.append({
        spreadsheetId: spreadsheetId,
        range: `\'${sheetName}\'!A:${String.fromCharCode(64 + expectedHeaderColumnCount)}`, // <--- 範囲を更新
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: dataForSheet },
      });
      console.log(`${dataForSheet.length} records appended to Google Sheets.`);
      return NextResponse.json({ message: `${dataForSheet.length}件の名刺データが処理され、スプレッドシートに書き込まれました。` }, { status: 200 });
    } else {
      console.log('No data processed to write to sheets.');
      return NextResponse.json({ message: '処理できるデータがありませんでした。ヘッダー行は確認・作成されました。' }, { status: 200 });
    }

  } catch (e: any) {
    console.error('Card processing API error:', e);
    const errorMessage = e.response?.data?.error?.message || e.message || '名刺処理中にエラーが発生しました。';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
