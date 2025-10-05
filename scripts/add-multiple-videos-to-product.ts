/**
 * SAFE Migration Script: Add Multiple Videos to Products
 *
 * This script adds multiple videos to existing products WITHOUT deleting any data.
 * It supports adding videos as an array with full metadata.
 *
 * USAGE:
 *   npm run add-videos:multiple -- --product-id=<id> --config=videos.json
 *
 * EXAMPLE videos.json:
 *   [
 *     {
 *       "url": "https://www.youtube.com/watch?v=VIDEO_ID_1",
 *       "title": "Chapter 1: Introduction",
 *       "description": "Welcome to the course",
 *       "chapter": "1장",
 *       "order": 0,
 *       "duration": "15:30"
 *     },
 *     {
 *       "url": "https://www.youtube.com/watch?v=VIDEO_ID_2",
 *       "title": "Chapter 2: Advanced Topics",
 *       "description": "Deep dive into concepts",
 *       "chapter": "2장",
 *       "order": 1,
 *       "duration": "22:15"
 *     }
 *   ]
 *
 * Or use command-line arguments:
 *   npm run add-videos:multiple -- --product-id=p1 \
 *     --video-url="https://youtube.com/watch?v=ID1" \
 *     --video-title="Chapter 1" \
 *     --video-description="Intro" \
 *     --video-chapter="1장" \
 *     --video-order=0 \
 *     --video-duration="15:30"
 *
 * SAFETY FEATURES:
 * - Reads existing product data first
 * - Merges with new video array (preserves all existing data)
 * - Dry-run mode to preview changes
 * - Validates video URLs
 * - Auto-generates video IDs
 * - Backward compatible with single videoUrl
 */

import { createClient } from 'redis';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

const REDIS_URL = process.env.REDIS_URL || process.env.DATABASE_URL;

if (!REDIS_URL) {
  console.error('❌ REDIS_URL or DATABASE_URL not found in environment');
  process.exit(1);
}

interface VideoInput {
  url: string;
  title: string;
  description?: string;
  chapter?: string;
  order: number;
  duration?: string;
  thumbnail?: string;
  tags?: string[];
}

interface ProductVideo {
  id: string;
  url: string;
  type: 'youtube';
  title: string;
  description?: string;
  order: number;
  duration?: string;
  chapter?: string;
  thumbnail?: string;
  tags?: string[];
  createdAt: number;
}

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (name: string): string | undefined => {
  const arg = args.find(a => a.startsWith(`--${name}=`));
  return arg?.split('=')[1];
};

const productId = getArg('product-id');
const configFile = getArg('config');
const dryRun = args.includes('--dry-run');

// Single video args
const videoUrl = getArg('video-url');
const videoTitle = getArg('video-title');
const videoDescription = getArg('video-description');
const videoChapter = getArg('video-chapter');
const videoOrder = getArg('video-order');
const videoDuration = getArg('video-duration');

// Video URL validation
function validateYouTubeUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return (
      (urlObj.hostname.includes('youtube.com') && urlObj.searchParams.has('v')) ||
      urlObj.hostname.includes('youtu.be')
    );
  } catch {
    return false;
  }
}

// Generate unique video ID
function generateVideoId(productId: string, index: number): string {
  return `v_${productId}_${String(index + 1).padStart(3, '0')}`;
}

// Load videos from config file or command line
function loadVideos(): VideoInput[] {
  if (configFile) {
    const configPath = path.resolve(process.cwd(), configFile);

    if (!fs.existsSync(configPath)) {
      console.error(`❌ Config file not found: ${configPath}`);
      process.exit(1);
    }

    try {
      const fileContent = fs.readFileSync(configPath, 'utf-8');
      const videos = JSON.parse(fileContent) as VideoInput[];

      if (!Array.isArray(videos)) {
        throw new Error('Config file must contain an array of videos');
      }

      return videos;
    } catch (error) {
      console.error('❌ Failed to parse config file:', error);
      process.exit(1);
    }
  } else if (videoUrl && videoTitle) {
    // Single video from command line
    return [{
      url: videoUrl,
      title: videoTitle,
      description: videoDescription,
      chapter: videoChapter,
      order: videoOrder ? parseInt(videoOrder) : 0,
      duration: videoDuration
    }];
  }

  return [];
}

