import { createClient } from 'redis';

async function rollbackLocalRedis() {
  // EXPLICITLY connect to LOCAL Redis only
  const LOCAL_REDIS_URL = 'redis://localhost:6379';
  
  console.log('🔄 Rolling back LOCAL Redis at port 6379...');
  console.log('   This will ONLY remove the data added by our seed script');
  console.log('   Your other Redis data will be preserved\n');
  
  const client = createClient({
    url: LOCAL_REDIS_URL,
    database: 0
  });

  try {
    await client.connect();
    console.log('✅ Connected to LOCAL Redis at port 6379\n');
    
    // List of keys that our seed script would have created
    const seedDataPatterns = [
      'influencer:*',
      'influencers',
      'influencers:trending',
      'product:*',
      'post:*',
      'community:posts'
    ];
    
    console.log('🧹 Removing seed data...');
    let totalRemoved = 0;
    
    for (const pattern of seedDataPatterns) {
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        console.log(`   Removing ${keys.length} keys matching "${pattern}"`);
        for (const key of keys) {
          await client.del(key);
          totalRemoved++;
        }
      }
    }
    
    // Also check for specific influencer slugs from our seed data
    const seedInfluencerSlugs = [
      'yaktoon', 'hana', 'parantsnote', 'terry', 
      'unova', 'kor.artis', 'christine'
    ];
    
    for (const slug of seedInfluencerSlugs) {
      // Remove influencer products sets
      const productsKey = `influencer:${slug}:products`;
      const exists = await client.exists(productsKey);
      if (exists) {
        await client.del(productsKey);
        console.log(`   Removed ${productsKey}`);
        totalRemoved++;
      }
    }
    
    // Remove specific product IDs from our seed
    const seedProductIds = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'];
    for (const productId of seedProductIds) {
      const productKey = `product:${productId}`;
      const exists = await client.exists(productKey);
      if (exists) {
        await client.del(productKey);
        console.log(`   Removed ${productKey}`);
        totalRemoved++;
      }
    }
    
    // Remove specific post IDs from our seed
    const seedPostIds = ['post1', 'post2'];
    for (const postId of seedPostIds) {
      const postKey = `post:${postId}`;
      const exists = await client.exists(postKey);
      if (exists) {
        await client.del(postKey);
        console.log(`   Removed ${postKey}`);
        totalRemoved++;
      }
    }
    
    console.log(`\n✅ Rollback complete! Removed ${totalRemoved} keys from LOCAL Redis`);
    console.log('   Your other Redis data has been preserved');
    
    // Show what's left
    const remainingKeys = await client.keys('*');
    if (remainingKeys.length > 0) {
      console.log(`\n📦 ${remainingKeys.length} keys remain in your LOCAL Redis:`);
      remainingKeys.forEach(k => console.log(`   - ${k}`));
    } else {
      console.log('\n📦 Your LOCAL Redis is now empty');
    }
    
  } catch (error) {
    console.error('❌ Error during rollback:', error);
    console.log('   Your local Redis might not be running or might be on a different port');
  } finally {
    await client.quit();
    console.log('\n👋 Disconnected from LOCAL Redis');
  }
}

if (require.main === module) {
  rollbackLocalRedis();
}

export default rollbackLocalRedis;