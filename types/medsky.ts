/**
 * Medsky - Student Record Analysis System Types
 * 
 * This file contains TypeScript types for the medsky functionality
 * that processes Korean student records (생기부) through PDF parsing,
 * text extraction, LLM-based data extraction, and validation analysis.
 */

import { z } from "zod";

// ===========================
// Core Data Model Types & Schemas
// ===========================

// Zod schemas for structured LLM output
export const CreativeActivitySchema = z.object({
  영역: z.string().describe("해당 창의적 체험활동상황의 영역. 영역 column of table e.g - 자율활동, 동아리활동, ..."),
  시간: z.number().describe("해당 창의적 체험활동상황의 시간. 시간 column of table"),
  특기사항: z.string().describe("해당 창의적 체험활동상황의 특기사항. 특기사항 column of table"),
});

export const CreativeActivitiesSchema = z.object({
  창의적체험활동상황: z.array(CreativeActivitySchema).describe("The list of creative activities"),
});

/**
 * Creative Activity Entry - 창의적 체험활동상황
 */
export interface CreativeActivity {
  /** Activity domain (e.g., 자율활동, 동아리활동, 진로활동, 봉사활동) */
  영역: string;
  /** Hours spent on this activity */
  시간: number;
  /** Detailed description of the activity and achievements */
  특기사항: string;
}

/**
 * Creative Activities Collection
 */
export interface CreativeActivities {
  창의적체험활동상황: CreativeActivity[];
}


export const AcademicDevelopmentSchema = z.object({
  과목: z.string().describe("해당 교과학습발달상황의 과목. 과목 column of table e.g - 수학, 과학, ..."),
  학점수: z.number().describe("해당 교과학습발달상황의 학점수. 학점수 column of table"),
  score_over_average: z.string().describe("해당 교과학습발달상황의 원점수/과목평균. 원점수/과목평균 column of table"),
  성취도: z.string().describe("해당 교과학습발달상황의 성취도. 성취도 column of table"),
  석차등급: z.string().describe("해당 교과학습발달상황의 석차등급. 석차등급 column of table"),
});

export const AcademicDevelopmentsSchema = z.object({
  교과학습발달상황: z.array(AcademicDevelopmentSchema).describe("The list of academic developments"),
});

export const DetailedAbilitySchema = z.object({
  과목: z.string().describe("해당 세부특기사항의 과목."),
  특기사항: z.string().describe("해당 과목의 특기사항."),
});

export const DetailedAbilitiesSchema = z.object({
  세부특기사항: z.array(DetailedAbilitySchema).describe("The list of detailed abilities"),
});

/**
 * Academic Development Entry - 교과학습발달상황
 */
export interface AcademicDevelopment {
  /** Subject name (e.g., 국어, 수학, 영어, 한국사, 통합사회, 통합과학) */
  과목: string;
  /** Credit points for the subject */
  학점수: number;
  /** Original score/class average format (e.g., '82/69.2(13.6)') */
  score_over_average: string;
  /** Achievement level (A, B, C, D, E) */
  성취도: string;
  /** Rank grade (1-9 or similar) */
  석차등급: string;
}

/**
 * Academic Developments Collection
 */
export interface AcademicDevelopments {
  교과학습발달상황: AcademicDevelopment[];
}

/**
 * Detailed Ability Entry - 세부능력 및 특기사항
 */
export interface DetailedAbility {
  /** Subject name */
  과목: string;
  /** Detailed evaluation and special abilities description for this subject */
  특기사항: string;
}

/**
 * Detailed Abilities Collection
 */
export interface DetailedAbilities {
  세부특기사항: DetailedAbility[];
}

/**
 * Complete extracted data structure
 */
export interface ExtractedData {
  creativeActivities?: CreativeActivities;
  academicDevelopments?: AcademicDevelopments;
  detailedAbilities?: DetailedAbilities;
}

// ===========================
// Validation System Types & Schemas
// ===========================

