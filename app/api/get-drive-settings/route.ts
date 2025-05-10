import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { nextAuthConfiguration } from "@/app/api/auth/[...nextauth]/route"; // パスを確認
import { supabase } from '@/lib/supabaseClient';

export async function GET(request: Request) { // 設定取得なのでGETメソッド
  const session = await getServerSession(nextAuthConfiguration);

  if (!session?.user?.id) {
    return NextResponse.json({ error: '認証されていません。' }, { status: 401 });
  }

  try {
    const userId = session.user.id;

    const { data, error } = await supabase
      .from('user_drive_settings') // テーブル名を確認
      .select('google_folder_id, google_spreadsheet_id') // 取得するカラム
      .eq('user_id', userId)
      .maybeSingle(); // データがない場合は null を返す (single()だとエラーになる)

    if (error) {
      console.error('Supabaseエラー (get-settings):', error);
      return NextResponse.json({ error: '設定の取得中にデータベースエラーが発生しました。' }, { status: 500 });
    }

    if (data) {
      // データが見つかった場合は返す
      return NextResponse.json({ 
        folderId: data.google_folder_id, 
        spreadsheetId: data.google_spreadsheet_id 
      }, { status: 200 });
    } else {
      // データが見つからなかった場合は null または空のオブジェクトを返す
      return NextResponse.json({ folderId: null, spreadsheetId: null }, { status: 200 }); 
    }

  } catch (e: any) {
    console.error('リクエスト処理エラー (get-settings):', e);
    return NextResponse.json({ error: '設定の取得中にエラーが発生しました。' }, { status: 500 });
  }
}
