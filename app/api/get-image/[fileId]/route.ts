import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { nextAuthConfiguration } from "@/lib/authConfig";
import { google } from 'googleapis';

export async function GET(
  request: Request,
  { params }: { params: { fileId: string } }
) {
  const session = await getServerSession(nextAuthConfiguration) as any;
  if (!session || !session.accessToken) {
    return new Response("Unauthorized", { status: 401 });
  }

  const fileId = params.fileId;
  if (!fileId) {
    return new Response("File ID is required", { status: 400 });
  }

  try {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: session.accessToken });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // まずサムネイルリンクを取得してみる (存在すればそれを使う方が軽量)
    // もし thumbnailLink が直接使えない場合や、より高解像度が必要な場合は、
    // drive.files.get({ fileId: fileId, alt: 'media' }) でファイル本体を取得する
    const fileMetadata = await drive.files.get({
      fileId: fileId,
      fields: 'thumbnailLink, webContentLink, mimeType', // webContentLinkは直接ダウンロード用だが認証が必要な場合がある
    });

    let imageResponse;

    // thumbnailLink があればそれを利用 (ただし、これも認証が必要な場合があるため、サーバー経由で取得)
    // thumbnailLink は一般的に公開されているとは限らない
    // ここでは直接ファイルコンテントを取得するロジックを優先する
    
    const res = await drive.files.get(
        { fileId: fileId, alt: 'media' },
        { responseType: 'arraybuffer' } // 画像データをバイナリで取得
    );
    
    // res.headers['content-type'] を使うのが望ましいが、取得できない場合もある
    // fileMetadata.data.mimeType を使う
    const mimeType = fileMetadata.data.mimeType || 'image/jpeg'; 
    const imageBuffer = Buffer.from(res.data as ArrayBuffer);

    return new NextResponse(imageBuffer, {
        status: 200,
        headers: {
            'Content-Type': mimeType,
            'Cache-Control': 'private, max-age=600', // 適宜キャッシュ設定
        },
    });

  } catch (error: any) {
    console.error(`Error fetching image for fileId ${fileId}:`, error);
    // error.response.data などで詳細なエラーメッセージが取得できる場合がある
    const errorMessage = error.response?.data?.error?.message || error.message || 'Error fetching image';
    const errorStatus = error.response?.status || 500;
    return new Response(errorMessage, { status: errorStatus });
  }
}
