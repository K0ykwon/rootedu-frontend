/**
 * Next-Semester Study Planning Service
 *
 * This service generates comprehensive study plans and improvement strategies for the next semester
 * based on current academic performance, identified weaknesses, and career goals. It provides
 * specific recommendations for academic improvement and 생활기록부 enhancement.
 */

import OpenAI from 'openai';
import { z } from 'zod';
import { ExtractedData } from '@/types/medsky';
import {
  NextSemesterPlanSchema,
  NextSemesterPlan,
  AIKeywordExtraction,
  AIScoreAnalysis,
  EnhancedAcademicAnalysis,
  AIMajorRecommendations
} from '@/types/medsky-enhanced';
import { createLLMConfig } from '../llmService';

// Study planning system prompt
const STUDY_PLANNING_PROMPT = `
당신은 한국의 고등학교 진학 전문 컨설턴트로 10년 경력을 가진 전문가입니다. 학생의 현재 생활기록부 분석 결과를 바탕으로 다음 학기 구체적이고 실행 가능한 학습 계획을 수립해야 합니다.

**계획 수립 원칙:**

1. **현실적 목표**: 현재 수준에서 달성 가능한 구체적 목표 설정
2. **우선순위 기반**: 가장 시급하고 중요한 영역부터 개선
3. **균형적 발전**: 학업과 비교과 활동의 조화로운 성장
4. **기록 전략**: 생활기록부 기재를 고려한 활동 계획
5. **지속 가능성**: 학생이 꾸준히 실행할 수 있는 현실적 계획

**계획 영역:**

**1. 학업 개선 계획**:
- 우선 개선 과목별 구체적 전략
- 목표 등급과 달성 방법
- 학습 시간 배분과 스케줄
- 부족한 개념 보완 방법

**2. 비교과 활동 계획**:
- 전공 연관 활동 추천
- 역량 개발 활동
- 생활기록부 기재 포인트
- 지속성과 발전 과정 설계

**3. 학기별 타임라인**:
- 월별 세부 계획
- 중간/기말고사 대비
- 방학 활용 계획
- 주요 활동 스케줄

**4. 생활기록부 작성 전략**:
- 매월 기록할 내용
- 효과적인 표현 방법
- 근거 자료 수집법
- 교사와의 소통 방법

모든 제안은 구체적이고 실행 가능하며, 한국 고등학교 교육과정과 대학 입시 현실을 반영해야 합니다.`;

/**
 * Analyze current gaps and improvement priorities
 */
function analyzeImprovementPriorities(
  academicAnalysis?: EnhancedAcademicAnalysis,
  scoreAnalysis?: AIScoreAnalysis,
  keywordAnalysis?: AIKeywordExtraction
): {
  weakSubjects: string[];
  improvementAreas: string[];
  strengthsToLeverage: string[];
  priorityLevel: 'urgent' | 'moderate' | 'gradual';
} {
  const weakSubjects = academicAnalysis?.overall_academic_trends.weak_subjects || [];
  const improvementAreas = keywordAnalysis?.improvement_areas || [];
  const strengthsToLeverage = keywordAnalysis?.student_strengths || [];

  // Determine priority level based on overall performance
  let priorityLevel: 'urgent' | 'moderate' | 'gradual' = 'moderate';
  if (academicAnalysis?.college_entrance_readiness.overall_readiness) {
    const readiness = academicAnalysis.college_entrance_readiness.overall_readiness;
    if (readiness < 50) priorityLevel = 'urgent';
    else if (readiness > 75) priorityLevel = 'gradual';
  }

  return {
    weakSubjects,
    improvementAreas,
    strengthsToLeverage,
    priorityLevel
  };
}

/**
 * Generate academic improvement plan
 */
