import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // パスを確認
import { getDriveClient } from '@/lib/googleAuth';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: '認証されていません。' }, { status: 401 });
  }

  try {
    const { fileId } = await request.json();
    if (!fileId) {
      return NextResponse.json({ error: 'ファイルIDが指定されていません。' }, { status: 400 });
    }

    const drive = await getDriveClient();

    // ファイルのメタデータを取得してMIMEタイプなどを確認することも可能
    // const fileMetadata = await drive.files.get({ fileId: fileId, fields: 'mimeType, name' });
    // console.log('Downloading file:', fileMetadata.data.name, fileMetadata.data.mimeType);

    const res = await drive.files.get(
      { fileId: fileId, alt: 'media' },
      { responseType: 'stream' } // ストリームで受け取るか、'arraybuffer' などで受け取る
    );
    
    // ストリームをクライアントに返す場合 (Next.jsのレスポンスで直接ストリームを扱うのは少し複雑)
    // ここでは例として、ファイルの内容を直接返す (小さなファイル向け)
    // res.data は ReadableStream なので、内容を読み出す処理が必要
    // const fileContent = await streamToString(res.data); 
    // return NextResponse.json({ content: fileContent }, { status: 200 });

    // より一般的なのは、サーバー側で一時保存してURLを返すか、処理して結果を返すなど。
    // ここでは成功したことだけを返すダミーレスポンス
    // 実際には res.data (ReadableStream) を使ってファイルデータを処理します。
    // 例えば、画像ならBufferに変換してOCR処理にかけるなど。

    // Content-Type と Content-Disposition を設定してファイルを直接ダウンロードさせる例
    // (ただし、APIルートから直接ファイルダウンロードさせるのは Next.js では工夫が必要)
    /*
    const fileMetadata = await drive.files.get({ fileId: fileId, fields: 'name, mimeType' });
    const headers = new Headers();
    headers.set('Content-Type', fileMetadata.data.mimeType || 'application/octet-stream');
    headers.set('Content-Disposition', `attachment; filename="${fileMetadata.data.name || 'downloaded_file'}"`);

    return new Response(res.data as any, { headers });
    */

    // ここでは、ダウンロード処理の開始を示すレスポンスを返すに留めます。
    // 実際のダウンロードやその後の処理は、このAPIを呼び出す側、またはこのAPI内部で非同期に行うことになります。
    return NextResponse.json({ message: `File ${fileId} download initiated. (Implementation for streaming/saving needed)` }, { status: 200 });


  } catch (e: any) {
    console.error('Google Drive APIエラー (Download):', e);
    const errorMessage = e.response?.data?.error?.message || e.message || 'Google Driveファイルのダウンロード中にエラーが発生しました。';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// Helper function (例: ストリームを文字列に変換)
// async function streamToString(stream: NodeJS.ReadableStream): Promise<string> {
//   const chunks: Buffer[] = [];
//   return new Promise((resolve, reject) => {
//     stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
//     stream.on('error', (err) => reject(err));
//     stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
//   });
// }
