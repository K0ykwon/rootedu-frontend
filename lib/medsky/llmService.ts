/**
 * Medsky LLM Service
 * 
 * This module provides LLM integration services for data extraction and validation
 * using OpenAI API directly with structured output. Uses gpt-4o-mini with
 * Zod schemas for reliable structured data extraction.
 */

import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { Agent, setGlobalDispatcher } from 'undici';
import { z } from 'zod';
import { 
  CreativeActivities, 
  AcademicDevelopments, 
  DetailedAbilities,
  ValidationResult,
  ValidationType,
  MedskyError,
  ERROR_CODES,
  CreativeActivitiesSchema,
  AcademicDevelopmentsSchema,
  DetailedAbilitiesSchema,
  ValidationResultSchema,
  GradeTrendReport,
  CompetencyScorePayload,
  MajorAlignmentReport,
  KeywordMatrixEntry,
  ConsultantNoteBlock,
  SummaryDraft
} from '@/types/medsky';
import { getExtractionPrompt, getValidationPrompt, SUMMARY_DRAFT_PROMPT } from './prompts';

const SummaryDraftSchema = z.object({
  summary: z.object({
    strengths: z.array(z.string()).default([]),
    improvements: z.array(z.string()).default([]),
    recommendations: z.array(z.string()).default([]),
    draft: z.string(),
  }),
});

export interface SummaryDraftInput {
  gradeTrends?: GradeTrendReport;
  competencyScores?: CompetencyScorePayload;
  majorAlignment?: MajorAlignmentReport;
  keywordMatrix?: KeywordMatrixEntry[];
  consultantNotes?: ConsultantNoteBlock;
}

// ===========================
// Configuration (functional style)
// ===========================

// Enable higher HTTP parallelism for OpenAI requests
try {
  setGlobalDispatcher(new Agent({ connections: 50 }));
} catch (_) {
  // Ignore if already set or not supported
}

interface LLMConfig {
  apiKey: string;
  model: string;
  baseUrl?: string;
}

const DEFAULT_OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

function buildConfig(config: Partial<LLMConfig>): LLMConfig {
  const apiKey = config.apiKey ?? process.env.OPENAI_API_KEY ?? '';
  if (!apiKey) {
    throw new Error('OpenAI API key is required');
  }

  const model = config.model ?? DEFAULT_OPENAI_MODEL;

  // Only use OpenAI - no baseUrl needed (will use default)
  return {
    apiKey,
    baseUrl: undefined,
    model,
  };
}

let cachedClient: {
  apiKey: string;
  baseUrl?: string;
  client: OpenAI;
} | null = null;

function createResponsesClient(config: LLMConfig): OpenAI {
  if (
    cachedClient &&
    cachedClient.apiKey === config.apiKey
  ) {
    return cachedClient.client;
  }

  const client = new OpenAI({
    apiKey: config.apiKey,
    // Let OpenAI SDK use its default baseURL
  });

  cachedClient = {
    apiKey: config.apiKey,
    baseUrl: undefined,
    client,
  };

  return client;
}

async function parseStructuredOutput<T>(
  config: Partial<LLMConfig>,
  systemPrompt: string,
  userContent: string,
  zodSchema: unknown,
  schemaName: string
): Promise<T> {
  const resolved = buildConfig(config);
  const openai = createResponsesClient(resolved);

  const response = await openai.chat.completions.parse({
    model: resolved.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent }
    ],
    response_format: zodResponseFormat(zodSchema as any, schemaName),
  });

  const message = response.choices[0]?.message;
  if (!message?.parsed) {
    throw new Error('Failed to parse structured output');
  }

  return message.parsed as T;
}