async function generateAcademicPlan(
  priorities: any,
  academicAnalysis: EnhancedAcademicAnalysis | undefined,
  client: OpenAI
): Promise<z.infer<typeof import('@/types/medsky-enhanced').StudyPlanRecommendationSchema>> {
  const academicPrompt = `
**현재 학업 상황 분석:**
- 약점 과목: ${priorities.weakSubjects.join(', ')}
- 개선 우선순위: ${priorities.priorityLevel}
- 전체 준비도: ${academicAnalysis?.college_entrance_readiness.overall_readiness || 0}점

**과목별 세부 현황:**
${academicAnalysis?.subject_analysis.map(subject => `
- ${subject.subject}: 준비도 ${subject.college_readiness}점, 추세 ${subject.performance_trend}
  강점: ${subject.strengths.join(', ')}
  개선점: ${subject.improvements_needed.join(', ')}
`).join('') || '데이터 없음'}

위 분석을 바탕으로 다음 학기 학업 개선 계획을 수립해주세요:

1. **우선 개선 과목 3-5개** (현재 수준, 목표, 구체적 전략, 시간 배분)
2. **비교과 활동 추천** (전공 연관성, 구체적 활동, 기록 포인트)
3. **학기 목표** (달성 가능한 구체적 목표)
4. **월별 타임라인** (단계별 실행 계획)
5. **준비 체크리스트** (실행 전 준비사항)
6. **성공 측정 지표** (목표 달성 확인 방법)

JSON 형태로 응답해주세요:
{
  "priority_subjects": [
    {
      "subject": "과목명",
      "current_level": "현재 수준 평가",
      "target_improvement": "목표 개선 수준",
      "specific_strategies": ["전략1", "전략2"],
      "time_allocation": "권장 학습 시간"
    }
  ],
  "extracurricular_recommendations": [
    {
      "activity_type": "활동 유형",
      "specific_activities": ["활동1", "활동2"],
      "purpose": "목적과 기대 효과",
      "documentation_tips": ["기록 팁1", "기록 팁2"]
    }
  ],
  "semester_goals": ["목표1", "목표2"],
  "timeline": [
    {
      "period": "시기",
      "tasks": ["과제1", "과제2"]
    }
  ],
  "preparation_checklist": ["준비사항1", "준비사항2"],
  "success_metrics": ["지표1", "지표2"]
}`;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: STUDY_PLANNING_PROMPT
        },
        {
          role: 'user',
          content: academicPrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 3000
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in AI response');
    }

    const parsed = JSON.parse(content);
    return {
      priority_subjects: parsed.priority_subjects || [],
      extracurricular_recommendations: parsed.extracurricular_recommendations || [],
      semester_goals: parsed.semester_goals || [],
      timeline: parsed.timeline || [],
      preparation_checklist: parsed.preparation_checklist || [],
      success_metrics: parsed.success_metrics || []
    };
  } catch (error) {
    console.error('Error generating academic plan:', error);

    // Return fallback plan
    return {
      priority_subjects: [
        {
          subject: '주요 과목',
          current_level: '분석 필요',
          target_improvement: '한 등급 향상',
          specific_strategies: ['개인별 상담을 통한 맞춤 계획 수립'],
          time_allocation: '주 5시간'
        }
      ],
      extracurricular_recommendations: [
        {
          activity_type: '전공 관련 활동',
          specific_activities: ['진로 탐색 활동'],
          purpose: '전공 적합성 향상',
          documentation_tips: ['구체적 경험과 성과 기록']
        }
      ],
      semester_goals: ['학업 성취도 향상', '진로 역량 개발'],
      timeline: [
        {
          period: '학기 초',
          tasks: ['학습 계획 수립', '목표 설정']
        }
      ],
      preparation_checklist: ['개인별 상담 예약'],
      success_metrics: ['성적 향상도', '활동 참여도']
    };
  }
}

/**
 * Generate character development plan
 */
