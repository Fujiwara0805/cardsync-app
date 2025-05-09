import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // パスを確認
import { supabase } from '@/lib/supabaseClient';
import { getDriveClient, getSheetsClient, getVisionClient } from '@/lib/googleAuth'; // Visionクライアントも追加
import { google } from 'googleapis'; // googleオブジェクトも使う可能性があるのでインポート

// OCR結果整形関数を大幅に簡略化
function parseOcrResult(texts: any[]): Record<string, string> {
  const extractedData: Record<string, string> = {
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
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: '認証されていません。' }, { status: 401 });
  }

  try {
    console.log('Card processing started for user:', session.user.id);

    const { data: userSettings, error: dbError } = await supabase
      .from('user_drive_settings')
      .select('google_folder_id, google_spreadsheet_id')
      .eq('user_id', session.user.id)
      .single();

    if (dbError || !userSettings?.google_folder_id || !userSettings?.google_spreadsheet_id) {
      console.error('DBエラーまたは設定未完了:', dbError);
      return NextResponse.json({ error: 'Google DriveのフォルダIDまたはスプレッドシートIDが設定されていません。' }, { status: 400 });
    }
    
    const { google_folder_id: folderId, google_spreadsheet_id: spreadsheetId } = userSettings;
    console.log(`Using Folder ID: ${folderId}, Spreadsheet ID: ${spreadsheetId}`);

    const sheets = await getSheetsClient();
    const sheetName = '名刺管理データベース'; // シート名は任意ですが、統一
    const headerRow = [ // 新しいヘッダー行
        '名刺情報', 
        '更新日', 
        'メモ' 
    ];
    const expectedHeaderColumnCount = headerRow.length; // C列まで (3列)

    // --- ヘッダー行の書き込み処理 ---
    try {
        const getHeaderRes = await sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: `'${sheetName}'!A1:${String.fromCharCode(64 + expectedHeaderColumnCount)}1`, 
        });

        let needsHeader = true;
        if (getHeaderRes.data.values && getHeaderRes.data.values.length > 0) {
            const existingHeader = getHeaderRes.data.values[0];
            // ヘッダーが完全に一致するか確認
            if (existingHeader.length === expectedHeaderColumnCount && 
                existingHeader[0] === headerRow[0] &&
                existingHeader[1] === headerRow[1] &&
                existingHeader[2] === headerRow[2]) {
                console.log('Header row already exists and matches.');
                needsHeader = false;
            } else if (existingHeader.length > 0) {
                 console.log('Header row exists but does not match. It will be overwritten.');
                 // 上書きする場合は needsHeader = true のまま
            }
        }
        
        // もしシートが存在しない場合、needsHeaderがtrueのままでもgetでエラーになるので、
        // updateの前にシート存在確認＆作成を行う
        if (needsHeader) {
            try {
                await sheets.spreadsheets.get({ spreadsheetId: spreadsheetId, ranges: [`'${sheetName}'!A1`] });
            } catch (getSheetError: any) {
                 if (getSheetError.code === 400 && getSheetError.message?.includes('Unable to parse range')) {
                    console.log(`Sheet '${sheetName}' does not exist. Creating it...`);
                    await sheets.spreadsheets.batchUpdate({
                        spreadsheetId: spreadsheetId,
                        requestBody: { requests: [{ addSheet: { properties: { title: sheetName } } }] },
                    });
                    console.log(`Sheet '${sheetName}' created.`);
                 } else {
                    throw getSheetError; 
                 }
            }
            // ヘッダーをクリアしてから書き込む (既存の不一致ヘッダーを上書きするため)
            await sheets.spreadsheets.values.clear({
                spreadsheetId: spreadsheetId,
                range: `'${sheetName}'!A1:${String.fromCharCode(64 + expectedHeaderColumnCount)}1`,
            });
            console.log('Writing new header row to the sheet.');
            await sheets.spreadsheets.values.update({
                spreadsheetId: spreadsheetId,
                range: `'${sheetName}'!A1`,
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: [headerRow] },
            });
        }
    } catch (headerError: any) {
        console.error('Error processing or writing header row:', headerError.message);
    }
    // --- ヘッダー行書き込み処理ここまで ---

    const drive = await getDriveClient();
    const listRes = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false and (mimeType='image/jpeg' or mimeType='image/png')`, // HEICに関する記述を削除し、JPEGとPNGのみを対象に戻す
      fields: 'files(id, name, webViewLink, mimeType)', 
      pageSize: 10,
    });
    console.log('Drive API list response:', JSON.stringify(listRes.data, null, 2));


    const files = listRes.data.files;
    if (!files || files.length === 0) {
      console.log('No new image files found in Drive folder (JPEG/PNG only).');
      return NextResponse.json({ message: '処理対象の新しいJPEG/PNG画像ファイルが見つかりませんでした。ヘッダー行は確認・作成されました。' }, { status: 200 });
    }
    console.log(`Found ${files.length} JPEG/PNG files to process.`);

    const allExtractedData = [];
    const vision = getVisionClient();

    for (const file of files) {
      if (!file.id || !file.name) continue;
      
      // HEICファイルはここで処理対象外とする
      if (file.name.toLowerCase().endsWith('.heic') || (file.mimeType && file.mimeType.toLowerCase().includes('heic'))) {
          console.log(`Skipping HEIC file: ${file.name}`);
          const skippedDataResult = { 
              textInfo: `HEICファイルは処理対象外です (${file.name})`, 
              userNotes: '',
              sourceFileName: file.name,
              driveFileLink: file.webViewLink || ''
          };
          allExtractedData.push(skippedDataResult);
          continue; // 次のファイルへ
      }

      console.log(`Processing file: ${file.name} (ID: ${file.id}, Type: ${file.mimeType})`);
      let parsedDataResult: Record<string, string>;
      let imageBuffer: Buffer;

      try {
        if (file.mimeType === 'image/jpeg' || file.mimeType === 'image/png') {
            const fileRes = await drive.files.get(
              { fileId: file.id, alt: 'media' },
              { responseType: 'arraybuffer' } 
            );
            imageBuffer = Buffer.from(fileRes.data as ArrayBuffer);
        } else {
          // 基本的に上のDrive検索クエリでフィルタリングされるはずだが、念のため
          console.log(`Skipping non-JPEG/PNG file: ${file.name} (MIME: ${file.mimeType})`);
          parsedDataResult = { textInfo: `非対応ファイル形式 (${file.name})`, userNotes: '' };
          parsedDataResult.sourceFileName = file.name;
          parsedDataResult.driveFileLink = file.webViewLink || '';
          allExtractedData.push(parsedDataResult);
          continue;
        }
        
        const [ocrResult] = await vision.textDetection({
          image: { content: imageBuffer },
        });
        
        const texts = ocrResult.textAnnotations;
        parsedDataResult = parseOcrResult(texts || []); // 空配列を渡す

      } catch (fileProcessingError: any) {
        console.error(`Error processing file ${file.name} (ID: ${file.id}):`, fileProcessingError.message);
        parsedDataResult = { textInfo: `ファイル処理エラー (${file.name}): ${fileProcessingError.message}`, userNotes: '' };
      }
      
      parsedDataResult.sourceFileName = file.name;
      parsedDataResult.driveFileLink = file.webViewLink || '';
      allExtractedData.push(parsedDataResult);
    }

    if (allExtractedData.length > 0) {
      const valuesToWrite = allExtractedData.map(data => [
        data.textInfo || '',    // 名刺情報 (OCR全文)
        new Date().toISOString(), // 更新日
        data.userNotes || '',   // メモ (今回は空)
        // 元ファイル名とDriveリンクは今回はスプレッドシートに含めないが、
        // デバッグや将来のために保持しておきたい場合はコメントアウトを解除
        // data.sourceFileName || '',
        // data.driveFileLink || '',
      ]);

      await sheets.spreadsheets.values.append({
        spreadsheetId: spreadsheetId,
        range: `'${sheetName}'!A:${String.fromCharCode(64 + expectedHeaderColumnCount)}`, 
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: valuesToWrite },
      });
      console.log(`${allExtractedData.length} records appended to Google Sheets.`);
      return NextResponse.json({ message: `${allExtractedData.length}件の名刺データが処理され、スプレッドシートに書き込まれました。`, results: allExtractedData }, { status: 200 });
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
