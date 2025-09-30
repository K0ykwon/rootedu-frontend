/**
 * AI-Powered Section Scoring Service
 *
 * This service provides sophisticated AI-based scoring for each section of the 생활기록부
 * using multiple criteria and detailed analysis, replacing the simple arithmetic formula
 * with intelligent assessment that considers depth, relevance, growth, uniqueness, and leadership.
 */

import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import { TextSections, ExtractedData, ValidationAnalysis } from '@/types/medsky';
import { AIScoreAnalysisSchema, AIScoreAnalysis, SectionScoreSchema } from '@/types/medsky-enhanced';
import { createLLMConfig } from '../llmService';

// Zod schemas for structured outputs
const OverallScoreResponseSchema = z.object({
  overall_feedback: z.string()
});

// Scoring criteria definitions
const SCORING_CRITERIA = {
  depth: '내용의 깊이와 구체성 (단순 나열 vs 심화 탐구)',
  relevance: '진로/전공과의 연관성 (목표 의식과 일관성)',
  growth: '성장과 발전 양상 (변화와 개선 과정)',
  uniqueness: '독창성과 차별성 (타 학생 대비 특별함)',
  leadership: '리더십과 주도성 (능동적 참여와 영향력)'
};

// Main system prompt for section scoring
const SECTION_SCORING_PROMPT = `
당신은 한국의 대학 입학사정관으로 20년 경력을 가진 전문가입니다. 고등학교 생활기록부의 각 섹션을 다음 5가지 기준으로 정밀하게 평가해야 합니다:

**평가 기준 (각 0-100점):**

1. **깊이와 구체성 (Depth)**:
   - 90-100점: 매우 구체적이고 심화된 내용, 단계별 과정과 결과 명시
   - 70-89점: 구체적 내용과 과정이 적절히 기술됨
   - 50-69점: 일반적 수준의 구체성, 일부 과정 설명
   - 30-49점: 추상적이고 일반적인 내용이 대부분
   - 0-29점: 매우 피상적이거나 형식적인 내용

2. **진로 연관성 (Relevance)**:
   - 90-100점: 명확한 진로 목표와 강한 연결성, 일관된 방향성
   - 70-89점: 진로와 관련성이 명확하고 목적의식 보임
   - 50-69점: 진로와 어느 정도 연관성이 있음
   - 30-49점: 진로 연관성이 약하거나 불분명
   - 0-29점: 진로와 관련성을 찾기 어려움

3. **성장 발전 (Growth)**:
   - 90-100점: 뚜렷한 성장 궤적과 지속적 발전 과정 확인
   - 70-89점: 명확한 성장과 개선 노력이 보임
   - 50-69점: 일정한 성장이나 변화가 관찰됨
   - 30-49점: 미미한 성장이나 변화
   - 0-29점: 성장이나 발전을 확인하기 어려움

4. **독창성 차별성 (Uniqueness)**:
   - 90-100점: 매우 독창적이고 차별화된 활동/성취
   - 70-89점: 독창적 요소와 개인만의 특색이 있음
   - 50-69점: 일반적이지만 일부 특별한 점이 있음
   - 30-49점: 대부분 일반적이고 평범한 내용
   - 0-29점: 매우 일반적이고 특별함이 없음

5. **리더십 주도성 (Leadership)**:
   - 90-100점: 강한 리더십과 적극적 주도로 큰 영향력 발휘
   - 70-89점: 명확한 주도성과 리더십 역량 보임
   - 50-69점: 일정한 주도성과 참여 의지 있음
   - 30-49점: 소극적이지만 참여하는 모습
   - 0-29점: 수동적 참여나 소극적 태도

**평가 원칙:**
- 대학 입학사정관의 관점에서 엄격하고 공정하게 평가
- 구체적 근거와 함께 점수 산정
- 강점과 약점을 명확히 구분하여 제시
- 개선 방향에 대한 구체적 제안 포함
- 한국 교육 현실과 대학 입시 트렌드 반영

각 섹션을 위 기준으로 분석하여 JSON 형태로 점수와 상세 피드백을 제공해주세요.`;

/**
 * Score a single section using AI
 */
