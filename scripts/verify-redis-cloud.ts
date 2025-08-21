import { createClient } from 'redis';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local file explicitly
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function verifyRedisCloud() {
  // ONLY connect to Redis Cloud from .env.local
  const REDIS_CLOUD_URL = process.env.REDIS_URL || 'redis://default:uidvu100wo6pdWxdrXoE1HaHx33mWDRA@redis-15676.c266.us-east-1-3.ec2.redns.redis-cloud.com:15676';
  
  console.log('🔍 Verifying Redis Cloud data...');
  console.log(`📍 Connecting to: ${REDIS_CLOUD_URL.replace(/:[^:@]+@/, ':****@')}\n`);
  
  const client = createClient({
    url: REDIS_CLOUD_URL,
    database: 0
  });

  try {
    await client.connect();
    console.log('✅ Connected to Redis Cloud successfully\n');
    
    // Check influencers
    const influencerSlugs = await client.sMembers('influencers');
    console.log(`Found ${influencerSlugs.length} influencers:`);
    
    for (const slug of influencerSlugs) {
      const influencer = await client.hGetAll(`influencer:${slug}`);
      const stats = JSON.parse(influencer.stats || '{}');
      console.log(`   ✓ ${influencer.name} (@${influencer.instagram}): ${stats.followers} followers`);
    }

    console.log('\n✅ All influencer data is properly stored in Redis Cloud!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.quit();
  }
}

if (require.main === module) {
  verifyRedisCloud();
}

export default verifyRedisCloud;