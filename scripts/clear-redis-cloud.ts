import { createClient } from 'redis';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local file explicitly
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function clearRedisCloud() {
  // ONLY connect to Redis Cloud, NOT local Redis
  const REDIS_CLOUD_URL = 'redis://default:uidvu100wo6pdWxdrXoE1HaHx33mWDRA@redis-15676.c266.us-east-1-3.ec2.redns.redis-cloud.com:15676';
  
  console.log('🔍 Connecting to Redis Cloud (NOT local Redis)...');
  console.log('   URL:', REDIS_CLOUD_URL.replace(/:[^:@]+@/, ':****@')); // Hide password in logs
  
  const client = createClient({
    url: REDIS_CLOUD_URL,
    database: 0
  });

  try {
    await client.connect();
    console.log('✅ Connected to Redis Cloud successfully');
    
    // Clear the database
    console.log('🧹 Clearing Redis Cloud database...');
    await client.flushDb();
    console.log('✅ Redis Cloud database cleared');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.quit();
    console.log('👋 Disconnected from Redis Cloud');
  }
}

if (require.main === module) {
  clearRedisCloud();
}

export default clearRedisCloud;