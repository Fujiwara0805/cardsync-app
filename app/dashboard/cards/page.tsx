'use client'; // 検索機能をクライアントサイドで行うため 'use client' に変更

import { useState, useEffect, useMemo, useCallback } from 'react'; // useState, useEffect, useMemo, useCallback をインポート
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input"; // Input をインポート
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Clock, FileText, Search, MessageSquareText, ImageOff, ChevronLeft, ChevronRight, Pencil } from 'lucide-react'; // Search, MessageSquareText, ImageOff, ChevronLeft, ChevronRight, Pencil をインポート
import EmptyState from '@/components/dashboard/empty-state';
import { Skeleton } from "@/components/ui/skeleton"; // スケルトンローディング用
import { Button } from "@/components/ui/button"; // Button をインポート
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog"; // Dialog関連をインポート
import { Label } from "@/components/ui/label"; // Labelをインポート
import { Textarea } from "@/components/ui/textarea"; // Textareaをインポート

interface DriveFile {
  id: string;
  name: string;
  thumbnailLink?: string;
  webViewLink?: string;
  modifiedTime?: string;
  memo?: string; // メモ情報を追加
}

// ローディング表示用のスケルトンカード
function CardSkeleton() {
  return (
    <Card className="overflow-hidden shadow-lg flex flex-col h-full">
      <CardHeader className="p-4">
        <Skeleton className="h-5 w-3/4" />
      </CardHeader>
      <CardContent className="p-0 flex-grow flex flex-col justify-center">
        <AspectRatio ratio={16 / 9} className="bg-muted">
          <Skeleton className="h-full w-full" />
        </AspectRatio>
      </CardContent>
      <CardFooter className="p-4 text-xs text-muted-foreground border-t">
        <Skeleton className="h-4 w-1/2" />
      </CardFooter>
    </Card>
  );
}

function BusinessCardImageItem({ file, onEdit }: { file: DriveFile; onEdit: (file: DriveFile) => void; }) {
  const displayDate = file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  }) : '日時不明';

  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false); // fileが変わったらエラー状態をリセット
  }, [file]);

  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
      <CardHeader className="p-4 pb-2 flex flex-row justify-between items-start">
        <CardTitle className="text-base font-semibold truncate flex items-center mr-2">
          <FileText className="w-4 h-4 mr-2 text-muted-foreground shrink-0" />
          <span className="truncate" title={file.name}>{file.name}</span>
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={() => onEdit(file)} className="shrink-0">
          <Pencil className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-0 flex-grow flex flex-col justify-center">
        <AspectRatio ratio={16 / 9} className="bg-muted">
          {imageError ? (
            <div className="flex flex-col items-center justify-center h-full text-xs text-red-600 p-2">
              <ImageOff className="w-8 h-8 mb-1" />
              <span>画像表示エラー</span>
              {file.webViewLink && (
                <a 
                    href={file.webViewLink} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-600 hover:underline mt-1"
                >
                    Google Driveで表示
                </a>
              )}
            </div>
          ) : (
            <img
              src={`/api/get-image/${file.id}`}
              alt={`名刺画像: ${file.name}`}
              className="object-contain w-full h-full"
              onError={() => setImageError(true)}
              loading="lazy" // 遅延読み込み
            />
          )}
        </AspectRatio>
      </CardContent>
      {file.memo && (
        <div className="p-4 border-t">
          <div className="flex items-start text-xs text-muted-foreground">
            <MessageSquareText className="w-4 h-4 mr-2 mt-0.5 shrink-0" />
            <p className="break-all line-clamp-3" title={file.memo}>{file.memo}</p>
          </div>
        </div>
      )}
      <CardFooter className="p-4 text-xs text-muted-foreground border-t">
        <div className="flex items-center">
          <Clock className="w-3 h-3 mr-1.5" />
          <span>最終更新: {displayDate}</span>
        </div>
      </CardFooter>
    </Card>
  );
}

const ITEMS_PER_PAGE = 8; // 1ページあたりのアイテム数

