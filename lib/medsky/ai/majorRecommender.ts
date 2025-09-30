/**
 * AI Major Recommendation Service
 *
 * This service provides intelligent major recommendations based on comprehensive analysis
 * of student's academic performance, interests, activities, and strengths derived from
 * their 생활기록부, replacing simple catalog matching with AI-driven personalized suggestions.
 */

import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import { ExtractedData } from '@/types/medsky';
import {
  AIMajorRecommendationsSchema,
  AIMajorRecommendations,
  AIKeywordExtraction,
  AIScoreAnalysis,
  EnhancedAcademicAnalysis
} from '@/types/medsky-enhanced';
import { createLLMConfig } from '../llmService';

// Major recommendation system prompt
const MAJOR_RECOMMENDATION_PROMPT = `
당신은 한국의 대학 진학 전문 상담사로 15년 경력을 가진 전문가입니다. 학생의 생활기록부 종합 분석 결과를 바탕으로 최적의 전공을 추천해야 합니다.

**추천 원칙:**

1. **적성과 흥미 중심**: 학생의 실제 관심사와 재능이 드러나는 영역 우선
2. **성취도 기반**: 현재 학업 성취도와 발전 가능성 고려
3. **진로 전망**: 해당 전공의 취업률, 전망, 사회적 수요 반영
4. **개인별 맞춤**: 학생만의 독특한 강점과 특성 활용
5. **실현 가능성**: 현재 성적 수준에서 진학 가능한 현실적 목표

**전공 분야 및 특성:**

- **인문계열**: 어학, 문학, 철학, 역사, 종교학 등
- **사회계열**: 경영, 경제, 행정, 법학, 정치외교, 사회학, 심리학 등
- **교육계열**: 교육학, 유아교육, 특수교육 등
- **공학계열**: 기계, 전자, 컴퓨터, 화학, 건축, 산업공학 등
- **자연계열**: 수학, 물리, 화학, 생물, 지구과학, 통계학 등
- **의약계열**: 의학, 치의학, 수의학, 약학, 간호학 등
- **예체능계열**: 미술, 음악, 체육, 디자인, 영상 등
- **융복합계열**: 바이오, 환경, 에너지, AI, 데이터사이언스 등

**평가 요소:**
- 학업 성취도와 과목별 강점
- 창의적 체험활동 패턴과 지속성
- 독서 활동과 지적 호기심 영역
- 리더십과 협력 역량
- 문제해결 능력과 창의성
- 진로 탐색 노력과 일관성

각 전공에 대해 구체적인 근거와 함께 매칭 점수를 제시하고, 진학 전략과 준비 방향을 상세히 안내해주세요.`;

/**
 * Analyze student profile from comprehensive data
 */
function createStudentProfile(
  extractedData: ExtractedData,
  keywordAnalysis?: AIKeywordExtraction,
  scoreAnalysis?: AIScoreAnalysis,
  academicAnalysis?: EnhancedAcademicAnalysis
): string {
  let profile = '**학생 프로필 종합 분석**\n\n';

  // Academic performance
  if (academicAnalysis) {
    profile += '**학업 성취 현황:**\n';
    profile += `- 전체 준비도: ${academicAnalysis.college_entrance_readiness.overall_readiness}점\n`;
    profile += `- 강점 과목: ${academicAnalysis.overall_academic_trends.strong_subjects.join(', ')}\n`;
    profile += `- 보완 과목: ${academicAnalysis.overall_academic_trends.weak_subjects.join(', ')}\n`;
    profile += `- 성적 추세: ${academicAnalysis.overall_academic_trends.gpa_trend}\n\n`;
  }

  // Subject details
  if (extractedData.academicDevelopments?.교과학습발달상황) {
    profile += '**과목별 성취도:**\n';
    const subjects = extractedData.academicDevelopments.교과학습발달상황;
    const subjectSummary = subjects.reduce((acc, subject) => {
      const key = subject.과목;
      if (!acc[key]) acc[key] = [];
      acc[key].push(`${subject.성취도}등급(석차${subject.석차등급})`);
      return acc;
    }, {} as Record<string, string[]>);

    Object.entries(subjectSummary).forEach(([subject, grades]) => {
      profile += `- ${subject}: ${grades.join(', ')}\n`;
    });
    profile += '\n';
  }

  // Activities and interests
  if (extractedData.creativeActivities?.창의적체험활동상황) {
    profile += '**창의적 체험활동:**\n';
    extractedData.creativeActivities.창의적체험활동상황.forEach(activity => {
      profile += `- ${activity.영역}: ${activity.특기사항.substring(0, 100)}...\n`;
    });
    profile += '\n';
  }

  // Detailed abilities
  if (extractedData.detailedAbilities?.세부특기사항) {
    profile += '**세부 특기사항:**\n';
    extractedData.detailedAbilities.세부특기사항.slice(0, 3).forEach(ability => {
      profile += `- ${ability.과목}: ${ability.특기사항.substring(0, 100)}...\n`;
    });
    profile += '\n';
  }

  // Keyword-based strengths
  if (keywordAnalysis) {
    profile += '**AI 분석 주요 강점:**\n';
    keywordAnalysis.student_strengths.forEach(strength => {
      profile += `- ${strength}\n`;
    });
    profile += '\n';

    profile += '**개선 영역:**\n';
    keywordAnalysis.improvement_areas.forEach(area => {
      profile += `- ${area}\n`;
    });
    profile += '\n';
  }

  // Overall scoring
  if (scoreAnalysis) {
    profile += '**종합 평가:**\n';
    profile += `- 전체 점수: ${scoreAnalysis.overall_score}점 (${scoreAnalysis.grade_equivalent}등급)\n`;
    profile += `- 예상 위치: 상위 ${100 - scoreAnalysis.percentile_rank}%\n`;
    profile += `- 역량 균형: 학업${scoreAnalysis.competency_balance.academic}, 진로${scoreAnalysis.competency_balance.career}, 공동체${scoreAnalysis.competency_balance.community}, 창의${scoreAnalysis.competency_balance.creativity}, 인성${scoreAnalysis.competency_balance.character}\n\n`;
  }

  return profile;
}

