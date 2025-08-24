#!/usr/bin/env tsx
/**
 * Script to create admin user with new structure
 * Usage: npx tsx scripts/create-admin.ts
 */

import bcrypt from 'bcryptjs';
import { getRedisClient } from '../lib/redis';

async function createAdminUser() {
  console.log('Creating admin user with new structure...');
  
  const redis = await getRedisClient();
  
  try {
    // Check if admin user already exists
    const existingUserId = await redis.get('user:userId:admin');
    if (existingUserId) {
      console.log('Admin user already exists!');
      await redis.quit();
      return;
    }
    
    // Generate admin user ID
    const adminId = 'admin-' + Date.now();
    
    // Hash the password
    const passwordHash = await bcrypt.hash('passwordadmin', 12);
    
    // Store admin user data
    await redis.hSet(`user:${adminId}`, {
      id: adminId,
      name: 'Administrator',
      userId: 'admin',
      studentPhoneNumber: '010-0000-1000', // Admin student number
      parentPhoneNumber: '010-0000-0000', // Admin parent number
      userType: 'parent', // Set as parent type
      passwordHash: passwordHash,
      createdAt: Date.now().toString(),
      role: 'admin', // Add admin role
    });
    
    // Create userId lookup
    await redis.set(`user:userId:admin`, adminId);
    
    console.log('✅ Admin user created successfully!');
    console.log('User ID: admin');
    console.log('Password: passwordadmin');
    console.log('Student Phone: 010-0000-1000');
    console.log('Parent Phone: 010-0000-0000');
    console.log('User Type: parent');
    console.log('Role: admin');
    console.log('Internal ID:', adminId);
    
  } catch (error) {
    console.error('❌ Failed to create admin user:', error);
  } finally {
    await redis.quit();
  }
}

createAdminUser().catch(console.error);