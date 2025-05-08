'use client'; // スプラッシュの状態管理のためクライアントコンポーネントに

import './globals.css';
import type { Metadata } from 'next';
import { Inter as FontSans } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import AuthProvider from '@/components/auth-provider';
import SplashScreen from '@/components/splash-screen'; // 作成したスプラッシュコンポーネント
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showSplash, setShowSplash] = useState(true);

  // セッションストレージを使って、一度表示したら次回以降は表示しないようにする (オプション)
  // useEffect(() => {
  //   const splashShown = sessionStorage.getItem('splashShown');
  //   if (splashShown) {
  //     setShowSplash(false);
  //   }
  // }, []); // このuseEffectをコメントアウトまたは削除

  const handleSplashFinished = () => {
    setShowSplash(false);
    // sessionStorage.setItem('splashShown', 'true'); // この行をコメントアウトまたは削除
  };

  if (showSplash) {
    return (
      <html lang="ja" suppressHydrationWarning>
        <body className={cn('min-h-screen bg-background font-sans antialiased', fontSans.variable)}>
          <SplashScreen onFinished={handleSplashFinished} />
        </body>
      </html>
    );
  }

  return (
    <html lang="ja" suppressHydrationWarning>
      {/* <head /> はNext.jsが自動で処理するので通常不要 */}
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          fontSans.variable
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}