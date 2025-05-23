'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronRight, Cloud, Database, Search, Share2, ArrowDown } from 'lucide-react';
import HeroImage from './hero-image';
import { signIn, useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn('google', { callbackUrl: '/dashboard' });
    } catch (error) {
      console.error("Sign in failed", error);
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    await signOut({ callbackUrl: '/' });
    setIsLoading(false);
  };

  // スムーズスクロール
  const scrollToFeatures = () => {
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const features = [
    {
      icon: <Cloud className="h-8 w-8 text-primary" />,
      title: 'Google Driveと瞬時に連携',
      description: '使い慣れたGoogle Driveが名刺データベースに。アップロードするだけで、面倒な手入力から解放されます。'
    },
    {
      icon: <Search className="h-8 w-8 text-primary" />,
      title: 'AIが高精度で読み取り',
      description: '最新AI-OCRが、文字のカスレや複雑なデザインの名刺も正確に読み取り。あなたの時間を無駄にしません。'
    },
    {
      icon: <Database className="h-8 w-8 text-primary" />,
      title: '情報はスプレッドシートに集約',
      description: '抽出データはリアルタイムでGoogleスプレッドシートへ。検索、編集、共有も思いのまま。'
    },
    {
      icon: <Share2 className="h-8 w-8 text-primary" />,
      title: 'ビジネスチャンスを最大化',
      description: '常に最新の人脈情報で、営業効率アップ。チーム連携を強化し、次のアクションを加速させます。'
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="fixed top-0 w-full bg-primary text-primary-foreground z-50 shadow-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: 0 }}
            >
              <Cloud className="h-6 w-6 sm:h-8 sm:w-8 text-primary-foreground" />
            </motion.div>
            <span className="text-xl sm:text-2xl font-bold text-primary-foreground">CardSync</span>
          </div>
          <nav>
            {status === 'loading' ? (
              <Button variant="outline" size="sm" disabled className="text-sm border-primary-foreground/50 text-primary-foreground">
                読込中...
              </Button>
            ) : session ? (
              <div className="flex items-center gap-2 sm:gap-4">
                <span className="text-xs sm:text-sm text-primary-foreground/80 hidden sm:inline">
                  {session.user?.name || session.user?.email}
                </span>
                <Button variant="outline" size="sm" onClick={handleSignOut} disabled={isLoading} className="text-sm border-primary-foreground/50 text-primary-foreground hover:bg-primary-foreground/10">
                  {isLoading ? 'ログアウト中...' : 'ログアウト'}
                </Button>
              </div>
            ) : (
              <Button 
                variant="outline"
                size="sm" 
                onClick={handleSignIn} 
                disabled={isLoading} 
                className="text-sm font-semibold text-blue-600 border-blue-600 hover:bg-blue-600 hover:text-white dark:text-blue-400 dark:border-blue-400 dark:hover:bg-blue-400 dark:hover:text-gray-900"
              >
                {isLoading ? 'ログイン中...' : 'ログイン'}
              </Button>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-grow pt-16 sm:pt-20">
        {/* ヒーローセクション */}
        <section className="py-12 sm:py-16 md:py-24 px-4">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col space-y-5 sm:space-y-8 text-center lg:text-left"
              >
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground">
                  その名刺、<span className="text-primary">眠らせていませんか？</span>
                </h1>
                <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0">
                  CardSyncが、あなたの名刺管理を劇的に変革します。山積みの名刺、煩雑な手入力、更新されない情報… そんな悩みはもう不要。AIとクラウドの力で、貴重な人脈を「活きる」資産へ。ビジネスのスタートアップも、日々の業務効率化も、CardSyncにお任せください。
                </p>
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 justify-center lg:justify-start pt-4">
                  {session ? (
                     <Button asChild size="lg" className="w-full sm:w-auto text-lg py-3 px-8">
                       <Link href="/dashboard">
                         ダッシュボードへ
                         <ChevronRight className="ml-2 h-5 w-5" />
                       </Link>
                     </Button>
                  ) : (
                    <Button onClick={handleSignIn} size="lg" disabled={isLoading || status === 'loading'} className="w-full sm:w-auto text-lg py-3 px-8">
                      {isLoading || status === 'loading' ? '接続中...' : '今すぐ無料で試す'}
                      <ChevronRight className="ml-2 h-5 w-5" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={scrollToFeatures}
                    className="w-full sm:w-auto text-lg py-3 px-8 border-primary/50 text-primary hover:bg-primary/5 hover:text-primary"
                  >
                    機能詳細
                    <ArrowDown className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="rounded-xl overflow-hidden shadow-2xl mt-8 sm:mt-0"
              >
                <HeroImage />
              </motion.div>
            </div>
          </div>
        </section>

        {/* 機能セクション */}
        <section id="features" className="py-16 md:py-20 bg-muted/30 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">CardSyncが選ばれる理由</h2>
              <p className="mt-4 sm:mt-5 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                名刺管理の「あったらいいな」を全て凝縮。あなたのビジネスを次のステージへ導く、CardSyncだけの価値を体験してください。
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true, margin: "-50px" }}
                  className="bg-card rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col items-start text-left"
                >
                  <div className="mb-4 p-3 bg-primary/10 rounded-lg">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">{feature.title}</h3>
                  <p className="text-base text-muted-foreground flex-grow">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* データ利用に関する説明セクション (ユーザーメリットを強調) */}
        <section className="py-16 md:py-20 px-4">
          <div className="container mx-auto">
            <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                あなたのデータは、安全かつスマートに。
              </h2>
              <p className="mt-4 sm:mt-5 text-lg sm:text-xl text-muted-foreground">
                CardSyncは、Googleの堅牢なセキュリティ基盤の上で、あなたの貴重な情報を最大限に活用します。
              </p>
            </div>
            <div className="bg-card rounded-xl p-6 sm:p-8 shadow-lg max-w-4xl mx-auto">
              <p className="text-base sm:text-lg text-muted-foreground mb-6">
                私たちは、お客様のデータを「お預かりする」だけでなく、お客様のビジネスを「加速させる」ために、Googleアカウントの連携をお願いしています。
              </p>
              <ul className="space-y-4 mb-6">
                <li className="flex items-start">
                  <Cloud className="h-6 w-6 text-primary mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-foreground text-lg">Google Drive: あなただけのセキュアな名刺バンク</h4>
                    <p className="text-muted-foreground text-sm sm:text-base">
                      名刺画像は、あなた自身のGoogle Driveへ。アプリが画像を読み取り、整理整頓をお手伝いします。いつでもどこでも、安全にアクセス可能です。
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <Database className="h-6 w-6 text-primary mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-foreground text-lg">Googleスプレッドシート: 自由自在な人脈データベース</h4>
                    <p className="text-muted-foreground text-sm sm:text-base">
                      AIが読み取った情報は、あなた専用のスプレッドシートへ。検索、ソート、メモ追加、そして最新情報への更新も簡単。チームでの共有も、CRMへの連携もスムーズです。
                    </p>
                  </div>
                </li>
              </ul>
              <p className="text-sm text-muted-foreground">
                CardSyncは、お客様の許可なくデータを外部に提供したり、目的外に利用することはありません。あなたのプライバシーとデータの主権を尊重し、透明性の高いサービス運営をお約束します。詳細はプライバシーポリシーをご覧ください。
              </p>
            </div>
          </div>
        </section>

        {/* CTAセクション */}
        <section className="py-16 sm:py-24 px-4">
          <div className="container mx-auto">
            <div className="max-w-2xl mx-auto text-center bg-gradient-to-r from-primary/80 to-blue-700 p-8 sm:p-12 rounded-xl shadow-2xl">
              <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-white">
                名刺管理の「次へ」進む準備は、できましたか？
              </h2>
              <p className="text-lg sm:text-xl text-primary-foreground mb-8">
                もう、名刺交換のたびにため息をつくのは終わりにしましょう。CardSyncで、未来志向のスマートな働き方を、今すぐ体験。
              </p>
              {session ? (
                <Button asChild size="lg" className="w-full sm:w-auto text-lg py-3 px-8 bg-white text-primary hover:bg-gray-100">
                  <Link href="/dashboard">
                    ダッシュボードへ
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              ) : (
                <Button 
                  onClick={handleSignIn} 
                  size="lg" 
                  disabled={isLoading || status === 'loading'} 
                  className="w-full sm:w-auto text-lg py-3 px-8 bg-white text-primary hover:bg-gray-100"
                >
                  {isLoading || status === 'loading' ? '接続中...' : '今すぐ無料で試す'}
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 bg-muted/50 text-muted-foreground border-t">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-4">
            <Link href="/dashboard/privacy-policy" className="text-sm hover:text-primary transition-colors">
              プライバシーポリシー
            </Link>
            <Link href="/dashboard/terms-of-service" className="text-sm hover:text-primary transition-colors">
              利用規約
            </Link>
            {/* 必要に応じて他のリンクを追加 */}
          </div>
          <p className="text-sm">
            &copy; {new Date().getFullYear()} CardSync. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}