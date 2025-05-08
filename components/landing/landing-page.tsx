'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronRight, Cloud, Database, Search, Share2 } from 'lucide-react';
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

  const features = [
    {
      icon: <Cloud className="h-8 w-8 text-primary" />,
      title: 'Google Drive連携',
      description: 'Google Driveにアップロードした名刺を自動で処理'
    },
    {
      icon: <Search className="h-8 w-8 text-primary" />,
      title: 'AI-OCR処理',
      description: '高性能OCRで名刺から情報を正確に抽出'
    },
    {
      icon: <Database className="h-8 w-8 text-primary" />,
      title: 'スプレッドシート連携',
      description: '名刺データをGoogle スプレッドシートで一元管理'
    },
    {
      icon: <Share2 className="h-8 w-8 text-primary" />,
      title: '簡単共有',
      description: 'Google Workspaceでチームメンバーと連絡先を共有'
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-2 md:px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: 0 }}
            >
              <Cloud className="h-8 w-8 text-primary" />
            </motion.div>
            <span className="text-2xl font-bold">CardSync</span>
          </div>
          <nav>
            {status === 'loading' ? (
              <Button variant="outline" disabled>
                読込中...
              </Button>
            ) : session ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  {session.user?.name || session.user?.email}
                </span>
                <Button variant="outline" onClick={handleSignOut} disabled={isLoading}>
                  {isLoading ? 'ログアウト中...' : 'ログアウト'}
                </Button>
              </div>
            ) : (
              <Button variant="outline" onClick={handleSignIn} disabled={isLoading}>
                {isLoading ? 'ログイン中...' : 'ログイン'}
              </Button>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-grow">
        <section className="py-12 md:py-20 px-2 md:px-4">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col space-y-6"
              >
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
                  名刺管理をもっとスマートに
                </h1>
                <p className="text-xl text-muted-foreground">
                  Google Driveにアップロードするだけで、AIが自動で名刺を処理。スプレッドシートで簡単管理。
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  {session ? (
                     <Button onClick={() => router.push('/dashboard')} size="lg">
                       ダッシュボードへ
                       <ChevronRight className="ml-2 h-4 w-4" />
                     </Button>
                  ) : (
                    <Button onClick={handleSignIn} size="lg" disabled={isLoading || status === 'loading'}>
                      {isLoading || status === 'loading' ? '接続中...' : 'Googleで始める'}
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="outline" size="lg" asChild>
                    <Link href="#features">詳しく見る</Link>
                  </Button>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="rounded-lg overflow-hidden shadow-xl"
              >
                <HeroImage />
              </motion.div>
            </div>
          </div>
        </section>

        <section id="features" className="py-12 md:py-20 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold">主な機能</h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                面倒な手作業なしで、名刺管理を効率化
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-card rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="mb-4 p-2 bg-primary/10 rounded-full w-fit">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-6">さっそく始めてみませんか？</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Google Driveと連携して、名刺管理を自動化しましょう。
              </p>
              {session ? (
                <Button onClick={() => router.push('/dashboard')} size="lg">
                  ダッシュボードへ
                </Button>
              ) : (
                <Button onClick={handleSignIn} size="lg" disabled={isLoading || status === 'loading'}>
                  {isLoading || status === 'loading' ? '接続中...' : 'Googleで始める'}
                </Button>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-muted py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Cloud className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">CardSync</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} CardSync. 無断転載を禁じます。
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}