import redis from '../lib/redis';

async function verifyData() {
  try {
    console.log('🔍 Verifying Redis data...\n');

    // Connect to Redis if not connected
    if (!redis.isOpen) {
      await redis.connect();
    }

    // Check influencers
    const influencerSlugs = await redis.sMembers('influencers');
    console.log(`✅ Found ${influencerSlugs.length} influencers:`);
    
    for (const slug of influencerSlugs) {
      const influencer = await redis.hGetAll(`influencer:${slug}`);
      const stats = JSON.parse(influencer.stats || '{}');
      console.log(`   - ${influencer.name} (@${influencer.instagram}): ${stats.followers} followers`);
    }

    // Check trending influencers
    console.log('\n📊 Trending influencers (by followers):');
    const trending = await redis.zRangeWithScores('influencers:trending', 0, -1, { REV: true });
    for (const item of trending) {
      const influencer = await redis.hGetAll(`influencer:${item.value}`);
      console.log(`   - ${influencer.name}: ${item.score} followers`);
    }

    // Check products
    console.log('\n📦 Products by influencer:');
    for (const slug of influencerSlugs) {
      const productIds = await redis.sMembers(`influencer:${slug}:products`);
      if (productIds.length > 0) {
        const influencer = await redis.hGetAll(`influencer:${slug}`);
        console.log(`   ${influencer.name}: ${productIds.length} product(s)`);
        for (const productId of productIds) {
          const product = await redis.hGetAll(`product:${productId}`);
          console.log(`      - ${product.title} (₩${parseInt(product.price).toLocaleString()})`);
        }
      }
    }

    // Check posts
    const postIds = await redis.lRange('community:posts', 0, -1);
    console.log(`\n💬 Found ${postIds.length} community posts`);

    console.log('\n✅ Data verification complete!');

  } catch (error) {
    console.error('❌ Error verifying data:', error);
  } finally {
    await redis.quit();
  }
}

if (require.main === module) {
  verifyData();
}

export default verifyData;