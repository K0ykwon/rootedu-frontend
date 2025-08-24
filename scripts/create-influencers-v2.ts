#!/usr/bin/env tsx
/**
 * Script to create influencer user accounts with updated structure
 * Usage: npx tsx scripts/create-influencers-v2.ts
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

async function updateInfluencerAccounts() {
  console.log('Updating influencer accounts with new structure...');
  
  const redis = await getRedisClient();
  
  try {
    for (const influencer of influencerAccounts) {
      // Check if user exists and delete old version
      const existingUserId = await redis.get(`user:userId:${influencer.username}`);
      if (existingUserId) {
        console.log(`🔄 Updating existing influencer account: ${influencer.username}`);
        // Delete old user data
        await redis.del(`user:${existingUserId}`);
      } else {
        console.log(`➕ Creating new influencer account: ${influencer.username}`);
      }
      
      // Generate new influencer user ID
      const influencerId = `influencer-${influencer.slug}-${Date.now()}`;
      
      // Hash the password
      const passwordHash = await bcrypt.hash(influencer.defaultPassword, 12);
      
      // Store influencer user data with new structure
      await redis.hSet(`user:${influencerId}`, {
        id: influencerId,
        name: influencer.name,
        userId: influencer.username,
        studentPhoneNumber: influencer.studentPhoneNumber,
        parentPhoneNumber: influencer.parentPhoneNumber,
        userType: 'influencer', // Influencers have their own type
        passwordHash: passwordHash,
        createdAt: Date.now().toString(),
        role: 'influencer',
        influencerSlug: influencer.slug, // Link to influencer data
      });
      
      // Update userId lookup
      await redis.set(`user:userId:${influencer.username}`, influencerId);
      
      console.log(`✅ Updated influencer account: ${influencer.username} (${influencer.name})`);
    }
    
    console.log('\n🎉 All influencer accounts updated successfully!');
    console.log('\nUpdated Influencer Accounts Summary:');
    console.log('='.repeat(60));
    
    for (const influencer of influencerAccounts) {
      console.log(`📱 ${influencer.name}`);
      console.log(`   Username: ${influencer.username}`);
      console.log(`   Password: ${influencer.defaultPassword}`);
      console.log(`   Student Phone: ${influencer.studentPhoneNumber}`);
      console.log(`   Parent Phone: ${influencer.parentPhoneNumber}`);
      console.log(`   User Type: influencer`);
      console.log(`   Role: influencer`);
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Failed to update influencer accounts:', error);
  } finally {
    await redis.quit();
  }
}

updateInfluencerAccounts().catch(console.error);