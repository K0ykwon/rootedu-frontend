import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';
import type { AdaptationAnswer, AdaptationResult } from '@/types/college-adaptation';

// Analyze adaptation based on answers
function analyzeAdaptation(answers: AdaptationAnswer[]): AdaptationResult {
  // Calculate total score
  const scores = answers.map(a => a.score);
  const totalScore = scores.reduce((sum, score) => sum + score, 0);
  const averageScore = totalScore / scores.length;
  const overallScore = Math.round(averageScore * 20); // Convert to percentage

  // Determine category
  let category: AdaptationResult['category'];
  if (overallScore >= 80) category = 'excellent';
  else if (overallScore >= 70) category = 'good';
  else if (overallScore >= 50) category = 'moderate';
  else if (overallScore >= 30) category = 'needs_support';
  else category = 'high_risk';

  // Calculate area scores
  const academicQuestions = ['academic_confidence', 'time_management', 'goal_clarity'];
  const socialQuestions = ['social_skills', 'help_seeking'];
  const independenceQuestions = ['independence', 'financial_awareness'];
  const mentalHealthQuestions = ['stress_management', 'burnout_risk', 'expectation_reality'];

  const calculateAreaScore = (questionIds: string[]) => {
    const areaAnswers = answers.filter(a => questionIds.includes(a.questionId));
    if (areaAnswers.length === 0) return 0;
    const areaSum = areaAnswers.reduce((sum, a) => sum + a.score, 0);
    return Math.round((areaSum / (areaAnswers.length * 5)) * 100);
  };

  const adaptationAreas = {
    academic: calculateAreaScore(academicQuestions),
    social: calculateAreaScore(socialQuestions),
    independence: calculateAreaScore(independenceQuestions),
    mentalHealth: calculateAreaScore(mentalHealthQuestions)
  };

  // Determine burnout risk
  const burnoutAnswer = answers.find(a => a.questionId === 'burnout_risk');
  const stressAnswer = answers.find(a => a.questionId === 'stress_management');
  const burnoutScore = (burnoutAnswer?.score || 3) + (stressAnswer?.score || 3);
  
  let burnoutRisk: AdaptationResult['burnoutRisk'];
  if (burnoutScore >= 8) burnoutRisk = 'low';
  else if (burnoutScore >= 5) burnoutRisk = 'moderate';
  else burnoutRisk = 'high';

  // Generate strengths
  const strengths: string[] = [];
  if (adaptationAreas.academic >= 70) {
    strengths.push('학업에 대한 자신감과 준비가 잘 되어있어요');
  }
  if (adaptationAreas.social >= 70) {
    strengths.push('새로운 인간관계 형성에 긍정적이에요');
  }
  if (adaptationAreas.independence >= 70) {
    strengths.push('독립적인 생활에 대한 준비가 잘 되어있어요');
  }
  if (adaptationAreas.mentalHealth >= 70) {
    strengths.push('스트레스 관리 능력이 우수해요');
  }
  const goalClarity = answers.find(a => a.questionId === 'goal_clarity');
  if (goalClarity && goalClarity.score >= 4) {
    strengths.push('명확한 목표 의식을 가지고 있어요');
  }
  const helpSeekingStrength = answers.find(a => a.questionId === 'help_seeking');
  if (helpSeekingStrength && helpSeekingStrength.score >= 4) {
    strengths.push('필요할 때 도움을 요청할 줄 알아요');
  }

  // Ensure at least some strengths
  if (strengths.length === 0) {
    strengths.push('변화에 대한 기대감을 가지고 있어요');
    strengths.push('새로운 도전을 받아들일 준비가 되어있어요');
    strengths.push('성장 가능성이 높아요');
  }

  // Generate challenges
  const challenges: string[] = [];
  if (adaptationAreas.academic < 50) {
    challenges.push('학업 관리 전략을 더 개발해야 해요');
  }
  if (adaptationAreas.social < 50) {
    challenges.push('사회적 기술을 더 연습해야 해요');
  }
  if (adaptationAreas.independence < 50) {
    challenges.push('독립적인 생활 스킬을 더 익혀야 해요');
  }
  if (adaptationAreas.mentalHealth < 50) {
    challenges.push('스트레스 관리 방법을 더 개발해야 해요');
  }
  const timeManagementChallenge = answers.find(a => a.questionId === 'time_management');
  if (timeManagementChallenge && timeManagementChallenge.score <= 2) {
    challenges.push('시간 관리 능력을 향상시켜야 해요');
  }
  const financialAwarenessChallenge = answers.find(a => a.questionId === 'financial_awareness');
  if (financialAwarenessChallenge && financialAwarenessChallenge.score <= 2) {
    challenges.push('재정 관리 능력을 기를 필요가 있어요');
  }

  // Ensure at least some challenges
  if (challenges.length === 0) {
    challenges.push('지속적인 자기 관리가 필요해요');
    challenges.push('새로운 환경에 대한 적응 전략이 필요해요');
  }

  // Generate recommendations based on scores and categories
  const recommendations: string[] = [];

  // Academic recommendations
  if (adaptationAreas.academic < 60) {
    recommendations.push('📚 대학 학습법 관련 도서를 미리 읽어보고, 효과적인 노트 필기법과 시험 준비 전략을 익혀두세요');
  }

  // Social recommendations
  if (adaptationAreas.social < 60) {
    recommendations.push('👥 동아리나 스터디 그룹 활동을 통해 자연스럽게 친구를 만들 기회를 만들어보세요');
  }

  // Independence recommendations
  if (adaptationAreas.independence < 60) {
    recommendations.push('🏠 독립생활을 위한 기본 요리, 청소, 세탁 등의 생활 스킬을 미리 연습해두세요');
  }

  // Mental health recommendations
  if (adaptationAreas.mentalHealth < 60 || burnoutRisk !== 'low') {
    recommendations.push('🧘 스트레스 해소를 위한 운동, 명상, 취미활동 등 자신만의 방법을 찾아두세요');
  }

  // Time management
  const timeManagementRec = answers.find(a => a.questionId === 'time_management');
  if (timeManagementRec && timeManagementRec.score <= 3) {
    recommendations.push('⏰ 시간 관리 앱이나 플래너를 활용해 일정 관리 습관을 미리 만들어보세요');
  }

  // Financial management
  const financialAwarenessRec = answers.find(a => a.questionId === 'financial_awareness');
  if (financialAwarenessRec && financialAwarenessRec.score <= 3) {
    recommendations.push('💰 가계부 앱을 사용해 용돈 관리 연습을 시작하고, 예산 계획 세우는 법을 익혀두세요');
  }

  // Help seeking
  const helpSeekingRec = answers.find(a => a.questionId === 'help_seeking');
  if (helpSeekingRec && helpSeekingRec.score <= 2) {
    recommendations.push('🤝 대학 내 상담센터, 멘토링 프로그램 등 도움받을 수 있는 자원들을 미리 알아두세요');
  }

  // General recommendations
  recommendations.push('📖 선배들의 대학생활 경험담을 듣고, 실질적인 조언을 구해보세요');
  recommendations.push('🎯 대학 생활의 우선순위를 정하고, 학업과 생활의 균형을 맞추는 계획을 세워보세요');

  // Limit recommendations to 5
  const topRecommendations = recommendations.slice(0, 5);

  return {
    overallScore,
    category,
    strengths: strengths.slice(0, 4),
    challenges: challenges.slice(0, 4),
    recommendations: topRecommendations,
    burnoutRisk,
    adaptationAreas
  };
}

