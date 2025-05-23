'use client'; // このレイアウトコンポーネントは状態を持つためクライアントコンポーネント

import { useState, useEffect, ReactNode, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import DashboardHeader from '@/components/dashboard/dashboard-header';
import DashboardSidebar from '@/components/dashboard/dashboard-sidebar';
import { ListChecks, UploadCloud, Home, Cog } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react'; // セッション情報をクライアントサイドで取得
import { type Session } from 'next-auth'; // Session 型を明示的にインポート
import GlobalLoadingIndicator from '@/app/loading'; // <--- app/loading.tsx をインポート

export default function DashboardAppLayout({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { data: session, status } = useSession(); // クライアントサイドでセッションを取得
  const pathname = usePathname();

  // PC表示時は常にサイドバーを表示するロジック
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) { // lgブレークポイント (Tailwindのlgに合わせる)
        setIsSidebarOpen(true);
      } else if (isSidebarOpen && window.innerWidth < 768) {
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

  let pageTitle = "CardSync"; 
  if (pathname === '/dashboard') {
    pageTitle = "ダッシュボード"; 
  } else if (pathname === '/dashboard/cards') {
    pageTitle = "名刺一覧";
  } else if (pathname === '/dashboard/drive-sync') {
    pageTitle = "画像アップロード・同期";
  } else if (pathname === '/dashboard/settings') {
    pageTitle = "設定";
  }

  // ナビゲーションアイテムの定義 (アニメーションやスタイル適用のため)
  const navItems = [
    { href: "/dashboard/cards", label: "名刺一覧", icon: ListChecks },
    { href: "/dashboard/image-upload", label: "アップロード", icon: UploadCloud },
    // 必要に応じて他のナビゲーションアイテムを追加
    // { href: "/dashboard", label: "ホーム", icon: Home },
    // { href: "/dashboard/settings", label: "設定", icon: Cog },
  ];

  if (status === "loading") {
    // セッション読み込み中の表示を共通ローディングインジケータに変更
    return <GlobalLoadingIndicator />;
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* サイドバーのオーバーレイ (スマホ表示時) */}
      <AnimatePresence>
        {isSidebarOpen && window.innerWidth < 768 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* サイドバー */}
      <DashboardSidebar 
        // dashboard-sidebar.tsx の props定義に合わせて渡す
        // 例: isOpen, setIsOpen, session など
        className={isSidebarOpen && window.innerWidth < 768 ? 'translate-x-0' : window.innerWidth < 768 ? '-translate-x-full' : ''}
        session={session as Session | null} // session の型を明示
        // dashboard-sidebar.tsx の props に isOpen と setIsOpen があれば渡す
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      
      {/* ヘッダーとメインコンテンツを束ねるコンテナ */}
      <div className="flex-1 flex flex-col min-h-0"> {/* h-screen を削除、または min-h-screen か min-h-0 */}
        <DashboardHeader 
          user={headerUser}
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} // スマホ時のメニューアイコンクリック
          isSidebarOpen={isSidebarOpen} // メニューアイコンの状態制御用
          session={session} 
        />
        {/* page.tsx の内容がここにレンダリングされる */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 bg-muted/20 pb-20 lg:pb-6"> {/* モバイルフッター分の余白確保 */}
          {/* Suspenseのフォールバック表示を共通ローディングインジケータに変更 */}
          <Suspense fallback={<GlobalLoadingIndicator />}>
            {children}
          </Suspense>
        </main>
      </div>

      {/* モバイル用下部ナビゲーション */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-muted border-t border-border flex justify-around items-center h-16 z-30 shadow-md"> {/* MODIFIED: shadow- ऊपर を shadow-md に変更 */}
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link href={item.href} key={item.href} className="flex-1 h-full">
              <motion.div
                className={`flex flex-col items-center justify-center h-full rounded-md transition-colors duration-200 ease-in-out
                            ${isActive 
                              ? 'bg-primary text-primary-foreground' // Shadcn/UIのprimaryカラーと前景を使用
                              : 'text-muted-foreground hover:bg-primary/10 hover:text-primary active:bg-primary/20'
                            }`}
                whileTap={{ scale: 0.95 }} 
              >
                <motion.div
                  animate={{ scale: isActive ? 1.15 : 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                >
                  <item.icon className="h-6 w-6" /> 
                </motion.div>
                <span className="text-xs mt-1">
                  {item.label}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