async function generateCharacterDevelopmentPlan(
  priorities: any,
  scoreAnalysis: AIScoreAnalysis | undefined,
  client: OpenAI
): Promise<{
  target_competencies: string[];
  development_activities: string[];
  reflection_questions: string[];
}> {
  const characterPrompt = `
**현재 역량 분석:**
${scoreAnalysis ? `
- 학업역량: ${scoreAnalysis.competency_balance.academic}점
- 진로역량: ${scoreAnalysis.competency_balance.career}점
- 공동체역량: ${scoreAnalysis.competency_balance.community}점
- 창의역량: ${scoreAnalysis.competency_balance.creativity}점
- 인성역량: ${scoreAnalysis.competency_balance.character}점
` : '역량 분석 데이터 없음'}

**개선이 필요한 영역:**
${priorities.improvementAreas.join(', ')}

다음 학기 인성 및 역량 개발 계획을 수립해주세요:

1. **개발할 역량** (가장 필요한 3-4개 역량)
2. **개발 활동** (구체적이고 실행 가능한 활동들)
3. **성찰 질문** (자기 성찰을 위한 가이드)

JSON 형태로 응답:
{
  "target_competencies": ["역량1", "역량2"],
  "development_activities": ["활동1", "활동2"],
  "reflection_questions": ["질문1", "질문2"]
}`;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: STUDY_PLANNING_PROMPT
        },
        {
          role: 'user',
          content: characterPrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1500
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in AI response');
    }

    const parsed = JSON.parse(content);
    return {
      target_competencies: parsed.target_competencies || [],
      development_activities: parsed.development_activities || [],
      reflection_questions: parsed.reflection_questions || []
    };
  } catch (error) {
    console.error('Error generating character development plan:', error);
    return {
      target_competencies: ['리더십', '협력역량', '소통능력'],
      development_activities: ['팀 프로젝트 참여', '봉사활동', '동아리 활동'],
      reflection_questions: ['내가 가장 성장한 부분은?', '앞으로 개발하고 싶은 역량은?']
    };
  }
}

/**
 * Generate documentation strategy
 */
async function generateDocumentationStrategy(
  majorRecommendations: AIMajorRecommendations | undefined,
  client: OpenAI
): Promise<{
  monthly_goals: string[];
  writing_tips: string[];
  evidence_collection: string[];
}> {
  const documentationPrompt = `
**목표 전공 분야:**
${majorRecommendations?.top_recommendations.map(rec =>
  `${rec.major_name} (매칭 점수: ${rec.match_score})`
).join(', ') || '미정'}

**추천 활동:**
${majorRecommendations?.top_recommendations.flatMap(rec => rec.related_activities).join(', ') || '없음'}

다음 학기 생활기록부 작성을 위한 전략을 수립해주세요:

1. **월별 기록 목표** (매월 기록할 내용)
2. **효과적인 작성 팁** (표현 방법, 구조)
3. **근거 자료 수집** (증빙 자료 준비법)

JSON 형태로 응답:
{
  "monthly_goals": ["월별목표1", "월별목표2"],
  "writing_tips": ["작성팁1", "작성팁2"],
  "evidence_collection": ["자료수집법1", "자료수집법2"]
}`;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: STUDY_PLANNING_PROMPT
        },
        {
          role: 'user',
          content: documentationPrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1500
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in AI response');
    }

    const parsed = JSON.parse(content);
    return {
      monthly_goals: parsed.monthly_goals || [],
      writing_tips: parsed.writing_tips || [],
      evidence_collection: parsed.evidence_collection || []
    };
  } catch (error) {
    console.error('Error generating documentation strategy:', error);
    return {
      monthly_goals: ['월별 활동 기록', '성취 내용 정리', '성찰 내용 작성'],
      writing_tips: ['구체적 행동과 결과 중심 기술', '수치와 근거 포함', '성장 과정 강조'],
      evidence_collection: ['활동 사진 촬영', '결과물 보관', '소감문 작성']
    };
  }
}

/**
 * Main function to generate next-semester study plan
 */
