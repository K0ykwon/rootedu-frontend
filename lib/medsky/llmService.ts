/**
 * Medsky LLM Service
 * 
 * This module provides LLM integration services for data extraction and validation
 * using OpenAI API directly with structured output. Uses gpt-4o-mini with
 * Zod schemas for reliable structured data extraction.
 */

import OpenAI from "openai";
import { zodTextFormat, zodResponseFormat } from "openai/helpers/zod";
import { Agent, setGlobalDispatcher } from 'undici';
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
  ValidationResultSchema
} from '@/types/medsky';
import { getExtractionPrompt, getValidationPrompt } from './prompts';

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
}

const DEFAULT_CONFIG: Partial<LLMConfig> = {
  model: 'openai/gpt-5-mini',
};

function buildConfig(config: Partial<LLMConfig>): LLMConfig {
  if (!config.apiKey) {
    throw new Error('OpenAI API key is required');
  }
  return { ...DEFAULT_CONFIG, ...config } as LLMConfig;
}

// Important: Do NOT singleton-cache the OpenAI client here.
// The SDK may gate concurrency per client; creating a new client per request
// allows true parallelism while still sharing the global Undici dispatcher.

async function parseStructuredOutput<T>(
  config: Partial<LLMConfig>,
  systemPrompt: string,
  userContent: string,
  zodSchema: unknown,
  schemaName: string
): Promise<T> {
  const resolved = buildConfig(config);
  const openai = new OpenAI({ apiKey: process.env.OPENROUTER_API_KEY, baseURL: process.env.OPENROUTER_BASE_URL });

  // Toggle between Chat Completions structured output and Responses API via env
  const useChatStructured = String(process.env.MEDSKY_USE_CHAT_STRUCTURED || '').toLowerCase();
  const preferChat = useChatStructured === '1' || useChatStructured === 'true' || useChatStructured === 'yes';

  if (preferChat) {
    console.log('Using Chat Completions structured output');
    const completion = await openai.chat.completions.create({
      model: resolved.model!,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent }
      ],
      response_format: zodResponseFormat(zodSchema as any, schemaName),
    });
    const message: any = completion.choices?.[0]?.message;
    const content = message?.content;
    if (typeof content === 'string') {
      return JSON.parse(content) as T;
    }
    if (Array.isArray(content)) {
      const text = content.map((part: any) => (typeof part === 'string' ? part : part?.text || '')).join('');
      if (text) {
        return JSON.parse(text) as T;
      }
    }
    throw new Error('Failed to parse structured JSON content from chat completion');
  }

  // Fallback to Responses API structured parsing
  const response = await openai.responses.parse({
    model: resolved.model!,
    input: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent }
    ],
    text: {
      format: zodTextFormat(zodSchema as any, schemaName),
    },
  });
  return response.output_parsed as T;
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

// ===========================
// Utility Functions
// ===========================

/**
 * Create LLM config from environment variables
 */
export function createLLMConfig(): Partial<LLMConfig> {
  return {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || DEFAULT_CONFIG.model,
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