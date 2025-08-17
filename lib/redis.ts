import { createClient } from 'redis';

declare global {
  var __redis: ReturnType<typeof createClient> | undefined;
}

const client = globalThis.__redis ?? createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  database: 0
});

if (process.env.NODE_ENV !== 'production') globalThis.__redis = client;

// Redis 연결을 보장하는 함수
async function ensureRedisConnection() {
  if (!client.isOpen) {
    try {
      await client.connect();
      console.log('Redis connected successfully');
    } catch (error) {
      console.error('Redis connection failed:', error);
      throw error;
    }
  }
}

// 연결 보장 후 클라이언트 반환
export async function getRedisClient() {
  // 새로운 클라이언트 인스턴스를 생성하여 문제 해결
  const newClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });
  
  if (!newClient.isOpen) {
    try {
      await newClient.connect();
      console.log('New Redis client connected successfully');
    } catch (error) {
      console.error('Redis connection error:', error);
      throw error;
    }
  }
  
  return newClient;
}

export default client;

// 데이터 모델 타입 정의
export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: number;
}

export interface Influencer {
  slug: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  subjects: string[];
  tags: string[];
  stats: {
    followers: number;
    rating: number;
    reviews: number;
    students: number;
    courses: number;
  };
  socials: {
    youtube?: string;
    instagram?: string;
    twitter?: string;
  };
  joinDate: number;
  updatedAt: number;
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

export interface Post {
  id: string;
  authorId: string;
  title: string;
  body: string;
  tags: string[];
  createdAt: number;
  stats: {
    likes: number;
    comments: number;
  };
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  body: string;
  createdAt: number;
}