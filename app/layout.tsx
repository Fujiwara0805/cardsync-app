import './globals.css';
import type { Metadata } from 'next';
import { Inter as FontSans } from 'next/font/google';
import AppBody from '@/components/AppBody'; // 作成したAppBodyコンポーネントをインポート
import { cn } from '@/lib/utils';

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'CardSync',
  description: 'CardSyncは、Google Driveのスプレッドシートと連携して、名刺情報を管理するアプリです。',
  icons: {
    icon: 'https://res.cloudinary.com/dz9trbwma/image/upload/v1747987887/CardSync_rr3hvh.png',
    shortcut: 'https://res.cloudinary.com/dz9trbwma/image/upload/v1747987887/CardSync_rr3hvh.png',
    apple: 'https://res.cloudinary.com/dz9trbwma/image/upload/v1747987887/CardSync_rr3hvh.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head /> {/* Next.js 13+ App Routerでは、ここに明示的な<head>タグは通常不要で、metadataオブジェクトから自動生成されますが、カスタムの<meta>タグなどを追加したい場合は記述できます。 */}
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          fontSans.variable // グローバルなフォント設定
        )}
      >
        <AppBody>{children}</AppBody>
      </body>
    </html>
  );
}