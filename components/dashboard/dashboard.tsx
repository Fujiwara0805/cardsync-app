'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardHeader from './dashboard-header';
import DashboardSidebar from './dashboard-sidebar';
import DriveSync from './drive-sync';
import { ListChecks, UploadCloud } from 'lucide-react';
import Link from 'next/link';

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
      {/* サイドバーのオーバーレイ */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* サイドバー */}
      <DashboardSidebar 
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      
      {/* メインコンテンツ */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader 
          user={{
            name: 'Demo User',
            email: 'demo@example.com',
            image: 'https://images.pexels.com/photos/2269872/pexels-photo-2269872.jpeg'
          }}
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
        />
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 bg-muted/20 pb-16 lg:pb-6">
          <DriveSync />
        </main>
      </div>

      {/* モバイル用下部ナビゲーション */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-primary border-t border-primary-foreground/20 flex justify-around py-2 z-30 text-primary-foreground">
        <Link href="/dashboard/cards" legacyBehavior passHref>
          <a className={`flex flex-col items-center p-2 rounded-md hover:bg-primary-foreground/10 w-1/2`}>
            <ListChecks className="h-6 w-6" />
            <span className="text-xs mt-1">名刺一覧</span>
          </a>
        </Link>
        <button
          onClick={() => alert('画像アップロード（未実装です。drive-syncページへ遷移予定）')}
          className={`flex flex-col items-center p-2 rounded-md hover:bg-primary-foreground/10 w-1/2`}
        >
          <UploadCloud className="h-6 w-6" />
          <span className="text-xs mt-1">アップロード</span>
        </button>
      </div>
    </div>
  );
}