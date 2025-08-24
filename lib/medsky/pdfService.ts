/**
 * Medsky PDF Service
 * 
 * This module provides PDF parsing functionality using LlamaCloud API.
 * It handles PDF upload, parsing configuration, and text extraction
 * optimized for Korean student records (생기부).
 * 
 * Using direct API calls with text endpoint to match Python page.text output exactly.
 */

import { MedskyError, ERROR_CODES } from '@/types/medsky';

// ===========================
// Configuration
// ===========================

interface LlamaCloudConfig {
  apiKey: string;
  parseMode: string;
  highResOcr: boolean;
  adaptiveLongTable: boolean;
  outlinedTableExtraction: boolean;
  outputTablesAsHTML: boolean;
  timeout: number;
  maxRetries: number;
  pollInterval: number;
  maxPollAttempts: number;
}

interface ParseJobResponse {
  id: string;
  status: 'PENDING' | 'SUCCESS' | 'ERROR';
  result?: {
    text?: string;
    pages?: Array<{ text: string }>;
  };
  error?: string;
}

// Match exact configuration from Python version (exp1_parsing.py) to minimize API costs
const DEFAULT_CONFIG: Partial<LlamaCloudConfig> = {
  parseMode: 'parse_page_without_llm',  // Same as Python: parse_mode="parse_page_without_llm"
  highResOcr: true,                      // Same as Python: high_res_ocr=True
  adaptiveLongTable: false,              // NOT used in Python version - disabled to save costs
  outlinedTableExtraction: true,         // Same as Python: outlined_table_extraction=True
  outputTablesAsHTML: true,              // Same as Python: output_tables_as_HTML=True
  timeout: 60000, // 60 seconds for PDF parsing
  maxRetries: 3,
  pollInterval: 2000, // 2 seconds between status polls
  maxPollAttempts: 30, // Max 60 seconds of polling
};

// ===========================
// LlamaCloud Client
// ===========================

class LlamaCloudClient {
  private config: LlamaCloudConfig;

  constructor(config: Partial<LlamaCloudConfig>) {
    if (!config.apiKey) {
      throw new Error('LlamaCloud API key is required');
    }

    this.config = { ...DEFAULT_CONFIG, ...config } as LlamaCloudConfig;
  }

