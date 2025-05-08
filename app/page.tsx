import LandingPage from '@/components/landing/landing-page';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CardSync - スマート名刺管理 | Google Drive連携',
  description: 'CardSyncは、Google DriveとAIを活用した新しい名刺管理システムです。手軽に名刺情報をデジタル化し、ビジネスを効率化します。',
  // 他のメタデータ（OGPなど）もここに追加可能
  // openGraph: {
  //   title: 'CardSync - スマート名刺管理',
  //   description: 'Google Drive連携で簡単な名刺管理を実現。',
  //   images: ['/og-image.png'], // OGP画像のパス
  // },
};

export default function Home() {
  return <LandingPage />;
}