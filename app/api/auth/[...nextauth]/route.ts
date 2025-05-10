import NextAuth from 'next-auth';
import { nextAuthConfiguration } from '@/lib/authConfig'; // 新しい設定ファイルのパスに合わせて調整

const handler = NextAuth(nextAuthConfiguration);

export { handler as GET, handler as POST };