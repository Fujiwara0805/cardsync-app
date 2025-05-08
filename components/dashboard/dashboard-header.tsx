'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useSession, signOut } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, Bell, Cloud, Upload, UserCircle, LogOut, Settings } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface DashboardHeaderProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export default function DashboardHeader({ user }: DashboardHeaderProps) {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  return (
    <header className="border-b bg-background z-10 sticky top-0">
      <div className="container mx-auto flex h-16 items-center justify-between px-2 md:px-4">
        <div className="flex items-center">
          <Link href="/dashboard" className="flex items-center">
            <motion.div 
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: 0 }}
            >
              <Cloud className="h-6 w-6 text-primary mr-2" />
            </motion.div>
            <span className="text-xl font-bold">CardSync</span>
          </Link>
        </div>
        
        <div className="hidden md:block flex-1 mx-6">
          <div className="relative max-w-md">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="名刺を検索..."
              className="pl-8 w-full max-w-md"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
          <Button variant="outline" size="icon" className="hidden md:inline-flex">
            <Bell className="h-5 w-5" />
          </Button>

          <Button variant="default" size="sm" className="hidden md:flex">
            <Upload className="mr-2 h-4 w-4" />
            名刺をアップロード
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.image || ''} alt={user?.name || 'User'} />
                  <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>アカウント</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <UserCircle className="mr-2 h-4 w-4" />
                <span>プロフィール</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>設定</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>ログアウト</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}