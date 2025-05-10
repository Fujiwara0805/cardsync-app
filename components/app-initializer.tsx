'use client';

import { useState, useEffect } from 'react';
import SplashScreen from './splash-screen';

export default function AppInitializer({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);

  // ローカルストレージを使って初回訪問のみスプラッシュ画面を表示
  useEffect(() => {
    const hasSeen = localStorage.getItem('has_seen_splash');
    if (hasSeen) {
      setShowSplash(false);
    } else {
      localStorage.setItem('has_seen_splash', 'true');
    }
  }, []);

  if (typeof window === 'undefined') {
    // サーバーサイドでは何も表示しないか、ローディングスケルトンを表示
    return null; 
  }

  return (
    <>
      {showSplash && <SplashScreen onFinished={() => setShowSplash(false)} />}
      {!showSplash && children}
    </>
  );
}
