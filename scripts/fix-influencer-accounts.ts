#!/usr/bin/env tsx
/**
 * Script to fix influencer accounts
 * Usage: npx tsx scripts/fix-influencer-accounts.ts
 */

import bcrypt from 'bcryptjs';
import { getRedisClient } from '../lib/redis';

interface InfluencerAccount {
  slug: string;
  name: string;
  username: string;
  defaultPassword: string;
  studentPhoneNumber: string;
  parentPhoneNumber: string;
}

const influencerAccounts: InfluencerAccount[] = [
  {
    slug: 'yaktoon',
    name: '알약툰',
    username: 'yaktoon',
    defaultPassword: 'yaktoon2024!',
    studentPhoneNumber: '010-1001-1001',
    parentPhoneNumber: '010-1001-0001'
  },
  {
    slug: 'hana',
    name: '하나쌤',
    username: 'hana',
    defaultPassword: 'hana2024!',
    studentPhoneNumber: '010-1002-1002',
    parentPhoneNumber: '010-1002-0002'
  },
  {
    slug: 'parantsnote',
    name: '부모노트',
    username: 'parantsnote',
    defaultPassword: 'parants2024!',
    studentPhoneNumber: '010-1003-1003',
    parentPhoneNumber: '010-1003-0003'
  },
  {
    slug: 'terry',
    name: '테리영어',
    username: 'terry',
    defaultPassword: 'terry2024!',
    studentPhoneNumber: '010-1004-1004',
    parentPhoneNumber: '010-1004-0004'
  },
  {
    slug: 'unova',
    name: '유노바',
    username: 'unova',
    defaultPassword: 'unova2024!',
    studentPhoneNumber: '010-1005-1005',
    parentPhoneNumber: '010-1005-0005'
  },
  {
    slug: 'kor.artis',
    name: '길품국어',
    username: 'korartis',
    defaultPassword: 'korartis2024!',
    studentPhoneNumber: '010-1006-1006',
    parentPhoneNumber: '010-1006-0006'
  },
  {
    slug: 'christine',
    name: '크리스틴영어',
    username: 'christine',
    defaultPassword: 'christine2024!',
    studentPhoneNumber: '010-1007-1007',
    parentPhoneNumber: '010-1007-0007'
  }
];

async function fixInfluencerAccounts() {
  console.log('🔧 Fixing influencer accounts...');
  
  const redis = await getRedisClient();
  
  try {
    for (const influencer of influencerAccounts) {
      // Clean up any existing data
      const existingUserId = await redis.get(`user:userId:${influencer.username}`);
      if (existingUserId) {
        console.log(`🧹 Cleaning up existing data for: ${influencer.username}`);
        await redis.del(`user:${existingUserId}`);
        await redis.del(`user:userId:${influencer.username}`);
      }
      
      // Generate new influencer user ID
      const influencerId = `influencer-${influencer.slug}-${Date.now()}`;
      
      // Hash the password
      const passwordHash = await bcrypt.hash(influencer.defaultPassword, 12);
      
      console.log(`📝 Creating account for: ${influencer.name} (${influencer.username})`);
      
      // Store influencer user data with all required fields as strings
      const influencerData = {
        id: influencerId,
        name: influencer.name,
        userId: influencer.username,
        studentPhoneNumber: influencer.studentPhoneNumber,
        parentPhoneNumber: influencer.parentPhoneNumber,
        userType: 'influencer',
        passwordHash: passwordHash,
        createdAt: Date.now().toString(),
        role: 'influencer',
        influencerSlug: influencer.slug,
      };
      
      // Store the influencer data
      await redis.hSet(`user:${influencerId}`, influencerData);
      
      // Create userId lookup
      await redis.set(`user:userId:${influencer.username}`, influencerId);
      
      console.log(`✅ Fixed account: ${influencer.username}`);
    }
    
    console.log('\n🎉 All influencer accounts fixed successfully!');
    
    // Verify all accounts
    console.log('\n📊 Verification:');
    for (const influencer of influencerAccounts) {
      const lookupId = await redis.get(`user:userId:${influencer.username}`);
      if (lookupId) {
        const userData = await redis.hGetAll(`user:${lookupId}`);
        console.log(`✅ ${influencer.username}: ID=${lookupId}, Type=${userData.userType}, Role=${userData.role}`);
      } else {
        console.log(`❌ ${influencer.username}: Lookup failed`);
      }
    }
    
  } catch (error) {
    console.error('❌ Failed to fix influencer accounts:', error);
  } finally {
    await redis.quit();
  }
}

fixInfluencerAccounts().catch(console.error);