export async function GET(request: NextRequest) {
  try {
    const redis = await getRedisClient();
    
    // Get user ID from session/auth (simplified for now)
    const userId = request.headers.get('x-user-id') || 'anonymous';
    
    // Try to get existing result
    const existingResult = await redis.hGet(`college-adaptation:${userId}`, 'result');
    
    if (existingResult) {
      await redis.quit();
      return NextResponse.json({ result: JSON.parse(existingResult) });
    }
    
    await redis.quit();
    return NextResponse.json({ result: null });
  } catch (error) {
    console.error('Failed to fetch college adaptation analysis:', error);
    return NextResponse.json({ error: 'Failed to fetch analysis' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { answers, userId } = body;
    
    if (!answers || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Analyze adaptation
    const analysisResult = analyzeAdaptation(answers);
    
    // Save to Redis
    const redis = await getRedisClient();
    
    const result = {
      id: `adaptation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      answers,
      result: analysisResult,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Store the result
    await redis.hSet(`college-adaptation:${userId}`, {
      result: JSON.stringify(result)
    });
    
    await redis.quit();
    
    return NextResponse.json({ 
      result: analysisResult
    });
  } catch (error) {
    console.error('Failed to analyze college adaptation:', error);
    return NextResponse.json(
      { error: 'Failed to analyze adaptation' },
      { status: 500 }
    );
  }
}