import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from '@/lib/supabaseClient';
import { getSheetsClient } from '@/lib/googleAuth';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: '認証されていません。' }, { status: 401 });
  }

  try {
    const { data: userSettings, error: dbError } = await supabase
      .from('user_drive_settings')
      .select('google_spreadsheet_id')
      .eq('user_id', session.user.id)
      .single();

    if (dbError || !userSettings?.google_spreadsheet_id) {
      return NextResponse.json({ error: 'スプレッドシートIDが設定されていません。' }, { status: 400 });
    }
    
    const spreadsheetId = userSettings.google_spreadsheet_id;
    const sheets = await getSheetsClient();
    const sheetName = '名刺管理データベース'; 
    
    // ヘッダー行を元に列インデックスを決定するのが望ましいが、ここでは固定値とする
    // process-cards のヘッダー: ['名刺情報', '更新日', 'メモ', 'ファイル名', 'File ID']
    // これに基づくと、以下のインデックスになる (0始まり)
    const UPDATE_DATE_INDEX = 1; // 更新日
    const MEMO_INDEX = 2;        // メモ
    const FILE_NAME_INDEX = 3;   // ファイル名
    
    // File IDまで読み込むために範囲をE列まで拡張
    const range = `\'${sheetName}\'!A:E`; 

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      // memosMap の代わりに cardInfoMap のような名前にして空のオブジェクトを返す
      return NextResponse.json({ cardInfoMap: {} }, { status: 200 });
    }

    const cardInfoMap: Record<string, { memo: string; sheetModifiedDate: string }> = {};
    // 最初の行がヘッダーであると仮定してスキップ (i=1 から開始)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const fileName = row[FILE_NAME_INDEX];
      const memo = row[MEMO_INDEX];
      const sheetModifiedDate = row[UPDATE_DATE_INDEX];

      if (fileName && typeof fileName === 'string') {
        cardInfoMap[fileName] = {
          memo: memo || '',
          sheetModifiedDate: sheetModifiedDate || '' // 更新日がundefinedなら空文字
        };
      }
    }
    
    // memosMap を cardInfoMap に変更
    return NextResponse.json({ cardInfoMap }, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching sheet card info:', error); // エラーメッセージ修正
    return NextResponse.json({ error: '名刺情報の取得中にエラーが発生しました。', details: error.message }, { status: 500 }); // エラーメッセージ修正
  }
}