/**
 * Generate AI-powered major recommendations
 */
async function generateMajorRecommendations(
  studentProfile: string,
  client: OpenAI
): Promise<{
  top_recommendations: any[];
  alternative_options: any[];
  interdisciplinary_suggestions: string[];
  analysis_summary: string;
}> {
  const recommendationPrompt = `
${studentProfile}

위 학생의 종합 프로필을 분석하여 다음을 추천해주세요:

1. **상위 3개 추천 전공**: 가장 적합한 전공 3개 (매칭 점수 포함)
2. **추가 고려 전공**: 2-3개의 대안 전공
3. **융복합 전공 제안**: 새로운 트렌드나 융복합 분야
4. **종합 분석 의견**: 추천 근거와 전체적 평가

각 전공 추천에는 다음 정보를 포함해주세요:
- 전공명과 대표 대학들
- 매칭 점수 (0-100)
- 추천 이유 (구체적 근거)
- 필요 과목과 현재 준비 수준
- 진로 전망과 취업 분야
- 관련 추천 활동

JSON 형태로 응답해주세요:
{
  "top_recommendations": [
    {
      "major_name": "전공명",
      "university_examples": ["대학1", "대학2", "대학3"],
      "match_score": 85,
      "match_reasons": ["이유1", "이유2", "이유3"],
      "required_subjects": ["과목1", "과목2"],
      "current_preparation_level": 75,
      "career_prospects": ["진로1", "진로2"],
      "related_activities": ["활동1", "활동2"]
    }
  ],
  "alternative_options": [...],
  "interdisciplinary_suggestions": ["융복합전공1", "융복합전공2"],
  "analysis_summary": "종합 분석 의견"
}`;

  try {
    const response = await client.chat.completions.parse({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: MAJOR_RECOMMENDATION_PROMPT
        },
        {
          role: 'user',
          content: recommendationPrompt
        }
      ],
      response_format: zodResponseFormat(AIMajorRecommendationsSchema, 'major_recommendations'),
      temperature: 0.3,
      max_tokens: 4000
    });

    const parsed = response.choices[0]?.message?.parsed;
    if (!parsed) {
      throw new Error('No parsed response from AI');
    }
    return {
      top_recommendations: parsed.top_recommendations || [],
      alternative_options: parsed.alternative_options || [],
      interdisciplinary_suggestions: parsed.interdisciplinary_suggestions || [],
      analysis_summary: parsed.analysis_summary || '분석을 완료했습니다.'
    };
  } catch (error) {
    console.error('Error generating major recommendations:', error);

    // Return fallback recommendations
    return {
      top_recommendations: [
        {
          major_name: '일반학과',
          university_examples: ['국립대학교', '사립대학교'],
          match_score: 50,
          match_reasons: ['AI 분석 중 오류가 발생했습니다'],
          required_subjects: ['국어', '수학', '영어'],
          current_preparation_level: 50,
          career_prospects: ['다양한 진로'],
          related_activities: ['추가 상담 필요']
        }
      ],
      alternative_options: [],
      interdisciplinary_suggestions: ['추가 진로 상담을 받아보시기 바랍니다'],
      analysis_summary: 'AI 분석 중 오류가 발생했습니다. 수동 상담을 권장합니다.'
    };
  }
}

/**
 * Enhance recommendations with Korean university data
 */
