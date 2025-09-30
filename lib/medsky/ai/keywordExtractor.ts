/**
 * AI-Powered Keyword Extraction Service
 *
 * This service uses LLM to extract contextually relevant keywords from student records
 * instead of simple frequency-based extraction. It analyzes each section of the 생활기록부
 * to identify meaningful keywords that indicate specific competencies and achievements.
 */

import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import { TextSections, ExtractedData } from '@/types/medsky';
import { AIKeywordExtractionSchema, AIKeywordExtraction, AIKeywordSchema } from '@/types/medsky-enhanced';
import { createLLMConfig } from '../llmService';

// Zod schemas for structured outputs
const SectionKeywordsResponseSchema = z.object({
  keywords: z.array(AIKeywordSchema),
  section_summary: z.string()
});

const OverallInsightsResponseSchema = z.object({
  overall_keywords: z.array(AIKeywordSchema),
  student_strengths: z.array(z.string()),
  improvement_areas: z.array(z.string())
});

// LLM prompt for contextual keyword extraction
const KEYWORD_EXTRACTION_PROMPT = `
당신은 한국의 고등학교 생활기록부 전문 분석가입니다. 주어진 생활기록부 텍스트에서 학생의 역량과 성장을 나타내는 핵심 키워드들을 문맥적으로 추출해야 합니다.

**분석 기준:**
1. **문맥적 중요성**: 단순 빈도가 아닌 교육적 의미와 중요성 고려
2. **역량 연계성**: 각 키워드가 나타내는 구체적인 역량 식별
3. **성장 지표**: 학생의 발전과 성취를 보여주는 증거 키워드
4. **차별화 요소**: 학생만의 독특한 강점과 특성을 나타내는 키워드

**역량 카테고리:**
- 학업역량: 깊이 있는 학습, 탐구 능력, 학업 성취
- 진로역량: 진로 탐색, 전문성 개발, 미래 준비
- 공동체역량: 협력, 배려, 사회 참여
- 창의성: 창의적 사고, 혁신, 독창성
- 리더십: 주도성, 영향력, 책임감
- 협력: 팀워크, 소통, 갈등 해결
- 문제해결: 분석력, 해결책 도출, 비판적 사고
- 의사소통: 표현력, 설득력, 언어 능력

**주의사항:**
- 형식적이고 일반적인 단어는 제외 (예: "활동", "참여", "학습")
- 구체적이고 의미있는 행동과 성취에 집중
- 각 키워드에 대한 근거 텍스트 제시
- 관련성 점수는 교육적 가치와 차별화 정도를 반영

다음 생활기록부 섹션들을 분석하여 각 섹션별로 가장 중요한 키워드들을 추출해주세요.`;

/**
 * Extract keywords from a single text section using AI
 */
async function extractSectionKeywords(
  sectionName: string,
  sectionText: string,
  client: OpenAI
): Promise<z.infer<typeof import('@/types/medsky-enhanced').SectionKeywordsSchema> | null> {
  if (!sectionText || sectionText.trim().length < 10) {
    return null;
  }

  const sectionPrompt = `
**분석 대상 섹션: ${sectionName}**

${sectionText}

위 ${sectionName} 섹션을 분석하여 다음 정보를 추출해주세요:
1. 핵심 키워드들 (문맥적 중요성 기준, 최대 8개)
2. 각 키워드의 관련성 점수 (0-1)
3. 키워드가 나타내는 역량 카테고리
4. 키워드 추출 근거가 되는 원문 텍스트
5. 해당 키워드가 나타내는 구체적 역량 지표
6. 섹션 전체의 특징과 강점 요약

JSON 형태로 응답해주세요.`;

  try {
    const response = await client.chat.completions.parse({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: KEYWORD_EXTRACTION_PROMPT
        },
        {
          role: 'user',
          content: sectionPrompt
        }
      ],
      response_format: zodResponseFormat(SectionKeywordsResponseSchema, 'section_keywords'),
      temperature: 0.3,
      max_tokens: 2000
    });

    const parsed = response.choices[0]?.message?.parsed;
    if (!parsed) {
      throw new Error('No parsed response from AI');
    }

    // Map to our schema format
    const sectionKeywords = {
      section_name: sectionName,
      keywords: parsed.keywords || [],
      section_summary: parsed.section_summary || `${sectionName} 분석 완료`
    };

    return sectionKeywords;
  } catch (error) {
    console.error(`Error extracting keywords for section ${sectionName}:`, error);
    return null;
  }
}

/**
 * Generate overall insights from all sections
 */
