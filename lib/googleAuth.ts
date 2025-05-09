import { google, Auth } from 'googleapis';
import { ImageAnnotatorClient } from '@google-cloud/vision'; // Vision APIクライアント

// GOOGLE_APPLICATION_CREDENTIALS 環境変数が設定されていれば、
// 各Google Cloudクライアントライブラリはそれを自動的に検出し使用します。

// 起動時に環境変数が設定されているかどうかの警告を出す（任意ですが推奨）
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.warn(
    '警告: 環境変数 GOOGLE_APPLICATION_CREDENTIALS が設定されていません。' +
    'Google Cloud サービスが正しく認証されない可能性があります。' +
    'サービスアカウントキーJSONファイルへのパスが正しく設定されているか確認してください。'
  );
} else {
  // 開発時の確認用ログ（本番では削除してもOK）
  console.log(
    `[googleAuth] GOOGLE_APPLICATION_CREDENTIALS は次のパスで設定されています: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`
  );
}

export function getGoogleAuth() {
  // credentialsを明示的に指定せず、デフォルトの検索メカニズムに任せます。
  // GOOGLE_APPLICATION_CREDENTIALS が使用されます。
  const auth = new google.auth.GoogleAuth({
    scopes: [
      'https://www.googleapis.com/auth/drive.readonly', // Driveの読み取り専用スコープ
      'https://www.googleapis.com/auth/spreadsheets',    // Sheetsの読み書きスコープ
      // 'https://www.googleapis.com/auth/cloud-platform' // Vision APIなど広範なアクセスが必要な場合
    ],
  });
  return auth;
}

export async function getDriveClient() {
  const auth = getGoogleAuth();
  // getClient() は適切な認証情報をロードしようとします。
  const authClient = await auth.getClient() as Auth.OAuth2Client;
  return google.drive({ version: 'v3', auth: authClient });
}

export async function getSheetsClient() {
  const auth = getGoogleAuth();
  const authClient = await auth.getClient() as Auth.OAuth2Client;
  return google.sheets({ version: 'v4', auth: authClient });
}

export function getVisionClient() {
  // ImageAnnotatorClient も GOOGLE_APPLICATION_CREDENTIALS が設定されていれば、
  // コンストラクタに何も渡さなくても自動的に認証情報を読み込みます。
  return new ImageAnnotatorClient();
}
