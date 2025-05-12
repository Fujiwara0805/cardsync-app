import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { nextAuthConfiguration } from "@/lib/authConfig";
import { getDriveClient, getSheetsClient } from '@/lib/googleAuth';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: Request) {
  const session = await getServerSession(nextAuthConfiguration);
  if (!session?.user?.id) {
    return NextResponse.json({ error: '認証されていません。' }, { status: 401 });
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
    
    // 1. Google Driveからファイルを削除（ゴミ箱に移動）
    const drive = await getDriveClient();
    await drive.files.update({
      fileId: fileId,
      requestBody: { trashed: true }
    });
    
    // 2. スプレッドシートから該当する行を削除
    const sheets = await getSheetsClient();
    
    // ファイルIDの列を特定するためにヘッダー行を取得
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A1:Z1`,
    });
    
    const headerRow = headerResponse.data.values?.[0] || [];
    const fileIdColumnIndex = headerRow.findIndex(h => h === 'File ID');
    
    if (fileIdColumnIndex === -1) {
      return NextResponse.json({ error: "スプレッドシートに 'File ID' 列が見つかりません。" }, { status: 400 });
    }
    
    // 全データを取得してファイルIDが一致する行を探す
    const dataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:Z`,
    });
    
    const rows = dataResponse.data.values || [];
    let targetRowIndex = -1;
    
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][fileIdColumnIndex] === fileId) {
        targetRowIndex = i + 1; // シートの行番号は1から始まる
        break;
      }
    }
    
    if (targetRowIndex === -1) {
      return NextResponse.json({ message: "スプレッドシートに該当するデータがないため、Driveのファイルのみ削除しました。" });
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
    return NextResponse.json({ error: error.message || '名刺の削除中にエラーが発生しました。' }, { status: 500 });
  }
}
