import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import redis, { User as RedisUser } from './redis';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Redis에서 사용자 조회
          const userIdStr = await redis.get(`user:email:${credentials.email}`);
          if (!userIdStr) {
            return null;
          }

          // hGetAll returns a Record<string, string>; empty object if not found
          const raw = await redis.hGetAll(`user:${userIdStr}`) as Record<string, string>;
          if (!raw || Object.keys(raw).length === 0 || !raw.passwordHash) {
            return null;
          }
          const userData: Partial<RedisUser> = raw as unknown as Partial<RedisUser>;
          const passwordHash: string = raw.passwordHash;
          if (!passwordHash) return null;

          // 비밀번호 검증
          const isValidPassword = await bcrypt.compare(credentials.password, passwordHash);
          if (!isValidPassword) {
            return null;
          }

          return {
            id: (userData.id as string) ?? userIdStr,
            name: (userData.name as string) ?? '',
            email: (userData.email as string) ?? credentials.email,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};