// Validation schemas for structured LLM output
export const ValidationFeedbackSchema = z.object({
  sentence: z.string().describe("평가된 컨텐츠에서 피드백 대상이 되는 문장. 원본 텍스트와 반드시 동일하게 작성해야 함."),
  feedback: z.string().describe("컨텐츠에 대한 피드백. 해당 피드백을 왜 제시하게 됐는지에 대한 설명"),
});

export const ValidationResultSchema = z.object({
  type: z.enum(["red_line", "red_check", "blue_line", "blue_highlight", "black_line"]),
  Feedbacks: z.array(ValidationFeedbackSchema).describe("The list of Feedbacks for the validation"),
});

/**
 * Validation feedback categories
 * Each represents different aspects of student record analysis
 */
export type ValidationType = 
  | 'blue_highlight'    // 진로 역량 강조 (career competency emphasis)
  | 'red_line'          // 구체적 노력·깊이 강조 (concrete effort/depth emphasis)
  | 'blue_line'         // 연계·후속 탐구 강조 (connection/follow-up research emphasis)
  | 'black_line'        // 구체성 부족 (lack of specificity)
  | 'red_check';        // 평가 불가 수준 (insufficient information for evaluation)

/**
 * Individual validation feedback item
 */
export interface ValidationFeedback {
  /** Original sentence from the text that triggered this validation */
  sentence: string;
  /** Explanation of why this validation was triggered */
  feedback: string;
}

/**
 * Validation result for a specific type
 */
export interface ValidationResult {
  type: ValidationType;
  Feedbacks: ValidationFeedback[];
}

/**
 * Complete validation analysis results
 */
export interface ValidationAnalysis {
  blue_highlight: ValidationResult;
  red_line: ValidationResult;
  blue_line: ValidationResult;
  black_line: ValidationResult;
  red_check: ValidationResult;
}

// ===========================
// Text Processing Types
// ===========================

/**
 * Raw text sections extracted via regex
 */
export interface TextSections {
  /** 창의적 체험활동상황 section text */
  creativeActivities: string;
  /** 교과학습발달상황 section text */
  academicDevelopment: string;
  /** 세부능력 및 특기사항 section text */
  detailedAbilities: string;
  /** 독서활동상황 section text */
  readingActivities: string;
  /** 행동특성 및 종합의견 section text */
  behavioralCharacteristics: string;
}

// ===========================
// Processing Pipeline Types
// ===========================

/**
 * Processing stages for the medsky pipeline
 */
export type ProcessingStage = 
  | 'uploading'         // File upload in progress
  | 'parsing'           // PDF parsing with LlamaCloud
  | 'extracting'        // Text section extraction with regex
  | 'analyzing'         // LLM-based data extraction
  | 'validating'        // Validation feedback analysis
  | 'completed'         // All processing completed
  | 'error';            // Error occurred

/**
 * Processing status information
 */
export interface ProcessingStatus {
  stage: ProcessingStage;
  progress: number;     // 0-100 percentage
  message: string;      // Human-readable status message
  error?: string;       // Error message if stage === 'error'
}

/**
 * Complete processing result
 */
export interface ProcessingResult {
  /** Processing status information */
  status: ProcessingStatus;
  /** Raw parsed text from PDF */
  parsedText?: string;
  /** Extracted text sections */
  textSections?: TextSections;
  /** Structured data extracted by LLM */
  extractedData?: ExtractedData;
  /** Validation analysis results */
  validationAnalysis?: ValidationAnalysis;
}

// ===========================
// API Request/Response Types
// ===========================

/**
 * PDF upload request
 */
export interface UploadPDFRequest {
  /** PDF file data as base64 string or File object */
  file: File;
}

/**
 * PDF upload response
 */
export interface UploadPDFResponse {
  success: boolean;
  sessionId: string;
  parsedText?: string;
  error?: string;
}

/**
 * Section extraction request
 */
export interface ExtractSectionsRequest {
  sessionId: string;
  parsedText: string;
}

/**
 * Section extraction response
 */
export interface ExtractSectionsResponse {
  success: boolean;
  textSections?: TextSections;
  error?: string;
}

/**
 * Data extraction request
 */
