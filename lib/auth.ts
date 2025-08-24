import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { getRedisClient, User as RedisUser } from './redis';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        userId: { label: 'User ID', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.userId || !credentials?.password) {
          return null;
        }

        try {
          const redis = await getRedisClient();
          
          try {
            const userIdStr = await redis.get(`user:userId:${credentials.userId}`);
            if (!userIdStr) {
              await redis.quit();
              return null;
            }

            const raw = await redis.hGetAll(`user:${userIdStr}`) as Record<string, string>;
            if (!raw || Object.keys(raw).length === 0 || !raw.passwordHash) {
              await redis.quit();
              return null;
            }
            
            const userData: Partial<RedisUser> = raw as unknown as Partial<RedisUser>;
            const passwordHash: string = raw.passwordHash;
            if (!passwordHash) {
              await redis.quit();
              return null;
            }

            const isValidPassword = await bcrypt.compare(credentials.password, passwordHash);
            if (!isValidPassword) {
              await redis.quit();
              return null;
            }

            await redis.quit();
            return {
              id: (userData.id as string) ?? userIdStr,
              name: (userData.name as string) ?? '',
              email: (userData.userId as string) ?? credentials.userId,
              role: (userData.role as string) ?? undefined,
              userId: (userData.userId as string) ?? credentials.userId,
              studentPhoneNumber: (userData.studentPhoneNumber as string) ?? '',
              parentPhoneNumber: (userData.parentPhoneNumber as string) ?? '',
              userType: (userData.userType as string) ?? 'student',
            };
            
          } catch (innerError) {
            await redis.quit();
            throw innerError;
          }
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
        token.role = (user as any).role;
        token.userId = (user as any).userId;
        token.studentPhoneNumber = (user as any).studentPhoneNumber;
        token.parentPhoneNumber = (user as any).parentPhoneNumber;
        token.userType = (user as any).userType;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
        (session.user as any).userId = token.userId;
        (session.user as any).studentPhoneNumber = token.studentPhoneNumber;
        (session.user as any).parentPhoneNumber = token.parentPhoneNumber;
        (session.user as any).userType = token.userType;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allow relative callback URLs
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      // Allow callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) {
        return url;
      }
      // Default redirect to base URL
      return baseUrl;
    },
  },
  pages: {
    signIn: '/auth/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};