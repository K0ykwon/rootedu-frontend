import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';
import { getServerSession } from 'next-auth/next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// SRS intervals in days
const SRS_INTERVALS = [1, 3, 7, 14, 30];

interface VocabularyWord {
  id: string;
  word: string;
  meaning: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  example: string;
  translation: string;
  createdAt: number;
  nextReviewDate: number;
  interval: number;
  easinessFactor: number;
  correctCount: number;
  incorrectCount: number;
  lastReviewed?: number;
}

interface DailyVocabularyRequest {
  action: 'generate_daily';
  userId: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  category: 'business' | 'academic' | 'daily' | 'toeic' | 'ielts';
  count?: number;
}

interface SentenceFeedbackRequest {
  action: 'feedback';
  userId: string;
  wordId: string;
  userSentence: string;
}

interface VocabularyResponse {
  success: boolean;
  words?: VocabularyWord[];
  feedback?: {
    score: number;
    isCorrect: boolean;
    suggestions: string[];
    improvedSentence: string;
    grammarFeedback: string;
    naturalnessFeedback: string;
  };
  message?: string;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<VocabularyResponse>> {
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
      case 'generate_daily':
        return await handleGenerateDaily(body as DailyVocabularyRequest);
      case 'feedback':
        return await handleSentenceFeedback(body as SentenceFeedbackRequest);
      default:
        return NextResponse.json({
          success: false,
          error: '지원하지 않는 액션입니다.'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Vocabulary API error:', error);
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const action = url.searchParams.get('action');

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: '사용자 ID가 필요합니다.'
      }, { status: 400 });
    }

    switch (action) {
      case 'today':
        return await getTodaysWords(userId);
      case 'progress':
        return await getProgress(userId);
      case 'due':
        return await getDueWords(userId);
      default:
        return NextResponse.json({
          success: false,
          error: '지원하지 않는 액션입니다.'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Vocabulary GET error:', error);
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 });
  }
}

