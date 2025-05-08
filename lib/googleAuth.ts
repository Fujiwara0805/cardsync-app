import { google, Auth } from 'googleapis';
import { ImageAnnotatorClient } from '@google-cloud/vision'; // Vision APIクライアント

// .env.local からサービスアカウントの認証情報を読み込む
const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS_JSON;

if (!credentialsJson) {
  throw new Error('The GOOGLE_SERVICE_ACCOUNT_CREDENTIALS_JSON environment variable is not set.');
}

const credentials = JSON.parse(credentialsJson);

export function getGoogleAuth() {
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/drive.readonly', // Driveの読み取り専用スコープ
      'https://www.googleapis.com/auth/spreadsheets',    // Sheetsの読み書きスコープ
      // 必要に応じて他のスコープを追加
    ],
  });
  return auth;
}

export async function getDriveClient() {
  const auth = getGoogleAuth();
  const authClient = await auth.getClient() as Auth.OAuth2Client;
  return google.drive({ version: 'v3', auth: authClient });
}

export async function getSheetsClient() {
  const auth = getGoogleAuth();
  const authClient = await auth.getClient() as Auth.OAuth2Client;
  return google.sheets({ version: 'v4', auth: authClient });
}

export function getVisionClient() {
  // GOOGLE_SERVICE_ACCOUNT_CREDENTIALS_JSON が設定されていれば、
  // ImageAnnotatorClient は自動的にその認証情報を使用します。
  // もし個別のキーファイルパス等で設定したい場合は、コンストラクタの引数で指定します。
  // const visionClient = new ImageAnnotatorClient({
  //   keyFilename: 'path/to/your/service-account-key.json', 
  // });
  return new ImageAnnotatorClient();
}
