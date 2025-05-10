import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { nextAuthConfiguration } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from '@/lib/supabaseClient';
import { getDriveClient, getSheetsClient, getVisionClient } from '@/lib/googleAuth';

// parseOcrResult関数 (process-cards/route.tsからコピーまたは共通化)
function parseOcrResult(texts: any[]): { textInfo: string; userNotes: string } {
  const extractedData: { textInfo: string; userNotes: string } = {
    textInfo: '', 
    userNotes: '', // ここはAPIから渡されるメモで上書きされる
  };
  if (texts && texts.length > 0 && texts[0] && texts[0].description) {
    extractedData.textInfo = texts[0].description.replace(/\n/g, ' ');
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
    const { fileId, fileName, memo: userProvidedMemo } = await request.json();
    if (!fileId || !fileName) {
      return NextResponse.json({ error: 'ファイルIDまたはファイル名が不足しています。' }, { status: 400 });
    }

    const { data: userSettings, error: dbError } = await supabase
      .from('user_drive_settings')
      .select('google_spreadsheet_id')
      .eq('user_id', session.user.id)
      .single();

    if (dbError || !userSettings?.google_spreadsheet_id) {
      return NextResponse.json({ error: 'スプレッドシートIDが設定されていません。' }, { status: 400 });
    }
    const spreadsheetId = userSettings.google_spreadsheet_id;

    const drive = await getDriveClient();
    const vision = getVisionClient();
    const sheets = await getSheetsClient();
    
    let parsedDataResult: { textInfo: string; userNotes: string; sourceFileName?: string; driveFileLink?: string; };
    let imageBuffer: Buffer;

    console.log(`Processing single file: ${fileName} (ID: ${fileId})`);

    try {
      const fileRes = await drive.files.get(
        { fileId: fileId, alt: 'media' },
        { responseType: 'arraybuffer' } 
      );
      imageBuffer = Buffer.from(fileRes.data as ArrayBuffer);
      
      const [ocrResultVision] = await vision.textDetection({ // 変数名を変更
        image: { content: imageBuffer },
      });
      
      const texts = ocrResultVision.textAnnotations;
      const ocrData = parseOcrResult(texts || []);
      parsedDataResult = {
          ...ocrData,
          userNotes: userProvidedMemo || '', // APIから渡されたメモを使用
          sourceFileName: fileName,
          // driveFileLink: file.webViewLink || '' // 必要であればDriveから再取得
      };

    } catch (fileProcessingError: any) {
      console.error(`Error processing file ${fileName} (ID: ${fileId}):`, fileProcessingError.message);
      parsedDataResult = { 
          textInfo: `ファイル処理エラー (${fileName}): ${fileProcessingError.message}`, 
          userNotes: userProvidedMemo || '',
          sourceFileName: fileName,
      };
    }
    
    // スプレッドシートへの書き込み
    const sheetName = '名刺管理データベース';
    // ヘッダー: ['名刺情報', '更新日', 'メモ', 'ファイル名']
    const headerColumnCount = 4; 
    const valuesToWrite = [[
      parsedDataResult.textInfo || '',
      new Date().toISOString(),
      parsedDataResult.userNotes || '',
      parsedDataResult.sourceFileName || fileName
    ]];

    await sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetId,
      range: `'${sheetName}'!A:${String.fromCharCode(64 + headerColumnCount)}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: valuesToWrite },
    });

    console.log(`Record for ${fileName} appended to Google Sheets.`);
    return NextResponse.json({ message: `名刺「${fileName}」の情報が処理され、スプレッドシートに書き込まれました。`}, { status: 200 });

  } catch (e: any) {
    console.error('Single card processing API error:', e);
    return NextResponse.json({ error: '名刺処理中にエラーが発生しました。', details: e.message }, { status: 500 });
  }
}