async function scoreSingleSection(
  sectionName: string,
  sectionText: string,
  extractedData: ExtractedData | undefined,
  client: OpenAI
): Promise<z.infer<typeof import('@/types/medsky-enhanced').SectionScoreSchema> | null> {
  if (!sectionText || sectionText.trim().length < 20) {
    return null;
  }

  // Add context from extracted data if available
  let contextInfo = '';
  if (extractedData) {
    if (sectionName.includes('창의적') && extractedData.creativeActivities) {
      contextInfo = `\n**구조화된 데이터 참고:**\n${JSON.stringify(extractedData.creativeActivities, null, 2)}`;
    } else if (sectionName.includes('세부') && extractedData.detailedAbilities) {
      contextInfo = `\n**구조화된 데이터 참고:**\n${JSON.stringify(extractedData.detailedAbilities, null, 2)}`;
    } else if (sectionName.includes('교과') && extractedData.academicDevelopments) {
      contextInfo = `\n**구조화된 데이터 참고:**\n${JSON.stringify(extractedData.academicDevelopments, null, 2)}`;
    }
  }

  const sectionPrompt = `
**평가 대상: ${sectionName}**

${sectionText}
${contextInfo}

위 ${sectionName} 섹션을 5가지 기준(깊이, 연관성, 성장, 독창성, 리더십)으로 평가하고 다음 형태의 JSON으로 응답해주세요:

{
  "section_name": "${sectionName}",
  "score": 전체점수(0-100),
  "criteria_scores": {
    "depth": 깊이점수(0-100),
    "relevance": 연관성점수(0-100),
    "growth": 성장점수(0-100),
    "uniqueness": 독창성점수(0-100),
    "leadership": 리더십점수(0-100)
  },
  "strengths": ["강점1", "강점2", "강점3"],
  "weaknesses": ["약점1", "약점2"],
  "improvement_suggestions": ["개선안1", "개선안2", "개선안3"],
  "evidence_highlights": ["높은평가받은활동1", "높은평가받은활동2"]
}`;

  try {
    const response = await client.chat.completions.parse({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: SECTION_SCORING_PROMPT
        },
        {
          role: 'user',
          content: sectionPrompt
        }
      ],
      response_format: zodResponseFormat(SectionScoreSchema, 'section_score'),
      temperature: 0.2, // Lower temperature for more consistent scoring
      max_tokens: 2500
    });

    const parsed = response.choices[0]?.message?.parsed;
    if (!parsed) {
      throw new Error('No parsed response from AI');
    }

    // Validate and clean the response
    const sectionScore = {
      section_name: parsed.section_name || sectionName,
      score: Math.min(100, Math.max(0, parsed.score || 0)),
      criteria_scores: {
        depth: Math.min(100, Math.max(0, parsed.criteria_scores?.depth || 0)),
        relevance: Math.min(100, Math.max(0, parsed.criteria_scores?.relevance || 0)),
        growth: Math.min(100, Math.max(0, parsed.criteria_scores?.growth || 0)),
        uniqueness: Math.min(100, Math.max(0, parsed.criteria_scores?.uniqueness || 0)),
        leadership: Math.min(100, Math.max(0, parsed.criteria_scores?.leadership || 0))
      },
      strengths: parsed.strengths || [],
      weaknesses: parsed.weaknesses || [],
      improvement_suggestions: parsed.improvement_suggestions || [],
      evidence_highlights: parsed.evidence_highlights || []
    };

    return sectionScore;
  } catch (error) {
    console.error(`Error scoring section ${sectionName}:`, error);
    return null;
  }
}

/**
 * Generate overall analysis from all section scores
 */
async function generateOverallAnalysis(
  sectionScores: any[],
  validationAnalysis: ValidationAnalysis | undefined,
  client: OpenAI
): Promise<{
  overall_score: number;
  grade_equivalent: string;
  percentile_rank: number;
  competency_balance: any;
  overall_feedback: string;
}> {
  // Calculate overall score as weighted average
  const totalSections = sectionScores.length;
  const overallScore = totalSections > 0
    ? Math.round(sectionScores.reduce((sum, section) => sum + (section?.score || 0), 0) / totalSections)
    : 0;

  // Grade mapping
  const gradeMapping = [
    { min: 95, grade: 'A+' },
    { min: 90, grade: 'A' },
    { min: 85, grade: 'B+' },
    { min: 80, grade: 'B' },
    { min: 75, grade: 'C+' },
    { min: 70, grade: 'C' },
    { min: 65, grade: 'D+' },
    { min: 60, grade: 'D' },
    { min: 0, grade: 'F' }
  ];

  const gradeEquivalent = gradeMapping.find(g => overallScore >= g.min)?.grade || 'F';

  // Percentile estimation (rough calculation)
  const percentileRank = Math.min(99, Math.max(1, Math.round((overallScore - 40) * 1.5)));

  // Calculate competency balance from criteria scores
  const allCriteriaScores = sectionScores.reduce((acc, section) => {
    if (section?.criteria_scores) {
      Object.entries(section.criteria_scores).forEach(([key, value]) => {
        if (!acc[key]) acc[key] = [];
        acc[key].push(value as number);
      });
    }
    return acc;
  }, {} as Record<string, number[]>);

  const competencyBalance = {
    academic: Math.round((allCriteriaScores.depth?.reduce((a: number, b: number) => a + b, 0) / (allCriteriaScores.depth?.length || 1)) || 0),
    career: Math.round((allCriteriaScores.relevance?.reduce((a: number, b: number) => a + b, 0) / (allCriteriaScores.relevance?.length || 1)) || 0),
    community: Math.round((allCriteriaScores.leadership?.reduce((a: number, b: number) => a + b, 0) / (allCriteriaScores.leadership?.length || 1)) || 0),
    creativity: Math.round((allCriteriaScores.uniqueness?.reduce((a: number, b: number) => a + b, 0) / (allCriteriaScores.uniqueness?.length || 1)) || 0),
    character: Math.round((allCriteriaScores.growth?.reduce((a: number, b: number) => a + b, 0) / (allCriteriaScores.growth?.length || 1)) || 0)
  };

  // Generate comprehensive feedback
  const feedbackPrompt = `
다음은 학생의 생활기록부 각 섹션별 점수입니다:

${JSON.stringify(sectionScores, null, 2)}

**전체 점수: ${overallScore}점 (${gradeEquivalent}등급)**
**예상 위치: 상위 ${100 - percentileRank}% 수준**

위 분석 결과를 바탕으로 학생에 대한 종합적인 총평을 3-4문장으로 작성해주세요.
- 주요 강점과 성취
- 보완이 필요한 영역
- 대학 진학에 대한 전망
- 향후 개선 방향

JSON 형태로 "overall_feedback" 필드에 담아 응답해주세요.`;

  try {
    const response = await client.chat.completions.parse({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: SECTION_SCORING_PROMPT
        },
        {
          role: 'user',
          content: feedbackPrompt
        }
      ],
      response_format: zodResponseFormat(OverallScoreResponseSchema, 'overall_feedback'),
      temperature: 0.3,
      max_tokens: 1000
    });

    const parsed = response.choices[0]?.message?.parsed;

    return {
      overall_score: overallScore,
      grade_equivalent: gradeEquivalent,
      percentile_rank: percentileRank,
      competency_balance: competencyBalance,
      overall_feedback: parsed?.overall_feedback || `총 ${overallScore}점으로 ${gradeEquivalent}등급에 해당하는 우수한 생활기록부입니다.`
    };
  } catch (error) {
    console.error('Error generating overall analysis:', error);
    return {
      overall_score: overallScore,
      grade_equivalent: gradeEquivalent,
      percentile_rank: percentileRank,
      competency_balance: competencyBalance,
      overall_feedback: `총 ${overallScore}점으로 ${gradeEquivalent}등급에 해당합니다. 지속적인 발전과 개선을 위해 노력하시기 바랍니다.`
    };
  }
}

