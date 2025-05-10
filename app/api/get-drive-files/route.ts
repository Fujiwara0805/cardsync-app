import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { nextAuthConfiguration } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from '@/lib/supabaseClient';
import { getDriveClient } from '@/lib/googleAuth';

export async function GET(request: Request) {
  const session = await getServerSession(nextAuthConfiguration);
  if (!session?.user?.id) {
    return NextResponse.json({ error: '認証されていません。' }, { status: 401 });
  }

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

    const drive = await getDriveClient();
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false and (mimeType='image/jpeg' or mimeType='image/png')`, // PNGも対象に含めるか検討
      fields: 'files(id, name, thumbnailLink, webViewLink, modifiedTime)',
      orderBy: 'modifiedTime desc',
      pageSize: 50, // 必要に応じて調整
    });

    return NextResponse.json({ files: res.data.files || [] }, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching drive files:', error);
    return NextResponse.json({ error: 'Driveファイルの取得中にエラーが発生しました。', details: error.message }, { status: 500 });
  }
}
