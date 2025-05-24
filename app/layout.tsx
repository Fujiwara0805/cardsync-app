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
    // ブラウザのタブ／ブックマーク用
    icon: [
      {
        url: 'https://res.cloudinary.com/dz9trbwma/image/upload/v1748066466/ChatGPT_Image_2025%E5%B9%B45%E6%9C%8824%E6%97%A5_15_00_50_qdclh9.png',
        sizes: '16x16',
        type: 'image/png',
      },
      {
        url: 'https://res.cloudinary.com/dz9trbwma/image/upload/v1748066466/ChatGPT_Image_2025%E5%B9%B45%E6%9C%8824%E6%97%A5_15_00_50_qdclh9.png',
        sizes: '32x32',
        type: 'image/png',
      },
    ],
    // Windows ショートカットや一部のブラウザ向け
    shortcut: {
      url: 'https://res.cloudinary.com/dz9trbwma/image/upload/v1748066466/ChatGPT_Image_2025%E5%B9%B45%E6%9C%8824%E6%97%A5_15_00_50_qdclh9.png',
      sizes: '48x48',
      type: 'image/png',
    },
    // iOS ホーム画面に追加したときに使われる Apple Touch Icon
    apple: {
      url: 'https://res.cloudinary.com/dz9trbwma/image/upload/v1748066466/ChatGPT_Image_2025%E5%B9%B45%E6%9C%8824%E6%97%A5_15_00_50_qdclh9.png',
      sizes: '180x180',
      type: 'image/png',
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head />
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          fontSans.variable
        )}
      >
        <AppBody>{children}</AppBody>
      </body>
    </html>
  );
}