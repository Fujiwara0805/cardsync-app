import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from '@/lib/supabaseClient';
import { getDriveClient } from '@/lib/googleAuth';
import { Readable } from 'stream';
import { google } from 'googleapis';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions) as any;
  if (!session || !session.accessToken) {
    return NextResponse.json({ error: '認証されていません、またはアクセストークンがありません。' }, { status: 401 });
  }

  console.log("Upload API - Access Token:", session.accessToken);
  console.log("Upload API - Token Scope from session:", session.scope);

  try {
    const { data: userSettings, error: dbError } = await supabase
      .from('user_drive_settings')
      .select('google_folder_id')
      .eq('user_id', session.user.id)
      .single();

    if (dbError || !userSettings?.google_folder_id) {
      return NextResponse.json({ error: 'Google DriveのフォルダIDが設定されていません。' }, { status: 400 });
    }
    const folderId = userSettings.google_folder_id;

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const newFileName = formData.get('newFileName') as string | null; // クライアントから送られたファイル名

    if (!file || !newFileName) {
      return NextResponse.json({ error: 'ファイルまたはファイル名がありません。' }, { status: 400 });
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: session.accessToken });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    
    const fileMetadata = {
      name: newFileName, // ここで指定されたファイル名を使用
      parents: [folderId],
    };
    
    const media = {
      mimeType: file.type,
      body: Readable.from(Buffer.from(await file.arrayBuffer())), // Node.jsのReadableStreamに変換
    };

    const driveResponse = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink', // 必要なフィールドを取得
    });

    console.log('File uploaded to Drive:', driveResponse.data);
    return NextResponse.json({ 
      message: 'ファイルがGoogle Driveにアップロードされました。', 
      fileId: driveResponse.data.id,
      fileName: driveResponse.data.name,
      webViewLink: driveResponse.data.webViewLink 
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error uploading to Drive:', error);
    return NextResponse.json({ error: 'Google Driveへのアップロード中にエラーが発生しました。', details: error.message }, { status: 500 });
  }
}
