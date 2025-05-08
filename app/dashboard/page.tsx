import { Suspense } from 'react';
import Dashboard from '@/components/dashboard/dashboard';
import AuthProvider from '@/components/auth-provider';

export default async function DashboardPage() {
  return (
    <AuthProvider>
      <Suspense fallback={<div>Loading...</div>}>
        <Dashboard />
      </Suspense>
    </AuthProvider>
  );
}