import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
// authOptionsのパスは、実際のプロジェクト構造に合わせて修正してください。
// 通常は app/api/auth/[...nextauth]/route.ts または pages/api/auth/[...nextauth].ts にあります。
// ここでは仮に @/app/api/auth/[...nextauth]/route としています。
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; 
import { supabase } from '@/lib/supabaseClient'; 

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) { 
    return NextResponse.json({ error: '認証されていません。' }, { status: 401 });
  }

  try {
    const { folderId, spreadsheetId } = await request.json();

    if (!folderId || !spreadsheetId) {
      return NextResponse.json({ error: 'フォルダIDとスプレッドシートIDは必須です。' }, { status: 400 });
    }

    const userId = session.user.id;

    const { data, error } = await supabase
      .from('user_drive_settings') 
      .upsert(
        { 
          user_id: userId, 
          google_folder_id: folderId, 
          google_spreadsheet_id: spreadsheetId,
          updated_at: new Date().toISOString() 
        },
        { onConflict: 'user_id' } 
      )
      .select() 
      .single(); 

    if (error) {
      console.error('Supabaseエラー:', error);
      return NextResponse.json({ error: 'データベースエラーが発生しました: ' + error.message }, { status: 500 });
    }

    return NextResponse.json({ message: '設定が正常に保存されました。', data }, { status: 200 });

  } catch (e: any) {
    console.error('リクエスト処理エラー:', e);
    return NextResponse.json({ error: 'リクエストの処理中にエラーが発生しました: ' + e.message }, { status: 500 });
  }
}
