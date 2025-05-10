'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/settings">
            <ArrowLeft className="mr-2 h-4 w-4" />
            設定に戻る
          </Link>
        </Button>
      </div>
      <h1 className="text-3xl font-bold mb-6">プライバシーポリシー</h1>
      <div className="prose dark:prose-invert max-w-none bg-card p-6 rounded-lg shadow">
        {/* 
          Tailwind Typography プラグイン (@tailwindcss/typography) を使用している場合、
          上記の "prose" クラスがスタイルを適用します。
          インストールしていない場合は、手動でスタイルを調整してください。
        */}
        <p><strong>最終更新日:</strong> [YYYY年MM月DD日]</p>

        <h2>はじめに</h2>
        <p>
          株式会社[あなたの会社名]（以下「当社」といいます。）は、当社が提供する名刺管理サービス「CardSync」（以下「本サービス」といいます。）における、ユーザーの個人情報の取扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」といいます。）を定めます。
        </p>

        <h2>1. 収集する個人情報</h2>
        <p>
          本サービスにおいて当社が収集する可能性のある個人情報は、以下のとおりです。
        </p>
        <ul>
          <li>氏名、メールアドレス、会社名、役職等のアカウント登録情報</li>
          <li>Googleアカウント連携により取得する情報（Google Drive内のファイル情報（ファイル名、ID、更新日時等）、Googleスプレッドシート内の情報、ユーザープロフィール情報等、本サービスの機能提供に必要な範囲に限ります）</li>
          <li>名刺画像及びOCR処理により抽出された情報（氏名、会社名、電話番号、メールアドレス、住所等）</li>
          <li>ユーザーが本サービスに任意で入力するメモ情報</li>
          <li>IPアドレス、Cookie情報、端末情報、アクセスログ等の利用状況に関する情報</li>
        </ul>

        <h2>2. 個人情報の利用目的</h2>
        <p>当社は、収集した個人情報を以下の目的で利用します。</p>
        <ul>
          <li>本サービスの提供、運営、改善のため</li>
          <li>ユーザーからのお問い合わせ、サポート対応のため</li>
          <li>利用規約に違反する行為への対応のため</li>
          <li>本サービスに関する重要なお知らせやメンテナンス情報等の連絡のため</li>
          <li>個人を特定できない形での統計データ作成、マーケティング、新サービス開発のため</li>
          <li>上記の利用目的に付随する目的</li>
        </ul>

        {/* --- 以下、前述の項目案を参考に具体的な内容を追記 --- */}
        {/* 例: 
        <h2>3. 個人情報の第三者提供</h2>
        <p>...</p>
        <h2>4. 個人情報の共同利用</h2>
        <p>...</p>
        <h2>5. 個人情報の管理と保護</h2>
        <p>...</p>
        <h2>6. 個人情報の開示・訂正・利用停止等</h2>
        <p>...</p>
        <h2>7. Cookieその他の技術の利用</h2>
        <p>...</p>
        <h2>8. 外部サービスの利用</h2>
        <p>本サービスは、以下の外部サービスを利用しており、それに伴い個人情報が外部サービス提供事業者に提供される場合があります。各サービスのプライバシーポリシーについては、各社のウェブサイトをご確認ください。</p>
        <ul>
          <li>Google Drive API (Google LLC)</li>
          <li>Google Sheets API (Google LLC)</li>
          <li>Google Cloud Vision API (Google LLC)</li>
        </ul>
        <h2>9. プライバシーポリシーの変更</h2>
        <p>...</p>
        <h2>10. お問い合わせ窓口</h2>
        <p>
          本ポリシーに関するお問い合わせは、下記の窓口までお願いいたします。
          <br />
          [あなたの会社名] 個人情報お問い合わせ窓口
          <br />
          メールアドレス: [あなたの連絡先メールアドレス]
        </p>
        */}

        <p className="mt-6">以上</p>
      </div>
    </div>
  );
}