export async function generateNextSemesterPlan(
  extractedData: ExtractedData,
  keywordAnalysis?: AIKeywordExtraction,
  scoreAnalysis?: AIScoreAnalysis,
  academicAnalysis?: EnhancedAcademicAnalysis,
  majorRecommendations?: AIMajorRecommendations
): Promise<NextSemesterPlan> {
  console.log('📅 Starting next-semester study plan generation...');

  try {
    const llmConfig = createLLMConfig();
    const client = new OpenAI({
      apiKey: llmConfig.apiKey || process.env.OPENAI_API_KEY
    });

    // Analyze improvement priorities
    const priorities = analyzeImprovementPriorities(academicAnalysis, scoreAnalysis, keywordAnalysis);

    console.log('🎯 Identified improvement priorities:', priorities);

    // Generate all plan components
    const [academicPlan, characterPlan, documentationPlan] = await Promise.all([
      generateAcademicPlan(priorities, academicAnalysis, client),
      generateCharacterDevelopmentPlan(priorities, scoreAnalysis, client),
      generateDocumentationStrategy(majorRecommendations, client)
    ]);

    const result: NextSemesterPlan = {
      academic_plan: academicPlan,
      character_development: characterPlan,
      documentation_strategy: documentationPlan
    };

    console.log('✅ Next-semester study plan completed:', {
      prioritySubjects: academicPlan.priority_subjects.length,
      extracurricularActivities: academicPlan.extracurricular_recommendations.length,
      semesterGoals: academicPlan.semester_goals.length,
      timelineItems: academicPlan.timeline.length,
      targetCompetencies: characterPlan.target_competencies.length,
      monthlyGoals: documentationPlan.monthly_goals.length
    });

    return result;
  } catch (error) {
    console.error('❌ Next-semester study plan generation failed:', error);

    // Return fallback plan
    return {
      academic_plan: {
        priority_subjects: [
          {
            subject: '전체적 학습',
            current_level: '현재 수준 파악 필요',
            target_improvement: '전반적 향상',
            specific_strategies: ['개인별 맞춤 상담을 통한 계획 수립'],
            time_allocation: '상담 후 결정'
          }
        ],
        extracurricular_recommendations: [
          {
            activity_type: '일반 활동',
            specific_activities: ['진로 상담', '학습 상담'],
            purpose: '현재 상황 정확한 파악',
            documentation_tips: ['상담 내용 기록', '계획 수립 과정 문서화']
          }
        ],
        semester_goals: ['정확한 현황 파악', '맞춤형 계획 수립'],
        timeline: [
          {
            period: '즉시',
            tasks: ['전문 상담 예약', '현재 상태 점검']
          }
        ],
        preparation_checklist: ['상담 준비 자료 정리'],
        success_metrics: ['상담 완료', '계획 수립 완료']
      },
      character_development: {
        target_competencies: ['자기주도학습능력', '진로탐색역량'],
        development_activities: ['학습 계획 수립', '진로 탐색'],
        reflection_questions: ['내 현재 상황은?', '개선하고 싶은 부분은?']
      },
      documentation_strategy: {
        monthly_goals: ['현황 파악', '계획 수립', '실행 시작'],
        writing_tips: ['구체적 사실 기록', '과정과 결과 함께 기술'],
        evidence_collection: ['상담 기록', '계획서 보관', '실행 과정 기록']
      }
    };
  }
}

/**
 * Helper function to get study plan status for debugging
 */
export function getStudyPlanStatus(result: NextSemesterPlan): {
  isComplete: boolean;
  hasAcademicPlan: boolean;
  hasCharacterPlan: boolean;
  hasDocumentationPlan: boolean;
  totalRecommendations: number;
} {
  return {
    isComplete: result.academic_plan.priority_subjects.length > 0 &&
                result.character_development.target_competencies.length > 0 &&
                result.documentation_strategy.monthly_goals.length > 0,
    hasAcademicPlan: result.academic_plan.priority_subjects.length > 0,
    hasCharacterPlan: result.character_development.target_competencies.length > 0,
    hasDocumentationPlan: result.documentation_strategy.monthly_goals.length > 0,
    totalRecommendations: result.academic_plan.priority_subjects.length +
                         result.academic_plan.extracurricular_recommendations.length +
                         result.character_development.development_activities.length
  };
}