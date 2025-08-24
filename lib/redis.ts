import { createClient } from 'redis';

declare global {
  var __redis: ReturnType<typeof createClient> | undefined;
  var __redisPromise: Promise<ReturnType<typeof createClient>> | undefined;
}

const REDIS_URL = process.env.REDIS_URL || process.env.DATABASE_URL || 'redis://localhost:6379';

// Create a singleton Redis client with connection pooling
function createRedisClient() {
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

  return client;
}

// Initialize the global client if it doesn't exist
if (!globalThis.__redis) {
  globalThis.__redis = createRedisClient();
}

const client = globalThis.__redis;

// Singleton connection promise to prevent multiple simultaneous connections
async function ensureConnection() {
  if (!globalThis.__redisPromise) {
    globalThis.__redisPromise = (async () => {
      if (!client.isOpen) {
        await client.connect();
      }
      return client;
    })();
  }
  return globalThis.__redisPromise;
}

// Get the singleton Redis client (ensures connection)
export async function getRedisClient() {
  const connectedClient = await ensureConnection();
  
  // Return a proxy that prevents closing the shared connection
  return new Proxy(connectedClient, {
    get(target, prop) {
      // Prevent quit/disconnect on the shared client
      if (prop === 'quit' || prop === 'disconnect') {
        return async () => {
          console.log('Redis: Skipping quit/disconnect on shared client');
        };
      }
      return target[prop as keyof typeof target];
    }
  });
}

export default client;

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