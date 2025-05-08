import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // パスを確認
import { supabase } from '@/lib/supabaseClient';
import { getDriveClient, getSheetsClient, getVisionClient } from '@/lib/googleAuth'; // Visionクライアントも追加
import { google } from 'googleapis'; // googleオブジェクトも使う可能性があるのでインポート

// 仮のOCR結果整形関数 (実際にはもっと複雑になる)
function parseOcrResult(texts: any[]): Record<string, string> {
  const extractedData: Record<string, string> = {
    name: '',
    company: '',
    title: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    notes: '', // OCR結果全体をここに入れるなど
  };
  
  if (texts.length > 0 && texts[0].description) {
    const fullText = texts[0].description;
    extractedData.notes = fullText; // まず全テキストをメモに

    // ここで正規表現やキーワード検索を使って各項目を抽出するロジックを実装
    // 以下は非常に単純な例
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const phoneRegex = /(\d{2,4}-\d{2,4}-\d{3,4}|\d{10,11})/; // 簡単な電話番号パターン

    const emailMatch = fullText.match(emailRegex);
    if (emailMatch) extractedData.email = emailMatch[0];

    const phoneMatch = fullText.match(phoneRegex);
    if (phoneMatch) extractedData.phone = phoneMatch[0];
    
    // 会社名、氏名、役職、住所などはより高度な抽出ロジックが必要
    // 例: "株式会社" を含む行を会社名候補にするなど
    const lines = fullText.split('\n');
    for (const line of lines) {
      if (line.includes('株式会社') || line.includes('合同会社') || line.includes('有限会社')) {
        if (!extractedData.company) extractedData.company = line.trim();
      }
      // 他の項目の抽出ロジック...
    }
  }
  return extractedData;
}