export default function BusinessCardsListPage() {
  const [allCardImages, setAllCardImages] = useState<DriveFile[]>([]); // 全データ
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // --- 編集モーダル用 State ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<DriveFile | null>(null);
  const [editedFileName, setEditedFileName] = useState('');
  const [editedMemo, setEditedMemo] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  // -------------------------

  const fetchCardData = useCallback(async () => { // useCallbackでラップ
    setIsLoading(true);
    setError(null);
    try {
      const driveFilesResponse = await fetch('/api/get-drive-files');
      if (!driveFilesResponse.ok) {
        const errorData = await driveFilesResponse.json();
        throw new Error(errorData.error || 'Driveファイルの取得に失敗しました。');
      }
      const driveFilesData = await driveFilesResponse.json();
      const driveFiles: DriveFile[] = driveFilesData.files || [];

      const memosResponse = await fetch('/api/get-sheet-memos');
      if (!memosResponse.ok) {
        const errorData = await memosResponse.json();
        throw new Error(errorData.error || 'メモ情報の取得に失敗しました。');
      }
      const memosData = await memosResponse.json();
      const memosMap: Record<string, string> = memosData.memosMap || {};

      const mergedData = driveFiles.map(file => ({
        ...file,
        memo: memosMap[file.name] || '', // メモがない場合は空文字に
      })).sort((a, b) => { // modifiedTimeで降順ソート
        if (a.modifiedTime && b.modifiedTime) {
          return new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime();
        }
        return 0;
      });
      
      setAllCardImages(mergedData);
    } catch (err: any) {
      console.error("Error fetching card data:", err);
      setError(err.message || 'データの読み込み中にエラーが発生しました。');
      setAllCardImages([]);
    } finally {
      setIsLoading(false);
    }
  }, []); // 依存配列は空

  useEffect(() => {
    fetchCardData();
  }, [fetchCardData]); // fetchCardDataを依存配列に追加

  const filteredCardImages = useMemo(() => {
    setCurrentPage(1); // 検索時は1ページ目に戻す
    if (!searchTerm) {
      return allCardImages;
    }
    return allCardImages.filter(file =>
      file.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allCardImages, searchTerm]);

  useEffect(() => {
    setCurrentPage(1); // searchTermが変更されたら1ページ目に戻す
  }, [searchTerm]);

  const totalPages = Math.ceil(filteredCardImages.length / ITEMS_PER_PAGE);
  
  const currentDisplayImages = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredCardImages.slice(startIndex, endIndex);
  }, [filteredCardImages, currentPage]);

  const handlePreviousPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  // --- 編集モーダル関連関数 ---
  const handleEditModalOpen = (file: DriveFile) => {
    setEditingFile(file);
    setEditedFileName(file.name);
    setEditedMemo(file.memo || '');
    setIsEditModalOpen(true);
  };

  const handleEditModalClose = () => {
    setIsEditModalOpen(false);
    setEditingFile(null);
    // isSavingがfalseの時だけクリアするなどの制御も可能
  };

  const handleSaveChanges = async () => {
    if (!editingFile) return;
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/update-card-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId: editingFile.id,
          originalFileName: editingFile.name, // スプレッドシート検索用
          newName: editedFileName,
          newMemo: editedMemo,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '情報の更新に失敗しました。');
      }
      // 成功した場合、リストを再読み込みするか、ローカルステートを更新
      await fetchCardData(); // 簡単なのは再取得
      handleEditModalClose();
    } catch (err: any) {
      console.error("Error updating card info:", err);
      setError(err.message || '更新処理中にエラーが発生しました。');
      // エラー時もモーダルを閉じないか、ユーザーに通知
    } finally {
      setIsSaving(false);
    }
  };
  // ----------------------------

  if (error && !isEditModalOpen) { // モーダル表示中はメインのエラー表示をしない
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyState title="エラー" description={error} iconName="AlertTriangle" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="ファイル名で検索..."
            className="w-full pl-10 pr-4 py-2 border rounded-md shadow-sm focus:ring-primary focus:border-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => <CardSkeleton key={index} />)}
        </div>
      ) : currentDisplayImages.length === 0 ? (
        <EmptyState
          title={searchTerm ? "検索結果なし" : "名刺画像がありません"}
          description={searchTerm ? `「${searchTerm}」に一致する名刺は見つかりませんでした。` : "Google Driveの連携フォルダにJPEG形式の名刺画像をアップロードし、システムと同期してください。"}
          iconName={searchTerm ? "SearchX" : "ImageOff"}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {currentDisplayImages.map((file) => (
              <BusinessCardImageItem key={file.id} file={file} onEdit={handleEditModalOpen} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center items-center space-x-4">
              <Button onClick={handlePreviousPage} disabled={currentPage === 1} variant="outline">
                <ChevronLeft className="h-4 w-4 mr-1" /> 前へ
              </Button>
              <span className="text-sm text-muted-foreground">{currentPage} / {totalPages} ページ</span>
              <Button onClick={handleNextPage} disabled={currentPage === totalPages} variant="outline">
                次へ <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* --- 編集モーダル --- */}
      {editingFile && (
        <Dialog open={isEditModalOpen} onOpenChange={(isOpen) => { if(!isOpen) handleEditModalClose(); else setIsEditModalOpen(true);}}>
          <DialogContent className="sm:max-w-[480px] w-[90vw] max-w-[400px] sm:w-full">
            <DialogHeader>
              <DialogTitle>名刺情報の編集</DialogTitle>
              <DialogDescription>
                ファイル名とメモを編集します。変更はGoogle Driveとスプレッドシートに反映されます。
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="fileName" className="text-right">ファイル名</Label>
                <Input 
                  id="fileName" 
                  value={editedFileName} 
                  onChange={(e) => setEditedFileName(e.target.value)} 
                  className="col-span-3" 
                  disabled={isSaving}
                />
              </div>
              <div className="grid grid-cols-4 items-start gap-4"> {/* items-start for textarea alignment */}
                <Label htmlFor="memo" className="text-right pt-2">メモ</Label> {/* pt-2 for alignment */}
                <Textarea 
                  id="memo" 
                  value={editedMemo} 
                  onChange={(e) => setEditedMemo(e.target.value)} 
                  className="col-span-3 min-h-[100px]"
                  disabled={isSaving}
                />
              </div>
              {error && isEditModalOpen && ( // モーダル内でのエラー表示
                  <p className="col-span-4 text-sm text-red-600 text-center">{error}</p>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isSaving}>キャンセル</Button>
              </DialogClose>
              <Button type="button" onClick={handleSaveChanges} disabled={isSaving}>
                {isSaving ? '保存中...' : '変更を保存'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      {/* ------------------ */}
    </div>
  );
}

