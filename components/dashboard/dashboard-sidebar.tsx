'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  FolderSync,
  Contact,
  BarChart3,
  Settings,
  HelpCircle,
  X,
  Bell,
  UploadCloud
} from 'lucide-react';
import { useEffect } from 'react';
import { Session } from 'next-auth';
import { usePathname } from 'next/navigation';

interface DashboardSidebarProps extends React.HTMLAttributes<HTMLElement> {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  session: Session | null;
}

export default function DashboardSidebar({
  isOpen,
  setIsOpen,
  session
}: DashboardSidebarProps) {
  const pathname = usePathname();

  const primaryNavigation = [
    { name: 'Google連携', icon: LayoutDashboard, href: '/dashboard' },
    { name: '名刺一覧', icon: Contact, href: '/dashboard/cards' },
    { name: '画像アップロード', icon: UploadCloud, href: '/dashboard/image-upload' },
  ];

  const secondaryNavigation = [
    { name: 'お知らせ', icon: Bell, href: '/dashboard/notifications' },
    { name: '設定', icon: Settings, href: '/dashboard/settings' },
    { name: 'ヘルプ', icon: HelpCircle, href: '/dashboard/help' },
  ];

  const handleLinkClick = (href: string) => {
    console.log(`Navigating to ${href}`);
    if (window.innerWidth < 768) {
        setIsOpen(false);
    }
  }
  
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsOpen(true); 
      } else {
        // スマホサイズに戻ったときに勝手に開かないように、ユーザー操作で再度開くまでは閉じておく
        // setIsOpen(false); // ← この行は意図によって調整
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [setIsOpen]);

  return (
    <>
      <AnimatePresence>
        {isOpen && window.innerWidth < 768 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className={cn(
              "bg-card flex flex-col fixed inset-y-0 left-0 z-50 w-64 md:w-60 lg:w-64",
              "border-r md:relative md:translate-x-0"
            )}
          >
            <div className="flex p-4 items-center justify-between border-b h-14">
              <Link href="/dashboard" className="text-lg font-semibold text-primary" onClick={() => {if(window.innerWidth < 768) setIsOpen(false)}}>
                CardSync
              </Link>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsOpen(false)}
                className="md:hidden text-muted-foreground"
              >
                <X size={18} />
              </Button>
            </div>
            
            <nav className="flex flex-col p-2 space-y-1 flex-grow">
              {primaryNavigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Button
                    key={item.name}
                    variant={isActive ? "secondary" : "ghost"}
                    className="w-full justify-start h-10"
                    asChild
                  >
                    <Link href={item.href} onClick={() => handleLinkClick(item.href)}>
                      <item.icon className={cn("h-5 w-5 mr-3", isActive ? "text-secondary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                      <span className={cn(isActive ? "text-secondary-foreground" : "group-hover:text-foreground")}>{item.name}</span>
                    </Link>
                  </Button>
                );
              })}
            </nav>
            
            <div className="p-2 border-t">
              {secondaryNavigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Button
                    key={item.name}
                    variant={isActive ? "secondary" : "ghost"}
                    className="w-full justify-start h-10"
                    asChild
                  >
                    <Link href={item.href} onClick={() => handleLinkClick(item.href)}>
                      <item.icon className={cn("h-5 w-5 mr-3", isActive ? "text-secondary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                      <span className={cn(isActive ? "text-secondary-foreground" : "text-muted-foreground group-hover:text-foreground")}>{item.name}</span>
                    </Link>
                  </Button>
                );
              })}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}