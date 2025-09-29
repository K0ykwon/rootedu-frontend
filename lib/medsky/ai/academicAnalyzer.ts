/**
 * Enhanced Academic Analysis Service
 *
 * This service provides comprehensive analysis of academic performance using the full
 * AcademicDevelopmentSchema including 석차등급 (rank grades), 성취도 (achievement levels),
 * and detailed trend analysis for better understanding of student's academic progression.
 */

import OpenAI from 'openai';
import { z } from 'zod';
import { ExtractedData, AcademicDevelopment } from '@/types/medsky';
import { EnhancedAcademicAnalysisSchema, EnhancedAcademicAnalysis } from '@/types/medsky-enhanced';
import { createLLMConfig } from '../llmService';

// Academic analysis system prompt
const ACADEMIC_ANALYSIS_PROMPT = `
당신은 한국의 고등학교 학업 성취도 전문 분석가입니다. 생활기록부의 교과학습발달상황 데이터를 종합적으로 분석하여 학생의 학업 역량과 대학 진학 준비도를 평가해야 합니다.

**분석 항목:**

1. **과목별 상세 분석**:
   - 원점수/과목평균: 절대적/상대적 성취도 분석
   - 성취도 (A,B,C,D,E): 학습 목표 달성 수준
   - 석차등급 (1-9등급): 상대적 위치와 경쟁력
   - 성취 추세: 학기별 향상/하락/유지 패턴

2. **상대적 위치 분석**:
   - 1-2등급: 상위권 (상위 11%)
   - 3-4등급: 중상위권 (상위 12-34%)
   - 5-6등급: 중위권 (상위 35-66%)
   - 7-8등급: 중하위권 (상위 67-89%)
   - 9등급: 하위권 (하위 11%)

3. **대학 진학 준비도**:
   - 주요 과목 경쟁력 (국어, 수학, 영어, 탐구)
   - 목표 대학/전공 적합성
   - 수능/학종 대비 현황

**평가 기준:**
- 절대 점수보다 상대적 위치와 개선 추세 중시
- 과목 간 균형과 전공 적합성 고려
- 지속적 성장 가능성과 학습 역량 평가

각 과목의 데이터를 종합하여 정확하고 실용적인 분석을 제공해주세요.`;

/**
 * Analyze performance trend for a subject across semesters
 */
function analyzePerformanceTrend(
  subjectGrades: AcademicDevelopment[]
): '상승' | '하락' | '유지' | '불안정' {
  if (subjectGrades.length <= 1) return '유지';

  // Convert rank grades to numbers for trend analysis
  const rankNumbers = subjectGrades
    .map(grade => {
      const rank = grade.석차등급;
      if (!rank || rank === '-') return null;
      const num = parseInt(rank.replace(/[^\d]/g, ''));
      return isNaN(num) ? null : num;
    })
    .filter(num => num !== null) as number[];

  if (rankNumbers.length <= 1) return '유지';

  const firstHalf = rankNumbers.slice(0, Math.ceil(rankNumbers.length / 2));
  const secondHalf = rankNumbers.slice(Math.floor(rankNumbers.length / 2));

  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  const difference = firstAvg - secondAvg; // Lower rank number = better performance

  if (difference > 0.5) return '상승'; // Improving (rank getting better)
  if (difference < -0.5) return '하락'; // Declining (rank getting worse)

  // Check for instability (high variance)
  const variance = rankNumbers.reduce((sum, rank) => {
    const avg = rankNumbers.reduce((a, b) => a + b, 0) / rankNumbers.length;
    return sum + Math.pow(rank - avg, 2);
  }, 0) / rankNumbers.length;

  return variance > 4 ? '불안정' : '유지';
}

/**
 * Determine relative position based on rank grade
 */
function getRelativePosition(rankGrade: string): '상위권' | '중상위권' | '중위권' | '중하위권' | '하위권' {
  const rank = parseInt(rankGrade.replace(/[^\d]/g, ''));
  if (isNaN(rank)) return '중위권';

  if (rank <= 2) return '상위권';
  if (rank <= 4) return '중상위권';
  if (rank <= 6) return '중위권';
  if (rank <= 8) return '중하위권';
  return '하위권';
}

