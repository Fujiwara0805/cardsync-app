'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
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
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

interface DashboardSidebarProps {
  activeView: 'cards' | 'stats';
  setActiveView: (view: 'cards' | 'stats') => void;
}

export default function DashboardSidebar({ activeView, setActiveView }: DashboardSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const navigation = [
    { name: 'Dashboard', icon: LayoutDashboard, view: 'cards' as const },
    { name: 'ドライブ連携', icon: FolderSync, view: 'drive' as const },
    { name: '名刺一覧', icon: Contact, view: 'cards' as const },
    { name: '分析', icon: BarChart3, view: 'stats' as const }
  ];

  return (
    <motion.aside
      initial={{ width: '100%', height: 'auto' }}
      animate={{ 
        width: collapsed ? 80 : 240,
        height: '100%'
      }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={cn(
        "bg-card flex flex-col",
        "md:h-full md:border-r",
        "fixed bottom-0 left-0 right-0 md:relative",
        "z-50"
      )}
    >
      <div className="hidden md:flex p-4 items-center justify-between border-b">
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-lg font-semibold"
          >
            CardSync
          </motion.div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className={cn("ml-auto", collapsed && "mx-auto")}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </Button>
      </div>
      
      <nav className="flex md:flex-col p-2 md:space-y-1 space-x-1 md:space-x-0">
        {navigation.map((item) => (
          <Button
            key={item.name}
            variant={activeView === item.view ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start h-10",
              collapsed && "justify-center px-0"
            )}
            onClick={() => {
              if (item.view === 'cards' || item.view === 'stats') {
                setActiveView(item.view);
              }
            }}
          >
            <item.icon className={cn("h-5 w-5", collapsed ? "mr-0" : "mr-2")} />
            {!collapsed && <span>{item.name}</span>}
          </Button>
        ))}
      </nav>
      
      <div className="hidden md:block p-2 border-t">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start h-10",
            collapsed && "justify-center px-0"
          )}
        >
          <Settings className={cn("h-5 w-5", collapsed ? "mr-0" : "mr-2")} />
          {!collapsed && <span>Settings</span>}
        </Button>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start h-10",
            collapsed && "justify-center px-0"
          )}
        >
          <HelpCircle className={cn("h-5 w-5", collapsed ? "mr-0" : "mr-2")} />
          {!collapsed && <span>Help</span>}
        </Button>
      </div>
    </motion.aside>
  );
}