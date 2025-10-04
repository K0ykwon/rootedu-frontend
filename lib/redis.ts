import { createClient } from 'redis';

type RedisClient = ReturnType<typeof createClient>;

declare global {
  // Shared Redis client instance reused across hot reloads / lambda invocations
  // eslint-disable-next-line no-var
  var __redis: RedisClient | undefined;
  // In-flight connection promise to avoid duplicate connects
  // eslint-disable-next-line no-var
  var __redisPromise: Promise<RedisClient> | undefined;
}

const REDIS_URL = process.env.REDIS_URL || process.env.DATABASE_URL || 'redis://localhost:6379';

// Create a singleton Redis client with pooled connection handling
function createRedisClient(): RedisClient {
  const client = createClient({
    url: REDIS_URL,
    database: 0,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          console.error('Redis: Too many reconnection attempts');
          return new Error('Too many reconnection attempts');
        }
        return Math.min(retries * 100, 3000);
      }
    }
  });

  client.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });

  client.on('connect', () => {
    console.log('Redis client connected');
  });

  client.on('ready', () => {
    console.log('Redis client ready');
  });

  client.on('end', () => {
    console.warn('Redis client connection ended. It will be reinitialized on next use.');
  });

  return client;
}

// Ensure a shared client exists so legacy default import still references an object
if (!globalThis.__redis) {
  globalThis.__redis = createRedisClient();
}

/**
 * Establishes a usable Redis connection, recreating the client if it was closed.
 */
async function ensureConnection(): Promise<RedisClient> {
  while (true) {
    if (!globalThis.__redis) {
      globalThis.__redis = createRedisClient();
    }

    const client = globalThis.__redis;

    if (client.isOpen) {
      return client;
    }

    if (!globalThis.__redisPromise) {
      const currentClient = client;
      globalThis.__redisPromise = (async () => {
        try {
          await currentClient.connect();
          return currentClient;
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          if (message.toLowerCase().includes('client is closed') || message.toLowerCase().includes('the client is closed')) {
            console.warn('Redis client was closed. Reinitializing shared connection...');
            try {
              currentClient.removeAllListeners();
              await currentClient.disconnect();
            } catch (disconnectError) {
              console.error('Failed to cleanly disconnect closed Redis client:', disconnectError);
            }
            globalThis.__redis = createRedisClient();
          }
          throw error;
        } finally {
          globalThis.__redisPromise = undefined;
        }
      })();
    }

    try {
      const connectedClient = await globalThis.__redisPromise;
      if (connectedClient.isOpen) {
        // Ensure the global pointer stays in sync with the connected instance
        globalThis.__redis = connectedClient;
        return connectedClient;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.toLowerCase().includes('client is closed') || message.toLowerCase().includes('the client is closed')) {
        // Loop again to instantiate a fresh client
        continue;
      }
      throw error;
    }
  }
}

// Get the singleton Redis client (ensures connection) with safe guards against closing it
export async function getRedisClient() {
  const connectedClient = await ensureConnection();

  return new Proxy<RedisClient>(connectedClient, {
    get(target, prop, receiver) {
      if (prop === 'quit' || prop === 'disconnect') {
        return async () => {
          console.warn('Ignoring attempt to close shared Redis client. Use createClient for isolated connections.');
        };
      }
      return Reflect.get(target, prop, receiver);
    }
  });
}

// Legacy default export retains reference for backwards compatibility
export default globalThis.__redis!;

// 데이터 모델 타입 정의
export interface User {
  id: string;
  name: string;
  userId: string; // Used as username/login ID
  studentPhoneNumber: string; // Student's phone number
  parentPhoneNumber: string; // Parent's phone number
  userType: 'student' | 'parent' | 'influencer'; // User type
  passwordHash: string;
  createdAt: number;
  role?: string; // 'admin', 'influencer', or undefined for regular users
}

export interface Influencer {
  id: string;
  slug: string;
  name: string;
  username: string; // Instagram username
  instagram: string; // Instagram handle/URL
  avatar: string;
  bio: string;
  description: string; // Service direction/orientation
  tags: string[];
  stats: {
    followers: number;
    free_courses: number;
    paid_courses: number;
  };
}

export interface Product {
  id: string;
  influencerSlug: string;
  title: string;
  price: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  thumbnail: string;
  summary: string;
  description?: string;
  createdAt: number;
}

export type CommunityType = 
  | 'elementary' 
  | 'middle' 
  | 'high' 
  | 'elementary-parent' 
  | 'middle-parent' 
  | 'high-parent';

export interface Post {
  id: string;
  authorId: string;
  communityType: CommunityType;
  title: string;
  body: string;
  tags: string[];
  createdAt: number;
  stats: {
    likes: number;
    comments: number;
    views?: number;
  };
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  body: string;
  createdAt: number;
}
