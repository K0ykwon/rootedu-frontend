import { createClient } from 'redis';

async function checkLocalRedis() {
  // EXPLICITLY connect to LOCAL Redis only
  const LOCAL_REDIS_URL = 'redis://localhost:6379';
  
  console.log('🔍 Checking LOCAL Redis at port 6379...');
  
  const client = createClient({
    url: LOCAL_REDIS_URL,
    database: 0
  });

  try {
    await client.connect();
    console.log('✅ Connected to LOCAL Redis at port 6379');
    
    // Check what keys exist
    const keys = await client.keys('*');
    console.log(`\n📊 Found ${keys.length} keys in LOCAL Redis:`);
    
    if (keys.length > 0) {
      // Group keys by type
      const influencerKeys = keys.filter(k => k.startsWith('influencer'));
      const productKeys = keys.filter(k => k.startsWith('product'));
      const postKeys = keys.filter(k => k.startsWith('post') || k.startsWith('community'));
      const otherKeys = keys.filter(k => !k.startsWith('influencer') && !k.startsWith('product') && !k.startsWith('post') && !k.startsWith('community'));
      
      if (influencerKeys.length > 0) {
        console.log(`\n⚠️  Found ${influencerKeys.length} influencer-related keys (from our seed script):`);
        influencerKeys.slice(0, 5).forEach(k => console.log(`   - ${k}`));
        if (influencerKeys.length > 5) console.log(`   ... and ${influencerKeys.length - 5} more`);
      }
      
      if (productKeys.length > 0) {
        console.log(`\n⚠️  Found ${productKeys.length} product-related keys (from our seed script):`);
        productKeys.slice(0, 5).forEach(k => console.log(`   - ${k}`));
        if (productKeys.length > 5) console.log(`   ... and ${productKeys.length - 5} more`);
      }
      
      if (postKeys.length > 0) {
        console.log(`\n⚠️  Found ${postKeys.length} post/community-related keys (from our seed script):`);
        postKeys.slice(0, 5).forEach(k => console.log(`   - ${k}`));
        if (postKeys.length > 5) console.log(`   ... and ${postKeys.length - 5} more`);
      }
      
      if (otherKeys.length > 0) {
        console.log(`\n📦 Found ${otherKeys.length} OTHER keys (your existing data):`);
        otherKeys.forEach(k => console.log(`   - ${k}`));
      }
      
      console.log('\n⚠️  WARNING: The seed script may have written to your LOCAL Redis!');
      console.log('   Run "npx tsx scripts/rollback-local-redis.ts" to remove only the seed data');
    } else {
      console.log('   ✅ LOCAL Redis is empty');
    }
    
  } catch (error) {
    console.error('❌ Could not connect to LOCAL Redis:', error);
    console.log('   Your local Redis might not be running or might be on a different port');
  } finally {
    await client.quit();
  }
}

if (require.main === module) {
  checkLocalRedis();
}

export default checkLocalRedis;