/**
 * Calculate college readiness score based on academic data
 */
function calculateCollegeReadiness(subject: AcademicDevelopment[]): number {
  if (subject.length === 0) return 0;

  const latestGrade = subject[subject.length - 1];
  const rankScore = (() => {
    const rank = parseInt(latestGrade.석차등급?.replace(/[^\d]/g, '') || '9');
    return Math.max(0, (10 - rank) * 10); // 1등급=90점, 9등급=10점
  })();

  const achievementScore = (() => {
    const achievement = latestGrade.성취도;
    const scoreMap: Record<string, number> = { 'A': 20, 'B': 15, 'C': 10, 'D': 5, 'E': 0 };
    return scoreMap[achievement] || 10;
  })();

  const trendBonus = (() => {
    const trend = analyzePerformanceTrend(subject);
    return trend === '상승' ? 10 : trend === '하락' ? -10 : 0;
  })();

  return Math.min(100, Math.max(0, rankScore + achievementScore + trendBonus));
}

/**
 * Analyze individual subject performance
 */
async function analyzeSubjectPerformance(
  subject: string,
  grades: AcademicDevelopment[],
  client: OpenAI
): Promise<z.infer<typeof import('@/types/medsky-enhanced').EnhancedAcademicAnalysisSchema>['subject_analysis'][0] | null> {
  if (grades.length === 0) return null;

  const latestGrade = grades[grades.length - 1];
  const trend = analyzePerformanceTrend(grades);
  const relativePosition = getRelativePosition(latestGrade.석차등급 || '5');
  const collegeReadiness = calculateCollegeReadiness(grades);

  const analysisPrompt = `
**과목**: ${subject}
**학기별 성적 데이터**:
${grades.map(g => `
- 학기: ${g.학기 || '미상'}
- 원점수/과목평균: ${g.score_over_average}
- 성취도: ${g.성취도}
- 석차등급: ${g.석차등급}
`).join('')}

**현재 분석 결과**:
- 성취 추세: ${trend}
- 상대적 위치: ${relativePosition}
- 대학 준비도: ${collegeReadiness}점

위 ${subject} 과목의 성적 데이터를 분석하여 다음 형태의 JSON으로 응답해주세요:

{
  "subject": "${subject}",
  "semester": "${latestGrade.학기 || '최근'}",
  "performance_trend": "${trend}",
  "grade_analysis": {
    "raw_score": "원점수/과목평균 분석 내용",
    "achievement_level": "성취도 분석 내용",
    "rank_grade": "석차등급 분석 내용",
    "relative_position": "${relativePosition}"
  },
  "strengths": ["강점1", "강점2"],
  "improvements_needed": ["개선점1", "개선점2"],
  "college_readiness": ${collegeReadiness}
}`;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: ACADEMIC_ANALYSIS_PROMPT
        },
        {
          role: 'user',
          content: analysisPrompt
        }
      ],
      temperature: 0.2,
      max_tokens: 1500
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);
    return {
      subject: parsed.subject || subject,
      semester: parsed.semester || latestGrade.학기,
      performance_trend: parsed.performance_trend || trend,
      grade_analysis: {
        raw_score: parsed.grade_analysis?.raw_score || `${latestGrade.score_over_average} 분석`,
        achievement_level: parsed.grade_analysis?.achievement_level || `${latestGrade.성취도}등급 달성`,
        rank_grade: parsed.grade_analysis?.rank_grade || `${latestGrade.석차등급} 위치`,
        relative_position: parsed.grade_analysis?.relative_position || relativePosition
      },
      strengths: parsed.strengths || [],
      improvements_needed: parsed.improvements_needed || [],
      college_readiness: parsed.college_readiness || collegeReadiness
    };
  } catch (error) {
    console.error(`Error analyzing subject ${subject}:`, error);
    return null;
  }
}

