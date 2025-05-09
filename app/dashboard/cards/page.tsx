'use client'; // 検索機能をクライアントサイドで行うため 'use client' に変更

import { useState, useEffect, useMemo } from 'react'; // useState, useEffect, useMemo をインポート
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input"; // Input をインポート
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Clock, FileText, Search, MessageSquareText, ImageOff, ChevronLeft, ChevronRight } from 'lucide-react'; // Search, MessageSquareText, ImageOff, ChevronLeft, ChevronRight をインポート
// import { getDriveClient } from '@/lib/googleAuth'; // これはサーバーサイドでのみ使用される想定
// import { getServerSession } from 'next-auth'; // クライアントコンポーネントでは使えない
// import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // 同上
// import { supabase } from '@/lib/supabaseClient'; // 必要であればクライアントから呼べるように設定が必要
import EmptyState from '@/components/dashboard/empty-state';
import { Skeleton } from "@/components/ui/skeleton"; // スケルトンローディング用
import { Button } from "@/components/ui/button"; // Button をインポート

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


function BusinessCardImageItem({ file }: { file: DriveFile }) {
  const displayDate = file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  }) : '日時不明';

  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
      <CardHeader className="p-4 pb-2"> {/* padding-bottomを調整 */}
        <CardTitle className="text-base font-semibold truncate flex items-center">
          <FileText className="w-4 h-4 mr-2 text-muted-foreground shrink-0" />
          <span className="truncate">{file.name}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-grow flex flex-col justify-center">
        <AspectRatio ratio={16 / 9} className="bg-muted">
           <div className="flex items-center justify-center h-full">
            <a 
                href={file.webViewLink || '#'} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-sm text-blue-600 hover:underline p-4 text-center"
            >
                {file.thumbnailLink ? "画像を表示 (Drive)" : "画像プレビューなし (Driveで表示)"}
            </a>
           </div>
        </AspectRatio>
      </CardContent>
      {/* メモ表示の追加 */}
      {file.memo && (
        <div className="p-4 border-t">
            <div className="flex items-start text-xs text-muted-foreground">
                <MessageSquareText className="w-4 h-4 mr-2 mt-0.5 shrink-0"/>
                <p className="break-all line-clamp-3"> {/* メモが長文の場合3行で省略 */}
                    {file.memo}
                </p>
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

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        // Google Driveからファイルリストを取得するAPIを呼び出す (仮のAPIパス)
        // このAPIはサーバーサイドで getDriveClient を使用して実装する必要がある
        const driveFilesResponse = await fetch('/api/get-drive-files'); // このAPIを別途作成する必要あり
        if (!driveFilesResponse.ok) {
          const errorData = await driveFilesResponse.json();
          throw new Error(errorData.error || 'Driveファイルの取得に失敗しました。');
        }
        const driveFilesData = await driveFilesResponse.json();
        const driveFiles: DriveFile[] = driveFilesData.files || [];

        // スプレッドシートからメモ情報を取得するAPIを呼び出す
        const memosResponse = await fetch('/api/get-sheet-memos');
        if (!memosResponse.ok) {
          const errorData = await memosResponse.json();
          throw new Error(errorData.error || 'メモ情報の取得に失敗しました。');
        }
        const memosData = await memosResponse.json();
        const memosMap: Record<string, string> = memosData.memosMap || {};

        // Driveファイルにメモ情報をマージ
        const mergedData = driveFiles.map(file => ({
          ...file,
          memo: memosMap[file.name] || undefined, // ファイル名でメモを検索
        }));
        
        setAllCardImages(mergedData);
      } catch (err: any) {
        console.error("Error fetching card data:", err);
        setError(err.message || 'データの読み込み中にエラーが発生しました。');
        setAllCardImages([]); // エラー時はデータを空にする
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredCardImages = useMemo(() => {
    setCurrentPage(1); // 検索時は1ページ目に戻す
    if (!searchTerm) {
      return allCardImages;
    }
    return allCardImages.filter(file =>
      file.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allCardImages, searchTerm]);

  const totalPages = Math.ceil(filteredCardImages.length / ITEMS_PER_PAGE);
  
  const currentDisplayImages = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredCardImages.slice(startIndex, endIndex);
  }, [filteredCardImages, currentPage]);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyState
            title="エラー"
            description={error}
            iconName="AlertTriangle" // lucide-reactのアイコン
        />
      </div>
    )
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
          {Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => ( // 8個のスケルトンを表示
            <CardSkeleton key={index} />
          ))}
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
              <BusinessCardImageItem key={file.id} file={file} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center items-center space-x-4">
              <Button 
                onClick={handlePreviousPage} 
                disabled={currentPage === 1}
                variant="outline"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                前へ
              </Button>
              <span className="text-sm text-muted-foreground">
                {currentPage} / {totalPages} ページ
              </span>
              <Button 
                onClick={handleNextPage} 
                disabled={currentPage === totalPages}
                variant="outline"
              >
                次へ
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

