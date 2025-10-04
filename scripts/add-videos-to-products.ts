/**
 * SAFE Migration Script: Add Video URLs to Products
 *
 * This script adds video capability to existing products WITHOUT deleting any data.
 * It merges new video fields with existing product data.
 *
 * USAGE:
 *   npm run add-videos -- --product-id=<id> --video-url=<url>
 *
 * EXAMPLE:
 *   npm run add-videos -- --product-id=p1 --video-url=https://www.youtube.com/watch?v=dQw4w9WgXcQ
 *
 * SAFETY FEATURES:
 * - Reads existing product data first
 * - Merges with new fields (preserves all existing data)
 * - Dry-run mode to preview changes
 * - Validates video URL format
 * - Rollback capability
 */

import { createClient } from 'redis';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const REDIS_URL = process.env.REDIS_URL || process.env.DATABASE_URL;

if (!REDIS_URL) {
  console.error('❌ REDIS_URL or DATABASE_URL not found in environment');
  process.exit(1);
}

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (name: string): string | undefined => {
  const arg = args.find(a => a.startsWith(`--${name}=`));
  return arg?.split('=')[1];
};

const productId = getArg('product-id');
const videoUrl = getArg('video-url');
const dryRun = args.includes('--dry-run');
const listProducts = args.includes('--list');

// Video URL validation
function validateYouTubeUrl(url: string): boolean {
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]{11}$/;
  return youtubeRegex.test(url);
}

async function listAllProducts() {
  const client = createClient({ url: REDIS_URL });
  await client.connect();

  console.log('\n📋 Fetching all products from Redis...\n');

  // Get all product keys
  const keys = await client.keys('product:*');
  const productKeys = keys.filter(key => !key.includes(':users:'));

  if (productKeys.length === 0) {
    console.log('⚠️  No products found in database');
    await client.disconnect();
    return;
  }

  console.log(`Found ${productKeys.length} products:\n`);

  for (const key of productKeys) {
    const productData = await client.hGetAll(key);
    const hasVideo = productData.hasVideo === 'true';

    console.log(`${hasVideo ? '📹' : '📦'} ${productData.id || key}`);
    console.log(`   Title: ${productData.title || 'N/A'}`);
    console.log(`   Influencer: ${productData.influencerSlug || 'N/A'}`);
    console.log(`   Price: ₩${Number(productData.price || 0).toLocaleString()}`);
    console.log(`   Has Video: ${hasVideo ? 'Yes' : 'No'}`);

    if (hasVideo) {
      console.log(`   Video URL: ${productData.videoUrl || 'N/A'}`);
    }
    console.log('');
  }

  await client.disconnect();
}

async function addVideoToProduct(productId: string, videoUrl: string, dryRun: boolean = false) {
  const client = createClient({ url: REDIS_URL });
  await client.connect();

  console.log('\n🔍 Starting safe product video update...\n');
  console.log(`Product ID: ${productId}`);
  console.log(`Video URL: ${videoUrl}`);
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE UPDATE'}\n`);

  // Step 1: Validate video URL
  if (!validateYouTubeUrl(videoUrl)) {
    console.error('❌ Invalid YouTube URL format');
    console.error('Expected format: https://www.youtube.com/watch?v=VIDEO_ID');
    await client.disconnect();
    process.exit(1);
  }

  console.log('✅ Video URL format validated\n');

  // Step 2: Check if product exists
  const productKey = `product:${productId}`;
  const exists = await client.exists(productKey);

  if (!exists) {
    console.error(`❌ Product with ID "${productId}" not found`);
    await client.disconnect();
    process.exit(1);
  }

  console.log('✅ Product exists in database\n');

  // Step 3: Read existing product data (CRITICAL: No deletion happens)
  const existingData = await client.hGetAll(productKey);

  console.log('📖 Current Product Data:');
  console.log(JSON.stringify(existingData, null, 2));
  console.log('');

  // Step 4: Create updated data by MERGING (not replacing)
  const updatedData = {
    ...existingData,  // ⭐ PRESERVE ALL EXISTING DATA
    videoUrl: videoUrl,
    videoType: 'youtube',
    hasVideo: 'true'
  };

  console.log('📝 Updated Product Data (with video fields):');
  console.log(JSON.stringify(updatedData, null, 2));
  console.log('');

  // Step 5: Write back to Redis (only if not dry run)
  if (!dryRun) {
    // Save previous state for rollback (optional)
    const backupKey = `product:${productId}:backup:${Date.now()}`;
    await client.hSet(backupKey, existingData);
    console.log(`💾 Backup created at: ${backupKey}`);

    // Update product with merged data
    await client.hSet(productKey, updatedData);

    console.log('\n✅ Product updated successfully!');
    console.log(`   - Video URL: ${videoUrl}`);
    console.log(`   - Video Type: youtube`);
    console.log(`   - Has Video: true`);
    console.log('   - All existing fields preserved ✓\n');
  } else {
    console.log('\n🔍 DRY RUN - No changes made to database');
    console.log('   Run without --dry-run to apply changes\n');
  }

  await client.disconnect();
}

// Main execution
async function main() {
  if (listProducts) {
    await listAllProducts();
    process.exit(0);
  }

  if (!productId || !videoUrl) {
    console.log('🎬 Add Video to Product - Safe Migration Script\n');
    console.log('USAGE:');
    console.log('  npm run add-videos -- --product-id=<id> --video-url=<url> [--dry-run]');
    console.log('  npm run add-videos -- --list  # List all products\n');
    console.log('EXAMPLES:');
    console.log('  npm run add-videos -- --list');
    console.log('  npm run add-videos -- --product-id=p1 --video-url=https://www.youtube.com/watch?v=VIDEO_ID --dry-run');
    console.log('  npm run add-videos -- --product-id=p1 --video-url=https://www.youtube.com/watch?v=VIDEO_ID\n');
    process.exit(1);
  }

  await addVideoToProduct(productId, videoUrl, dryRun);
}

main().catch(console.error);