/**
 * Generate overall academic trends analysis
 */
async function generateOverallTrends(
  subjectAnalyses: any[],
  client: OpenAI
): Promise<{
  gpa_trend: '상승' | '하락' | '유지';
  strong_subjects: string[];
  weak_subjects: string[];
  grade_consistency: number;
  improvement_rate: number;
}> {
  // Calculate overall trends
  const trends = subjectAnalyses.map(s => s.performance_trend);
  const risingCount = trends.filter(t => t === '상승').length;
  const fallingCount = trends.filter(t => t === '하락').length;

  const gpaTrend = risingCount > fallingCount ? '상승' : fallingCount > risingCount ? '하락' : '유지';

  // Identify strong and weak subjects
  const readinessScores = subjectAnalyses.map(s => ({ subject: s.subject, score: s.college_readiness }));
  readinessScores.sort((a, b) => b.score - a.score);

  const strongSubjects = readinessScores.slice(0, Math.min(3, Math.ceil(readinessScores.length / 2)))
    .map(s => s.subject);
  const weakSubjects = readinessScores.slice(-Math.min(3, Math.floor(readinessScores.length / 2)))
    .map(s => s.subject);

  // Calculate consistency (inverse of variance in readiness scores)
  const scores = readinessScores.map(s => s.score);
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) / scores.length;
  const gradeConsistency = Math.max(0, Math.min(100, 100 - variance));

  // Calculate improvement rate
  const improvementRate = risingCount / trends.length * 100;

  return {
    gpa_trend: gpaTrend,
    strong_subjects: strongSubjects,
    weak_subjects: weakSubjects,
    grade_consistency: Math.round(gradeConsistency),
    improvement_rate: Math.round(improvementRate)
  };
}

/**
 * Generate college entrance readiness analysis
 */
async function generateCollegeReadiness(
  subjectAnalyses: any[],
  client: OpenAI
): Promise<{
  overall_readiness: number;
  subject_readiness: Record<string, number>;
  competitive_position: string;
  recommendations: string[];
}> {
  const subjectReadiness = subjectAnalyses.reduce((acc, analysis) => {
    acc[analysis.subject] = analysis.college_readiness;
    return acc;
  }, {} as Record<string, number>);

  const readinessValues = Object.values(subjectReadiness) as number[];
  const overallReadiness = Math.round(
    readinessValues.reduce((a, b) => a + b, 0) / readinessValues.length
  );

  const competitivePosition = (() => {
    if (overallReadiness >= 85) return '상위권 대학 진학 가능';
    if (overallReadiness >= 70) return '중상위권 대학 적합';
    if (overallReadiness >= 55) return '중위권 대학 목표';
    if (overallReadiness >= 40) return '하위권 대학 고려';
    return '기초 학력 보강 필요';
  })();

  // Generate specific recommendations
  const recommendationsPrompt = `
다음은 학생의 과목별 대학 준비도 점수입니다:

${JSON.stringify(subjectReadiness, null, 2)}

**전체 준비도**: ${overallReadiness}점
**경쟁력 위치**: ${competitivePosition}

위 데이터를 바탕으로 학생의 성적 향상을 위한 구체적인 제안사항을 3-5개 제시해주세요.
JSON 형태의 "recommendations" 배열로 응답해주세요.`;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: ACADEMIC_ANALYSIS_PROMPT
        },
        {
          role: 'user',
          content: recommendationsPrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });

    const content = response.choices[0]?.message?.content;
    const parsed = content ? JSON.parse(content) : {};

    return {
      overall_readiness: overallReadiness,
      subject_readiness: subjectReadiness,
      competitive_position: competitivePosition,
      recommendations: parsed.recommendations || [
        '주요 과목 집중 학습을 통한 등급 향상',
        '약점 과목 보완을 위한 추가 학습',
        '지속적인 성적 관리와 목표 설정'
      ]
    };
  } catch (error) {
    console.error('Error generating college readiness analysis:', error);
    return {
      overall_readiness: overallReadiness,
      subject_readiness: subjectReadiness,
      competitive_position: competitivePosition,
      recommendations: ['성적 향상을 위한 체계적인 학습 계획 수립이 필요합니다.']
    };
  }
}

