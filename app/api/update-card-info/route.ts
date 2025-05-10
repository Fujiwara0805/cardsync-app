import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { nextAuthConfiguration } from "@/app/api/auth/[...nextauth]/route";
import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function getGoogleClients(session: any) {
  if (!session || !session.accessToken) {
    throw new Error("Unauthorized: Missing access token");
  }
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: session.accessToken });
  const drive = google.drive({ version: 'v3', auth: oauth2Client });
  const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
  return { drive, sheets };
}

async function getUserDriveSettings(userId: string) {
  const { data, error } = await supabase
    .from('user_drive_settings') 
    .select('google_spreadsheet_id, google_folder_id')
    .eq('user_id', userId) 
    .single();

  if (error) {
    console.error('Error fetching user drive settings from Supabase:', error);
    console.error('Supabase error details:', JSON.stringify(error, null, 2)); 
    throw new Error('ユーザーの設定情報の取得に失敗しました。Supabaseの接続またはテーブル/カラム名を確認してください。');
  }
  if (!data) {
    throw new Error('ユーザーの設定情報が見つかりません。Google接続設定を確認してください。');
  }
  if (!data.google_spreadsheet_id) { 
      throw new Error('スプレッドシートIDがユーザー設定に構成されていません。');
  }

  return {
    spreadsheetId: data.google_spreadsheet_id,
    folderId: data.google_folder_id,
    sheetName: '名刺管理データベース' 
  };
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(nextAuthConfiguration) as any; 
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "認証されていません。" }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await request.json();
    const { fileId, newName, newMemo } = body;

    if (!fileId || typeof newName !== 'string' || typeof newMemo !== 'string') {
      return NextResponse.json({ error: "必要な情報（fileId, newName, newMemo）が不足しています。" }, { status: 400 });
    }

    const userSettings = await getUserDriveSettings(userId); 
    const spreadsheetId = userSettings.spreadsheetId;
    const sheetName = userSettings.sheetName; 

    const { drive, sheets } = await getGoogleClients(session);

    // 1. Google Driveのファイル名を更新
    let currentDriveFileName = '';
    try {
        const driveFile = await drive.files.get({
            fileId: fileId,
            fields: 'name',
        });
        currentDriveFileName = driveFile.data.name || '';
        if (newName !== currentDriveFileName) {
            await drive.files.update({
                fileId: fileId,
                requestBody: { name: newName },
            });
            console.log(`Drive file name updated for ${fileId} to \"${newName}\"`);
        }
    } catch (driveError: any) {
        console.warn(`Could not update Drive file name for ${fileId}:`, driveError.message);
    }

    // 2. スプレッドシートの情報を更新
    const getValuesResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A:Z`, 
    });
    const rows = getValuesResponse.data.values;

    if (!rows || rows.length === 0) throw new Error(`スプレッドシート「${sheetName}」にデータが見つかりません。`);
    
    const headerRow = rows[0];
    const fileIdColumnIndex = headerRow.findIndex(h => h === 'File ID');
    const fileNameColumnIndex = headerRow.findIndex(h => h === 'ファイル名');
    const memoColumnIndex = headerRow.findIndex(h => h === 'メモ');
    const updatedTimeColumnIndex = headerRow.findIndex(h => h === '更新日');

    if (fileIdColumnIndex === -1) throw new Error("スプレッドシートに 'File ID' 列が見つかりません。");
    if (fileNameColumnIndex === -1) throw new Error("スプレッドシートに 'ファイル名' 列が見つかりません。");
    if (memoColumnIndex === -1) throw new Error("スプレッドシートに 'メモ' 列が見つかりません。");
    if (updatedTimeColumnIndex === -1) throw new Error("スプレッドシートに '更新日' 列が見つかりません。");

    let targetRowIndex = -1;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][fileIdColumnIndex] === fileId) {
        targetRowIndex = i + 1;
        break;
      }
    }

    if (targetRowIndex === -1) throw new Error(`スプレッドシート内に対象のFile ID (${fileId}) が見つかりませんでした。`);
    
    const valuesToUpdate = [];
    const currentSheetFileName = rows[targetRowIndex-1][fileNameColumnIndex];
    const currentSheetMemo = rows[targetRowIndex-1][memoColumnIndex];

    if (newName !== currentSheetFileName) {
        valuesToUpdate.push({
            range: `${sheetName}!${String.fromCharCode(65 + fileNameColumnIndex)}${targetRowIndex}`,
            values: [[newName]],
        });
    }
    if (newMemo !== currentSheetMemo) {
        valuesToUpdate.push({
            range: `${sheetName}!${String.fromCharCode(65 + memoColumnIndex)}${targetRowIndex}`,
            values: [[newMemo]],
        });
    }
    
    valuesToUpdate.push({
        range: `${sheetName}!${String.fromCharCode(65 + updatedTimeColumnIndex)}${targetRowIndex}`,
        values: [[new Date().toISOString()]],
    });
    
    if (valuesToUpdate.length > 0) {
        await sheets.spreadsheets.values.batchUpdate({
            spreadsheetId,
            requestBody: { valueInputOption: 'USER_ENTERED', data: valuesToUpdate },
        });
    }

    return NextResponse.json({ message: "情報が正常に更新されました。" });

  } catch (error: any) {
    console.error("Error updating card info (POST handler):", error);
    const errorMessage = error.message || '情報の更新中に予期せぬエラーが発生しました。';
    return NextResponse.json({ error: errorMessage }, { status: (error as any).status || 500 });
  }
}
