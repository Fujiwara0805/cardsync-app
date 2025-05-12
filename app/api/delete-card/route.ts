import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { nextAuthConfiguration } from "@/lib/authConfig";
import { getSheetsClient } from '@/lib/googleAuth';
import { supabase } from '@/lib/supabaseClient';
import { google } from 'googleapis';

export async function POST(request: Request) {
  const session = await getServerSession(nextAuthConfiguration) as any;
  if (!session?.user?.id || !session?.accessToken) {
    return NextResponse.json({ error: '認証されていません。', details: '認証情報が不足しています。' }, { status: 401 });
  }

  try {
    const { fileId } = await request.json();
    if (!fileId) {
      return NextResponse.json({ error: 'ファイルIDが指定されていません。' }, { status: 400 });
    }
    
    const userId = session.user.id;
    
    // ユーザー設定を取得
    const { data: userSettings, error: dbError } = await supabase
      .from('user_drive_settings')
      .select('google_spreadsheet_id')
      .eq('user_id', userId)
      .single();

    if (dbError || !userSettings?.google_spreadsheet_id) {
      return NextResponse.json({ error: 'スプレッドシートIDが設定されていません。' }, { status: 400 });
    }
    
    const spreadsheetId = userSettings.google_spreadsheet_id;
    const sheetName = '名刺管理データベース';
    
    // 1. ユーザーのアクセストークンを使用してDriveファイルを削除
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: session.accessToken });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    
    try {
      await drive.files.update({
        fileId: fileId,
        requestBody: { trashed: true }
      });
    } catch (driveError: any) {
      console.error('Drive file deletion error:', driveError);
      return NextResponse.json({ 
        error: 'Google Driveファイルの削除に失敗しました。', 
        details: driveError.message || 'ファイルに対する権限がないか、すでに削除されています。'
      }, { status: 403 });
    }
    
    // 2. スプレッドシートから該当する行を削除 (サービスアカウント経由)
    const sheets = await getSheetsClient();
    
    // ファイルIDの列を特定するためにヘッダー行を取得
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A1:Z1`,
    });
    
    const headerRow = headerResponse.data.values?.[0] || [];
    const fileIdColumnIndex = headerRow.findIndex(h => h === 'File ID');
    
    if (fileIdColumnIndex === -1) {
      return NextResponse.json({ 
        message: "Google Driveのファイルは削除されましたが、スプレッドシートに 'File ID' 列が見つからないため、シートの更新はスキップされました。"
      });
    }
    
    // 全データを取得してファイルIDが一致する行を探す
    const dataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:Z`,
    });
    
    const rows = dataResponse.data.values || [];
    let targetRowIndex = -1;
    
    for (let i = 1; i < rows.length; i++) {
      if (rows[i] && rows[i][fileIdColumnIndex] === fileId) {
        targetRowIndex = i + 1; // シートの行番号は1から始まる
        break;
      }
    }
    
    if (targetRowIndex === -1) {
      return NextResponse.json({ 
        message: "Google Driveのファイルは削除されましたが、スプレッドシートに該当するデータが見つかりませんでした。" 
      });
    }
    
    // 行の削除リクエスト（空の配列でその行を上書き）
    const emptyRow = Array(headerRow.length).fill("");
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A${targetRowIndex}:${String.fromCharCode(65 + headerRow.length - 1)}${targetRowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [emptyRow] },
    });
    
    return NextResponse.json({ message: "名刺を削除しました。" });
    
  } catch (error: any) {
    console.error("Error deleting card:", error);
    return NextResponse.json({ 
      error: '名刺の削除中にエラーが発生しました。', 
      details: error.message || '不明なエラーが発生しました。'
    }, { status: 500 });
  }
}
