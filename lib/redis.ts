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
  // Video capability fields (MVP - YouTube integration)
  videoUrl?: string;              // YouTube URL (unlisted/private)
  videoType?: 'youtube';          // Extensible for future platforms (vimeo, cloudflare, etc.)
  hasVideo?: boolean;             // Quick flag for filtering products with video content
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

// ============================================================================
// USER PRODUCT ACCESS SYSTEM (Video Access Control)
// ============================================================================

export interface UserProduct {
  userId: string;
  productId: string;
  purchasedAt: number;
  accessStatus: 'active' | 'expired' | 'revoked';
  expiresAt?: number;  // Optional: for subscription-based products
}

/**
 * Grant product access to a user (after purchase)
 * Creates relationship in both directions for efficient queries
 */
export async function grantProductAccess(userId: string, productId: string): Promise<void> {
  const redis = await ensureConnection();

  const userProduct: UserProduct = {
    userId,
    productId,
    purchasedAt: Date.now(),
    accessStatus: 'active'
  };

  // Store the purchase record
  await redis.json.set(`purchase:${userId}:${productId}`, '$', userProduct as any);

  // Add to user's product set (for getUserProducts query)
  await redis.sAdd(`user:products:${userId}`, productId);

  // Add to product's user set (for analytics - who has access)
  await redis.sAdd(`product:users:${productId}`, userId);
}

/**
 * Check if a user has access to a specific product
 * Used before showing video content
 */
export async function checkProductAccess(userId: string, productId: string): Promise<boolean> {
  const redis = await ensureConnection();

  const purchaseData = await redis.json.get(`purchase:${userId}:${productId}`);

  if (!purchaseData) {
    return false;
  }

  const userProduct = purchaseData as unknown as UserProduct;

  // Check if access is active
  if (userProduct.accessStatus !== 'active') {
    return false;
  }

  // Check if access has expired (for subscription products)
  if (userProduct.expiresAt && userProduct.expiresAt < Date.now()) {
    return false;
  }

  return true;
}

/**
 * Get all products a user has purchased
 * Returns full product details with video access info
 */
export async function getUserProducts(userId: string): Promise<Product[]> {
  const redis = await ensureConnection();

  // Get all product IDs user has access to
  const productIds = await redis.sMembers(`user:products:${userId}`);

  if (productIds.length === 0) {
    return [];
  }

  // Fetch full product details for each
  const products: Product[] = [];

  for (const productId of productIds) {
    const productData = await redis.hGetAll(`product:${productId}`);

    if (productData && Object.keys(productData).length > 0) {
      products.push({
        id: productData.id,
        influencerSlug: productData.influencerSlug,
        title: productData.title,
        price: Number(productData.price),
        level: productData.level as 'beginner' | 'intermediate' | 'advanced',
        thumbnail: productData.thumbnail,
        summary: productData.summary,
        description: productData.description,
        createdAt: Number(productData.createdAt),
        videoUrl: productData.videoUrl,
        videoType: productData.videoType as 'youtube' | undefined,
        hasVideo: productData.hasVideo === 'true'
      });
    }
  }

  return products;
}

/**
 * Revoke product access (for refunds or subscription cancellations)
 */
export async function revokeProductAccess(userId: string, productId: string): Promise<void> {
  const redis = await ensureConnection();

  // Update purchase status to revoked (keep record for audit)
  const purchaseData = await redis.json.get(`purchase:${userId}:${productId}`);

  if (purchaseData) {
    const userProduct = purchaseData as unknown as UserProduct;
    userProduct.accessStatus = 'revoked';
    await redis.json.set(`purchase:${userId}:${productId}`, '$', userProduct as any);
  }

  // Remove from active access sets
  await redis.sRem(`user:products:${userId}`, productId);
  await redis.sRem(`product:users:${productId}`, userId);
}
