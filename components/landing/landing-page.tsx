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
      title: 'Google Drive連携',
      description: 'Google Driveにアップロードした名刺を自動で処理。シームレスなデータフローを実現します。'
    },
    {
      icon: <Search className="h-8 w-8 text-primary" />,
      title: 'AI-OCR処理',
      description: '最先端のAI-OCR技術により、名刺情報を高精度かつ迅速にデジタル化します。'
    },
    {
      icon: <Database className="h-8 w-8 text-primary" />,
      title: 'スプレッドシート連携',
      description: '抽出データは自動でGoogle スプレッドシートに集約。効率的な情報管理をサポートします。'
    },
    {
      icon: <Share2 className="h-8 w-8 text-primary" />,
      title: 'データ活用',
      description: 'チーム内での情報共有やCRM連携など、ビジネスの成長に繋がるデータ活用を促進します。'
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
                  名刺管理を、<span className="text-primary">再定義</span>する
                </h1>
                <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0">
                  Google Drive連携とAI技術で、アナログな名刺情報をスマートなビジネス資産へ。CardSyncが組織の生産性向上を実現します。
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
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">主な機能</h2>
              <p className="mt-4 sm:mt-5 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                CardSyncは、名刺管理の非効率を解消し、ビジネスチャンスを最大化するための強力な機能を提供します。
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

        {/* データ利用に関する説明セクション */}
        <section className="py-16 md:py-20 px-4">
          <div className="container mx-auto">
            <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                お客様のデータ利用について
              </h2>
              <p className="mt-4 sm:mt-5 text-lg sm:text-xl text-muted-foreground">
                CardSyncは、サービスの提供と向上のために、お客様のGoogleアカウント情報へアクセスします。
              </p>
            </div>
            <div className="bg-card rounded-xl p-6 sm:p-8 shadow-lg max-w-4xl mx-auto">
              <p className="text-base sm:text-lg text-muted-foreground mb-6">
                本アプリケーションでは、以下のGoogleユーザーデータへのアクセス権限をリクエストします。これらの権限は、CardSyncの主要機能を提供し、お客様の利便性を高めるために不可欠なものです。
              </p>
              <ul className="space-y-4 mb-6">
                <li className="flex items-start">
                  <Cloud className="h-6 w-6 text-primary mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-foreground text-lg">Google Driveのファイルへのアクセス</h4>
                    <p className="text-muted-foreground text-sm sm:text-base">
                      お客様がアップロードした名刺画像をGoogle Driveに安全に保存し、アプリケーション内で表示・処理するために使用します。これには、ファイルの読み取り、作成、編集の権限が含まれる場合があります。
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <Database className="h-6 w-6 text-primary mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-foreground text-lg">Googleスプレッドシートへのアクセス</h4>
                    <p className="text-muted-foreground text-sm sm:text-base">
                      OCR処理によって名刺から抽出された情報を、お客様の指定するGoogleスプレッドシートに記録・整理するために使用します。これにより、データの管理と活用が容易になります。
                    </p>
                  </div>
                </li>
              </ul>
              <p className="text-sm text-muted-foreground">
                取得したデータは、上記の明示された目的以外で利用されることは一切ありません。お客様のプライバシー保護を最優先に考え、データの取り扱いには最大限の注意を払っています。詳細については、当社のプライバシーポリシーをご確認ください。
              </p>
            </div>
          </div>
        </section>

        {/* CTAセクション */}
        <section className="py-16 sm:py-24 px-4">
          <div className="container mx-auto">
            <div className="max-w-2xl mx-auto text-center bg-gradient-to-r from-primary/80 to-blue-700 p-8 sm:p-12 rounded-xl shadow-2xl">
              <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-white">
                ビジネスを加速させる準備はできましたか？
              </h2>
              <p className="text-lg sm:text-xl text-primary-foreground mb-8">
                今すぐCardSyncを導入し、名刺管理の新しいスタンダードを体験してください。
              </p>
              {session ? (
                <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto text-lg py-3 px-8 bg-white text-primary hover:bg-gray-100">
                  <Link href="/dashboard">ダッシュボードへ</Link>
                </Button>
              ) : (
                <Button onClick={handleSignIn} size="lg" variant="secondary" disabled={isLoading || status === 'loading'} className="w-full sm:w-auto text-lg py-3 px-8 bg-white text-primary hover:bg-gray-100">
                  {isLoading || status === 'loading' ? '接続中...' : '無料で始める'}
                </Button>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-primary text-primary-foreground py-8 sm:py-10 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Cloud className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
              <span className="text-lg sm:text-xl font-bold text-primary-foreground">CardSync</span>
            </div>
            <div className="flex flex-col items-center md:items-end">
              <p className="text-xs sm:text-sm text-primary-foreground/70 mb-1">
                © {new Date().getFullYear()} 株式会社Nobody. All rights reserved.
              </p>
              <Link href="/dashboard/privacy-policy" className="text-xs sm:text-sm text-primary-foreground/70 hover:text-primary-foreground underline">
                プライバシーポリシー
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}