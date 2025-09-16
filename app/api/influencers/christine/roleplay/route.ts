import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ConversationMessage {
  id: string;
  role: 'user' | 'ai' | 'system';
  content: string;
  timestamp: number;
  feedback?: MessageFeedback;
}

interface MessageFeedback {
  score: number;
  naturalness: string;
  suggestions: string[];
  improvedVersion?: string;
}

interface ConversationSession {
  id: string;
  scenario: string;
  context: string;
  difficulty: string;
  messages: ConversationMessage[];
  totalScore: number;
  completedTurns: number;
  startTime: number;
}

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { action, userId } = body;

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: '사용자 ID가 필요합니다.'
      }, { status: 400 });
    }

    switch (action) {
      case 'start_conversation':
        return await startConversation(body);
      case 'send_message':
        return await sendMessage(body);
      case 'get_feedback':
        return await getFeedback(body);
      default:
        return NextResponse.json({
          success: false,
          error: '지원하지 않는 액션입니다.'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Roleplay API error:', error);
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 });
  }
}

async function startConversation(requestData: any): Promise<NextResponse> {
  const { userId, scenario, context, difficulty = 'intermediate' } = requestData;

  try {
    const sessionId = uuidv4();
    const now = Date.now();

    // Generate initial AI message
    const initialMessage = await generateInitialMessage(scenario, context, difficulty);

    const session: ConversationSession = {
      id: sessionId,
      scenario,
      context,
      difficulty,
      messages: [
        {
          id: uuidv4(),
          role: 'system',
          content: `🎭 Role-play 시작: ${context}`,
          timestamp: now
        },
        {
          id: uuidv4(),
          role: 'ai',
          content: initialMessage,
          timestamp: now + 1000
        }
      ],
      totalScore: 0,
      completedTurns: 0,
      startTime: now
    };

    // Save session to Redis
    const redis = await getRedisClient();
    await redis.setEx(
      `christine:roleplay:${sessionId}`,
      SESSION_TIMEOUT / 1000,
      JSON.stringify(session)
    );
    await redis.quit();

    return NextResponse.json({
      success: true,
      session,
      message: '새로운 Role-play 세션이 시작되었습니다.'
    });

  } catch (error) {
    console.error('Start conversation error:', error);
    return NextResponse.json({
      success: false,
      error: '대화 시작 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
}

async function sendMessage(requestData: any): Promise<NextResponse> {
  const { userId, sessionId, message } = requestData;

  try {
    const redis = await getRedisClient();
    const sessionKey = `christine:roleplay:${sessionId}`;
    const sessionData = await redis.get(sessionKey);

    if (!sessionData) {
      await redis.quit();
      return NextResponse.json({
        success: false,
        error: '세션을 찾을 수 없습니다.'
      }, { status: 404 });
    }

    const session: ConversationSession = JSON.parse(sessionData);
    const now = Date.now();

    // Add user message
    const userMessage: ConversationMessage = {
      id: uuidv4(),
      role: 'user',
      content: message,
      timestamp: now
    };

    session.messages.push(userMessage);

    // Generate AI response
    const aiResponse = await generateAIResponse(session, message);

    const aiMessage: ConversationMessage = {
      id: uuidv4(),
      role: 'ai',
      content: aiResponse,
      timestamp: now + 1000
    };

    session.messages.push(aiMessage);
    session.completedTurns++;

    // Update session in Redis
    await redis.setEx(sessionKey, SESSION_TIMEOUT / 1000, JSON.stringify(session));
    await redis.quit();

    return NextResponse.json({
      success: true,
      session,
      message: '메시지가 전송되었습니다.'
    });

  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({
      success: false,
      error: '메시지 전송 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
}

async function getFeedback(requestData: any): Promise<NextResponse> {
  const { userId, sessionId, messageId } = requestData;

  try {
    const redis = await getRedisClient();
    const sessionKey = `christine:roleplay:${sessionId}`;
    const sessionData = await redis.get(sessionKey);

    if (!sessionData) {
      await redis.quit();
      return NextResponse.json({
        success: false,
        error: '세션을 찾을 수 없습니다.'
      }, { status: 404 });
    }

    const session: ConversationSession = JSON.parse(sessionData);
    const message = session.messages.find(m => m.id === messageId && m.role === 'user');

    if (!message) {
      await redis.quit();
      return NextResponse.json({
        success: false,
        error: '메시지를 찾을 수 없습니다.'
      }, { status: 404 });
    }

    // Generate feedback
    const feedback = await generateMessageFeedback(session, message.content);

    // Update message with feedback
    message.feedback = feedback;

    // Update session in Redis
    await redis.setEx(sessionKey, SESSION_TIMEOUT / 1000, JSON.stringify(session));
    await redis.quit();

    return NextResponse.json({
      success: true,
      session,
      feedback,
      message: '피드백이 생성되었습니다.'
    });

  } catch (error) {
    console.error('Get feedback error:', error);
    return NextResponse.json({
      success: false,
      error: '피드백 생성 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
}

async function generateInitialMessage(scenario: string, context: string, difficulty: string): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are Christine, a friendly and experienced English conversation teacher. You're helping Korean students practice English through role-play scenarios.

Scenario: ${scenario}
Context: ${context}
Difficulty: ${difficulty}

Generate a natural opening message to start the conversation. Use appropriate level of English for ${difficulty} learners. Be encouraging and set the scene clearly.

Response should be 1-2 sentences, natural and conversational.`
        }
      ],
      max_tokens: 200,
      temperature: 0.8,
    });

    return completion.choices[0]?.message?.content || "Hello! Let's start our role-play practice. How can I help you today?";

  } catch (error) {
    console.error('Initial message generation error:', error);
    return "Hello! Let's start our role-play practice. How can I help you today?";
  }
}

async function generateAIResponse(session: ConversationSession, userMessage: string): Promise<string> {
  try {
    // Get recent conversation history
    const recentMessages = session.messages
      .filter(m => m.role !== 'system')
      .slice(-6) // Last 6 messages for context
      .map(m => `${m.role === 'user' ? 'Student' : 'Christine'}: ${m.content}`)
      .join('\n');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are Christine, a patient and encouraging English conversation teacher conducting a role-play session.

Scenario: ${session.scenario}
Context: ${session.context}
Difficulty: ${session.difficulty}

Guidelines:
- Respond naturally to continue the conversation
- Match the scenario and context
- Use appropriate difficulty level for ${session.difficulty} learners
- Be encouraging and helpful
- Keep responses 1-3 sentences
- Stay in character for the role-play scenario

Recent conversation:
${recentMessages}

Student just said: ${userMessage}

Respond as Christine in the role-play scenario:`
        }
      ],
      max_tokens: 300,
      temperature: 0.8,
    });

    return completion.choices[0]?.message?.content || "That's great! Please continue.";

  } catch (error) {
    console.error('AI response generation error:', error);
    return "That sounds good. What would you like to say next?";
  }
}

async function generateMessageFeedback(session: ConversationSession, userMessage: string): Promise<MessageFeedback> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are Christine, an expert English teacher providing feedback on student conversation.

Analyze this student message in the context of the role-play scenario and provide constructive feedback.

Scenario: ${session.scenario}
Context: ${session.context}
Student message: "${userMessage}"

Provide feedback in this JSON format:
{
  "score": 8,
  "naturalness": "자연스러운 표현입니다. 원어민이 실제로 사용하는 표현이에요.",
  "suggestions": ["Consider using 'I'd like to' instead of 'I want to' for more politeness", "Try adding 'please' to make it sound more polite"],
  "improvedVersion": "I'd like to check in, please."
}

Score: 1-10 (naturalness and appropriateness)
Naturalness: Korean explanation of how natural the expression sounds
Suggestions: 2-3 practical improvement tips in English
ImprovedVersion: (optional) better version if significant improvement is needed`
        }
      ],
      max_tokens: 500,
      temperature: 0.3,
    });

    const response = completion.choices[0]?.message?.content;

    if (response) {
      return JSON.parse(response);
    }

    throw new Error('Empty AI response');

  } catch (error) {
    console.error('Feedback generation error:', error);

    // Fallback feedback
    return {
      score: 7,
      naturalness: '좋은 표현입니다! 계속 연습하면 더욱 자연스러워질 거예요.',
      suggestions: [
        '더 다양한 표현을 사용해보세요.',
        '문장을 조금 더 길게 만들어보면 좋겠어요.'
      ],
      improvedVersion: userMessage
    };
  }
}