'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FolderSync, Upload, FileSpreadsheet, Check, AlertCircle, LogIn, LogOut, Save, CheckCircle, Copy, Edit, Loader2 } from 'lucide-react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';

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

  const serviceAccountEmail = process.env.NEXT_PUBLIC_GOOGLE_SERVICE_ACCOUNT_EMAIL;

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
    await signIn('google');
  };

  const handleGoogleSignOut = async () => {
    await signOut();
    setFolderId('');
    setSpreadsheetId('');
  };

  const handleSetSpreadsheet = () => {
    if (!spreadsheetId) {
      alert('スプレッドシートIDを入力してください。');
      return;
    }
    alert('スプレッドシートIDが設定されました: ' + spreadsheetId + '\n（実際にはバックエンドで保存処理が必要です）');
  };
  
  const handleSetFolderId = () => {
    if (!folderId) {
      alert('フォルダIDを入力してください。');
      return;
    }
    alert('フォルダIDが設定されました: ' + folderId + '\n（実際にはバックエンドで保存処理が必要です）');
  }

  const handleSaveSettings = async () => {
    console.log('handleSaveSettings called. Status:', status, 'Session:', session);

    if (status === 'loading') {
      alert('認証情報を確認中です。少し時間をおいて再度お試しください。');
      return;
    }
    if (!session?.user?.id) {
      alert('認証情報がありません。再度ログインしてください。');
      return;
    }
    if (!folderId || !spreadsheetId) {
      alert('Google DriveのフォルダIDとスプレッドシートIDの両方を設定してください。');
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
      
      alert(`設定が${hasExistingSettings ? '更新' : '保存'}されました！`);
      console.log('保存/更新結果:', result.data);
      
      setHasExistingSettings(true);
      setIsEditing(false);
      setInitialFolderId(folderId);
      setInitialSpreadsheetId(spreadsheetId);

    } catch (error: any) {
      console.error('設定保存/更新エラー:', error);
      alert(`設定の${hasExistingSettings ? '更新' : '保存'}中にエラーが発生しました。\n${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const syncNow = async () => {
    if (status === 'loading') {
      alert('認証情報を確認中です。少し時間をおいて再度お試しください。');
      return;
    }
    if (!session?.user?.id) {
      alert('認証情報がありません。再度ログインしてください。');
      return;
    }
    if (!folderId || !spreadsheetId) {
      alert('名刺処理を開始する前に、Google DriveのフォルダIDとスプレッドシートIDを設定してください。');
      return;
    }

    setProcessing(true);
    console.log('同期処理を開始します...');
    
    try {
      const response = await fetch('/api/process-cards', {
        method: 'POST',
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

      alert(result.message || '同期処理が完了しました。詳細はコンソールログを確認してください。');
      console.log('同期処理結果:', result);

    } catch (error: any) {
      console.error('同期処理中にエラーが発生しました (at drive-sync.tsx):', error);
      alert(`同期処理に失敗しました。\n${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const isAuthenticated = status === 'authenticated' && !!session?.user;

  const copyToClipboard = (text: string | undefined) => {
    if (!text) {
      alert('コピーするメールアドレスがありません。');
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
        alert('メールアドレスをコピーしました！');
      } catch (err) {
        alert('コピーに失敗しました: ' + err);
      }
      return;
    }
    navigator.clipboard.writeText(text).then(() => {
      alert('メールアドレスをコピーしました！');
    }, (err) => {
      alert('コピーに失敗しました: ' + err);
    });
  };

  const toggleEditMode = () => {
      setIsEditing(!isEditing);
      if (isEditing && initialFolderId !== null && initialSpreadsheetId !== null) {
          setFolderId(initialFolderId);
          setSpreadsheetId(initialSpreadsheetId);
      }
  };

  return (
    <div className="space-y-8 pb-20 lg:pb-10">
      <motion.h1 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-3xl font-bold text-foreground"
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
                variant={session?.user ? "outline" : "default"}
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
                        Googleドライブ内に名刺画像保存用のフォルダを新規作成するか、既存のフォルダを使用します。
                        そのフォルダを開き、ブラウザのアドレスバーに表示されるURLからフォルダIDをコピーしてください。
                        フォルダIDは通常、URLの `folders/` の直後にあるランダムな文字列です。
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 break-all">
                        例: `https://drive.google.com/drive/folders/`<strong>`1a2B3c4D5e6F7g8H9i0JkLmNoPqRs`</strong> (太字部分がID)
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
                        上記で準備したフォルダを、本アプリのサービスアカウントと共有し、**「閲覧者」**以上の権限を付与してください。
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
                        <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">フォルダIDの入力</p>
                            <p className="text-xs text-muted-foreground mt-1 mb-2">
                                上記の手順が完了したら、コピーしたフォルダIDを下の欄に入力してください。
                            </p>
                            <Input
                                id="folderId"
                                placeholder="Google DriveのフォルダIDを入力"
                                value={folderId}
                                onChange={(e) => setFolderId(e.target.value)}
                                disabled={!isEditing || isSaving}
                                className={cn("bg-background", !isEditing && hasExistingSettings && "bg-gray-100 dark:bg-gray-800")}
                            />
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
                                Googleスプレッドシートを新規作成するか、既存のものを使用します。
                                そのスプレッドシートを開き、ブラウザのアドレスバーに表示されるURLからIDをコピーしてください。
                                IDは通常、URLの `/d/` と `/edit` の間のランダムな文字列です。
                            </p>
                             <p className="text-xs text-muted-foreground mt-1 break-all">
                                例: `https://docs.google.com/spreadsheets/d/`<strong>`1a2B3c4D5e6F7g8H9i0JkLmNoPqRs`</strong>`/edit` (太字部分がID)
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
                        上記で準備したスプレッドシートを、本アプリのサービスアカウントと共有し、**「編集者」**権限を付与してください。
                        これにより、アプリが抽出した名刺データをシートに書き込めるようになります。
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
                                上記の手順が完了したら、コピーしたスプレッドシートIDを下の欄に入力してください。
                            </p>
                            <Input
                                id="spreadsheetId"
                                placeholder="GoogleスプレッドシートのIDを入力"
                                value={spreadsheetId}
                                onChange={(e) => setSpreadsheetId(e.target.value)}
                                disabled={!isEditing || isSaving}
                                className={cn("bg-background", !isEditing && hasExistingSettings && "bg-gray-100 dark:bg-gray-800")}
                            />
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
                  {hasExistingSettings ? '設定の更新と名刺同期' : '設定の保存と名刺同期'}
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
                     <Button variant="outline" onClick={toggleEditMode} className="flex-1 py-3 text-base">
                       キャンセル
                     </Button>
                  )}
                   {!isEditing && hasExistingSettings && (
                       <Button onClick={toggleEditMode} className="w-full py-3 text-base" variant="outline">
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
    </div>
  );
}
