#!/usr/bin/env tsx
/**
 * Script to create influencer user accounts for existing influencers in Redis
 * Usage: npx tsx scripts/create-influencers.ts
 */

import bcrypt from 'bcryptjs';
import { getRedisClient } from '../lib/redis';

interface InfluencerAccount {
  slug: string;
  name: string;
  username: string;
  defaultPassword: string;
  phoneNumber: string;
}

const influencerAccounts: InfluencerAccount[] = [
  {
    slug: 'yaktoon',
    name: '알약툰',
    username: 'yaktoon',
    defaultPassword: 'yaktoon2024!',
    phoneNumber: '010-1001-0001'
  },
  {
    slug: 'hana',
    name: '하나쌤',
    username: 'hana',
    defaultPassword: 'hana2024!',
    phoneNumber: '010-1002-0002'
  },
  {
    slug: 'parantsnote',
    name: '부모노트',
    username: 'parantsnote',
    defaultPassword: 'parants2024!',
    phoneNumber: '010-1003-0003'
  },
  {
    slug: 'terry',
    name: '테리영어',
    username: 'terry',
    defaultPassword: 'terry2024!',
    phoneNumber: '010-1004-0004'
  },
  {
    slug: 'unova',
    name: '유노바',
    username: 'unova',
    defaultPassword: 'unova2024!',
    phoneNumber: '010-1005-0005'
  },
  {
    slug: 'kor.artis',
    name: '길품국어',
    username: 'korartis',
    defaultPassword: 'korartis2024!',
    phoneNumber: '010-1006-0006'
  },
  {
    slug: 'christine',
    name: '크리스틴영어',
    username: 'christine',
    defaultPassword: 'christine2024!',
    phoneNumber: '010-1007-0007'
  }
];

async function createInfluencerAccounts() {
  console.log('Creating influencer accounts...');
  
  const redis = await getRedisClient();
  
  try {
    for (const influencer of influencerAccounts) {
      // Check if user already exists
      const existingUserId = await redis.get(`user:userId:${influencer.username}`);
      if (existingUserId) {
        console.log(`⚠️  Influencer account '${influencer.username}' already exists!`);
        continue;
      }
      
      // Generate influencer user ID
      const influencerId = `influencer-${influencer.slug}-${Date.now()}`;
      
      // Hash the password
      const passwordHash = await bcrypt.hash(influencer.defaultPassword, 12);
      
      // Store influencer user data
      await redis.hSet(`user:${influencerId}`, {
        id: influencerId,
        name: influencer.name,
        userId: influencer.username,
        phoneNumber: influencer.phoneNumber,
        userType: 'parent', // Influencers are considered as parent type
        passwordHash: passwordHash,
        createdAt: Date.now().toString(),
        role: 'influencer',
        influencerSlug: influencer.slug, // Link to influencer data
      });
      
      // Create userId lookup
      await redis.set(`user:userId:${influencer.username}`, influencerId);
      
      console.log(`✅ Created influencer account: ${influencer.username} (${influencer.name})`);
    }
    
    console.log('\n🎉 All influencer accounts created successfully!');
    console.log('\nInfluencer Accounts Summary:');
    console.log('='.repeat(50));
    
    for (const influencer of influencerAccounts) {
      console.log(`📱 ${influencer.name}`);
      console.log(`   Username: ${influencer.username}`);
      console.log(`   Password: ${influencer.defaultPassword}`);
      console.log(`   Phone: ${influencer.phoneNumber}`);
      console.log(`   Role: influencer`);
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Failed to create influencer accounts:', error);
  } finally {
    await redis.quit();
  }
}

createInfluencerAccounts().catch(console.error);