function enhanceWithUniversityData(recommendations: any[]): any[] {
  // University ranking and characteristics for Korean context
  const universityData: Record<string, string[]> = {
    '컴퓨터공학': ['KAIST', '서울대학교', '포항공과대학교', '연세대학교', '고려대학교'],
    '경영학': ['서울대학교', '연세대학교', '고려대학교', '성균관대학교', '한양대학교'],
    '의학': ['서울대학교', '연세대학교', '울산대학교', '성균관대학교', '가톨릭대학교'],
    '법학': ['서울대학교', '연세대학교', '고려대학교', '성균관대학교', '한양대학교'],
    '기계공학': ['KAIST', '서울대학교', '포항공과대학교', '한양대학교', '부산대학교'],
    '경제학': ['서울대학교', '연세대학교', '고려대학교', '서강대학교', '한양대학교'],
    '심리학': ['연세대학교', '고려대학교', '서울대학교', '이화여자대학교', '중앙대학교'],
    '교육학': ['서울대학교', '연세대학교', '이화여자대학교', '고려대학교', '한국교원대학교'],
    '화학': ['KAIST', '서울대학교', '포항공과대학교', '연세대학교', '한양대학교'],
    '생명과학': ['서울대학교', 'KAIST', '연세대학교', '고려대학교', '포항공과대학교']
  };

  return recommendations.map(rec => {
    // Try to match major name with university data
    const matchingKey = Object.keys(universityData).find(key =>
      rec.major_name.includes(key) || key.includes(rec.major_name.replace(/학과|전공/g, ''))
    );

    if (matchingKey) {
      rec.university_examples = universityData[matchingKey];
    }

    // Ensure match score is reasonable
    rec.match_score = Math.min(100, Math.max(10, rec.match_score));
    rec.current_preparation_level = Math.min(100, Math.max(0, rec.current_preparation_level));

    return rec;
  });
}

/**
 * Main function to generate AI-powered major recommendations
 */
export async function generateAIMajorRecommendations(
  extractedData: ExtractedData,
  keywordAnalysis?: AIKeywordExtraction,
  scoreAnalysis?: AIScoreAnalysis,
  academicAnalysis?: EnhancedAcademicAnalysis
): Promise<AIMajorRecommendations> {
  console.log('🎯 Starting AI major recommendation generation...');

  try {
    const llmConfig = createLLMConfig();
    const client = new OpenAI({
      apiKey: llmConfig.apiKey || process.env.OPENAI_API_KEY
    });

    // Create comprehensive student profile
    const studentProfile = createStudentProfile(
      extractedData,
      keywordAnalysis,
      scoreAnalysis,
      academicAnalysis
    );

    console.log('📋 Generated student profile length:', studentProfile.length);

    // Generate AI recommendations
    const recommendations = await generateMajorRecommendations(studentProfile, client);

    // Enhance with Korean university data
    const enhancedTopRecommendations = enhanceWithUniversityData(recommendations.top_recommendations);
    const enhancedAlternatives = enhanceWithUniversityData(recommendations.alternative_options);

    const result: AIMajorRecommendations = {
      top_recommendations: enhancedTopRecommendations,
      alternative_options: enhancedAlternatives,
      interdisciplinary_suggestions: recommendations.interdisciplinary_suggestions,
      analysis_summary: recommendations.analysis_summary
    };

    console.log('✅ AI major recommendations completed:', {
      topRecommendations: enhancedTopRecommendations.length,
      alternativeOptions: enhancedAlternatives.length,
      interdisciplinaryOptions: recommendations.interdisciplinary_suggestions.length,
      averageMatchScore: enhancedTopRecommendations.reduce((sum, rec) => sum + rec.match_score, 0) / enhancedTopRecommendations.length
    });

    return result;
  } catch (error) {
    console.error('❌ AI major recommendation generation failed:', error);

    // Return fallback recommendations
    return {
      top_recommendations: [
        {
          major_name: '상담 필요',
          university_examples: ['전문 상담 권장'],
          match_score: 0,
          match_reasons: ['AI 분석 중 오류가 발생했습니다'],
          required_subjects: ['추가 분석 필요'],
          current_preparation_level: 0,
          career_prospects: ['진로 상담 필요'],
          related_activities: ['전문 상담사와 면담']
        }
      ],
      alternative_options: [],
      interdisciplinary_suggestions: ['진로 전문가와 상담을 받으시기 바랍니다'],
      analysis_summary: 'AI 분석 중 오류가 발생했습니다. 전문 진로 상담을 권장합니다.'
    };
  }
}

/**
 * Helper function to get recommendation status for debugging
 */
export function getMajorRecommendationStatus(result: AIMajorRecommendations): {
  isComplete: boolean;
  hasTopRecommendations: boolean;
  hasAlternatives: boolean;
  hasInterdisciplinary: boolean;
  averageMatchScore: number;
} {
  const avgScore = result.top_recommendations.length > 0
    ? result.top_recommendations.reduce((sum, rec) => sum + rec.match_score, 0) / result.top_recommendations.length
    : 0;

  return {
    isComplete: result.top_recommendations.length > 0,
    hasTopRecommendations: result.top_recommendations.length >= 3,
    hasAlternatives: result.alternative_options.length > 0,
    hasInterdisciplinary: result.interdisciplinary_suggestions.length > 0,
    averageMatchScore: Math.round(avgScore)
  };
}