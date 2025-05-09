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
import { Cloud, UserCircle, LogOut as LogOutIcon, Menu, X } from 'lucide-react';
import { type Session } from 'next-auth';

interface DashboardHeaderProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  onMenuClick?: () => void;
  isSidebarOpen?: boolean;
  session: Session | null;
}

export default function DashboardHeader({ user, onMenuClick, isSidebarOpen, session }: DashboardHeaderProps) {
  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-primary px-4 text-primary-foreground shadow sm:px-6">
      <div className="flex items-center sm:hidden">
        <Button
          variant="ghost"
          size="icon"
          className="text-primary-foreground hover:bg-primary-foreground/10"
          onClick={onMenuClick}
        >
          {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          <span className="sr-only">{isSidebarOpen ? 'Close menu' : 'Open menu'}</span>
        </Button>
      </div>
      
      <div className="flex flex-1 items-center justify-center sm:justify-start">
        <Link href="/dashboard" className="flex items-center gap-2">
          <motion.div 
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: 0 }}
          >
            <Cloud className="h-6 w-6 text-primary-foreground" />
          </motion.div>
          <span className="text-xl font-bold text-primary-foreground">CardSync</span>
        </Link>
      </div>

      <div className="hidden sm:flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="overflow-hidden rounded-full border-2 border-primary-foreground/50 hover:border-primary-foreground/80"
              size="icon"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? 'User'} />
                <AvatarFallback className="bg-primary-foreground text-primary">
                  {user?.name?.charAt(0)?.toUpperCase() || <UserCircle size={20} />}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-card text-card-foreground mt-1">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name || 'User'}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive hover:!bg-destructive/10 hover:!text-destructive focus:bg-destructive/10 focus:text-destructive">
              <LogOutIcon className="mr-2 h-4 w-4" />
              <span>ログアウト</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center sm:hidden ml-auto">
         <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="overflow-hidden rounded-full border-2 border-primary-foreground/50 hover:border-primary-foreground/80"
              size="icon"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? 'User'} />
                <AvatarFallback className="bg-primary-foreground text-primary">
                  {user?.name?.charAt(0)?.toUpperCase() || <UserCircle size={20} />}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-card text-card-foreground mt-1">
             <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name || 'User'}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive hover:!bg-destructive/10 hover:!text-destructive focus:bg-destructive/10 focus:text-destructive">
              <LogOutIcon className="mr-2 h-4 w-4" />
              <span>ログアウト</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}