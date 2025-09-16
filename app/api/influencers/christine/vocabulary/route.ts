import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';
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
  category: 'travel' | 'smalltalk' | 'business';
  subcategory: string;
  pronunciation: string;
  example: string;
  translation: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  createdAt: number;
  nextReviewDate: number;
  interval: number;
  easinessFactor: number;
  correctCount: number;
  incorrectCount: number;
  lastReviewed?: number;
}

interface StudyProgress {
  totalWords: number;
  todayStudied: number;
  dueCount: number;
  studyStreak: number;
  categoryProgress: {
    travel: number;
    smalltalk: number;
    business: number;
  };
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
      case 'progress':
        return await getProgress(userId);
      case 'due_words':
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
      case 'generate_study_words':
        return await generateStudyWords(body);
      case 'get_due_words':
        return await getDueWords(userId);
      case 'check_answer':
        return await checkAnswer(body);
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

async function getProgress(userId: string): Promise<NextResponse> {
  try {
    const redis = await getRedisClient();

    // Get all user's vocabulary words
    const allWordIds = await redis.sMembers(`christine:vocab:${userId}:all`);
    const now = Date.now();
    let dueCount = 0;
    const categoryProgress = { travel: 0, smalltalk: 0, business: 0 };

    // Check due words and categorize
    for (const wordId of allWordIds) {
      const wordKey = `christine:vocab:${userId}:word:${wordId}`;
      const wordData = await redis.hGetAll(wordKey);

      if (wordData.word) {
        const category = wordData.category as keyof typeof categoryProgress;
        if (categoryProgress[category] !== undefined) {
          categoryProgress[category]++;
        }

        const nextReviewDate = parseInt(wordData.nextReviewDate);
        if (nextReviewDate <= now) {
          dueCount++;
        }
      }
    }

    // Get today's studied count
    const today = new Date().toDateString();
    const todayStudied = await redis.sCard(`christine:vocab:${userId}:studied:${today}`);

    // Calculate study streak (simplified)
    const studyStreak = 1; // TODO: Implement proper streak calculation

    const progress: StudyProgress = {
      totalWords: allWordIds.length,
      todayStudied,
      dueCount,
      studyStreak,
      categoryProgress
    };

    await redis.quit();

    return NextResponse.json({
      success: true,
      progress
    });

  } catch (error) {
    console.error('Get progress error:', error);
    return NextResponse.json({
      success: false,
      error: '진도를 가져오는 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
}

async function generateStudyWords(requestData: any): Promise<NextResponse> {
  const { userId, category, subcategory, count = 10 } = requestData;

  try {
    // Generate vocabulary words using AI
    const words = await generateVocabularyWithAI(category, subcategory, count);

    // Save words to Redis
    const redis = await getRedisClient();

    for (const word of words) {
      const wordKey = `christine:vocab:${userId}:word:${word.id}`;
      await redis.hSet(wordKey, {
        ...word,
        createdAt: word.createdAt.toString(),
        nextReviewDate: word.nextReviewDate.toString(),
        interval: word.interval.toString(),
        easinessFactor: word.easinessFactor.toString(),
        correctCount: word.correctCount.toString(),
        incorrectCount: word.incorrectCount.toString(),
      });

      // Add to user's word list
      await redis.sAdd(`christine:vocab:${userId}:all`, word.id);

      // Add to category-specific list
      await redis.sAdd(`christine:vocab:${userId}:category:${category}`, word.id);
    }

    await redis.quit();

    return NextResponse.json({
      success: true,
      words,
      message: `${words.length}개의 새로운 단어가 생성되었습니다.`
    });

  } catch (error) {
    console.error('Generate study words error:', error);
    return NextResponse.json({
      success: false,
      error: '단어 생성 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
}

async function getDueWords(userId: string): Promise<NextResponse> {
  try {
    const redis = await getRedisClient();
    const now = Date.now();

    // Get all user's words
    const allWordIds = await redis.sMembers(`christine:vocab:${userId}:all`);
    const dueWords: VocabularyWord[] = [];

    for (const wordId of allWordIds) {
      const wordKey = `christine:vocab:${userId}:word:${wordId}`;
      const wordData = await redis.hGetAll(wordKey);

      if (wordData.word && parseInt(wordData.nextReviewDate) <= now) {
        dueWords.push({
          id: wordData.id,
          word: wordData.word,
          meaning: wordData.meaning,
          category: wordData.category as any,
          subcategory: wordData.subcategory,
          pronunciation: wordData.pronunciation,
          example: wordData.example,
          translation: wordData.translation,
          difficulty: wordData.difficulty as any,
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

    // Limit to 10 words and shuffle
    const selectedWords = dueWords
      .sort(() => Math.random() - 0.5)
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      words: selectedWords
    });

  } catch (error) {
    console.error('Get due words error:', error);
    return NextResponse.json({
      success: false,
      error: '복습할 단어를 가져오는 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
}

async function checkAnswer(requestData: any): Promise<NextResponse> {
  const { userId, wordId, userAnswer, timeSpent } = requestData;

  try {
    const redis = await getRedisClient();
    const wordKey = `christine:vocab:${userId}:word:${wordId}`;
    const wordData = await redis.hGetAll(wordKey);

    if (!wordData.word) {
      await redis.quit();
      return NextResponse.json({
        success: false,
        error: '단어를 찾을 수 없습니다.'
      }, { status: 404 });
    }

    // Check if answer is correct
    const correctAnswer = wordData.meaning.toLowerCase();
    const userAnswerNorm = userAnswer.toLowerCase().trim();
    const isCorrect = correctAnswer.includes(userAnswerNorm) || userAnswerNorm.includes(correctAnswer);

    // Update SRS data
    const updatedWord = await updateSRSData(redis, userId, wordId, isCorrect);

    // Record today's study
    const today = new Date().toDateString();
    await redis.sAdd(`christine:vocab:${userId}:studied:${today}`, wordId);

    await redis.quit();

    return NextResponse.json({
      success: true,
      isCorrect,
      correctAnswer: wordData.meaning,
      updatedWord,
      message: isCorrect ? '정답입니다!' : '다시 한번 연습해보세요!'
    });

  } catch (error) {
    console.error('Check answer error:', error);
    return NextResponse.json({
      success: false,
      error: '답변 확인 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
}

async function generateVocabularyWithAI(category: string, subcategory: string | undefined, count: number): Promise<VocabularyWord[]> {
  try {
    const categoryMap = {
      travel: '여행',
      smalltalk: '일상 대화',
      business: '비즈니스'
    };

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are Christine, an expert English vocabulary teacher for Korean learners.

Create ${count} practical English vocabulary words for the category: ${categoryMap[category as keyof typeof categoryMap] || category}${subcategory ? ` (${subcategory})` : ''}.

For each word, provide:
1. English word
2. Korean meaning
3. Pronunciation (IPA or simple phonetic)
4. Example sentence in English
5. Korean translation of example
6. Difficulty level (basic/intermediate/advanced)

Response format (JSON only):
{
  "words": [
    {
      "word": "reservation",
      "meaning": "예약",
      "pronunciation": "ˌrezərˈveɪʃən",
      "example": "I have a reservation under Kim.",
      "translation": "김씨 이름으로 예약했습니다.",
      "difficulty": "intermediate"
    }
  ]
}

Focus on:
- Practical, commonly used words
- Words appropriate for the category
- Clear, natural example sentences
- Accurate Korean translations`
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
      category: category as any,
      subcategory: subcategory || 'general',
      pronunciation: word.pronunciation,
      example: word.example,
      translation: word.translation,
      difficulty: word.difficulty,
      createdAt: now,
      nextReviewDate: now + (24 * 60 * 60 * 1000), // Review tomorrow
      interval: 1,
      easinessFactor: 2.5,
      correctCount: 0,
      incorrectCount: 0
    }));

  } catch (error) {
    console.error('AI vocabulary generation error:', error);

    // Fallback words
    const fallbackWords = [
      {
        word: 'hello',
        meaning: '안녕하세요',
        pronunciation: 'həˈloʊ',
        example: 'Hello, how are you?',
        translation: '안녕하세요, 어떻게 지내세요?',
        difficulty: 'basic'
      },
      {
        word: 'thank you',
        meaning: '감사합니다',
        pronunciation: 'θæŋk juː',
        example: 'Thank you very much.',
        translation: '정말 감사합니다.',
        difficulty: 'basic'
      },
      {
        word: 'excuse me',
        meaning: '실례합니다',
        pronunciation: 'ɪkˈskjuːs miː',
        example: 'Excuse me, where is the bathroom?',
        translation: '실례합니다, 화장실이 어디인가요?',
        difficulty: 'basic'
      }
    ];

    const now = Date.now();

    return fallbackWords.slice(0, count).map((word, index) => ({
      id: `${Date.now()}-${index}`,
      word: word.word,
      meaning: word.meaning,
      category: category as any,
      subcategory: subcategory || 'general',
      pronunciation: word.pronunciation,
      example: word.example,
      translation: word.translation,
      difficulty: word.difficulty as any,
      createdAt: now,
      nextReviewDate: now + (24 * 60 * 60 * 1000),
      interval: 1,
      easinessFactor: 2.5,
      correctCount: 0,
      incorrectCount: 0
    }));
  }
}

async function updateSRSData(redis: any, userId: string, wordId: string, isCorrect: boolean): Promise<VocabularyWord> {
  const wordKey = `christine:vocab:${userId}:word:${wordId}`;
  const wordData = await redis.hGetAll(wordKey);

  if (!wordData.word) throw new Error('Word not found');

  const correctCount = parseInt(wordData.correctCount) + (isCorrect ? 1 : 0);
  const incorrectCount = parseInt(wordData.incorrectCount) + (isCorrect ? 0 : 1);
  let easinessFactor = parseFloat(wordData.easinessFactor);
  let interval = parseInt(wordData.interval);

  // SRS algorithm (SM-2 based)
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

  const updatedData = {
    correctCount: correctCount.toString(),
    incorrectCount: incorrectCount.toString(),
    easinessFactor: easinessFactor.toString(),
    interval: interval.toString(),
    nextReviewDate: nextReviewDate.toString(),
    lastReviewed: now.toString()
  };

  await redis.hSet(wordKey, updatedData);

  return {
    id: wordData.id,
    word: wordData.word,
    meaning: wordData.meaning,
    category: wordData.category as any,
    subcategory: wordData.subcategory,
    pronunciation: wordData.pronunciation,
    example: wordData.example,
    translation: wordData.translation,
    difficulty: wordData.difficulty as any,
    createdAt: parseInt(wordData.createdAt),
    nextReviewDate,
    interval,
    easinessFactor,
    correctCount,
    incorrectCount,
    lastReviewed: now
  };
}