  /**
   * Parse PDF file using LlamaCloud API with official asynchronous job-based workflow
   */
  async parsePDF(file: File): Promise<string> {
    // Validate file
    this.validateFile(file);

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        console.log(`PDF parsing attempt ${attempt}/${this.config.maxRetries}`);
        
        // Step 1: Upload file and create parsing job
        const jobId = await this.uploadFile(file);
        console.log(`Created parsing job: ${jobId}`);
        
        // Step 2: Poll for job completion
        const result = await this.pollJobStatus(jobId);
        
        // Step 3: Extract text from result
        const parsedText = this.extractTextFromResult(result);
        
        if (!parsedText || parsedText.trim().length === 0) {
          throw new Error('PDF parsing resulted in empty text');
        }

        console.log(`PDF parsing successful on attempt ${attempt}, extracted ${parsedText.length} characters`);
        return parsedText;

      } catch (error) {
        lastError = error as Error;
        
        console.warn(`PDF parsing attempt ${attempt}/${this.config.maxRetries} failed:`, error);
        
        // Don't retry on certain error types
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            throw new MedskyError('PDF parsing timeout', ERROR_CODES.TIMEOUT, 'parsing');
          }
          if (error.message.includes('401') || error.message.includes('403')) {
            throw new MedskyError('LlamaCloud authentication failed', ERROR_CODES.NETWORK_ERROR, 'parsing');
          }
          if (error.message.includes('FILE_TOO_LARGE')) {
            throw new MedskyError('PDF file too large', ERROR_CODES.FILE_TOO_LARGE, 'parsing');
          }
        }

        // Wait before retry (exponential backoff)
        if (attempt < this.config.maxRetries) {
          const backoffTime = Math.pow(2, attempt) * 1000;
          console.log(`Waiting ${backoffTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
        }
      }
    }

    throw new MedskyError(
      `PDF parsing failed after ${this.config.maxRetries} attempts: ${lastError?.message}`,
      ERROR_CODES.PDF_PARSING_FAILED,
      'parsing'
    );
  }

  /**
   * Step 1: Upload file to LlamaCloud and create parsing job
   */
  private async uploadFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    
    // Use the exact parameter names from LlamaCloud API documentation
    formData.append('parse_mode', this.config.parseMode);
    formData.append('high_res_ocr', this.config.highResOcr.toString());
    formData.append('adaptive_long_table', this.config.adaptiveLongTable.toString());
    formData.append('outlined_table_extraction', this.config.outlinedTableExtraction.toString());
    formData.append('output_tables_as_HTML', this.config.outputTablesAsHTML.toString());

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch('https://api.cloud.llamaindex.ai/api/v1/parsing/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`LlamaCloud upload error (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      
      if (!result.id) {
        throw new Error('No job ID returned from LlamaCloud upload');
      }
      
      return result.id;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Step 2: Poll job status until completion
   */
  private async pollJobStatus(jobId: string): Promise<ParseJobResponse> {
    for (let attempt = 1; attempt <= this.config.maxPollAttempts; attempt++) {
      try {
        const response = await fetch(`https://api.cloud.llamaindex.ai/api/v1/parsing/job/${jobId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Job status check failed (${response.status}): ${errorText}`);
        }

        const jobStatus: ParseJobResponse = await response.json();
        
        console.log(`Job ${jobId} status: ${jobStatus.status} (attempt ${attempt})`);
        
        if (jobStatus.status === 'SUCCESS') {
          console.log(`Job ${jobId} completed successfully, waiting 2s before fetching result...`);
          // Wait a bit after SUCCESS status to ensure result is available
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Get the actual result from the result endpoint
          return await this.getJobResult(jobId);
        } else if (jobStatus.status === 'ERROR') {
          throw new Error(`Parsing job failed: ${jobStatus.error || 'Unknown error'}`);
        }
        
        // Job still pending, wait and retry
        if (attempt < this.config.maxPollAttempts) {
          await new Promise(resolve => setTimeout(resolve, this.config.pollInterval));
        }
      } catch (error) {
        console.warn(`Job status check attempt ${attempt} failed:`, error);
        if (attempt === this.config.maxPollAttempts) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, this.config.pollInterval));
      }
    }
    
    throw new Error(`Job ${jobId} did not complete within ${this.config.maxPollAttempts * this.config.pollInterval / 1000} seconds`);
  }

  /**
   * Step 3: Get the final result from completed job - use text endpoint to match Python
   */
  private async getJobResult(jobId: string): Promise<ParseJobResponse> {
    // Use text endpoint to match Python version: result.pages[i].text
    // Based on API docs, /result/text should return the same format as Python
    const endpoint = `/api/v1/parsing/job/${jobId}/result/text`;
    let lastError: Error | null = null;

    // Retry with increasing delays if result not ready yet
    for (let retryAttempt = 0; retryAttempt < 5; retryAttempt++) {
      try {
        console.log(`Getting result from: ${endpoint} (attempt ${retryAttempt + 1})`);
        
        const response = await fetch(`https://api.cloud.llamaindex.ai${endpoint}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.warn(`Attempt ${retryAttempt + 1} failed (${response.status}): ${errorText}`);
          
          // If 404, the result might not be ready yet, wait and retry
          if (response.status === 404) {
            lastError = new Error(`Result not ready yet: ${errorText}`);
            if (retryAttempt < 4) {
              const waitTime = (retryAttempt + 1) * 5000; // 5s, 10s, 15s, 20s
              console.log(`Result not ready, waiting ${waitTime}ms before retry...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
              continue;
            }
          } else {
            // Other errors are final
            throw new Error(`API error (${response.status}): ${errorText}`);
          }
        } else {
          const result = await response.json();
          console.log(`Successfully got result:`, Object.keys(result));
          
          // Text endpoint should return pages array or text content to match Python version
          if (result.pages && Array.isArray(result.pages)) {
            return {
              id: jobId,
              status: 'SUCCESS',
              result: {
                pages: result.pages,
                text: result.pages.map((page: any) => page.text || '').join('\n\n')
              }
            };
          } else if (result.text) {
            return {
              id: jobId,
              status: 'SUCCESS',
              result: {
                text: result.text,
                pages: [{ text: result.text }]
              }
            };
          } else {
            console.warn('Unexpected response format:', result);
            throw new Error('No text content in response');
          }
        }
      } catch (error) {
        console.warn(`Result fetch attempt ${retryAttempt + 1} error:`, error);
        lastError = error as Error;
        
        // For non-network errors, don't retry
        if (!(error as Error).message.includes('Result not ready yet')) {
          break;
        }
      }
    }
    
    throw lastError || new Error(`Failed to get job result after ${5} attempts`);
  }

  /**
   * Extract text content from parsing result - matches Python version exactly
   */
  private extractTextFromResult(result: ParseJobResponse): string {
    if (!result.result) {
      throw new Error('No result data in completed job');
    }

    let parsedText = '';
    
    // Match Python version: for page in result.pages: f.write(page.text)
    if (result.result.pages && Array.isArray(result.result.pages) && result.result.pages.length > 0) {
      parsedText = result.result.pages
        .map((page: any) => page.text || '')
        .filter(text => text.trim().length > 0)
        .join(''); // Python version doesn't join with newlines, just concatenates
      console.log(`Extracted text from pages format: ${parsedText.length} characters`);
    } else if (result.result.text && result.result.text.trim()) {
      parsedText = result.result.text;
      console.log(`Extracted text from text format: ${parsedText.length} characters`);
    }
    
    if (!parsedText || parsedText.trim().length === 0) {
      console.error('No text content found. Result structure:', {
        hasResult: !!result.result,
        resultKeys: result.result ? Object.keys(result.result) : [],
        textLength: result.result?.text?.length || 0,
        pagesCount: result.result?.pages?.length || 0
      });
      throw new Error('No text content found in parsing result');
    }
    
    return parsedText;
  }

  /**
   * Validate uploaded file
   */
  private validateFile(file: File): void {
    // Check file type
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      throw new MedskyError(
        'Invalid file type. Only PDF files are supported.',
        ERROR_CODES.INVALID_FILE_TYPE,
        'uploading'
      );
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      throw new MedskyError(
        `File too large. Maximum size is ${maxSize / (1024 * 1024)}MB.`,
        ERROR_CODES.FILE_TOO_LARGE,
        'uploading'
      );
    }

    // Check minimum file size (to avoid empty files)
    if (file.size < 1024) { // 1KB minimum
      throw new MedskyError(
        'File too small. Please ensure the PDF contains content.',
        ERROR_CODES.INVALID_FILE_TYPE,
        'uploading'
      );
    }
  }
}

