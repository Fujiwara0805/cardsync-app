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
    const sheetName = '名刺管理データベース'; // process-cards と同じシート名
    
    // ヘッダー行を読み取り、"ファイル名" と "メモ" の列インデックスを特定
    // 簡単のため、ファイル名はD列(インデックス3)、メモはC列(インデックス2)と仮定します。
    // より堅牢にするには、ヘッダーを読み取って動的にインデックスを見つける処理が必要です。
    // 今回はファイル名がD列、メモがC列という前提で進めます。
    // process-cards のヘッダー: ['名刺情報', '更新日', 'メモ', 'ファイル名']
    const fileNameColumn = 'D'; // ファイル名
    const memoColumn = 'C';     // メモ
    
    // A列からD列までのデータを取得 (ヘッダー行を含む可能性がある)
    // 範囲を広めに取っておき、必要な列だけを後で処理します。
    const range = `'${sheetName}'!A:D`; 

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return NextResponse.json({ memos: [] }, { status: 200 });
    }

    // ヘッダー行 ['名刺情報', '更新日', 'メモ', 'ファイル名'] と仮定
    // 実際のファイル名列インデックス: 3 (0始まり)
    // 実際のメモ列インデックス: 2 (0始まり)
    const FILE_NAME_INDEX = 3; 
    const MEMO_INDEX = 2;

    const memosMap: Record<string, string> = {};
    // 最初の行がヘッダーであると仮定してスキップ (i=1 から開始)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const fileName = row[FILE_NAME_INDEX];
      const memo = row[MEMO_INDEX];
      if (fileName && typeof fileName === 'string') { // ファイル名が存在し、文字列であること
        memosMap[fileName] = memo || ''; // メモがundefinedなら空文字
      }
    }
    
    return NextResponse.json({ memosMap }, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching sheet memos:', error);
    return NextResponse.json({ error: 'メモの取得中にエラーが発生しました。', details: error.message }, { status: 500 });
  }
}
