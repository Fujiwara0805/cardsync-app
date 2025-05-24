'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FolderSync, Upload, FileSpreadsheet, Check, AlertCircle, LogIn, LogOut, Save, CheckCircle, Copy, Edit, Loader2, Info, Settings } from 'lucide-react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { ToastNotification, type NotificationType } from '@/components/ui/toast-notification';

// Add these type declarations
declare global {
  interface Window {
    gapi: any; // You can replace 'any' with more specific types if available
    google: {
      picker: any; // You can replace 'any' with more specific types if available
      [key: string]: any; // For other google properties if needed
    };
  }
}

interface NotificationState {
  isOpen: boolean;
  message: string;
  type: NotificationType;
}

// 型定義 (仮。実際のAPIレスポンスに合わせる)
interface UserSettings {
  google_spreadsheet_id?: string;
  google_folder_id?: string;
}

// Google APIのスクリプトURL
const GAPI_SCRIPT_URL = 'https://apis.google.com/js/api.js';
const PICKER_SCRIPT_URL = 'https://apis.google.com/js/picker.js';

export default function DriveSync() {
  const { data: session, status } = useSession();
  const isLoadingSession = status === 'loading';

  const [folderId, setFolderId] = useState('');
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [initialFolderId, setInitialFolderId] = useState<string | null>(null);
  const [initialSpreadsheetId, setInitialSpreadsheetId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [hasExistingSettings, setHasExistingSettings] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({
    isOpen: false,
    message: '',
    type: 'info',
  });
  const [keepMemos, setKeepMemos] = useState(true);

  // --- Google Picker API関連のState ---
  const [gapiLoaded, setGapiLoaded] = useState(false);
  const [pickerApiLoaded, setPickerApiLoaded] = useState(false);
  const [oauthToken, setOauthToken] = useState<string | null>(null);
  
  // APIキー (Google Cloud Consoleから取得したAPIキーを設定)
  const DEVELOPER_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
  const APP_ID = process.env.NEXT_PUBLIC_GOOGLE_APP_ID; // PickerのsetAppId用

  const serviceAccountEmail = process.env.NEXT_PUBLIC_GOOGLE_SERVICE_ACCOUNT_EMAIL;

  // --- Google API Client & Picker APIスクリプトのロード ---
  useEffect(() => {
    const loadGapiScript = () => {
      const script = document.createElement('script');
      script.src = GAPI_SCRIPT_URL;
      script.onload = () => {
        if (window.gapi) {
          window.gapi.load('client:picker', () => {
            setGapiLoaded(true);
            loadPickerScript(); 
          });
        } else {
          console.error("GAPI script loaded but window.gapi is not defined.");
          showNotification("Google APIの初期化に失敗しました(GAPI)。", "error");
        }
      };
      script.onerror = () => {
        showNotification("Google APIスクリプトの読み込みに失敗しました(GAPI)。", "error");
      }
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    };

    const loadPickerScript = () => {
      const script = document.createElement('script');
      script.src = PICKER_SCRIPT_URL;
      script.onload = () => {
        if (window.google && window.google.picker) {
          setPickerApiLoaded(true);
        } else {
           console.error("Picker API script loaded but window.google.picker is not defined.");
           showNotification("Google APIの初期化に失敗しました(Picker)。", "error");
        }
      };
      script.onerror = () => {
        showNotification("Google Picker APIスクリプトの読み込みに失敗しました。", "error");
      }
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    };

    if (typeof window !== 'undefined') {
      if (!(window as any).gapi) {
        loadGapiScript();
      } else if (!(window as any).google?.picker) {
        // gapiはロード済みだがpickerがまだの場合
        if (!gapiLoaded) { // gapi.loadが未完了の可能性を考慮
             window.gapi.load('client:picker', () => {
                setGapiLoaded(true);
                loadPickerScript();
            });
        } else {
            loadPickerScript();
        }
      } else {
        setGapiLoaded(true);
        setPickerApiLoaded(true);
      }
    }
  }, [gapiLoaded]); // gapiLoadedを追加して再試行の可能性を考慮

  useEffect(() => {
    if (session && (session as any).accessToken) {
      setOauthToken((session as any).accessToken);
    } else {
      setOauthToken(null);
    }
  }, [session]);

  useEffect(() => {
    const fetchSettings = async () => {
      if (status === 'authenticated' && session?.user?.id) {
        setIsLoadingSettings(true);
        try {
          const response = await fetch('/api/get-drive-settings');
          if (!response.ok) {
            throw new Error('設定の取得に失敗しました。');
          }
          const data = await response.json();
          if (data.folderId || data.spreadsheetId) {
            setFolderId(data.folderId || '');
            setSpreadsheetId(data.spreadsheetId || '');
            setInitialFolderId(data.folderId || '');
            setInitialSpreadsheetId(data.spreadsheetId || '');
            setHasExistingSettings(true);
            setIsEditing(false);
          } else {
            setHasExistingSettings(false);
            setIsEditing(true);
          }
        } catch (error) {
          console.error("設定の読み込みエラー:", error);
          setHasExistingSettings(false);
          setIsEditing(true);
        } finally {
          setIsLoadingSettings(false);
        }
      } else if (status === 'unauthenticated') {
          setIsLoadingSettings(false);
          setHasExistingSettings(false);
          setIsEditing(false);
      }
    };

    fetchSettings();
  }, [status, session]);

  const handleGoogleSignIn = async () => {
    // signIn('google') の際に、新しいスコープが適用されるようにする
    // (nextAuthConfigurationでスコープが drive.file のみになっていることを確認済みという前提)
    await signIn('google');
  };

  const handleGoogleSignOut = async () => {
    await signOut();
    setFolderId('');
    setSpreadsheetId('');
  };

  const showNotification = (message: string, type: NotificationType, duration?: number) => {
    setNotification({ isOpen: true, message, type });
  };

  const handleSetSpreadsheet = () => {
    if (!spreadsheetId) {
      showNotification('スプレッドシートIDを入力してください。', 'error');
      return;
    }
    showNotification('スプレッドシートIDが設定されました: ' + spreadsheetId + '\n（実際にはバックエンドで保存処理が必要です）', 'info');
  };
  
  const handleSetFolderId = () => {
    if (!folderId) {
      showNotification('フォルダIDを入力してください。', 'error');
      return;
    }
    showNotification('フォルダIDが設定されました: ' + folderId + '\n（実際にはバックエンドで保存処理が必要です）', 'info');
  }

  const handleSaveSettings = async () => {
    console.log('handleSaveSettings called. Status:', status, 'Session:', session);

    if (status === 'loading') {
      showNotification('認証情報を確認中です。少し時間をおいて再度お試しください。', 'info');
      return;
    }
    if (!session?.user?.id) {
      showNotification('認証情報がありません。再度ログインしてください。', 'error');
      return;
    }
    if (!folderId || !spreadsheetId) {
      showNotification('Google DriveのフォルダIDとスプレッドシートIDの両方を設定してください。', 'error');
      return;
    }
    
    setIsSaving(true);
    try {
      const response = await fetch('/api/save-drive-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId, spreadsheetId }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || '設定の保存/更新に失敗しました。');
      }
      
      showNotification(`設定が${hasExistingSettings ? '更新' : '保存'}されました！`, 'success');
      console.log('保存/更新結果:', result.data);
      
      setHasExistingSettings(true);
      setIsEditing(false);
      setInitialFolderId(folderId);
      setInitialSpreadsheetId(spreadsheetId);

    } catch (error: any) {
      console.error('設定保存/更新エラー:', error);
      showNotification(`設定の${hasExistingSettings ? '更新' : '保存'}中にエラーが発生しました。\n${error.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const syncNow = async () => {
    if (!isAuthenticated) { // 認証状態を最初に確認
      showNotification('Googleアカウントに接続されていません。接続してください。', 'error');
      return;
    }
    if (!gapiLoaded || !pickerApiLoaded) { // Picker APIのロードも確認
      showNotification('Google APIの準備ができていません。ページを再読み込みするか、しばらくお待ちください。', 'info');
      return;
    }
     if (!hasExistingSettings || !folderId || !spreadsheetId) { // 設定が保存されているか
      showNotification('名刺処理を開始する前に、Google DriveのフォルダIDとスプレッドシートIDを設定・保存してください。', 'error');
      return;
    }
    // ここで、spreadsheetIdがユーザーによってPickerで選択・許可されたものかどうかの
    // 直接的なチェックは難しいが、UIフローとしてPicker経由での設定を促している前提。

    setProcessing(true);
    console.log('同期処理を開始します...');
    
    try {
      const response = await fetch('/api/process-cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ keepMemos })
      });

      if (!response.ok) {
        let errorMessage = `同期処理中にサーバーエラーが発生しました (ステータス: ${response.status})`;
        try {
          const errorResult = await response.json();
          errorMessage = errorResult.error || errorMessage;
        } catch (e) {
          console.warn('Failed to parse error response as JSON:', e);
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      showNotification(result.message || '同期処理が完了しました。詳細はコンソールログを確認してください。', 'success');
      console.log('同期処理結果:', result);

    } catch (error: any) {
      console.error('同期処理中にエラーが発生しました (at drive-sync.tsx):', error);
      showNotification(`同期処理に失敗しました。\n${error.message}`, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const isAuthenticated = status === 'authenticated' && !!session?.user;

  const copyToClipboard = (text: string | undefined) => {
    if (!text) {
      showNotification('コピーするメールアドレスがありません。', 'info');
      return;
    }
    if (!navigator.clipboard) {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showNotification('メールアドレスをコピーしました！', 'success');
      } catch (err) {
        showNotification('コピーに失敗しました: ' + err, 'error');
      }
      return;
    }
    navigator.clipboard.writeText(text).then(() => {
      showNotification('メールアドレスをコピーしました！', 'success');
    }, (err) => {
      showNotification('コピーに失敗しました: ' + err, 'error');
    });
  };

  const toggleEditMode = () => {
      setIsEditing(!isEditing);
      if (isEditing && initialFolderId !== null && initialSpreadsheetId !== null) {
          setFolderId(initialFolderId);
          setSpreadsheetId(initialSpreadsheetId);
      }
  };

  // --- Google Picker API呼び出しハンドラ ---
  const handleOpenPickerForSpreadsheet = () => {
    if (!gapiLoaded || !pickerApiLoaded) {
      showNotification('Google Picker APIの準備ができていません。しばらく待つか、ページを再読み込みしてください。', 'error');
      console.error('Picker API not loaded. gapiLoaded:', gapiLoaded, 'pickerApiLoaded:', pickerApiLoaded);
      return;
    }
    if (!oauthToken) {
      showNotification('Google認証トークンがありません。再度ログインしてください。', 'error');
      return;
    }
    if (!DEVELOPER_KEY) {
      showNotification('Google APIキーが設定されていません。管理者に連絡してください。', 'error');
      return;
    }
    if (!APP_ID) {
      showNotification('GoogleアプリケーションIDが設定されていません。管理者に連絡してください。', 'error');
      return;
    }

    const view = new window.google.picker.DocsView(window.google.picker.ViewId.SPREADSHEETS)
      .setIncludeFolders(true)
      .setMimeTypes("application/vnd.google-apps.spreadsheet");
      // もし既存のspreadsheetIdがあれば、それを初期選択させる試み（setQueryなどで）
      // if (spreadsheetId) {
      //   view.setQuery(spreadsheetId); // 例: IDで直接検索できるか（API仕様確認）
      // }

    const picker = new window.google.picker.PickerBuilder()
      .setAppId(APP_ID)
      .setOAuthToken(oauthToken)
      .setDeveloperKey(DEVELOPER_KEY)
      .setLocale('ja')
      .addView(view)
      .setCallback((data: any) => {
        if (data[window.google.picker.Response.ACTION] == window.google.picker.Action.PICKED) {
          const doc = data[window.google.picker.Response.DOCUMENTS][0];
          const fileId = doc[window.google.picker.Document.ID];
          setSpreadsheetId(fileId); // Pickerで選択されたIDをStateにセット
          showNotification(`スプレッドシートが選択されました。ID: ${fileId}\n設定を保存してください。`, 'info');
        } else if (data[window.google.picker.Response.ACTION] == window.google.picker.Action.CANCEL) {
          showNotification('スプレッドシートの選択がキャンセルされました。', 'info');
        }
      })
      .build();
    picker.setVisible(true);
  };

  // 新しく追加: フォルダ選択用のPickerハンドラ
  const handleOpenPickerForFolder = () => {
    if (!gapiLoaded || !pickerApiLoaded) {
      showNotification('Google Picker APIの準備ができていません。しばらく待つか、ページを再読み込みしてください。', 'error');
      console.error('Picker API not loaded. gapiLoaded:', gapiLoaded, 'pickerApiLoaded:', pickerApiLoaded);
      return;
    }
    if (!oauthToken) {
      showNotification('Google認証トークンがありません。再度ログインしてください。', 'error');
      return;
    }
    if (!DEVELOPER_KEY) {
      showNotification('Google APIキーが設定されていません。管理者に連絡してください。', 'error');
      return;
    }
    if (!APP_ID) {
      showNotification('GoogleアプリケーションIDが設定されていません。管理者に連絡してください。', 'error');
      return;
    }

    const view = new window.google.picker.DocsView(window.google.picker.ViewId.FOLDERS) // FOLDERSビューを使用
      .setIncludeFolders(true)
      .setMimeTypes("application/vnd.google-apps.folder"); // フォルダのMIMEタイプ

    const picker = new window.google.picker.PickerBuilder()
      .setAppId(APP_ID)
      .setOAuthToken(oauthToken)
      .setDeveloperKey(DEVELOPER_KEY)
      .setLocale('ja')
      .addView(view)
      .setCallback((data: any) => {
        if (data[window.google.picker.Response.ACTION] == window.google.picker.Action.PICKED) {
          const doc = data[window.google.picker.Response.DOCUMENTS][0];
          const fileId = doc[window.google.picker.Document.ID];
          setFolderId(fileId); // Pickerで選択されたフォルダIDをStateにセット
          showNotification(`フォルダが選択されました。ID: ${fileId}\n設定を保存してください。`, 'info');
        } else if (data[window.google.picker.Response.ACTION] == window.google.picker.Action.CANCEL) {
          showNotification('フォルダの選択がキャンセルされました。', 'info');
        }
      })
      .build();
    picker.setVisible(true);
  };

  return (
    <div className="space-y-8">
      <motion.h1 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-3xl font-bold text-primary"
      >
        Googleサービス連携設定
      </motion.h1>
      
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-xl font-semibold">
              <LogIn className="mr-3 h-6 w-6 text-primary" />
              Googleアカウント接続
            </CardTitle>
            <CardDescription className="pt-1">
              Googleドライブとスプレッドシートにアクセスするために、Googleアカウントで認証します。
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2 pb-4">
            {isLoadingSession && <p className="text-sm text-muted-foreground">認証情報を確認中...</p>}
            {!isLoadingSession && session?.user ? (
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium">接続済み: {session.user.email}</p>
                  {session.user.name && <p className="text-xs text-muted-foreground">{session.user.name}</p>}
                </div>
              </div>
            ) : (
              !isLoadingSession && <p className="text-sm text-muted-foreground">まだGoogleアカウントに接続されていません。</p>
            )}
          </CardContent>
          <CardFooter>
            {!isLoadingSession && (
              <Button 
                onClick={session?.user ? handleGoogleSignOut : handleGoogleSignIn}
                className="w-full"
                variant={session?.user ? "outline" : "secondary"}
                disabled={isLoadingSession}
              >
                {session?.user ? (
                  <><LogOut className="mr-2 h-4 w-4" />切断する</>
                ) : (
                  <><LogIn className="mr-2 h-4 w-4" />Googleアカウントで接続</>
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
      </motion.div>

      {isLoadingSettings && (
        <div className="flex justify-center items-center p-10">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-3 text-muted-foreground">設定情報を読み込み中...</span>
        </div>
      )}

      {!isLoadingSettings && isAuthenticated && (
        <>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }} className={cn("transition-opacity duration-300", (isLoadingSession || !isAuthenticated) ? 'opacity-50 pointer-events-none' : '')}>
            <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-xl font-semibold">
                  <FolderSync className="mr-3 h-6 w-6 text-primary" />
                  Googleドライブ フォルダ設定
                </CardTitle>
                <CardDescription className="pt-1">
                  名刺画像が保存されているGoogleドライブのフォルダIDを指定し、アクセス権を設定します。
                </CardDescription>
                <div className="ml-auto">
                  {hasExistingSettings && !isEditing && (
                     <Button variant="ghost" size="sm" onClick={toggleEditMode}>
                       <Edit size={16} className="mr-1"/> 変更
                     </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-5 pt-2 pb-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
                  <div className="flex items-start">
                    <div className="shrink-0 mr-3 mt-0.5">
                        <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-500 text-white text-xs font-semibold">1</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                        フォルダの準備とフォルダIDのコピー
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Googleドライブ内に名刺画像保存用のフォルダを新規作成してください。<br />（例：名刺管理フォルダ）<br />
                        {/* そのフォルダを開き、ブラウザのアドレスバーに表示されるURLからフォルダIDをコピーしてください。<br />
                        フォルダIDは通常、URLの `folders/` の直後にあるランダムな文字列です。<br />
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 break-all">
                        例: `https://drive.google.com/drive/folders/`<strong>`1a2B3c4D5e6F7g8H9i0JkLmNoPqRs`</strong> (太字部分がID) */}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-700">
                  <div className="flex items-start">
                     <div className="shrink-0 mr-3 mt-0.5">
                        <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-green-500 text-white text-xs font-semibold">2</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-green-700 dark:text-green-300">
                        アクセス権の設定（重要）
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        上記で準備したフォルダを、サービスアカウントと共有し、<b>「閲覧者」</b>以上の権限を付与してください。
                        これにより、アプリがフォルダ内の名刺画像を読み取れるようになります。
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        共有するメールアドレス:
                      </p>
                      {serviceAccountEmail ? (
                        <div className="mt-1 flex items-center gap-2">
                          <code className="text-xs p-1.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300 break-all flex-grow">
                            {serviceAccountEmail}
                          </code>
                          <Button variant="ghost" size="icon" onClick={() => copyToClipboard(serviceAccountEmail)} className="h-8 w-8 shrink-0">
                            <Copy size={16} className="text-muted-foreground hover:text-foreground" />
                            <span className="sr-only">メールアドレスをコピー</span>
                          </Button>
                        </div>
                      ) : (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          サービスアカウントのメールアドレスが設定されていません。管理者にお問い合わせください。
                        </p>
                      )}
                       <p className="text-xs text-muted-foreground mt-2">
                        <strong>手順:</strong> Googleドライブでフォルダを右クリック → 「共有」 → 「ユーザーやグループを追加」に上記のメールアドレスを入力 → 権限を「閲覧者」に設定 → 「送信」。
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-gray-200 dark:border-gray-700">
                     <div className="flex items-start">
                        <div className="shrink-0 mr-3 mt-0.5">
                            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gray-500 text-white text-xs font-semibold">3</span>
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">フォルダIDの入力</p>
                            <p className="text-xs text-muted-foreground mt-1 mb-2">
                            上記の手順が完了したら、歯車アイコンを押下して作成したファイルを選択してください。
                            </p>
                            <div className="flex items-center gap-2">
                              <Input
                                  id="folderId"
                                  placeholder="Google DriveのフォルダIDを入力"
                                  value={folderId}
                                  onChange={(e) => setFolderId(e.target.value)}
                                  disabled={!isEditing || isSaving}
                                  className={cn("bg-background flex-grow", !isEditing && hasExistingSettings && "bg-gray-100 dark:bg-gray-800")}
                              />
                              <Button
                                onClick={handleOpenPickerForFolder}
                                variant="secondary"
                                size="icon"
                                disabled={!isEditing || isSaving || !gapiLoaded || !pickerApiLoaded || !oauthToken || isLoadingSession}
                                title="Google Pickerでフォルダを選択"
                              >
                                <Settings size={18} /> 
                                <span className="sr-only">フォルダを選択</span>
                              </Button>
                            </div>
                            {(!gapiLoaded || !pickerApiLoaded && isAuthenticated ) && <p className="text-xs text-destructive mt-1">Picker APIの読み込み中です...</p>}
                        </div>
                    </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }} className={cn("transition-opacity duration-300", (isLoadingSession || !isAuthenticated) ? 'opacity-50 pointer-events-none' : '')}>
            <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-xl font-semibold">
                  <FileSpreadsheet className="mr-3 h-6 w-6 text-primary" />
                  スプレッドシート設定
                </CardTitle>
                <CardDescription className="pt-1">
                  抽出した名刺データの保存先GoogleスプレッドシートのIDを指定し、アクセス権を設定します。
                </CardDescription>
                <div className="ml-auto">
                  {hasExistingSettings && !isEditing && (
                     <Button variant="ghost" size="sm" onClick={toggleEditMode}>
                       <Edit size={16} className="mr-1"/> 変更
                     </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-5 pt-2 pb-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
                     <div className="flex items-start">
                        <div className="shrink-0 mr-3 mt-0.5">
                            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-500 text-white text-xs font-semibold">1</span>
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">スプレッドシートの準備とIDのコピー</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Googleスプレッドシートを新規作成してください。新規作成する際には、ファイル名とシート名を<b>名刺管理データベース</b>としてください。
                            </p>
                             {/* <p className="text-xs text-muted-foreground mt-1 break-all">
                                例: `https://docs.google.com/spreadsheets/d/`<strong>`1a2B3c4D5e6F7g8H9i0JkLmNoPqRs`</strong>`/edit` (太字部分がID)
                            </p> */}
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-700">
                  <div className="flex items-start">
                     <div className="shrink-0 mr-3 mt-0.5">
                        <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-green-500 text-white text-xs font-semibold">2</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-green-700 dark:text-green-300">
                        アクセス権の設定（重要）
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        上記で準備したスプレッドシートを、サービスアカウントと共有し、<b>「編集者」</b>権限を付与してください。
                        これにより、アプリが抽出した名刺管理データベースをシートに書き込めるようになります。
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        共有するメールアドレス:
                      </p>
                      {serviceAccountEmail ? (
                        <div className="mt-1 flex items-center gap-2">
                          <code className="text-xs p-1.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300 break-all flex-grow">{serviceAccountEmail}</code>
                          <Button variant="ghost" size="icon" onClick={() => copyToClipboard(serviceAccountEmail)} className="h-8 w-8 shrink-0">
                            <Copy size={16} className="text-muted-foreground hover:text-foreground" />
                            <span className="sr-only">メールアドレスをコピー</span>
                          </Button>
                        </div>
                      ) : (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          サービスアカウントのメールアドレスが設定されていません。管理者にお問い合わせください。
                        </p>
                      )}
                       <p className="text-xs text-muted-foreground mt-2">
                        <strong>手順:</strong> Googleスプレッドシート右上の「共有」ボタン → 「ユーザーやグループを追加」に上記のメールアドレスを入力 → 権限を「編集者」に設定 → 「送信」。
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start">
                        <div className="shrink-0 mr-3 mt-0.5">
                            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gray-500 text-white text-xs font-semibold">3</span>
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">スプレッドシートIDの入力</p>
                            <p className="text-xs text-muted-foreground mt-1 mb-2">
                                上記の手順が完了したら、歯車アイコンを押下して作成したファイルを選択してください。
                            </p>
                            <div className="flex items-center gap-2">
                              <Input
                                  id="spreadsheetId"
                                  placeholder="GoogleスプレッドシートのIDを入力"
                                  value={spreadsheetId}
                                  onChange={(e) => setSpreadsheetId(e.target.value)}
                                  disabled={!isEditing || isSaving}
                                  className={cn("bg-background flex-grow", !isEditing && hasExistingSettings && "bg-gray-100 dark:bg-gray-800")}
                              />
                              <Button
                                onClick={handleOpenPickerForSpreadsheet}
                                variant="secondary"
                                size="icon"
                                disabled={!isEditing || isSaving || !gapiLoaded || !pickerApiLoaded || !oauthToken || isLoadingSession}
                                title="Google Pickerでスプレッドシートを選択"
                              >
                                <Settings size={18} /> 
                                <span className="sr-only">スプレッドシートを選択</span>
                              </Button>
                            </div>
                            {(!gapiLoaded || !pickerApiLoaded && isAuthenticated ) && <p className="text-xs text-destructive mt-1">Picker APIの読み込み中です...</p>}
                        </div>
                    </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 }} className={cn("transition-opacity duration-300", (isLoadingSession || !isAuthenticated) ? 'opacity-50 pointer-events-none' : '')}>
            <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold">
                  {hasExistingSettings ? '設定の更新と同期処理(一括登録)' : '設定の保存と同期処理(一括登録)'}
                </CardTitle>
                <CardDescription className="pt-1">
                  {hasExistingSettings 
                    ? '上記の設定を更新します。編集後、更新ボタンを押してください。' 
                    : '上記で設定したフォルダIDとスプレッドシートIDを保存し、名刺の同期処理を実行します。'}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2 pb-4">
                <div className="flex gap-3 mb-6">
                  {isEditing && (
                     <Button 
                      onClick={handleSaveSettings} 
                      disabled={isLoadingSession || !folderId || !spreadsheetId || isSaving || processing || !isEditing}
                      className="flex-1 py-3 text-base"
                    >
                      {isSaving ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>{hasExistingSettings ? '更新中...' : '保存中...'}</>
                      ) : (
                          <><Save className="mr-2 h-4 w-4" />{hasExistingSettings ? '設定を更新' : '設定を保存'}</>
                      )}
                    </Button>
                  )}
                  {isEditing && hasExistingSettings && (
                     <Button variant="secondary" onClick={toggleEditMode} className="flex-1 py-3 text-base">
                       キャンセル
                     </Button>
                  )}
                   {!isEditing && hasExistingSettings && (
                       <Button onClick={toggleEditMode} className="w-full py-3 text-base " variant="secondary">
                           <Edit size={16} className="mr-2"/> 設定を変更する
                       </Button>
                   )}
                </div>

                <div className="bg-muted/70 p-4 rounded-lg text-sm">
                  <p className="font-semibold mb-2 text-foreground/90">同期処理ステップ：</p>
                  <ol className="space-y-1 list-decimal list-inside pl-2">
                    <li>指定されたGoogleドライブフォルダから名刺画像を取得</li>
                    <li>AI-OCRで名刺情報を抽出（別途API連携が必要）</li>
                    <li>抽出データを指定されたスプレッドシートに登録</li>
                  </ol>
                   <p className="mt-3 text-xs text-muted-foreground">※OCR処理やGoogle APIとの連携には、バックエンドでの実装と適切な権限設定が必要です。</p>
                </div>

                <div className="mt-4 flex items-center space-x-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="keepMemos"
                      checked={keepMemos}
                      onChange={(e) => setKeepMemos(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      disabled={processing || isSaving || !hasExistingSettings || isEditing}
                    />
                    <label htmlFor="keepMemos" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      既存のメモ情報を保持する
                    </label>
                  </div>
                  <div className="inline-block" title="チェックを外すと、スプレッドシートのデータが完全にクリアされ、新しいデータのみが書き込まれます。チェックすると、既存のメモ情報が保持されます。">
                    <Info size={16} className="text-muted-foreground cursor-help" />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={syncNow} 
                  disabled={isLoadingSession || !isAuthenticated || !folderId || !spreadsheetId || processing || isSaving || !hasExistingSettings || isEditing}
                  className="w-full py-3 text-base"
                  variant="secondary"
                >
                  {processing ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>同期処理中...</>
                  ) : (
                      '今すぐ同期する'
                  )}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </>
      )}

      <ToastNotification
        isOpen={notification.isOpen}
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification({ ...notification, isOpen: false })}
      />
    </div>
  );
}