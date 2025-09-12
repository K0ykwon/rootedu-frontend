import { createClient } from 'redis';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local file
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const REDIS_URL = process.env.REDIS_URL || 'redis://default:uidvu100wo6pdWxdrXoE1HaHx33mWDRA@redis-15676.c266.us-east-1-3.ec2.redns.redis-cloud.com:15676';

async function fixProductsKey() {
  const redis = createClient({
    url: REDIS_URL,
    database: 0
  });

  try {
    console.log('🔧 Checking and fixing products key...');
    await redis.connect();

    // Check the key type
    const keyType = await redis.type('influencer:yaktoon:products');
    console.log(`Key type for influencer:yaktoon:products: ${keyType}`);

    if (keyType !== 'set' && keyType !== 'none') {
      // If it's not a set and not missing, delete it
      console.log('⚠️ Key exists but is wrong type, deleting...');
      await redis.del('influencer:yaktoon:products');
    }

    // Find all products for yaktoon
    const productKeys = [];
    let cursor = '0';
    
    do {
      const result = await redis.scan(cursor, {
        MATCH: 'product:*',
        COUNT: 100
      });
      cursor = result.cursor;
      
      for (const key of result.keys) {
        try {
          // Check the type of each key first
          const keyType = await redis.type(key);
          
          if (keyType === 'hash') {
            const data = await redis.hGetAll(key);
            if (data && data.influencerSlug === 'yaktoon') {
              const productId = data.id || key.split(':')[1];
              productKeys.push(productId);
              console.log(`Found product: ${productId} - ${data.title}`);
            }
          } else {
            console.log(`⚠️ Key ${key} is type ${keyType}, expected hash`);
          }
        } catch (err) {
          console.log(`❌ Error processing ${key}: ${err}`);
        }
      }
    } while (cursor !== '0');

    // Add products to the set
    if (productKeys.length > 0) {
      await redis.sAdd('influencer:yaktoon:products', productKeys);
      console.log(`✅ Added ${productKeys.length} products to influencer:yaktoon:products set`);
    } else {
      console.log('ℹ️ No products found for yaktoon');
    }

    // Verify the fix
    const members = await redis.sMembers('influencer:yaktoon:products');
    console.log(`📦 Products in set: ${members.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await redis.quit();
  }
}

if (require.main === module) {
  fixProductsKey();
}

export default fixProductsKey;