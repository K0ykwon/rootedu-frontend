#!/usr/bin/env tsx
/**
 * Script to fix admin account issues
 * Usage: npx tsx scripts/fix-admin-account.ts
 */

import bcrypt from 'bcryptjs';
import { getRedisClient } from '../lib/redis';

async function fixAdminAccount() {
  console.log('🔧 Fixing admin account...');
  
  const redis = await getRedisClient();
  
  try {
    // Clean up any existing admin data
    const existingUserId = await redis.get('user:userId:admin');
    if (existingUserId) {
      console.log(`🧹 Cleaning up existing admin data: ${existingUserId}`);
      await redis.del(`user:${existingUserId}`);
      await redis.del('user:userId:admin');
    }
    
    // Generate new admin user ID
    const adminId = 'admin-' + Date.now();
    
    // Hash the password
    const passwordHash = await bcrypt.hash('passwordadmin', 12);
    
    console.log('📝 Creating admin account with proper structure...');
    
    // Store admin user data with all required fields as strings
    const adminData = {
      id: adminId,
      name: 'Administrator',
      userId: 'admin',
      studentPhoneNumber: '010-0000-1000',
      parentPhoneNumber: '010-0000-0000',
      userType: 'parent',
      passwordHash: passwordHash,
      createdAt: Date.now().toString(),
      role: 'admin',
    };
    
    // Store the admin data
    await redis.hSet(`user:${adminId}`, adminData);
    
    // Create userId lookup
    await redis.set('user:userId:admin', adminId);
    
    // Verify the data was stored correctly
    const storedData = await redis.hGetAll(`user:${adminId}`);
    const lookupId = await redis.get('user:userId:admin');
    
    console.log('✅ Admin account fixed successfully!');
    console.log('📊 Verification:');
    console.log(`   Internal ID: ${adminId}`);
    console.log(`   Lookup ID: ${lookupId}`);
    console.log(`   Username: ${storedData.userId}`);
    console.log(`   Name: ${storedData.name}`);
    console.log(`   User Type: ${storedData.userType}`);
    console.log(`   Role: ${storedData.role}`);
    console.log(`   Student Phone: ${storedData.studentPhoneNumber}`);
    console.log(`   Parent Phone: ${storedData.parentPhoneNumber}`);
    console.log(`   Password Hash Length: ${storedData.passwordHash?.length} chars`);
    
  } catch (error) {
    console.error('❌ Failed to fix admin account:', error);
  } finally {
    await redis.quit();
  }
}

fixAdminAccount().catch(console.error);