export async function runParallelLLMTasks<T>(
  factories: Array<() => Promise<T>>,
  concurrency = 5
): Promise<PromiseSettledResult<T>[]> {
  if (factories.length === 0) return [];
  const results: PromiseSettledResult<T>[] = new Array(factories.length);
  let nextIndex = 0;

  async function worker() {
    while (true) {
      const current = nextIndex++;
      if (current >= factories.length) break;
      try {
        const value = await factories[current]();
        results[current] = { status: 'fulfilled', value };
      } catch (error) {
        results[current] = { status: 'rejected', reason: error };
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, factories.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

// (Removed runWithLimit helper to keep implementation minimal)

// ===========================
// Data Extraction Functions
// ===========================

/**
 * Extract creative activities data from raw text using LLM - creates new client instance for parallel execution
 */
export async function extractCreativeActivities(
  rawText: string,
  config: Partial<LLMConfig>
): Promise<CreativeActivities> {
  try {
    const systemPrompt = getExtractionPrompt('creative');
    
    const result = await parseStructuredOutput<CreativeActivities>(
      config,
      systemPrompt,
      rawText,
      CreativeActivitiesSchema,
      'creative_activities'
    );

    // Validate the result structure
    if (!result.창의적체험활동상황 || !Array.isArray(result.창의적체험활동상황)) {
      throw new Error('Invalid creative activities extraction result structure');
    }

    return result;
  } catch (error) {
    throw new MedskyError(
      `Failed to extract creative activities: ${error}`,
      ERROR_CODES.LLM_EXTRACTION_FAILED,
      'analyzing'
    );
  }
}

/**
 * Extract academic development data from raw text using LLM - creates new client instance for parallel execution
 */
export async function extractAcademicDevelopment(
  rawText: string,
  config: Partial<LLMConfig>
): Promise<AcademicDevelopments> {
  try {
    const systemPrompt = getExtractionPrompt('academic');
    
    const result = await parseStructuredOutput<AcademicDevelopments>(
      config,
      systemPrompt,
      rawText,
      AcademicDevelopmentsSchema,
      'academic_developments'
    );

    // Validate the result structure
    if (!result.교과학습발달상황 || !Array.isArray(result.교과학습발달상황)) {
      throw new Error('Invalid academic development extraction result structure');
    }

    return result;
  } catch (error) {
    throw new MedskyError(
      `Failed to extract academic development: ${error}`,
      ERROR_CODES.LLM_EXTRACTION_FAILED,
      'analyzing'
    );
  }
}

/**
 * Extract detailed abilities data from raw text using LLM - creates new client instance for parallel execution
 */
export async function extractDetailedAbilities(
  rawText: string,
  config: Partial<LLMConfig>
): Promise<DetailedAbilities> {
  try {
    const systemPrompt = getExtractionPrompt('detailed');
    
    const result = await parseStructuredOutput<DetailedAbilities>(
      config,
      systemPrompt,
      rawText,
      DetailedAbilitiesSchema,
      'detailed_abilities'
    );

    // Validate the result structure
    if (!result.세부특기사항 || !Array.isArray(result.세부특기사항)) {
      throw new Error('Invalid detailed abilities extraction result structure');
    }

    return result;
  } catch (error) {
    throw new MedskyError(
      `Failed to extract detailed abilities: ${error}`,
      ERROR_CODES.LLM_EXTRACTION_FAILED,
      'analyzing'
    );
  }
}

/**
 * Extract all data types in parallel for better performance
 */
export async function extractAllData(
  creativeText: string,
  academicText: string,
  detailedText: string,
  config: Partial<LLMConfig>
) {
  try {
    const startTime = Date.now();
    console.log('   - Running 3 parallel LLM extraction tasks...');
    
    // Run all extractions in parallel for better performance
    const [creativeActivities, academicDevelopments, detailedAbilities] = await Promise.all([
      extractCreativeActivities(creativeText, config),
      extractAcademicDevelopment(academicText, config),
      extractDetailedAbilities(detailedText, config),
    ]);

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    console.log(`   - All 3 extraction tasks completed in ${duration.toFixed(2)}s (avg: ${(duration / 3).toFixed(2)}s per task)`);

    return {
      creativeActivities,
      academicDevelopments,
      detailedAbilities,
    };
  } catch (error) {
    throw new MedskyError(
      `Failed to extract all data: ${error}`,
      ERROR_CODES.LLM_EXTRACTION_FAILED,
      'analyzing'
    );
  }
}

// ===========================
// Validation Functions
// ===========================

/**
 * Validate text with a specific validation type - creates new client instance for parallel execution
 */
export async function validateText(
  text: string,
  validationType: ValidationType,
  config: Partial<LLMConfig>
): Promise<ValidationResult> {
  try {
    const systemPrompt = getValidationPrompt(validationType);

    const result = await parseStructuredOutput<ValidationResult>(
      config,
      systemPrompt,
      text,
      ValidationResultSchema,
      'validation_result'
    );

    // Validate the result structure
    if (!result.type || !result.Feedbacks || !Array.isArray(result.Feedbacks)) {
      throw new Error('Invalid validation result structure');
    }

    // Ensure type matches what was requested
    if (result.type !== validationType) {
      result.type = validationType;
    }

    return result;
  } catch (error) {
    console.warn(`Validation failed for ${validationType}:`, error);
    // Return empty-but-valid result on failure to avoid blocking the pipeline
    return {
      type: validationType,
      Feedbacks: [
        {
          sentence: '오류로 인해 분석을 완료할 수 없었습니다.',
          feedback: `API 오류 또는 JSON 파싱 실패: ${String(error).substring(0, 200)}`
        }
      ]
    };
  }
}

/**
 * Run all validation types in parallel on provided text
 */
export async function validateAllTypes(
  text: string,
  config: Partial<LLMConfig>
) {
  const validationTypes: ValidationType[] = [
    'blue_highlight',
    'red_line', 
    'blue_line',
    'black_line',
    'red_check'
  ];

  try {
    // Run all validations in parallel
    const results = await Promise.all(
      validationTypes.map(type => validateText(text, type, config))
    );

    // Convert array to object with validation types as keys
    const validationAnalysis = validationTypes.reduce((acc, type, index) => {
      acc[type] = results[index];
      return acc;
    }, {} as Record<ValidationType, ValidationResult>);

    return validationAnalysis;
  } catch (error) {
    throw new MedskyError(
      `Failed to run all validations: ${error}`,
      ERROR_CODES.VALIDATION_FAILED,
      'validating'
    );
  }
}

/**
 * Run comprehensive validation analysis on text sections (matches Python exp5_validation.py)
 */
export async function runComprehensiveValidation(
  textSections: {
    creativeActivities: string;
    academicDevelopment: string; 
    detailedAbilities: string;
  },
  config: Partial<LLMConfig>
) {
  try {
    const startTime = Date.now();
    const validationTypes: ValidationType[] = [
      'blue_highlight',
      'red_line', 
      'blue_line',
      'black_line',
      'red_check'
    ];

    // Prepare section texts
    const sectionTexts = [
      textSections.creativeActivities,
      textSections.academicDevelopment,
      textSections.detailedAbilities
    ];

    // For each validation type, run validation on each section (3 per type → 15 total)
    const factories: Array<() => Promise<ValidationResult>> = [];
    for (const validationType of validationTypes) {
      for (const sectionText of sectionTexts) {
        factories.push(() => validateText(sectionText, validationType, config));
      }
    }

    console.log(`🚀 Starting ${factories.length} validation tasks with Promise.allSettled (no cap)...`);
    const settled = await Promise.allSettled(factories.map(fn => fn()));
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    // Combine the 3 section results per validation type into a single result
    const validationAnalysis = validationTypes.reduce((acc, type, typeIndex) => {
      const startIndex = typeIndex * sectionTexts.length;
      const group = settled.slice(startIndex, startIndex + sectionTexts.length);
      const results: ValidationResult[] = group.map((r) => {
        if (r.status === 'fulfilled') return r.value;
        return {
          type,
          Feedbacks: [
            {
              sentence: '오류로 인해 분석을 완료할 수 없었습니다.',
              feedback: `API 오류 또는 JSON 파싱 실패: ${String(r.reason).substring(0, 200)}`
            }
          ]
        };
      });
      acc[type] = {
        type,
        Feedbacks: results.flatMap(r => r.Feedbacks)
      };
      return acc;
    }, {} as Record<ValidationType, ValidationResult>);

    console.log(`✅ All ${factories.length} validation tasks completed in ${duration.toFixed(2)}s`);
    console.log(`   - Average time per task: ${(duration / factories.length).toFixed(2)}s`);
    return validationAnalysis;

  } catch (error) {
    throw new MedskyError(
      `Failed to run comprehensive validation: ${error}`,
      ERROR_CODES.VALIDATION_FAILED,
      'validating'
    );
  }
}

/**
 * Generate summary draft combining analytics and consultant notes
 */
export async function generateSummaryDraft(
  input: SummaryDraftInput,
  config: Partial<LLMConfig>
): Promise<SummaryDraft> {
  try {
    const payload = JSON.stringify({
      gradeTrends: input.gradeTrends ?? null,
      competencyScores: input.competencyScores ?? null,
      majorAlignment: input.majorAlignment ?? null,
      keywordMatrix: input.keywordMatrix ?? null,
      consultantNotes: input.consultantNotes ?? null,
    });

    const result = await parseStructuredOutput<z.infer<typeof SummaryDraftSchema>>(
      config,
      SUMMARY_DRAFT_PROMPT,
      payload,
      SummaryDraftSchema,
      'summary_draft'
    );

    const summary = result.summary;
    return {
      aiDraft: summary.draft,
      strengths: summary.strengths,
      improvements: summary.improvements,
      recommendations: summary.recommendations,
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    throw new MedskyError(
      `Failed to generate summary draft: ${error}`,
      ERROR_CODES.LLM_EXTRACTION_FAILED,
      'validating'
    );
  }
}

// ===========================
// Utility Functions
// ===========================

/**
 * Create LLM config from environment variables
 */
export function createLLMConfig(): Partial<LLMConfig> {
  return {
    apiKey: process.env.OPENAI_API_KEY || '',
    baseUrl: undefined, // Use OpenAI default
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  };
}

/**
 * Validate LLM configuration
 */
export function validateLLMConfig(config: Partial<LLMConfig>): string[] {
  const errors: string[] = [];
  
  if (!config.apiKey) {
    errors.push('OPENAI_API_KEY is required');
  }
  
  if (!config.model) {
    errors.push('OPENAI_MODEL is required');
  }
  
  return errors;
}
