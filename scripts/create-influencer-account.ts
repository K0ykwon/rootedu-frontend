import { createClient } from 'redis';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local file explicitly
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Create Redis client
const REDIS_CLOUD_URL = process.env.REDIS_URL || 'redis://default:uidvu100wo6pdWxdrXoE1HaHx33mWDRA@redis-15676.c266.us-east-1-3.ec2.redns.redis-cloud.com:15676';
const redis = createClient({
  url: REDIS_CLOUD_URL,
  database: 0
});

async function createInfluencerAccount() {
  try {
    console.log('🔐 Creating influencer account...');
    console.log(`📍 Connecting to Redis Cloud at: ${REDIS_CLOUD_URL.replace(/:[^:@]+@/, ':****@')}`);

    // Connect to Redis if not connected
    if (!redis.isOpen) {
      await redis.connect();
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash('yaktoon2025!', 10);

    // Create user account data
    const userData = {
      id: 'yaktoon',
      email: 'yaktoon@rootedu.com',
      name: '알약툰',
      password: hashedPassword,
      type: 'influencer',
      influencerSlug: 'yaktoon',
      createdAt: Date.now().toString(),
      updatedAt: Date.now().toString()
    };

    // Store user data in Redis
    await redis.hSet('user:yaktoon', userData);
    
    // Also store by email for login lookup
    await redis.hSet('user:email:yaktoon@rootedu.com', {
      userId: 'yaktoon',
      password: hashedPassword,
      type: 'influencer'
    });

    // Add to users list
    await redis.sAdd('users', 'yaktoon');
    
    // Add to influencer users list
    await redis.sAdd('users:influencer', 'yaktoon');

    console.log('✅ Influencer account created successfully!');
    console.log('   - Username: yaktoon');
    console.log('   - Email: yaktoon@rootedu.com');
    console.log('   - Password: yaktoon2025!');
    console.log('   - Type: influencer');
    console.log('   - Slug: yaktoon');

  } catch (error) {
    console.error('❌ Error creating influencer account:', error);
  } finally {
    await redis.quit();
  }
}

if (require.main === module) {
  createInfluencerAccount();
}

export default createInfluencerAccount;