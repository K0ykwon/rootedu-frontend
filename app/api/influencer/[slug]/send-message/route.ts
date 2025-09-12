import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth';
import { getRedisClient } from '../../../../../lib/redis';
import { v4 as uuidv4 } from 'uuid';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, userId: providedUserId, userEmail: providedEmail } = body;
    
    const userId = providedUserId || (session.user as any)?.userId || (session.user as any)?.id;
    const userEmail = providedEmail || session.user?.email;
    const userName = (session.user as any)?.name || session.user?.name || 'Customer';
    
    const params = await context.params;
    const slug = params.slug;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const redis = await getRedisClient();
    
    try {
      // Generate message IDs
      const userMessageId = uuidv4();
      const aiMessageId = uuidv4();
      const timestamp = new Date().toISOString();
      
      // Create the customer message
      const customerMessage = {
        id: userMessageId,
        role: 'customer',
        content: message,
        timestamp,
        status: 'sent',
        userId,
        userEmail,
        userName
      };

      // Generate immediate AI response
      const aiResponse = await generateImmediateAIResponse(message, userName, slug);
      
      // Create AI response message
      const aiMessage = {
        id: aiMessageId,
        role: 'ai',
        content: aiResponse,
        timestamp: new Date().toISOString(),
        status: 'delivered',
        responseSource: 'ai',
        canRequestReview: true
      };

      // Save both messages to conversation
      const conversationKey = `influencer:${slug}:user:${userId}:conversation`;
      
      // Save customer message
      await redis.lPush(conversationKey, JSON.stringify(customerMessage));
      
      // Save AI response message
      await redis.lPush(conversationKey, JSON.stringify(aiMessage));
      
      // Set expiration for conversation
      await redis.expire(conversationKey, 30 * 24 * 60 * 60); // 30 days

      // Also maintain the user messages list for compatibility
      const userMessagesKey = `influencer:${slug}:user:${userId}:messages`;
      await redis.sAdd(userMessagesKey, userMessageId);
      await redis.sAdd(userMessagesKey, aiMessageId);
      await redis.expire(userMessagesKey, 30 * 24 * 60 * 60);

      return NextResponse.json({ 
        success: true,
        messageId: userMessageId,
        aiMessageId: aiMessageId,
        aiResponse: aiResponse,
        responseType: 'immediate',
        message: 'Message sent and AI response generated'
      });
      
    } finally {
      // Don't close the shared Redis connection
    }
    
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function generateImmediateAIResponse(message: string, userName: string, influencerSlug: string): Promise<string> {
  try {
    // Call OpenAI API for immediate customer response
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant representing ${influencerSlug}. 
            You are directly responding to customer inquiries with helpful, friendly, and professional responses in Korean.
            Provide practical and actionable advice. Keep responses concise but comprehensive.
            Always maintain a warm, supportive tone as if you're personally helping them.`
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (response.ok) {
      const data = await response.json();
      return data.choices[0].message.content;
    }
  } catch (error) {
    console.error('Error generating immediate AI response:', error);
  }

  // Fallback response if AI generation fails
  return `안녕하세요 ${userName}님! 

질문해 주신 내용에 대해 도움을 드리고 싶지만, 지금 일시적으로 응답 생성에 문제가 있습니다. 

더 정확하고 개인적인 답변을 원하시면 "인플루언서 검토 요청" 버튼을 클릭해 주세요. ${influencerSlug}가 직접 답변해 드릴게요!

감사합니다! 😊`;
}

async function generateAIDraft(message: string, userName: string, influencerSlug: string): Promise<string> {
  try {
    // Call OpenAI API or your preferred AI service
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant helping an influencer respond to customer questions. 
            The influencer's name is ${influencerSlug}. 
            Provide helpful, friendly, and professional responses in Korean.
            Keep responses concise but informative.`
          },
          {
            role: 'user',
            content: `Customer ${userName} asks: "${message}"\n\nPlease draft a helpful response in Korean.`
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (response.ok) {
      const data = await response.json();
      return data.choices[0].message.content;
    }
  } catch (error) {
    console.error('Error generating AI draft:', error);
  }

  // Fallback response if AI generation fails
  return `안녕하세요 ${userName}님! 질문 주신 "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"에 대해 답변드리겠습니다. 
  
잠시만 기다려 주시면 자세한 답변을 준비해서 보내드리겠습니다. 
  
감사합니다!`;
}