/**
 * Main function to perform AI-powered section scoring
 */
export async function performAISectionScoring(
  textSections: TextSections,
  extractedData?: ExtractedData,
  validationAnalysis?: ValidationAnalysis
): Promise<AIScoreAnalysis> {
  console.log('🎯 Starting AI section scoring...');

  try {
    const llmConfig = createLLMConfig();
    const client = new OpenAI({
      apiKey: llmConfig.apiKey || process.env.OPENAI_API_KEY
    });

    // Define sections to score
    const sectionsToScore = [
      { name: '창의적체험활동상황', text: textSections.creativeActivities },
      { name: '교과학습발달상황', text: textSections.academicDevelopment },
      { name: '세부특기사항', text: textSections.detailedAbilities },
      { name: '독서활동상황', text: textSections.readingActivities },
      { name: '행동특성및종합의견', text: textSections.behavioralCharacteristics }
    ];

    // Score each section
    const sectionScores = await Promise.all(
      sectionsToScore.map(section =>
        scoreSingleSection(section.name, section.text, extractedData, client)
      )
    );

    // Filter out null results
    const validSectionScores = sectionScores.filter(score => score !== null);

    // Generate overall analysis
    const overallAnalysis = await generateOverallAnalysis(validSectionScores, validationAnalysis, client);

    const result: AIScoreAnalysis = {
      section_scores: validSectionScores,
      overall_score: overallAnalysis.overall_score,
      grade_equivalent: overallAnalysis.grade_equivalent as any,
      percentile_rank: overallAnalysis.percentile_rank,
      competency_balance: overallAnalysis.competency_balance,
      overall_feedback: overallAnalysis.overall_feedback
    };

    console.log('✅ AI section scoring completed:', {
      sectionsScored: validSectionScores.length,
      overallScore: overallAnalysis.overall_score,
      gradeEquivalent: overallAnalysis.grade_equivalent,
      percentileRank: overallAnalysis.percentile_rank
    });

    return result;
  } catch (error) {
    console.error('❌ AI section scoring failed:', error);

    // Return fallback result
    return {
      section_scores: [],
      overall_score: 0,
      grade_equivalent: 'F',
      percentile_rank: 1,
      competency_balance: {
        academic: 0,
        career: 0,
        community: 0,
        creativity: 0,
        character: 0
      },
      overall_feedback: 'AI 분석 중 오류가 발생했습니다. 수동 검토가 필요합니다.'
    };
  }
}

/**
 * Helper function to get scoring status for debugging
 */
export function getScoringStatus(result: AIScoreAnalysis): {
  isComplete: boolean;
  sectionsScored: number;
  averageScore: number;
  hasDetailedAnalysis: boolean;
} {
  return {
    isComplete: result.section_scores.length > 0 && result.overall_score > 0,
    sectionsScored: result.section_scores.length,
    averageScore: result.overall_score,
    hasDetailedAnalysis: result.overall_feedback.length > 50
  };
}