// ===========================
// Public API Functions
// ===========================

/**
 * Parse a PDF file and extract text content using LlamaCloud
 */
export async function parsePDFFile(file: File, config: Partial<LlamaCloudConfig>): Promise<string> {
  const client = new LlamaCloudClient(config);
  return await client.parsePDF(file);
}

/**
 * Create LlamaCloud config from environment variables
 */
export function createPDFConfig(): Partial<LlamaCloudConfig> {
  return {
    apiKey: process.env.LLAMA_API_KEY || '',
    parseMode: process.env.LLAMA_PARSE_MODE || DEFAULT_CONFIG.parseMode,
    // Use exact same config as Python version to minimize costs
    highResOcr: process.env.LLAMA_HIGH_RES_OCR === 'true' || DEFAULT_CONFIG.highResOcr === true,
    adaptiveLongTable: process.env.LLAMA_ADAPTIVE_LONG_TABLE === 'true' || DEFAULT_CONFIG.adaptiveLongTable === true, // Default false to save costs
    outlinedTableExtraction: process.env.LLAMA_TABLE_EXTRACTION === 'true' || DEFAULT_CONFIG.outlinedTableExtraction === true,
    outputTablesAsHTML: process.env.LLAMA_OUTPUT_HTML === 'true' || DEFAULT_CONFIG.outputTablesAsHTML === true,
  };
}