async function generateOverallInsights(
  sectionsResults: any[],
  client: OpenAI
): Promise<{
  overall_keywords: any[];
  student_strengths: string[];
  improvement_areas: string[];
}> {
  const allKeywords = sectionsResults.flatMap(section => section?.keywords || []);

  const insightsPrompt = `
다음은 학생의 생활기록부에서 추출된 모든 키워드들입니다:

${JSON.stringify(allKeywords, null, 2)}

이 키워드들을 종합 분석하여 다음을 제공해주세요:

1. **전체 상위 키워드들**: 모든 섹션을 통틀어 가장 중요한 키워드 5개 (중복 제거 및 통합)
2. **학생의 주요 강점 영역**: 키워드 분석을 통해 도출된 학생의 핵심 강점 (3-5개)
3. **보완이 필요한 영역**: 상대적으로 부족하거나 개발이 필요한 영역 (2-3개)

JSON 형태로 응답해주세요.`;

  try {
    const response = await client.chat.completions.parse({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: KEYWORD_EXTRACTION_PROMPT
        },
        {
          role: 'user',
          content: insightsPrompt
        }
      ],
      response_format: zodResponseFormat(OverallInsightsResponseSchema, 'overall_insights'),
      temperature: 0.3,
      max_tokens: 1500
    });

    const parsed = response.choices[0]?.message?.parsed;
    if (!parsed) {
      throw new Error('No parsed response from AI');
    }
    return {
      overall_keywords: parsed.overall_keywords || [],
      student_strengths: parsed.student_strengths || [],
      improvement_areas: parsed.improvement_areas || []
    };
  } catch (error) {
    console.error('Error generating overall insights:', error);
    return {
      overall_keywords: [],
      student_strengths: ['분석 중 오류가 발생했습니다'],
      improvement_areas: ['추가 분석이 필요합니다']
    };
  }
}

/**
 * Main function to extract AI-powered keywords from student record
 */
export async function extractAIKeywords(
  textSections: TextSections,
  extractedData?: ExtractedData
): Promise<AIKeywordExtraction> {
  console.log('🤖 Starting AI keyword extraction...');

  try {
    const llmConfig = createLLMConfig();
    const client = new OpenAI({
      apiKey: llmConfig.apiKey || process.env.OPENAI_API_KEY
    });

    // Define sections to analyze
    const sectionsToAnalyze = [
      { name: '창의적체험활동상황', text: textSections.creativeActivities },
      { name: '세부특기사항', text: textSections.detailedAbilities },
      { name: '독서활동상황', text: textSections.readingActivities },
      { name: '행동특성및종합의견', text: textSections.behavioralCharacteristics }
    ];

    // Extract keywords from each section
    const sectionResults = await Promise.all(
      sectionsToAnalyze.map(section =>
        extractSectionKeywords(section.name, section.text, client)
      )
    );

    // Filter out null results
    const validSectionResults = sectionResults.filter(result => result !== null);

    // Generate overall insights
    const overallInsights = await generateOverallInsights(validSectionResults, client);

    const result: AIKeywordExtraction = {
      sections: validSectionResults,
      overall_keywords: overallInsights.overall_keywords,
      student_strengths: overallInsights.student_strengths,
      improvement_areas: overallInsights.improvement_areas
    };

    console.log('✅ AI keyword extraction completed:', {
      sectionsAnalyzed: validSectionResults.length,
      totalKeywords: validSectionResults.reduce((sum, section) => sum + (section?.keywords?.length || 0), 0),
      overallKeywords: overallInsights.overall_keywords.length,
      strengths: overallInsights.student_strengths.length,
      improvements: overallInsights.improvement_areas.length
    });

    return result;
  } catch (error) {
    console.error('❌ AI keyword extraction failed:', error);

    // Return fallback result
    return {
      sections: [],
      overall_keywords: [],
      student_strengths: ['AI 분석 중 오류가 발생했습니다'],
      improvement_areas: ['추가 분석이 필요합니다']
    };
  }
}

/**
 * Helper function to get keyword extraction status for debugging
 */
export function getKeywordExtractionStatus(result: AIKeywordExtraction): {
  isComplete: boolean;
  sectionsAnalyzed: number;
  totalKeywords: number;
  hasOverallAnalysis: boolean;
} {
  return {
    isComplete: result.sections.length > 0 && result.overall_keywords.length > 0,
    sectionsAnalyzed: result.sections.length,
    totalKeywords: result.sections.reduce((sum, section) => sum + section.keywords.length, 0),
    hasOverallAnalysis: result.student_strengths.length > 0 && result.improvement_areas.length > 0
  };
}