async function addMultipleVideosToProduct(
  productId: string,
  videosInput: VideoInput[],
  dryRun: boolean = false
) {
  const client = createClient({ url: REDIS_URL });
  await client.connect();

  console.log('\n🔍 Starting safe product video update (multiple videos)...\n');
  console.log(`Product ID: ${productId}`);
  console.log(`Videos to add: ${videosInput.length}`);
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE UPDATE'}\n`);

  // Step 1: Validate all video URLs
  console.log('🔍 Validating video URLs...\n');
  for (let i = 0; i < videosInput.length; i++) {
    const video = videosInput[i];
    if (!validateYouTubeUrl(video.url)) {
      console.error(`❌ Invalid YouTube URL at index ${i}: ${video.url}`);
      await client.disconnect();
      process.exit(1);
    }
    console.log(`  ✅ Video ${i + 1}: ${video.title}`);
  }

  console.log('\n✅ All video URLs validated\n');

  // Step 2: Check if product exists
  const productKey = `product:${productId}`;
  const exists = await client.exists(productKey);

  if (!exists) {
    console.error(`❌ Product with ID "${productId}" not found`);
    await client.disconnect();
    process.exit(1);
  }

  console.log('✅ Product exists in database\n');

  // Step 3: Read existing product data
  const existingData = await client.hGetAll(productKey);

  console.log('📖 Current Product Data:');
  console.log(JSON.stringify(existingData, null, 2));
  console.log('');

  // Step 4: Check for existing videos
  let existingVideos: ProductVideo[] = [];
  if (existingData.videos) {
    try {
      existingVideos = JSON.parse(existingData.videos as string) as ProductVideo[];
      console.log(`ℹ️  Found ${existingVideos.length} existing video(s)\n`);
    } catch (e) {
      console.log('⚠️  Could not parse existing videos, starting fresh\n');
    }
  }

  // Step 5: Create new video objects
  const startIndex = existingVideos.length;
  const newVideos: ProductVideo[] = videosInput.map((videoInput, index) => ({
    id: generateVideoId(productId, startIndex + index),
    url: videoInput.url,
    type: 'youtube',
    title: videoInput.title,
    description: videoInput.description,
    order: videoInput.order,
    duration: videoInput.duration,
    chapter: videoInput.chapter,
    thumbnail: videoInput.thumbnail,
    tags: videoInput.tags,
    createdAt: Date.now()
  }));

  // Step 6: Merge with existing videos
  const allVideos = [...existingVideos, ...newVideos];

  // Sort by order
  allVideos.sort((a, b) => a.order - b.order);

  console.log('📝 Videos to be stored:');
  allVideos.forEach((v, i) => {
    console.log(`  ${i + 1}. [${v.chapter || 'No chapter'}] ${v.title} (order: ${v.order})`);
  });
  console.log('');

  // Step 7: Create updated data by MERGING
  const updatedData = {
    ...existingData,  // ⭐ PRESERVE ALL EXISTING DATA
    videos: JSON.stringify(allVideos),
    hasVideo: 'true',
    videoCount: String(allVideos.length)
  };

  console.log('📝 Updated Product Data Preview:');
  console.log(`  Total videos: ${allVideos.length}`);
  console.log(`  Has video: true`);
  console.log('');

  // Step 8: Write back to Redis (only if not dry run)
  if (!dryRun) {
    // Save backup
    const backupKey = `product:${productId}:backup:${Date.now()}`;
    await client.hSet(backupKey, existingData);
    console.log(`💾 Backup created at: ${backupKey}`);

    // Update product
    await client.hSet(productKey, updatedData);

    console.log('\n✅ Product updated successfully!');
    console.log(`   - Added ${newVideos.length} new video(s)`);
    console.log(`   - Total videos: ${allVideos.length}`);
    console.log(`   - Has Video: true`);
    console.log('   - All existing fields preserved ✓\n');

    console.log('📋 Video Summary:');
    allVideos.forEach((v, i) => {
      console.log(`   ${i + 1}. ${v.title} (${v.duration || 'N/A'})`);
    });
    console.log('');
  } else {
    console.log('\n🔍 DRY RUN - No changes made to database');
    console.log('   Run without --dry-run to apply changes\n');
  }

  await client.disconnect();
}

// Main execution
async function main() {
  if (!productId) {
    console.log('🎬 Add Multiple Videos to Product - Safe Migration Script\n');
    console.log('USAGE:');
    console.log('  npm run add-videos:multiple -- --product-id=<id> --config=videos.json [--dry-run]');
    console.log('  npm run add-videos:multiple -- --product-id=<id> --video-url=<url> --video-title=<title> [--dry-run]\n');
    console.log('EXAMPLES:');
    console.log('  npm run add-videos:multiple -- --product-id=p1 --config=videos.json --dry-run');
    console.log('  npm run add-videos:multiple -- --product-id=p1 --video-url="https://youtube.com/watch?v=ID" --video-title="Chapter 1" --video-order=0\n');
    process.exit(1);
  }

  const videos = loadVideos();

  if (videos.length === 0) {
    console.error('❌ No videos provided. Use --config or --video-url/--video-title');
    process.exit(1);
  }

  await addMultipleVideosToProduct(productId, videos, dryRun);
}

main().catch(console.error);