async function handleGenerateDaily(request: DailyVocabularyRequest): Promise<NextResponse<VocabularyResponse>> {
  const { userId, level, category, count = 7 } = request;

  try {
    // AI로 카테고리와 레벨에 맞는 단어들 생성
    const words = await generateVocabularyWithAI(level, category, count);
    
    // Redis에 저장
    const redis = await getRedisClient();
    const today = new Date().toDateString();
    
    for (const word of words) {
      const wordKey = `vocab:${userId}:word:${word.id}`;
      await redis.hSet(wordKey, {
        ...word,
        createdAt: word.createdAt.toString(),
        nextReviewDate: word.nextReviewDate.toString(),
        interval: word.interval.toString(),
        easinessFactor: word.easinessFactor.toString(),
        correctCount: word.correctCount.toString(),
        incorrectCount: word.incorrectCount.toString(),
      });
      
      // 오늘의 단어 목록에 추가
      await redis.sAdd(`vocab:${userId}:daily:${today}`, word.id);
      
      // 전체 단어 목록에 추가
      await redis.sAdd(`vocab:${userId}:all`, word.id);
    }
    
    await redis.quit();

    return NextResponse.json({
      success: true,
      words,
      message: `${words.length}개의 새로운 단어가 생성되었습니다.`
    });

  } catch (error) {
    console.error('Generate daily words error:', error);
    return NextResponse.json({
      success: false,
      error: 'AI 단어 생성 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
}

async function handleSentenceFeedback(request: SentenceFeedbackRequest): Promise<NextResponse<VocabularyResponse>> {
  const { userId, wordId, userSentence } = request;

  try {
    // 단어 정보 가져오기
    const redis = await getRedisClient();
    const wordKey = `vocab:${userId}:word:${wordId}`;
    const wordData = await redis.hGetAll(wordKey);
    
    if (!wordData.word) {
      await redis.quit();
      return NextResponse.json({
        success: false,
        error: '단어를 찾을 수 없습니다.'
      }, { status: 404 });
    }

    // AI로 문장 피드백 생성
    const feedback = await generateSentenceFeedback(wordData.word, userSentence, wordData.example);
    
    // SRS 업데이트 (피드백 점수에 따라)
    const isCorrect = feedback.score >= 70; // 70점 이상을 정답으로 간주
    await updateSRSData(redis, userId, wordId, isCorrect);
    
    await redis.quit();

    return NextResponse.json({
      success: true,
      feedback,
      message: isCorrect ? '훌륭합니다!' : '다시 한번 연습해보세요!'
    });

  } catch (error) {
    console.error('Sentence feedback error:', error);
    return NextResponse.json({
      success: false,
      error: '문장 피드백 생성 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
}

async function getTodaysWords(userId: string): Promise<NextResponse> {
  try {
    const redis = await getRedisClient();
    const today = new Date().toDateString();
    
    // 오늘의 단어 목록 가져오기
    const wordIds = await redis.sMembers(`vocab:${userId}:daily:${today}`);
    
    if (wordIds.length === 0) {
      await redis.quit();
      return NextResponse.json({
        success: true,
        words: [],
        message: '오늘의 단어가 없습니다. 새로운 단어를 생성해보세요!'
      });
    }

    // 각 단어의 상세 정보 가져오기
    const words: VocabularyWord[] = [];
    for (const wordId of wordIds) {
      const wordKey = `vocab:${userId}:word:${wordId}`;
      const wordData = await redis.hGetAll(wordKey);
      
      if (wordData.word) {
        words.push({
          id: wordData.id,
          word: wordData.word,
          meaning: wordData.meaning,
          level: wordData.level as any,
          category: wordData.category,
          example: wordData.example,
          translation: wordData.translation,
          createdAt: parseInt(wordData.createdAt),
          nextReviewDate: parseInt(wordData.nextReviewDate),
          interval: parseInt(wordData.interval),
          easinessFactor: parseFloat(wordData.easinessFactor),
          correctCount: parseInt(wordData.correctCount),
          incorrectCount: parseInt(wordData.incorrectCount),
          lastReviewed: wordData.lastReviewed ? parseInt(wordData.lastReviewed) : undefined
        });
      }
    }
    
    await redis.quit();

    return NextResponse.json({
      success: true,
      words
    });

  } catch (error) {
    console.error('Get todays words error:', error);
    return NextResponse.json({
      success: false,
      error: '오늘의 단어를 가져오는 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
}

async function getDueWords(userId: string): Promise<NextResponse> {
  try {
    const redis = await getRedisClient();
    const now = Date.now();
    
    // 모든 단어 가져오기
    const allWordIds = await redis.sMembers(`vocab:${userId}:all`);
    const dueWords: VocabularyWord[] = [];

    for (const wordId of allWordIds) {
      const wordKey = `vocab:${userId}:word:${wordId}`;
      const wordData = await redis.hGetAll(wordKey);
      
      if (wordData.word && parseInt(wordData.nextReviewDate) <= now) {
        dueWords.push({
          id: wordData.id,
          word: wordData.word,
          meaning: wordData.meaning,
          level: wordData.level as any,
          category: wordData.category,
          example: wordData.example,
          translation: wordData.translation,
          createdAt: parseInt(wordData.createdAt),
          nextReviewDate: parseInt(wordData.nextReviewDate),
          interval: parseInt(wordData.interval),
          easinessFactor: parseFloat(wordData.easinessFactor),
          correctCount: parseInt(wordData.correctCount),
          incorrectCount: parseInt(wordData.incorrectCount),
          lastReviewed: wordData.lastReviewed ? parseInt(wordData.lastReviewed) : undefined
        });
      }
    }
    
    await redis.quit();

    return NextResponse.json({
      success: true,
      words: dueWords
    });

  } catch (error) {
    console.error('Get due words error:', error);
    return NextResponse.json({
      success: false,
      error: '복습할 단어를 가져오는 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
}

async function getProgress(userId: string): Promise<NextResponse> {
  try {
    const redis = await getRedisClient();
    
    // 전체 단어 수
    const totalWords = await redis.sCard(`vocab:${userId}:all`);
    
    // 오늘 학습한 단어 수
    const today = new Date().toDateString();
    const todayStudied = await redis.sCard(`vocab:${userId}:studied:${today}`);
    
    // 복습 예정 단어 수
    const allWordIds = await redis.sMembers(`vocab:${userId}:all`);
    let dueCount = 0;
    const now = Date.now();
    
    for (const wordId of allWordIds) {
      const wordKey = `vocab:${userId}:word:${wordId}`;
      const nextReviewDate = await redis.hGet(wordKey, 'nextReviewDate');
      
      if (nextReviewDate && parseInt(nextReviewDate) <= now) {
        dueCount++;
      }
    }
    
    await redis.quit();

    return NextResponse.json({
      success: true,
      progress: {
        totalWords,
        todayStudied,
        dueCount,
        studyStreak: 0 // TODO: Calculate streak
      }
    });

  } catch (error) {
    console.error('Get progress error:', error);
    return NextResponse.json({
      success: false,
      error: '진도를 가져오는 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
}

async function generateVocabularyWithAI(level: string, category: string, count: number): Promise<VocabularyWord[]> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are Terry English, an expert vocabulary teacher. Create ${count} essential English words for Korean learners.

Level: ${level}
Category: ${category}

For each word, provide:
1. The English word
2. Korean meaning
3. An example sentence showing practical usage
4. Korean translation of the example

Response format (JSON only):
{
  "words": [
    {
      "word": "deadline",
      "meaning": "마감일, 기한",
      "example": "I need to finish this project before the deadline.",
      "translation": "나는 마감일 전에 이 프로젝트를 끝내야 한다."
    }
  ]
}

Focus on:
- Practical, commonly used words
- Clear, natural example sentences
- Accurate Korean translations
- Words appropriate for ${level} level
- ${category} context relevance`
        }
      ],
      max_tokens: 2000,
      temperature: 0.8,
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error('AI response is empty');
    }

    const aiData = JSON.parse(response);
    const now = Date.now();
    
    return aiData.words.map((word: any, index: number) => ({
      id: `${Date.now()}-${index}`,
      word: word.word,
      meaning: word.meaning,
      level,
      category,
      example: word.example,
      translation: word.translation,
      createdAt: now,
      nextReviewDate: now + (24 * 60 * 60 * 1000), // 1일 후 첫 복습
      interval: 1,
      easinessFactor: 2.5, // 기본 난이도
      correctCount: 0,
      incorrectCount: 0
    }));

  } catch (error) {
    console.error('AI vocabulary generation error:', error);
    
    // Fallback words
    const fallbackWords = [
      { word: 'important', meaning: '중요한', example: 'This is an important meeting.', translation: '이것은 중요한 회의입니다.' },
      { word: 'develop', meaning: '발전시키다', example: 'We need to develop new skills.', translation: '우리는 새로운 기술을 개발해야 합니다.' },
      { word: 'opportunity', meaning: '기회', example: 'This is a great opportunity.', translation: '이것은 좋은 기회입니다.' }
    ];

    const now = Date.now();
    
    return fallbackWords.slice(0, count).map((word, index) => ({
      id: `${Date.now()}-${index}`,
      word: word.word,
      meaning: word.meaning,
      level: level as any,
      category,
      example: word.example,
      translation: word.translation,
      createdAt: now,
      nextReviewDate: now + (24 * 60 * 60 * 1000),
      interval: 1,
      easinessFactor: 2.5,
      correctCount: 0,
      incorrectCount: 0
    }));
  }
}

async function generateSentenceFeedback(word: string, userSentence: string, exampleSentence: string) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are Terry English, an expert English teacher providing detailed feedback on student sentences.

Analyze the student's sentence usage of the word "${word}" and provide constructive feedback.

Example sentence: "${exampleSentence}"
Student sentence: "${userSentence}"

Provide feedback in this JSON format:
{
  "score": 85,
  "isCorrect": true,
  "suggestions": ["Use past tense for completed actions", "Add an article before 'project'"],
  "improvedSentence": "I finished the project yesterday.",
  "grammarFeedback": "Grammar is mostly correct. Consider using past tense.",
  "naturalnessFeedback": "The sentence sounds natural to native speakers."
}`
        }
      ],
      max_tokens: 800,
      temperature: 0.3,
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error('AI feedback response is empty');
    }

    return JSON.parse(response);

  } catch (error) {
    console.error('AI feedback generation error:', error);
    
    // Fallback feedback
    return {
      score: 70,
      isCorrect: true,
      suggestions: ['문장을 더 자연스럽게 만들어보세요.'],
      improvedSentence: userSentence,
      grammarFeedback: '문법적으로 올바른 문장입니다.',
      naturalnessFeedback: '자연스러운 표현입니다.'
    };
  }
}

async function updateSRSData(redis: any, userId: string, wordId: string, isCorrect: boolean) {
  const wordKey = `vocab:${userId}:word:${wordId}`;
  const wordData = await redis.hGetAll(wordKey);
  
  if (!wordData.word) return;

  const correctCount = parseInt(wordData.correctCount) + (isCorrect ? 1 : 0);
  const incorrectCount = parseInt(wordData.incorrectCount) + (isCorrect ? 0 : 1);
  let easinessFactor = parseFloat(wordData.easinessFactor);
  let interval = parseInt(wordData.interval);

  // SRS 알고리즘 (SM-2 기반)
  if (isCorrect) {
    if (correctCount === 1) {
      interval = 1;
    } else if (correctCount === 2) {
      interval = 3;
    } else {
      interval = Math.round(interval * easinessFactor);
    }
    easinessFactor = easinessFactor + (0.1 - (5 - 4) * (0.08 + (5 - 4) * 0.02));
  } else {
    interval = 1;
    easinessFactor = Math.max(1.3, easinessFactor - 0.2);
  }

  const nextReviewDate = Date.now() + (interval * 24 * 60 * 60 * 1000);
  const now = Date.now();

  await redis.hSet(wordKey, {
    correctCount: correctCount.toString(),
    incorrectCount: incorrectCount.toString(),
    easinessFactor: easinessFactor.toString(),
    interval: interval.toString(),
    nextReviewDate: nextReviewDate.toString(),
    lastReviewed: now.toString()
  });

  // 오늘 학습한 단어에 추가
  const today = new Date().toDateString();
  await redis.sAdd(`vocab:${userId}:studied:${today}`, wordId);
}