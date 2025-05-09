'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardHeader from './dashboard-header';
import DashboardSidebar from './dashboard-sidebar';
import DriveSync from './drive-sync';
import { BusinessCard } from '@/lib/types';
import { ListChecks, UploadCloud } from 'lucide-react';

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

  // Mock data for demonstration
  const mockCards: BusinessCard[] = [
    {
      id: '1',
      name: '山田 太郎',
      company: '株式会社テクノロジー',
      title: '代表取締役社長',
      email: 'yamada.taro@technology.co.jp',
      phone: '03-1234-5678',
      address: '〒100-0001 東京都千代田区千代田1-1',
      website: 'https://technology.co.jp',
      notes: '',
      imageUrl: 'https://images.pexels.com/photos/5699456/pexels-photo-5699456.jpeg',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'processed'
    },
    {
      id: '2',
      name: '佐藤 花子',
      company: '株式会社イノベーション',
      title: '技術部長',
      email: 'sato.hanako@innovation.co.jp',
      phone: '03-9876-5432',
      address: '〒150-0002 東京都渋谷区渋谷2-2',
      website: 'https://innovation.co.jp',
      notes: '2025年テクノロジーカンファレンスにて名刺交換',
      imageUrl: 'https://images.pexels.com/photos/5699456/pexels-photo-5699456.jpeg',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
      status: 'processed'
    },
    {
      id: '3',
      name: '鈴木 一郎',
      company: 'グローバルサービス株式会社',
      title: 'マーケティング部長',
      email: 'suzuki.ichiro@globalservices.co.jp',
      phone: '03-5555-1234',
      address: '〒107-0052 東京都港区赤坂3-3',
      website: 'https://globalservices.co.jp',
      notes: '',
      imageUrl: 'https://images.pexels.com/photos/5699456/pexels-photo-5699456.jpeg',
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      updatedAt: new Date(Date.now() - 172800000).toISOString(),
      status: 'pending'
    }
  ];

  const showCards = mockCards.length > 0;

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
        <button
          onClick={() => console.log("名刺一覧 (仮)")}
          className={`flex flex-col items-center p-2 rounded-md hover:bg-primary-foreground/10 w-1/2`}
        >
          <ListChecks className="h-6 w-6" />
          <span className="text-xs mt-1">名刺一覧</span>
        </button>
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