export async function POST(request: Request) { // このAPIは時間がかかる可能性があるのでPOST推奨
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: '認証されていません。' }, { status: 401 });
  }

  try {
    console.log('Card processing started for user:', session.user.id);

    // 1. ユーザーの設定情報をSupabaseから取得
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

    // 2. Google Drive APIでファイル一覧取得
    const drive = await getDriveClient();
    const listRes = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false and (mimeType='image/jpeg' or mimeType='image/png')`, // 画像ファイルのみ対象
      fields: 'files(id, name, webViewLink)', 
      pageSize: 10, // 一度に処理するファイル数 (多すぎるとタイムアウトの可能性)
    });

    const files = listRes.data.files;
    if (!files || files.length === 0) {
      console.log('No new image files found in Drive folder.');
      return NextResponse.json({ message: '処理対象の新しい画像ファイルが見つかりませんでした。' }, { status: 200 });
    }
    console.log(`Found ${files.length} files to process.`);

    const allExtractedData = [];
    const vision = getVisionClient();

    for (const file of files) {
      if (!file.id || !file.name) continue;
      console.log(`Processing file: ${file.name} (ID: ${file.id})`);

      try {
        // 3. 個々のファイルをダウンロード (Drive APIで内容取得)
        const fileRes = await drive.files.get(
          { fileId: file.id, alt: 'media' },
          { responseType: 'arraybuffer' } // Vision APIはBufferを期待するのでarraybufferで取得
        );
        const imageBuffer = Buffer.from(fileRes.data as ArrayBuffer);

        // 4. ダウンロードした画像データをOCR API (Google Cloud Vision API) に送信
        const [ocrResult] = await vision.textDetection({
          image: { content: imageBuffer },
          // imageContext: { languageHints: ["ja"] } // 必要に応じて言語ヒント
        });
        
        const texts = ocrResult.textAnnotations;
        if (texts && texts.length > 0) {
          console.log(`OCR successful for ${file.name}. Full text length: ${texts[0]?.description?.length}`);
          // 5. 結果を整形
          const parsedData = parseOcrResult(texts);
          parsedData.sourceFileName = file.name; // 元ファイル名も記録
          parsedData.driveFileLink = file.webViewLink || ''; // Driveへのリンク
          allExtractedData.push(parsedData);
        } else {
          console.log(`No text found by OCR for ${file.name}`);
          allExtractedData.push({
              name: '', company: '', title: '', email: '', phone: '', address: '', website: '', 
              notes: `OCRでテキスト抽出不可: ${file.name}`,
              sourceFileName: file.name,
              driveFileLink: file.webViewLink || ''
          });
        }

        // TODO: 処理済みファイルをマークする (例: Driveでカスタムプロパティを設定、ファイル名を変更、別フォルダに移動など)
        // この実装は複雑になるため、まずはリストアップとOCR、書き込みに注力

      } catch (fileProcessingError: any) {
        console.error(`Error processing file ${file.name} (ID: ${file.id}):`, fileProcessingError.message);
        allExtractedData.push({
            name: '', company: '', title: '', email: '', phone: '', address: '', website: '',
            notes: `ファイル処理エラー (${file.name}): ${fileProcessingError.message}`,
            sourceFileName: file.name,
            driveFileLink: file.webViewLink || ''
        });
      }
    } // end of for loop

    // 6. 整形したデータをSheets APIでスプレッドシートに書き込み
    if (allExtractedData.length > 0) {
      const sheets = await getSheetsClient();
      const sheetName = '名刺データ'; // 書き込むシート名
      const headerRow = [ // 定義するヘッダー行
        '氏名', '会社名', '役職', 'メールアドレス', '電話番号', 
        '住所', 'ウェブサイト', 'メモ (OCR全文)', '元ファイル名', 
        'Driveファイルリンク', '処理日時'
      ];

      // --- ヘッダー行の書き込みロジックここから ---
      try {
        // まずシートの既存データをA1セルから少量読み取ってみる (ヘッダーがあるか確認のため)
        const getHeaderRes = await sheets.spreadsheets.values.get({
          spreadsheetId: spreadsheetId,
          range: `${sheetName}!A1:K1`, // ヘッダー行の範囲 (列数はヘッダーに合わせる)
        });

        let needsHeader = true;
        if (getHeaderRes.data.values && getHeaderRes.data.values.length > 0) {
          // A1セルに何かデータがあれば、ヘッダーは既に存在するとみなす (簡易的な判定)
          // より厳密には、読み取った内容が定義したヘッダーと一致するか確認する
          const existingHeader = getHeaderRes.data.values[0];
          if (JSON.stringify(existingHeader) === JSON.stringify(headerRow)) {
              needsHeader = false;
              console.log('Header row already exists in the sheet.');
          } else if (existingHeader.length > 0) {
              console.log('Sheet is not empty, assuming header exists or different data format. Will not write new header.');
              // ここで、もし既存ヘッダーが異なっていたらエラーにするか、上書きするかなどの判断も可能
              // 今回は、何かデータがあれば新しいヘッダーは書き込まない方針
              needsHeader = false; 
          }
        }

        if (needsHeader) {
          console.log('Writing header row to the sheet.');
          await sheets.spreadsheets.values.update({ // updateでA1から書き込む (appendだと最終行になる)
            spreadsheetId: spreadsheetId,
            range: `${sheetName}!A1`, // ヘッダーを書き込む開始セル
            valueInputOption: 'USER_ENTERED',
            requestBody: {
              values: [headerRow], // ヘッダー行は2次元配列で渡す
            },
          });
        }
      } catch (headerError: any) {
        // getで範囲が存在しない場合 (シートが全くの空など) はエラーになることがある
        if (headerError.code === 400 && headerError.message?.includes('Unable to parse range')) {
          console.log('Sheet appears to be empty or range does not exist. Writing header row.');
          // この場合もヘッダーを書き込む
          await sheets.spreadsheets.values.update({
            spreadsheetId: spreadsheetId,
            range: `${sheetName}!A1`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
              values: [headerRow],
            },
          });
        } else {
          // その他のヘッダー処理エラー
          console.error('Error processing header row:', headerError.message);
          // ヘッダー書き込みに失敗しても、データ書き込みは試行するかもしれないし、ここで処理を中断するかもしれない
          // ここでは、エラーをログに出力し、データ書き込みに進む
        }
      }
      // --- ヘッダー行の書き込みロジックここまで ---


      const valuesToWrite = allExtractedData.map(data => [
        data.name,
        data.company,
        data.title,
        data.email,
        data.phone,
        data.address,
        data.website,
        data.notes,
        data.sourceFileName,
        data.driveFileLink,
        new Date().toISOString() // 処理日時
      ]);

      // ヘッダーを書き込んだ後なので、データは常に追記 (append) で良い
      await sheets.spreadsheets.values.append({
        spreadsheetId: spreadsheetId,
        range: `${sheetName}!A:K`, // A列からK列に追記
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: valuesToWrite,
        },
      });
      console.log(`${allExtractedData.length} records appended to Google Sheets.`);
      return NextResponse.json({ message: `${allExtractedData.length}件の名刺データが処理され、スプレッドシートに書き込まれました。`, results: allExtractedData }, { status: 200 });
    } else {
      console.log('No data extracted to write to sheets.');
      return NextResponse.json({ message: '抽出できるデータがありませんでした。' }, { status: 200 });
    }

  } catch (e: any) {
    console.error('Card processing API error:', e);
    const errorMessage = e.response?.data?.error?.message || e.message || '名刺処理中にエラーが発生しました。';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
