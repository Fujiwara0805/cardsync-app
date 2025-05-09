import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Clock, FileText } from 'lucide-react';
import { getDriveClient } from '@/lib/googleAuth'; // 仮の関数、後で実装
import { getServerSession } from 'next-auth'; // セッション取得用
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // authOptionsのパスを確認
import { supabase } from '@/lib/supabaseClient'; // Supabaseクライアント
import EmptyState from '@/components/dashboard/empty-state'; // 空の状態表示用

interface DriveFile {
  id: string;
  name: string;
  thumbnailLink?: string; // サムネイルのURL
  webViewLink?: string; // Driveでの表示・ダウンロード用リンク
  modifiedTime?: string; // 最終更新日時
  // 必要に応じて他のプロパティ
}

async function getBusinessCardImages(): Promise<DriveFile[]> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    console.error('User not authenticated');
    return [];
  }

  try {
    const { data: userSettings, error: dbError } = await supabase
      .from('user_drive_settings')
      .select('google_folder_id')
      .eq('user_id', session.user.id)
      .single();

    if (dbError || !userSettings?.google_folder_id) {
      console.error('Drive folder ID not configured or DB error:', dbError?.message);
      return [];
    }
    const folderId = userSettings.google_folder_id;

    const drive = await getDriveClient(); // 認証済みDriveクライアントを取得
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false and mimeType='image/jpeg'`,
      fields: 'files(id, name, thumbnailLink, webViewLink, modifiedTime)',
      orderBy: 'modifiedTime desc', // 更新日時の降順でソート
      pageSize: 20, // まずは20件程度
    });

    const files = res.data.files;
    if (files && files.length > 0) {
      return files as DriveFile[]; // 型アサーション
    }
    return [];
  } catch (error: any) {
    console.error('Error fetching files from Google Drive:', error.message);
    return [];
  }
}

function BusinessCardImageItem({ file }: { file: DriveFile }) {
  const displayDate = file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  }) : '日時不明';

  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
      <CardHeader className="p-4">
        <CardTitle className="text-base font-semibold truncate flex items-center">
          <FileText className="w-4 h-4 mr-2 text-muted-foreground" />
          {file.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-grow flex flex-col justify-center">
        {/* サムネイルがあればそれを使う、なければwebViewLinkで何か表示するか、プレースホルダー */}
        {/* Google Driveのサムネイルは認証が必要な場合があるので、直接Imageコンポーネントで表示が難しい場合がある */}
        {/* ここではダミー画像またはwebViewLinkへのリンクを表示 */}
        <AspectRatio ratio={16 / 9} className="bg-muted">
          {/* 
            直接サムネイルを表示する場合 (認証とCORSに注意):
            file.thumbnailLink ? (
              <Image
                src={file.thumbnailLink}
                alt={file.name}
                fill
                className="object-cover rounded-t-md"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">画像なし</div>
            )
          */}
          {/* 代わりにwebViewLinkへのリンクを設置する例 */}
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
      <CardFooter className="p-4 text-xs text-muted-foreground border-t">
        <div className="flex items-center">
          <Clock className="w-3 h-3 mr-1.5" />
          <span>最終更新: {displayDate}</span>
        </div>
      </CardFooter>
    </Card>
  );
}


export default async function BusinessCardsListPage() {
  const cardImages = await getBusinessCardImages();

  if (!cardImages || cardImages.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-foreground">名刺一覧</h1>
        <EmptyState
          title="名刺画像がありません"
          description="Google Driveの連携フォルダにJPEG形式の名刺画像をアップロードしてください。"
          iconName="ImageOff" // lucide-reactのアイコン名を指定 (適宜変更)
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {cardImages.map((file) => (
          <BusinessCardImageItem key={file.id} file={file} />
        ))}
      </div>
    </div>
  );
}

