'use client';

import { useState, useEffect } from 'react';
import SplashScreen from '@/components/splash-screen';
import { ThemeProvider } from '@/components/theme-provider';
import AuthProvider from '@/components/auth-provider';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { Inter as FontSans } from 'next/font/google';

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
});

export default function AppBody({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);

  // セッションストレージを使って、一度表示したら次回以降は表示しないようにする (オプション)
  // useEffect(() => {
  //   const splashShown = sessionStorage.getItem('splashShown');
  //   if (splashShown) {
  //     setShowSplash(false);
  //   }
  // }, []);

  const handleSplashFinished = () => {
    setShowSplash(false);
    // sessionStorage.setItem('splashShown', 'true');
  };

  if (showSplash) {
    return (
      // スプラッシュ表示時は<html>と<body>も最小限でよい
      // suppressHydrationWarning は RootLayout の <html> に移譲
      <SplashScreen onFinished={handleSplashFinished} />
    );
  }

  return (
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
  );
}
