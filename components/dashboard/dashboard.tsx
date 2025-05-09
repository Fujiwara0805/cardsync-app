'use client';

import { useState, useEffect } from 'react';
import DriveSync from './drive-sync';

export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // PC表示時は常にサイドバーを表示
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) { // lgブレークポイント
        setIsSidebarOpen(true);
      } else if (!isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // 初期表示時に実行
    
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarOpen]);



  return (
    <div className="flex min-h-screen bg-background overflow-hidden">
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 bg-muted/20 pb-16 lg:pb-6">
          <DriveSync />
        </main>
    </div>
  );
}