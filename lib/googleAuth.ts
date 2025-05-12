import { google, Auth } from 'googleapis';
import { ImageAnnotatorClient, protos } from '@google-cloud/vision'; // Vision APIクライアント

let parsedCredentials: any; // 型を適切に設定することも検討 (e.g., ServiceAccountCredentials)
let isCredentialsParsedAsJson = false;

// GOOGLE_APPLICATION_CREDENTIALS 環境変数が設定されていれば、
// 各Google Cloudクライアントライブラリはそれを自動的に検出し使用します。

// 起動時に環境変数が設定されているかどうかの警告を出す（任意ですが推奨）
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.warn(
    '警告: 環境変数 GOOGLE_APPLICATION_CREDENTIALS が設定されていません。' +
    'Google Cloud サービスが正しく認証されない可能性があります。'
  );
} else {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS.trim().startsWith('{')) {
    try {
      parsedCredentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
      isCredentialsParsedAsJson = true;
      console.log('[googleAuth] GOOGLE_APPLICATION_CREDENTIALS をJSONオブジェクトとして正常にパースしました。');
    } catch (e: any) {
      console.error(
        '[googleAuth] GOOGLE_APPLICATION_CREDENTIALS のJSONとしてのパースに失敗しました。' +
        'ファイルパスとして扱われます。エラー: ' + e.message
      );
      // parsedCredentials は undefined のまま
    }
  } else {
    // JSON文字列で始まらない場合はファイルパスとみなす
    console.log(
      `[googleAuth] GOOGLE_APPLICATION_CREDENTIALS は次のパスで設定されています: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`
    );
    // parsedCredentials は undefined のまま
  }
}

export function getGoogleAuth() {
  const authOptions: Auth.GoogleAuthOptions = {
    scopes: [
      'https://www.googleapis.com/auth/drive', // process-cardsでファイル一覧取得とファイル内容取得のため
      'https://www.googleapis.com/auth/spreadsheets',    // Sheetsの読み書きスコープ
      // 'https://www.googleapis.com/auth/cloud-platform' // Vision APIなど広範なアクセスが必要な場合
    ],
  };

  if (isCredentialsParsedAsJson && parsedCredentials) {
    authOptions.credentials = parsedCredentials;
  }
  // parsedCredentials が未設定、またはJSONとしてパースできなかった場合（ファイルパスの場合など）は、
  // GoogleAuth が GOOGLE_APPLICATION_CREDENTIALS 環境変数をファイルパスとして解釈しようとします。

  return new google.auth.GoogleAuth(authOptions);
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
  if (isCredentialsParsedAsJson && parsedCredentials) {
    // 明示的にパースされた認証情報を使用
    return new ImageAnnotatorClient({ credentials: parsedCredentials });
  }
  // パースされた認証情報がない場合（ファイルパスが設定されている、または環境変数が未設定など）
  // ImageAnnotatorClient は GOOGLE_APPLICATION_CREDENTIALS をファイルパスとして参照しようとするか、
  // 他のデフォルトの認証メカニズム（ADCなど）を使用します。
  return new ImageAnnotatorClient();
}
