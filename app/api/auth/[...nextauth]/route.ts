import NextAuth, { type NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: [
            // "openid",
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/userinfo.profile",
            "https://www.googleapis.com/auth/drive.file", // 一旦コメントアウトまたは削除
            // "https://www.googleapis.com/auth/drive",      // こちらの広範なスコープを試す
          ].join(" "),
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      console.log("JWT Callback - account:", account);
      console.log("JWT Callback - token before:", token);
      if (account && user) {
        token.id = user.id;
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.accessTokenExpires = account.expires_at ? account.expires_at * 1000 : undefined;
        token.scope = account.scope;
      }
      console.log("JWT Callback - token after:", token);
      return token;
    },
    async session({ session, token }) {
      console.log("Session Callback - token:", token);
      if (token.id && session.user) {
        session.user.id = token.id as string;
      }
      if (token.accessToken) {
        (session as any).accessToken = token.accessToken;
      }
      if (token.scope) {
        (session as any).scope = token.scope;
      }
      console.log("Session Callback - session after:", session);
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };