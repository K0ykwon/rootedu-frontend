import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface PracticeQuestion {
  id: string;
  type: 'fill_blank' | 'complete_sentence' | 'variation';
  originalPhrase: string;
  question: string;
  answer: string;
  options?: string[];
  explanation?: string;
}

interface PracticeProgress {
  monthKey: string;
  weekKey: string;
  completedQuestions: string[];
  score: number;
  lastStudied: number;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const action = url.searchParams.get('action');
    const month = url.searchParams.get('month');
    const week = url.searchParams.get('week');

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: '사용자 ID가 필요합니다.'
      }, { status: 400 });
    }

    switch (action) {
      case 'progress':
        return await getProgress(userId, month!, week!);
      default:
        return NextResponse.json({
          success: false,
          error: '지원하지 않는 액션입니다.'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Core phrase GET error:', error);
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
      case 'generate_questions':
        return await generateQuestions(body);
      case 'calculate_results':
        return await calculateResults(body);
      default:
        return NextResponse.json({
          success: false,
          error: '지원하지 않는 액션입니다.'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Core phrase API error:', error);
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 });
  }
}

async function getProgress(userId: string, month: string, week: string): Promise<NextResponse> {
  try {
    const redis = await getRedisClient();
    const progressKey = `christine:core_phrase:${userId}:${month}:${week}`;

    const progressData = await redis.hGetAll(progressKey);
    await redis.quit();

    if (Object.keys(progressData).length === 0) {
      return NextResponse.json({
        success: true,
        progress: null
      });
    }

    const progress: PracticeProgress = {
      monthKey: month,
      weekKey: week,
      completedQuestions: JSON.parse(progressData.completedQuestions || '[]'),
      score: parseInt(progressData.score || '0'),
      lastStudied: parseInt(progressData.lastStudied || '0')
    };

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

async function generateQuestions(requestData: any): Promise<NextResponse> {
  const { userId, month, week, phrases, count = 10 } = requestData;

  try {
    // Generate questions using AI
    const questions = await generateQuestionsWithAI(phrases, count, month, week);

    return NextResponse.json({
      success: true,
      questions,
      message: `${questions.length}개의 문제가 생성되었습니다.`
    });

  } catch (error) {
    console.error('Generate questions error:', error);
    return NextResponse.json({
      success: false,
      error: '문제 생성 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
}

async function calculateResults(requestData: any): Promise<NextResponse> {
  const { userId, month, week, questions, userAnswers } = requestData;

  try {
    let correctCount = 0;
    const completedQuestions: string[] = [];

    // Calculate score
    for (const question of questions) {
      const userAnswer = userAnswers[question.id];
      if (userAnswer) {
        completedQuestions.push(question.id);

        // Check if answer is correct
        if (question.options) {
          // Multiple choice - check exact match
          if (userAnswer === question.answer) {
            correctCount++;
          }
        } else {
          // Text input - check similarity or exact match
          const similarity = calculateStringSimilarity(userAnswer.toLowerCase().trim(), question.answer.toLowerCase().trim());
          if (similarity > 0.8) { // 80% similarity threshold
            correctCount++;
          }
        }
      }
    }

    const score = Math.round((correctCount / questions.length) * 100);

    // Save progress to Redis
    const redis = await getRedisClient();
    const progressKey = `christine:core_phrase:${userId}:${month}:${week}`;

    const progress: PracticeProgress = {
      monthKey: month,
      weekKey: week,
      completedQuestions,
      score,
      lastStudied: Date.now()
    };

    await redis.hSet(progressKey, {
      completedQuestions: JSON.stringify(completedQuestions),
      score: score.toString(),
      lastStudied: Date.now().toString()
    });

    await redis.quit();

    return NextResponse.json({
      success: true,
      progress,
      correctCount,
      totalQuestions: questions.length,
      message: `${correctCount}/${questions.length} 정답! ${score}점을 획득했습니다.`
    });

  } catch (error) {
    console.error('Calculate results error:', error);
    return NextResponse.json({
      success: false,
      error: '결과 계산 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
}

async function generateQuestionsWithAI(phrases: string[], count: number, month: string, week: string): Promise<PracticeQuestion[]> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are Christine, an expert English conversation teacher specializing in practical English patterns for Korean learners.

Create ${count} diverse practice questions based on the given phrases from ${month} ${week} curriculum.

Generate 3 types of questions:
1. Fill-in-blank: Remove 1-2 key words and provide multiple choice options
2. Complete sentence: Give a situation and ask to complete using the pattern
3. Variation: Ask for alternative ways to express the same meaning

For each question, provide:
- type: "fill_blank", "complete_sentence", or "variation"
- originalPhrase: the source phrase
- question: the question text in Korean
- answer: the correct answer
- options: array of 4 choices (for multiple choice questions)
- explanation: helpful tip in Korean

Respond in JSON format:
{
  "questions": [
    {
      "type": "fill_blank",
      "originalPhrase": "I'd like to check in.",
      "question": "다음 빈칸에 알맞은 단어를 선택하세요: I'd ____ to check in.",
      "answer": "like",
      "options": ["like", "want", "need", "wish"],
      "explanation": "'I'd like to'는 정중한 요청 표현입니다."
    }
  ]
}`
        },
        {
          role: 'user',
          content: `Create practice questions for these phrases:
${phrases.join('\n')}

Theme: ${month} ${week}
Focus on practical usage and natural conversation patterns.`
        }
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      throw new Error('AI response is empty');
    }

    const aiData = JSON.parse(response);

    return aiData.questions.map((q: any, index: number) => ({
      id: `${Date.now()}-${index}`,
      type: q.type,
      originalPhrase: q.originalPhrase,
      question: q.question,
      answer: q.answer,
      options: q.options,
      explanation: q.explanation
    }));

  } catch (error) {
    console.error('AI question generation error:', error);

    // Fallback questions
    return generateFallbackQuestions(phrases, count);
  }
}

function generateFallbackQuestions(phrases: string[], count: number): PracticeQuestion[] {
  const fallbackQuestions: PracticeQuestion[] = [];

  for (let i = 0; i < Math.min(count, phrases.length); i++) {
    const phrase = phrases[i];
    const words = phrase.split(' ');

    if (words.length >= 3) {
      // Generate fill-in-blank question
      const keyWordIndex = Math.floor(words.length / 2);
      const keyWord = words[keyWordIndex];
      const questionPhrase = words.map((w, idx) => idx === keyWordIndex ? '____' : w).join(' ');

      fallbackQuestions.push({
        id: `fallback-${Date.now()}-${i}`,
        type: 'fill_blank',
        originalPhrase: phrase,
        question: `다음 빈칸에 알맞은 단어를 선택하세요: "${questionPhrase}"`,
        answer: keyWord,
        options: [keyWord, 'is', 'the', 'can'].filter((w, idx, arr) => arr.indexOf(w) === idx),
        explanation: '문맥에 맞는 단어를 선택해주세요.'
      });
    }
  }

  return fallbackQuestions;
}

function calculateStringSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  if (str1.includes(str2) || str2.includes(str1)) return 0.9;

  // Simple Levenshtein distance approximation
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1;

  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }

  return matrix[str2.length][str1.length];
}