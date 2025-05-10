'use client';

import { useState, useRef, ChangeEvent, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea'; // Textareaをインポート
import { UploadCloud, FileImage, Edit3, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import Image from 'next/image'; // 画像プレビュー用
import { ToastNotification, type NotificationType } from '@/components/ui/toast-notification'; // 通知用

interface NotificationState {
  isOpen: boolean;
  message: string;
  type: NotificationType;
}

export default function ImageUploadForm() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [memo, setMemo] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // OCRとスプレッドシート処理中
  const [notification, setNotification] = useState<NotificationState>({
    isOpen: false,
    message: '',
    type: 'info',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showNotification = (message: string, type: NotificationType) => {
    setNotification({ isOpen: true, message, type });
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'image/jpeg') {
      setSelectedFile(file);
      setFileName(file.name.replace(/\.[^/.]+$/, "")); // 拡張子を除いたファイル名
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedFile(null);
      setPreviewUrl(null);
      setFileName('');
      if (file) {
        showNotification('JPEG形式の画像ファイルを選択してください。', 'error');
      }
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile) {
      showNotification('画像ファイルを選択してください。', 'error');
      return;
    }
    if (!fileName.trim()) {
      showNotification('ファイル名を入力してください。', 'error');
      return;
    }

    setIsUploading(true);
    const finalFileName = fileName.trim() + '.jpeg'; // 拡張子をjpegに固定

    const formData = new FormData();
    formData.append('file', selectedFile, finalFileName); // サーバー側でファイル名を使用
    formData.append('newFileName', finalFileName); // 新しいファイル名を別途送信
    formData.append('memo', memo);

    try {
      // 1. 画像をGoogle Driveにアップロード
      const uploadResponse = await fetch('/api/upload-image-to-drive', {
        method: 'POST',
        body: formData, // FormData を直接送信
      });

      if (!uploadResponse.ok) {
        const errorResult = await uploadResponse.json();
        throw new Error(errorResult.error || 'Google Driveへのアップロードに失敗しました。');
      }
      const uploadResult = await uploadResponse.json();
      showNotification('Google Driveへのアップロードが完了しました。', 'success');
      setIsUploading(false);

      // 2. アップロードされたファイルを処理 (OCRとスプレッドシート登録)
      setIsProcessing(true);
      const processResponse = await fetch('/api/process-single-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fileId: uploadResult.fileId, // Drive APIからの返り値 (ファイルID)
          fileName: finalFileName, // ファイル名も渡す
          memo: memo // メモも渡す
        }),
      });

      if (!processResponse.ok) {
        const errorResult = await processResponse.json();
        throw new Error(errorResult.error || '名刺情報の処理に失敗しました。');
      }
      const processResult = await processResponse.json();
      showNotification(processResult.message || '名刺情報の処理と登録が完了しました。', 'success');
      
      // フォームをリセット
      setSelectedFile(null);
      setPreviewUrl(null);
      setFileName('');
      setMemo('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error: any) {
      console.error("Upload or processing error:", error);
      showNotification(error.message || 'エラーが発生しました。', 'error');
    } finally {
      setIsUploading(false);
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Card className="max-w-2xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-semibold">
            <UploadCloud className="mr-3 h-7 w-7 text-primary" />
            名刺アップロード
          </CardTitle>
          <CardDescription>
            JPEG形式の名刺画像を1枚選択し、ファイル名とメモを入力してアップロードしてください。
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6 pt-4">
            <div>
              <label htmlFor="file-upload" className="block text-sm font-medium text-foreground mb-1">
                画像ファイル (JPEGのみ)
              </label>
              <Input
                id="file-upload"
                type="file"
                accept="image/jpeg"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                disabled={isUploading || isProcessing}
              />
            </div>

            {previewUrl && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 border rounded-md overflow-hidden"
              >
                <Image src={previewUrl} alt="プレビュー" width={400} height={225} style={{ objectFit: 'contain', width: '100%', maxHeight: '300px' }} />
              </motion.div>
            )}

            {selectedFile && (
              <>
                <div>
                  <label htmlFor="fileName" className="block text-sm font-medium text-foreground mb-1">
                    ファイル名 (拡張子 .jpeg は自動付与)
                  </label>
                  <div className="relative">
                    <Edit3 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="fileName"
                      type="text"
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                      placeholder="例: 株式会社ABC_営業部_山田太郎"
                      className="pl-10"
                      disabled={isUploading || isProcessing}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="memo" className="block text-sm font-medium text-foreground mb-1">
                    メモ (任意)
                  </label>
                  <Textarea
                    id="memo"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder="例: 2023年展示会での面談、後日フォローアップ予定"
                    rows={3}
                    disabled={isUploading || isProcessing}
                  />
                </div>
              </>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              type="submit" 
              className="w-full py-3 text-base" 
              disabled={!selectedFile || !fileName || isUploading || isProcessing}
            >
              {isUploading ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Driveへアップロード中...</>
              ) : isProcessing ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" />名刺情報処理中...</>
              ) : (
                <><UploadCloud className="mr-2 h-5 w-5" />アップロードして処理開始</>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <ToastNotification
        isOpen={notification.isOpen}
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification({ ...notification, isOpen: false })}
      />
    </>
  );
}