export interface ExtractDataRequest {
  sessionId: string;
  textSections: TextSections;
}

/**
 * Data extraction response
 */
export interface ExtractDataResponse {
  success: boolean;
  extractedData?: ExtractedData;
  error?: string;
}

/**
 * Validation request
 */
export interface ValidationRequest {
  sessionId: string;
  extractedData: ExtractedData;
}

/**
 * Validation response
 */
export interface ValidationResponse {
  success: boolean;
  validationAnalysis?: ValidationAnalysis;
  error?: string;
}

/**
 * Complete processing request
 */
export interface CompleteProcessRequest {
  file: File;
}

/**
 * Complete processing response
 */
export interface CompleteProcessResponse {
  success: boolean;
  sessionId: string;
  result?: ProcessingResult;
  error?: string;
}

// ===========================
// UI Component Props Types
// ===========================

/**
 * Props for the main Medsky component
 */
export interface MedskyProps {
  /** Optional custom styling classes */
  className?: string;
  /** Callback when processing completes */
  onComplete?: (result: ProcessingResult) => void;
  /** Callback for processing status updates */
  onStatusChange?: (status: ProcessingStatus) => void;
}

/**
 * Props for the PDF upload component
 */
export interface PDFUploadProps {
  /** Callback when file is uploaded successfully */
  onUpload: (file: File) => void;
  /** Whether upload is in progress */
  isLoading?: boolean;
  /** Error message to display */
  error?: string;
  /** Optional custom styling classes */
  className?: string;
}

/**
 * Props for the validation results display
 */
export interface ValidationResultsProps {
  /** Text sections extracted from PDF */
  textSections: TextSections;
  /** Extracted data to display */
  extractedData: ExtractedData;
  /** Validation analysis results */
  validationAnalysis: ValidationAnalysis;
  /** Currently active validation filters */
  activeFilters: ValidationType[];
  /** Callback when filter selection changes */
  onFilterChange: (filters: ValidationType[]) => void;
  /** Optional custom styling classes */
  className?: string;
}

/**
 * Props for individual validation category display
 */
export interface ValidationCategoryProps {
  /** Validation type being displayed */
  type: ValidationType;
  /** Validation results for this category */
  result: ValidationResult;
  /** Whether this category is currently active/visible */
  isActive: boolean;
  /** Callback to toggle this category */
  onToggle: (type: ValidationType) => void;
  /** Optional custom styling classes */
  className?: string;
}

/**
 * Props for processing status display
 */
export interface ProcessingStatusProps {
  /** Current processing status */
  status: ProcessingStatus;
  /** Optional custom styling classes */
  className?: string;
}

// ===========================
// Configuration Types
// ===========================

/**
 * Medsky service configuration
 */
export interface MedskyConfig {
  /** LlamaCloud API configuration */
  llamaCloud: {
    apiKey: string;
    parseMode: string;
    highResOcr: boolean;
    outlinedTableExtraction: boolean;
    outputTablesAsHTML: boolean;
  };
  /** OpenRouter API configuration */
  openRouter: {
    apiKey: string;
    baseUrl: string;
    model: string;
  };
  /** Processing configuration */
  processing: {
    maxFileSize: number;        // Maximum PDF file size in bytes
    timeoutMs: number;          // Processing timeout in milliseconds
    retryAttempts: number;      // Number of retry attempts for failed operations
  };
}

// ===========================
// Error Types
// ===========================

/**
 * Medsky-specific error types
 */
export class MedskyError extends Error {
  constructor(
    message: string,
    public code: string,
    public stage?: ProcessingStage
  ) {
    super(message);
    this.name = 'MedskyError';
  }
}

/**
 * Common error codes
 */
export const ERROR_CODES = {
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  PDF_PARSING_FAILED: 'PDF_PARSING_FAILED',
  SECTION_EXTRACTION_FAILED: 'SECTION_EXTRACTION_FAILED',
  LLM_EXTRACTION_FAILED: 'LLM_EXTRACTION_FAILED',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  TIMEOUT: 'TIMEOUT',
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];