import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { nextAuthConfiguration } from "@/lib/authConfig"; // パスを確認
import { getSheetsClient } from '@/lib/googleAuth';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: Request) {
  const session = await getServerSession(nextAuthConfiguration);
  if (!session?.user?.id) {
    return NextResponse.json({ error: '認証されていません。' }, { status: 401 });
  }

  try {
    // リクエストボディから書き込むデータと、どのシートに書き込むかの情報を受け取る
    // const { spreadsheetId: requestedSpreadsheetId, range, values } = await request.json();
    // if (!requestedSpreadsheetId || !range || !values) {
    //   return NextResponse.json({ error: 'スプレッドシートID、範囲、値は必須です。' }, { status: 400 });
    // }

    // DBからユーザーのスプレッドシートIDを読み込む場合
    const { data: userSettings, error: dbError } = await supabase
      .from('user_drive_settings')
      .select('google_spreadsheet_id')
      .eq('user_id', session.user.id)
      .single();

    if (dbError || !userSettings?.google_spreadsheet_id) {
      console.error('DBエラーまたはスプレッドシートID未設定:', dbError);
      return NextResponse.json({ error: 'スプレッドシートIDが設定されていないか、取得に失敗しました。' }, { status: 404 });
    }
    const spreadsheetId = userSettings.google_spreadsheet_id;

    // フロントエンドから送られてくるデータ (例)
    const { range, values } = await request.json(); 
    // range例: 'シート1!A1' (追記なので、通常はシート名だけ指定して最終行に追記)
    // values例: [ ['山田太郎', '株式会社ABC', '代表取締役'], ['佐藤花子', 'XYZ合同会社', '部長'] ] (2次元配列)
    
    if (!range || !Array.isArray(values) || values.length === 0) {
      return NextResponse.json({ error: '書き込む範囲 (range) と値 (values) は必須です。valuesは空でない配列である必要があります。' }, { status: 400 });
    }


    const sheets = await getSheetsClient();

    const res = await sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetId,
      range: range, // 例: 'Sheet1' (シート名のみだと最終行に追記) or 'Sheet1!A1:C10'
      valueInputOption: 'USER_ENTERED', // または 'RAW'
      requestBody: {
        values: values,
      },
    });

    return NextResponse.json({ message: 'スプレッドシートにデータが正常に書き込まれました。', updates: res.data.updates }, { status: 200 });

  } catch (e: any) {
    console.error('Google Sheets APIエラー:', e);
    const errorMessage = e.response?.data?.error?.message || e.message || 'スプレッドシートへの書き込み中にエラーが発生しました。';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