/**
 * Validate PDF configuration
 */
export function validatePDFConfig(config: Partial<LlamaCloudConfig>): string[] {
  const errors: string[] = [];
  
  if (!config.apiKey) {
    errors.push('LLAMA_API_KEY is required');
  }
  
  return errors;
}

// ===========================
// Alternative PDF Processing
// ===========================

/**
 * Fallback PDF processing using browser-based libraries
 * This can be used when LlamaCloud is unavailable
 */
export async function parsePDFClientSide(file: File): Promise<string> {
  try {
    // This would require pdf-parse or similar library
    // For now, we'll throw an error to indicate this needs implementation
    throw new Error('Client-side PDF parsing not implemented yet');
    
    // TODO: Implement client-side parsing as fallback
    // const pdfjsLib = await import('pdfjs-dist/build/pdf');
    // const arrayBuffer = await file.arrayBuffer();
    // const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    // ... extract text from pages
    
  } catch (error) {
    throw new MedskyError(
      `Client-side PDF parsing failed: ${error}`,
      ERROR_CODES.PDF_PARSING_FAILED,
      'parsing'
    );
  }
}

// ===========================
// Utility Functions
// ===========================

/**
 * Check if a PDF file appears to be a Korean student record
 * based on text content analysis
 */
export function validateStudentRecord(parsedText: string): {
  isValid: boolean;
  confidence: number;
  missingElements: string[];
} {
  const requiredElements = [
    '창의적 체험활동상황',
    '교과학습발달상황', 
    '세부능력 및 특기사항'
  ];
  
  const optionalElements = [
    '독서활동상황',
    '행동특성 및 종합의견'
  ];

  let foundRequired = 0;
  let foundOptional = 0;
  const missingElements: string[] = [];

  // Check for required elements
  for (const element of requiredElements) {
    if (parsedText.includes(element)) {
      foundRequired++;
    } else {
      missingElements.push(element);
    }
  }

  // Check for optional elements
  for (const element of optionalElements) {
    if (parsedText.includes(element)) {
      foundOptional++;
    }
  }

  // Calculate confidence score
  const requiredScore = (foundRequired / requiredElements.length) * 0.8;
  const optionalScore = (foundOptional / optionalElements.length) * 0.2;
  const confidence = requiredScore + optionalScore;

  // Consider valid if at least 2/3 required elements are found
  const isValid = foundRequired >= 2;

  return {
    isValid,
    confidence: Math.round(confidence * 100) / 100,
    missingElements
  };
}

/**
 * Extract metadata from parsed PDF text
 */
export function extractDocumentMetadata(parsedText: string) {
  const metadata = {
    studentName: '',
    schoolName: '',
    academicYear: '',
    documentType: '',
    pageCount: 0,
    textLength: parsedText.length
  };

  // Extract student name (usually appears early in the document)
  const nameMatch = parsedText.match(/성\s*명\s*[:：]\s*([가-힣]{2,4})/);
  if (nameMatch) {
    metadata.studentName = nameMatch[1];
  }

  // Extract school name
  const schoolMatch = parsedText.match(/([가-힣]+(?:초등학교|중학교|고등학교))/);
  if (schoolMatch) {
    metadata.schoolName = schoolMatch[1];
  }

  // Extract academic year
  const yearMatch = parsedText.match(/(\d{4})\s*학년도/);
  if (yearMatch) {
    metadata.academicYear = yearMatch[1];
  }

  // Determine document type
  if (parsedText.includes('학교생활기록부')) {
    metadata.documentType = '학교생활기록부';
  } else if (parsedText.includes('생활기록부')) {
    metadata.documentType = '생활기록부';
  }

  // Estimate page count (rough approximation)
  metadata.pageCount = Math.ceil(parsedText.length / 2000);

  return metadata;
}