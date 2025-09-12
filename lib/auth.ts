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
          console.log('Missing credentials');
          return null;
        }

        try {
          const redis = await getRedisClient();
          
          try {
            // Prefer canonical lookup by mapping, then fall back to legacy direct key
            let userData: Record<string, string> | undefined;

            // 1) Canonical mapping: user:userId:<username> -> internal id
            const mappedId = await redis.get(`user:userId:${credentials.userId}`);
            console.log('userId mapping lookup:', mappedId ? 'hit' : 'miss');
            if (mappedId) {
              const mappedData = await redis.hGetAll(`user:${mappedId}`) as Record<string, string>;
              if (mappedData && Object.keys(mappedData).length > 0) {
                userData = mappedData;
              }
            }

            // 2) Fallback to direct hash: user:<username>
            if (!userData || Object.keys(userData).length === 0) {
              const directData = await redis.hGetAll(`user:${credentials.userId}`) as Record<string, string>;
              console.log('Direct lookup fallback:', directData && Object.keys(directData).length > 0 ? 'hit' : 'miss');
              if (directData && Object.keys(directData).length > 0) {
                userData = directData;
              }
            }
            
            // If still not found, try by email
            if (!userData || Object.keys(userData).length === 0 || (!userData.password && !userData.passwordHash)) {
              const emailData = await redis.hGetAll(`user:email:${credentials.userId}`) as Record<string, string>;
              if (emailData?.userId) {
                userData = await redis.hGetAll(`user:${emailData.userId}`) as Record<string, string>;
                console.log('Email lookup found:', userData ? 'yes' : 'no');
              }
            }
            
            if (!userData || Object.keys(userData).length === 0) {
              console.log('No user data found');
              await redis.quit();
              return null;
            }
            
            // Check password - handle both 'password' and 'passwordHash' fields
            const passwordHash = userData.password || userData.passwordHash;
            console.log('Password field found:', passwordHash ? 'yes' : 'no');
            if (!passwordHash) {
              await redis.quit();
              return null;
            }

            const isValidPassword = await bcrypt.compare(credentials.password, passwordHash);
            console.log('Password validation result:', isValidPassword);
            if (!isValidPassword) {
              await redis.quit();
              return null;
            }

            await redis.quit();
            return {
              id: userData.id ?? userData.userId ?? credentials.userId,
              name: userData.name ?? '',
              email: userData.email ?? userData.userId ?? credentials.userId,
              role: userData.role ?? undefined,
              userId: userData.userId ?? userData.id ?? credentials.userId,
              studentPhoneNumber: userData.studentPhoneNumber ?? '',
              parentPhoneNumber: userData.parentPhoneNumber ?? '',
              userType: userData.type ?? userData.userType ?? 'student',
              influencerSlug: userData.influencerSlug ?? undefined,
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
        token.influencerSlug = (user as any).influencerSlug;
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
        (session.user as any).influencerSlug = token.influencerSlug;
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