/**
 * Main function to perform enhanced academic analysis
 */
export async function performEnhancedAcademicAnalysis(
  extractedData: ExtractedData
): Promise<EnhancedAcademicAnalysis> {
  console.log('📚 Starting enhanced academic analysis...');

  if (!extractedData.academicDevelopments?.교과학습발달상황) {
    console.warn('No academic development data found');
    return {
      subject_analysis: [],
      overall_academic_trends: {
        gpa_trend: '유지',
        strong_subjects: [],
        weak_subjects: [],
        grade_consistency: 0,
        improvement_rate: 0
      },
      college_entrance_readiness: {
        overall_readiness: 0,
        subject_readiness: {},
        competitive_position: '데이터 부족',
        recommendations: ['학업 성취 데이터가 충분하지 않습니다.']
      }
    };
  }

  try {
    const llmConfig = createLLMConfig();
    const client = new OpenAI({
      apiKey: llmConfig.apiKey || process.env.OPENAI_API_KEY
    });

    // Group academic data by subject
    const subjectGroups = extractedData.academicDevelopments.교과학습발달상황.reduce((groups, grade) => {
      const subject = grade.과목;
      if (!groups[subject]) groups[subject] = [];
      groups[subject].push(grade);
      return groups;
    }, {} as Record<string, AcademicDevelopment[]>);

    // Analyze each subject
    const subjectAnalyses = await Promise.all(
      Object.entries(subjectGroups).map(([subject, grades]) =>
        analyzeSubjectPerformance(subject, grades, client)
      )
    );

    const validAnalyses = subjectAnalyses.filter(analysis => analysis !== null);

    // Generate overall trends
    const overallTrends = await generateOverallTrends(validAnalyses, client);

    // Generate college readiness analysis
    const collegeReadiness = await generateCollegeReadiness(validAnalyses, client);

    const result: EnhancedAcademicAnalysis = {
      subject_analysis: validAnalyses,
      overall_academic_trends: overallTrends,
      college_entrance_readiness: collegeReadiness
    };

    console.log('✅ Enhanced academic analysis completed:', {
      subjectsAnalyzed: validAnalyses.length,
      overallReadiness: collegeReadiness.overall_readiness,
      gpaTrend: overallTrends.gpa_trend,
      strongSubjects: overallTrends.strong_subjects.length,
      weakSubjects: overallTrends.weak_subjects.length
    });

    return result;
  } catch (error) {
    console.error('❌ Enhanced academic analysis failed:', error);

    // Return fallback result
    return {
      subject_analysis: [],
      overall_academic_trends: {
        gpa_trend: '유지',
        strong_subjects: [],
        weak_subjects: [],
        grade_consistency: 0,
        improvement_rate: 0
      },
      college_entrance_readiness: {
        overall_readiness: 0,
        subject_readiness: {},
        competitive_position: 'AI 분석 오류',
        recommendations: ['AI 분석 중 오류가 발생했습니다. 수동 검토가 필요합니다.']
      }
    };
  }
}

/**
 * Helper function to get academic analysis status for debugging
 */
export function getAcademicAnalysisStatus(result: EnhancedAcademicAnalysis): {
  isComplete: boolean;
  subjectsAnalyzed: number;
  hasOverallTrends: boolean;
  hasCollegeReadiness: boolean;
  overallReadiness: number;
} {
  return {
    isComplete: result.subject_analysis.length > 0,
    subjectsAnalyzed: result.subject_analysis.length,
    hasOverallTrends: result.overall_academic_trends.strong_subjects.length > 0,
    hasCollegeReadiness: result.college_entrance_readiness.overall_readiness > 0,
    overallReadiness: result.college_entrance_readiness.overall_readiness
  };
}