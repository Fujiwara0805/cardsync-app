'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
// 必要に応じて他の設定関連コンポーネントをインポート
// 例: import DriveSync from '@/components/dashboard/drive-sync';

export default function SettingsPage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2 text-primary">設定</h1>
        <p className="text-muted-foreground">
          各種設定や法的情報を確認できます。
        </p>
      </div>
      
      <Separator />

      {/* 例: Google Drive同期設定などの既存コンポーネントをここに配置 */}
      {/* <DriveSync /> */}
      
      {/* <Separator /> */}


      <Card>
        <CardHeader>
          <CardTitle>アカウント設定</CardTitle>
          <CardDescription>
            アカウントに関連する設定を行います。（現在プレースホルダー）
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* アカウント設定項目をここに追加 */}
          <p className="text-sm text-muted-foreground">近日公開予定です。</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>法的情報</CardTitle>
          <CardDescription>
            本サービスのご利用に関する重要な情報です。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Link href="/dashboard/privacy-policy" className="text-sm font-medium text-primary hover:underline">
              プライバシーポリシー
            </Link>
            <p className="text-xs text-muted-foreground">
              個人情報の取り扱いについて説明しています。
            </p>
          </div>
          <div>
            <Link href="/dashboard/terms-of-service" className="text-sm font-medium text-primary hover:underline">
              利用規約
            </Link>
            <p className="text-xs text-muted-foreground">
              サービスの利用条件を定めています。
            </p>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
