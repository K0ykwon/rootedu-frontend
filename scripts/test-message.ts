import { createClient } from 'redis';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Load .env.local file
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const REDIS_URL = process.env.REDIS_URL || 'redis://default:uidvu100wo6pdWxdrXoE1HaHx33mWDRA@redis-15676.c266.us-east-1-3.ec2.redns.redis-cloud.com:15676';

async function testMessage() {
  const redis = createClient({
    url: REDIS_URL,
    database: 0
  });

  try {
    console.log('🔧 Testing message system...');
    await redis.connect();

    const slug = 'yaktoon';
    const messageId = uuidv4();
    const timestamp = new Date().toISOString();

    // Simulate saving a message (like the API does)
    const customerMessage = {
      id: messageId,
      role: 'customer',
      content: 'Test message from script',
      timestamp,
      status: 'pending',
      userId: 'test-user',
      userEmail: 'test@example.com',
      userName: 'Test User'
    };

    // Save message to Redis
    const messageKey = `influencer:${slug}:message:${messageId}`;
    console.log(`\n📝 Saving message to ${messageKey}`);
    await redis.hSet(messageKey, customerMessage);
    
    // Add to pending messages queue
    const pendingKey = `influencer:${slug}:pending_messages`;
    console.log(`📋 Adding to pending queue: ${pendingKey}`);
    await redis.lPush(pendingKey, messageId);
    
    // Save a mock AI draft
    const aiDraftKey = `influencer:${slug}:message:${messageId}:draft`;
    console.log(`🤖 Saving AI draft to ${aiDraftKey}`);
    await redis.set(aiDraftKey, JSON.stringify({
      content: 'This is a test AI draft response',
      generatedAt: timestamp
    }));

    console.log('\n✅ Message saved successfully!');

    // Now retrieve it like the dashboard does
    console.log('\n🔍 Retrieving pending messages...');
    const pendingMessageIds = await redis.lRange(pendingKey, 0, -1);
    console.log(`Found ${pendingMessageIds.length} pending messages`);

    for (const id of pendingMessageIds) {
      const msgKey = `influencer:${slug}:message:${id}`;
      const messageData = await redis.hGetAll(msgKey);
      
      if (messageData && Object.keys(messageData).length > 0) {
        console.log(`\n📧 Message ${id}:`);
        console.log(`  From: ${messageData.userName} (${messageData.userEmail})`);
        console.log(`  Content: ${messageData.content}`);
        console.log(`  Status: ${messageData.status}`);
        console.log(`  Time: ${messageData.timestamp}`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await redis.quit();
  }
}

if (require.main === module) {
  testMessage();
}

export default testMessage;