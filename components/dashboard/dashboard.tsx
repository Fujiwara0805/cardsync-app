'use client';

import { useState } from 'react';
import DashboardHeader from './dashboard-header';
import DashboardSidebar from './dashboard-sidebar';
import BusinessCardsList from './business-cards-list';
import EmptyState from './empty-state';
import DashboardStats from './dashboard-stats';
import { Stats, BusinessCard } from '@/lib/types';

export default function Dashboard() {
  const [activeView, setActiveView] = useState<'cards' | 'stats'>('cards');

  // Mock data for demonstration
  const mockStats: Stats = {
    totalCards: 24,
    processedCards: 18,
    pendingCards: 5,
    failedCards: 1
  };

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
    <div className="flex flex-col md:flex-row h-screen overflow-hidden">
      <DashboardSidebar activeView={activeView} setActiveView={setActiveView} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader user={{
          name: 'Demo User',
          email: 'demo@example.com',
          image: 'https://images.pexels.com/photos/2269872/pexels-photo-2269872.jpeg'
        }} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-muted/20">
          {activeView === 'stats' ? (
            <DashboardStats stats={mockStats} />
          ) : (
            <>
              {showCards ? (
                <BusinessCardsList cards={mockCards} />
              ) : (
                <EmptyState />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}