'use client'; // このレイアウトコンポーネントは状態を持つためクライアントコンポーネント

import { useState, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardHeader from '@/components/dashboard/dashboard-header';
import DashboardSidebar from '@/components/dashboard/dashboard-sidebar';
import { ListChecks, UploadCloud } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react'; // セッション情報をクライアントサイドで取得
import { type Session } from 'next-auth'; // Session 型を明示的にインポート

export default function CardsDashboardLayout({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { data: session } = useSession(); // クライアントサイドでセッションを取得

  // PC表示時は常にサイドバーを表示するロジック
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) { // lgブレークポイント (Tailwindのlgに合わせる)
        setIsSidebarOpen(true);
      } else if (isSidebarOpen && window.innerWidth < 1024) {
        // スマホサイズになったときにサイドバーを自動で閉じる場合は以下のコメントを外す
        // setIsSidebarOpen(false); 
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); 
    
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarOpen]); // isSidebarOpen を依存配列に追加

  const headerUser = session?.user ? {
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
  } : undefined;

  return (
    <div className="flex min-h-screen bg-background overflow-hidden">
      {/* サイドバーのオーバーレイ (スマホ表示時) */}
      <AnimatePresence>
        {isSidebarOpen && window.innerWidth < 1024 && (
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
        // dashboard-sidebar.tsx の props定義に合わせて渡す
        // 例: isOpen, setIsOpen, session など
        className={isSidebarOpen && window.innerWidth < 1024 ? 'translate-x-0' : window.innerWidth < 1024 ? '-translate-x-full' : ''}
        session={session as Session | null} // session の型を明示
        // dashboard-sidebar.tsx の props に isOpen と setIsOpen があれば渡す
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      
      {/* メインコンテンツエリア */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader 
          user={headerUser}
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} // スマホ時のメニューアイコンクリック
          isSidebarOpen={isSidebarOpen} // メニューアイコンの状態制御用
          session={session} 
        />
        {/* page.tsx の内容がここにレンダリングされる */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 bg-muted/20 pb-20 lg:pb-6"> {/* モバイルフッター分の余白確保 */}
          {children}
        </main>
      </div>

      {/* モバイル用下部ナビゲーション */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-primary border-t border-primary-foreground/20 flex justify-around py-2 z-30 text-primary-foreground">
        <Link href="/dashboard/cards" legacyBehavior passHref>
          <a className={`flex flex-col items-center p-2 rounded-md hover:bg-primary-foreground/10 w-1/2 ${
            typeof window !== 'undefined' && window.location.pathname === '/dashboard/cards' ? 'bg-primary-foreground/20' : ''
          }`}>
            <ListChecks className="h-6 w-6" />
            <span className="text-xs mt-1">名刺一覧</span>
          </a>
        </Link>
        <Link href="/dashboard/drive-sync" legacyBehavior passHref>
          <a className={`flex flex-col items-center p-2 rounded-md hover:bg-primary-foreground/10 w-1/2 ${
            typeof window !== 'undefined' && window.location.pathname === '/dashboard/drive-sync' ? 'bg-primary-foreground/20' : ''
          }`}>
            <UploadCloud className="h-6 w-6" />
            <span className="text-xs mt-1">アップロード</span>
          </a>
        </Link>
      </div>
    </div>
  );
}
