import { Suspense } from 'react';
import Dashboard from '@/components/dashboard/dashboard';
import AuthProvider from '@/components/auth-provider';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ダッシュボード - CardSync',
  description: 'CardSyncダッシュボード。名刺情報の確認やGoogleサービスとの連携設定を行います。',
};

export default async function DashboardPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
      <Dashboard />
    </Suspense>
  );
}