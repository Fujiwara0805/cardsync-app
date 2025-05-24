'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="secondary" size="sm" asChild>
          <Link href="/dashboard/settings">
            <ArrowLeft className="mr-2 h-4 w-4" />
            設定に戻る
          </Link>
        </Button>
      </div>
      <h1 className="text-3xl font-bold mb-6 text-primary">利用規約</h1>
      <div className="prose dark:prose-invert max-w-none bg-card p-6 rounded-lg shadow">
        <p><strong>最終更新日:</strong> 2025年5月24日</p>

        <h2>第1条（本規約への同意）</h2>
        <p>
          この利用規約（以下「本規約」といいます。）は、株式会社Nobody（以下「当社」といいます。）が提供する名刺管理サービス「CardSync」（以下「本サービス」といいます。）の利用条件を定めるものです。ユーザーの皆様（以下「ユーザー」といいます。）には、本規約に従って本サービスをご利用いただきます。ユーザーは、本サービスを利用することにより、本規約の全ての記載内容に同意したものとみなされます。
        </p>

        <h2>第2条（定義）</h2>
        <ul>
          <li>「本サービス」とは、当社が提供する名刺管理サービス「CardSync」及び関連する一切のサービスをいいます。</li>
          <li>「ユーザー」とは、本規約に同意の上、本サービスを利用する個人または法人をいいます。</li>
          {/* ... 他の定義 ... */}
        </ul>
        
        {/* --- 以下、前述の項目案を参考に具体的な内容を追記 --- */}
        {/* 例:
        <h2>第3条（サービスの利用）</h2>
        <p>...</p>
        <h2>第4条（ユーザーの義務・責任）</h2>
        <p>...</p>
        <h2>第5条（禁止事項）</h2>
        <p>...</p>
        ...
        <h2>第X条（準拠法・合意管轄）</h2>
        <p>...</p>
        */}

        <p className="mt-6">以上</p>
      </div>
    </div>
  );
}
