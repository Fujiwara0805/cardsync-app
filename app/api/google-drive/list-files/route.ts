import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { nextAuthConfiguration } from "@/lib/authConfig"; // パスを確認
import { getDriveClient } from '@/lib/googleAuth'; // 作成した認証ユーティリティ
import { supabase } from '@/lib/supabaseClient'; // Supabaseクライアント

export async function POST(request: Request) {
  const session = await getServerSession(nextAuthConfiguration);
  if (!session?.user?.id) {
    return NextResponse.json({ error: '認証されていません。' }, { status: 401 });
  }

  try {
    // リクエストボディから直接folderIdを受け取るか、
    // DBからユーザーの設定を読み込むかを選択
    // const { folderId: requestedFolderId } = await request.json(); 
    // if (!requestedFolderId) {
    //   return NextResponse.json({ error: 'フォルダIDが指定されていません。' }, { status: 400 });
    // }

    // DBからユーザーの設定を読み込む場合
    const { data: userSettings, error: dbError } = await supabase
      .from('user_drive_settings')
      .select('google_folder_id')
      .eq('user_id', session.user.id)
      .single();

    if (dbError || !userSettings?.google_folder_id) {
      console.error('DBエラーまたはフォルダID未設定:', dbError);
      return NextResponse.json({ error: 'フォルダIDが設定されていないか、取得に失敗しました。' }, { status: 404 });
    }
    
    const folderId = userSettings.google_folder_id;
    const drive = await getDriveClient();

    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`, // 指定フォルダ内、ゴミ箱以外
      fields: 'nextPageToken, files(id, name, mimeType, webViewLink, createdTime, modifiedTime, iconLink, thumbnailLink)', // 取得するファイル情報
      pageSize: 100, // 取得する最大ファイル数 (適宜調整)
    });

    return NextResponse.json({ files: res.data.files || [] }, { status: 200 });

  } catch (e: any) {
    console.error('Google Drive APIエラー:', e);
    // e.response.data.error.message のように、より詳細なエラーを取得できる場合がある
    const errorMessage = e.response?.data?.error?.message || e.message || 'Google Driveファイルのリスト取得中にエラーが発生しました。';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
