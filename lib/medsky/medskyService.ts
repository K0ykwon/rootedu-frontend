/**
 * Medsky Main Service
 * 
 * This is the main orchestration service that coordinates all medsky functionality:
 * PDF parsing, text section extraction, LLM data extraction, and validation analysis.
 * 
 * This service provides both individual step functions and a complete processing pipeline.
 */

import { 
  ProcessingResult, 
  ProcessingStatus, 
  TextSections, 
  ExtractedData, 
  ValidationAnalysis,
  MedskyError,
  ERROR_CODES,
  ProcessingStage 
} from '@/types/medsky';
import { getRedisClient } from '@/lib/redis';
import { parsePDFFile, createPDFConfig, validateStudentRecord } from './pdfService';
import { parseAllSections, cleanAllSections, validateParsedSections } from './textParser';
import { extractAllData, runComprehensiveValidation, createLLMConfig, validateLLMConfig } from './llmService';

// ===========================
// Session Management
// ===========================

interface UserInfo {
  id: string;
  name: string;
  email: string;
  analyzedAt: string;
  productId?: string;
}

interface ProcessingSession {
  id: string;
  status: ProcessingStatus;
  result: ProcessingResult;
  startTime: Date;
  lastUpdate: Date;
  userInfo?: UserInfo;
}

// In-memory session storage (augmented with Redis persistence for multi-instance)
const sessions = new Map<string, ProcessingSession>();
const SESSION_PREFIX = 'medsky:session:';
const YAKTOON_ANALYSIS_PREFIX = 'yaktoon:analysis_data:';

async function persistSession(session: ProcessingSession): Promise<void> {
  try {
    const client = await getRedisClient();
    await client.set(`${SESSION_PREFIX}${session.id}`, JSON.stringify(session), { EX: 60 * 60 * 24 });
    await client.quit();
  } catch (_) {
    // Non-fatal: best-effort persistence
  }
}

/**
 * Store completed analysis result in Redis for admin access
 */
async function storeAnalysisForAdmin(sessionId: string, session: ProcessingSession): Promise<void> {
  if (!session.userInfo || !session.result.extractedData || !session.result.validationAnalysis || !session.result.textSections) {
    return; // Skip if missing required data
  }

  try {
    const client = await getRedisClient();
    
    const analysisData = {
      sessionId,
      userInfo: session.userInfo,
      completedAt: new Date().toISOString(),
      result: {
        textSections: session.result.textSections,
        extractedData: session.result.extractedData,
        validationAnalysis: session.result.validationAnalysis,
        status: session.result.status
      },
      processingTime: session.lastUpdate.getTime() - session.startTime.getTime()
    };

    // Batch writes to reduce round-trips
    const ttl = 60 * 60 * 24 * 30;
    const metadata = {
      sessionId,
      productId: session.userInfo.productId || null,
      userId: session.userInfo.id,
      name: session.userInfo.name,
      email: session.userInfo.email,
      createdAt: session.startTime.toISOString(),
      completedAt: new Date().toISOString()
    };
    const multi = client.multi();
    multi.set(`${YAKTOON_ANALYSIS_PREFIX}${sessionId}`, JSON.stringify(analysisData), { EX: ttl } as any);
    multi.sAdd('yaktoon:analysis_sessions', sessionId);
    multi.set(`analysis:${sessionId}:metadata`, JSON.stringify(metadata), { EX: ttl } as any);
    await multi.exec();
    
    await client.quit();
    console.log(`✅ Analysis data stored for admin access: ${sessionId}`);
  } catch (error) {
    console.error('Failed to store analysis data for admin:', error);
    // Non-fatal: best-effort storage
  }
}

async function loadSessionFromStore(sessionId: string): Promise<ProcessingSession | null> {
  try {
    const client = await getRedisClient();
    const raw = await client.get(`${SESSION_PREFIX}${sessionId}`);
    await client.quit();
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ProcessingSession;
    // Warm local cache for faster subsequent access
    sessions.set(sessionId, parsed);
    return parsed;
  } catch (_) {
    return null;
  }
}

/**
 * Create a new processing session
 */
export function createSession(): string {
  const sessionId = `medsky_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  
  const session: ProcessingSession = {
    id: sessionId,
    status: {
      stage: 'uploading',
      progress: 0,
      message: '파일 업로드 준비 중...'
    },
    result: {
      status: {
        stage: 'uploading',
        progress: 0,
        message: '파일 업로드 준비 중...'
      }
    },
    startTime: new Date(),
    lastUpdate: new Date()
  };

  sessions.set(sessionId, session);
  // Best-effort persistence
  void persistSession(session);
  return sessionId;
}

/**
 * Update session status
 */
function updateSessionStatus(sessionId: string, status: ProcessingStatus): void {
  const session = sessions.get(sessionId);
  if (session) {
    // Prevent status regression once completed
    if (session.status.stage === 'completed') {
      return;
    }
    session.status = status;
    session.result.status = status;
    session.lastUpdate = new Date();
    void persistSession(session);
    
    // Store analysis data for admin when processing completes successfully
    if (status.stage === 'completed') {
      void storeAnalysisForAdmin(sessionId, session);
    }
  }
}

/**
 * Update session result
 */
function updateSessionResult(sessionId: string, updates: Partial<ProcessingResult>): void {
  const session = sessions.get(sessionId);
  if (session) {
    session.result = { ...session.result, ...updates };
    session.lastUpdate = new Date();
    void persistSession(session);
  }
}

/**
 * Mark session completed if both extraction and validation are done
 */
function markCompletedIfAllDone(sessionId: string): void {
  const session = sessions.get(sessionId);
  if (!session) return;
  const hasExtraction = Boolean(session.result.extractedData);
  const hasValidation = Boolean(session.result.validationAnalysis);
  if (hasExtraction && hasValidation) {
    updateSessionStatus(sessionId, {
      stage: 'completed',
      progress: 100,
      message: '모든 분석이 완료되었습니다!'
    });
  }
}

/**
 * Get session data
 */
export function getSession(sessionId: string): ProcessingSession | null {
  const found = sessions.get(sessionId);
  if (found) return found;
  // Attempt to load from Redis synchronously via async kick (cannot block), so return null for now
  // Consumers should call getProcessingStatus/getProcessingResult which handle absence gracefully.
  void loadSessionFromStore(sessionId);
  return sessions.get(sessionId) || null;
}

/**
 * Clean up old sessions (call periodically)
 */
export function cleanupOldSessions(maxAgeHours: number = 24): number {
  const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
  let cleaned = 0;

  for (const [sessionId, session] of sessions) {
    if (session.lastUpdate < cutoffTime) {
      sessions.delete(sessionId);
      cleaned++;
    }
  }

  return cleaned;
}

// ===========================
// Individual Processing Steps
// ===========================

/**
 * Step 1: Parse PDF file and extract raw text
 */
export async function processPDFUpload(file: File, sessionId?: string): Promise<{
  sessionId: string;
  parsedText: string;
}> {
  const actualSessionId = sessionId || createSession();
  
  try {
    updateSessionStatus(actualSessionId, {
      stage: 'parsing',
      progress: 10,
      message: 'PDF 파일 파싱 중...'
    });

    // Parse PDF using LlamaCloud
    const pdfConfig = createPDFConfig();
    const parsedText = await parsePDFFile(file, pdfConfig);

    // Validate that it's a student record
    const validation = validateStudentRecord(parsedText);
    if (!validation.isValid) {
      throw new MedskyError(
        `업로드된 파일이 학생생활기록부가 아닌 것 같습니다. 확신도: ${validation.confidence * 100}%`,
        ERROR_CODES.INVALID_FILE_TYPE,
        'parsing'
      );
    }

    updateSessionResult(actualSessionId, { parsedText });
    updateSessionStatus(actualSessionId, {
      stage: 'extracting',
      progress: 25,
      message: 'PDF 파싱 완료. 텍스트 섹션 추출 준비 중...'
    });

    return {
      sessionId: actualSessionId,
      parsedText
    };

  } catch (error) {
    const errorMessage = error instanceof MedskyError ? error.message : `PDF 처리 중 오류 발생: ${error}`;
    updateSessionStatus(actualSessionId, {
      stage: 'error',
      progress: 0,
      message: errorMessage,
      error: errorMessage
    });
    throw error;
  }
}

/**
 * Step 2: Extract text sections using regex patterns
 */
export async function processTextExtraction(parsedText: string, sessionId: string): Promise<TextSections> {
  try {
    console.log(`📝 Processing text extraction for session ${sessionId}`);
    updateSessionStatus(sessionId, {
      stage: 'extracting',
      progress: 40,
      message: '텍스트 섹션 추출 중...'
    });

    // Parse sections using regex
    console.log('   - Parsing sections with regex...');
    const rawSections = parseAllSections(parsedText);
    console.log('   - Cleaning sections...');
    const cleanSections = cleanAllSections(rawSections);
    
    // Log section statistics
    console.log('   - Section extraction results:');
    console.log(`     * Creative Activities: ${cleanSections.creativeActivities.length} characters`);
    console.log(`     * Academic Development: ${cleanSections.academicDevelopment.length} characters`);
    console.log(`     * Detailed Abilities: ${cleanSections.detailedAbilities.length} characters`);
    console.log(`     * Reading Activities: ${cleanSections.readingActivities.length} characters`);
    console.log(`     * Behavioral Characteristics: ${cleanSections.behavioralCharacteristics.length} characters`);
    
    // Validate that required sections were found
    const missingSections = validateParsedSections(cleanSections);
    if (missingSections.length > 0) {
      console.error(`❌ Missing required sections: ${missingSections.join(', ')}`);
      throw new MedskyError(
        `필수 섹션을 찾을 수 없습니다: ${missingSections.join(', ')}`,
        ERROR_CODES.SECTION_EXTRACTION_FAILED,
        'extracting'
      );
    }

    updateSessionResult(sessionId, { textSections: cleanSections });
    updateSessionStatus(sessionId, {
      stage: 'analyzing',
      progress: 55,
      message: '텍스트 섹션 추출 완료. LLM 데이터 분석 준비 중...'
    });

    console.log(`✅ Text extraction completed for session ${sessionId}`);
    return cleanSections;

  } catch (error) {
    console.error(`❌ Text extraction failed for session ${sessionId}:`, error);
    const errorMessage = error instanceof MedskyError ? error.message : `텍스트 추출 중 오류 발생: ${error}`;
    updateSessionStatus(sessionId, {
      stage: 'error',
      progress: 0,
      message: errorMessage,
      error: errorMessage
    });
    throw error;
  }
}

/**
 * Step 3: Extract structured data using LLM
 */
export async function processDataExtraction(textSections: TextSections, sessionId: string): Promise<ExtractedData> {
  try {
    console.log(`🤖 Processing LLM data extraction for session ${sessionId}`);
    updateSessionStatus(sessionId, {
      stage: 'analyzing',
      progress: 70,
      message: 'LLM을 사용한 데이터 구조화 중...'
    });

    // Extract structured data using LLM
    console.log('   - Creating LLM config...');
    const llmConfig = createLLMConfig();
    
    // Validate LLM config
    const configErrors = validateLLMConfig(llmConfig);
    if (configErrors.length > 0) {
      throw new MedskyError(`LLM configuration error: ${configErrors.join(', ')}`, ERROR_CODES.LLM_EXTRACTION_FAILED, 'analyzing');
    }
    
    console.log('   - Starting parallel LLM extraction (3 tasks)...');
    const extractedData = await extractAllData(
      textSections.creativeActivities,
      textSections.academicDevelopment,
      textSections.detailedAbilities,
      llmConfig
    );
    
    console.log('   - LLM extraction results:');
    console.log(`     * Creative Activities: ${extractedData.creativeActivities?.창의적체험활동상황.length || 0} entries`);
    console.log(`     * Academic Developments: ${extractedData.academicDevelopments?.교과학습발달상황.length || 0} entries`);
    console.log(`     * Detailed Abilities: ${extractedData.detailedAbilities?.세부특기사항.length || 0} entries`);

    updateSessionResult(sessionId, { extractedData });
    updateSessionStatus(sessionId, {
      stage: 'validating',
      progress: 85,
      message: '데이터 추출 완료. 검증 분석 중...'
    });

    console.log(`✅ LLM data extraction completed for session ${sessionId}`);
    return extractedData;

  } catch (error) {
    console.error(`❌ LLM data extraction failed for session ${sessionId}:`, error);
    const errorMessage = error instanceof MedskyError ? error.message : `데이터 추출 중 오류 발생: ${error}`;
    updateSessionStatus(sessionId, {
      stage: 'error',
      progress: 0,
      message: errorMessage,
      error: errorMessage
    });
    throw error;
  }
}

/**
 * Step 4: Run validation analysis
 */
export async function processValidation(textSections: TextSections, sessionId: string): Promise<ValidationAnalysis> {
  try {
    updateSessionStatus(sessionId, {
      stage: 'validating',
      progress: 95,
      message: '종합 검증 분석 진행 중...'
    });

    // Run comprehensive validation on text sections (matches Python implementation)
    const llmConfig = createLLMConfig();
    
    // Ensure all required text sections exist for validation
    if (!textSections.creativeActivities || !textSections.academicDevelopment || !textSections.detailedAbilities) {
      throw new Error('Incomplete text sections - cannot proceed with validation');
    }
    
    const validationAnalysis = await runComprehensiveValidation({
      creativeActivities: textSections.creativeActivities,
      academicDevelopment: textSections.academicDevelopment,
      detailedAbilities: textSections.detailedAbilities
    }, llmConfig);

    updateSessionResult(sessionId, { validationAnalysis });
    // Do not mark as completed here to allow parallel execution coordination
    return validationAnalysis;

  } catch (error) {
    const errorMessage = error instanceof MedskyError ? error.message : `검증 분석 중 오류 발생: ${error}`;
    updateSessionStatus(sessionId, {
      stage: 'error',
      progress: 0,
      message: errorMessage,
      error: errorMessage
    });
    throw error;
  }
}

// ===========================
// Complete Processing Pipeline
// ===========================

/**
 * Process entire medsky pipeline from PDF upload to validation analysis
 */
export async function processCompleteAnalysis(
  file: File,
  onStatusUpdate?: (status: ProcessingStatus) => void
): Promise<{
  sessionId: string;
  result: ProcessingResult;
}> {
  let sessionId: string = '';
  
  try {
    console.log('🚀 Starting complete medsky analysis pipeline...');
    
    // Step 1: Parse PDF
    console.log('📄 Step 1/4: Starting PDF parsing...');
    const pdfResult = await processPDFUpload(file);
    sessionId = pdfResult.sessionId;
    console.log(`✅ Step 1/4: PDF parsing completed (${pdfResult.parsedText.length} characters)`);
    
    if (onStatusUpdate) {
      const session = getSession(sessionId);
      if (session) onStatusUpdate(session.status);
    }

    // Step 2: Extract text sections
    console.log('📝 Step 2/4: Starting text section extraction...');
    const textSections = await processTextExtraction(pdfResult.parsedText, sessionId);
    console.log('✅ Step 2/4: Text section extraction completed');
    console.log(`   - Creative Activities: ${textSections.creativeActivities.length} chars`);
    console.log(`   - Academic Development: ${textSections.academicDevelopment.length} chars`);
    console.log(`   - Detailed Abilities: ${textSections.detailedAbilities.length} chars`);
    
    if (onStatusUpdate) {
      const session = getSession(sessionId);
      if (session) onStatusUpdate(session.status);
    }

    // Steps 3 & 4: Extract structured data and run validation in parallel
    console.log('🤖 Step 3/4: Starting LLM data extraction...');
    console.log('🔍 Step 4/4: Starting validation analysis...');
    const [extractedData, validationAnalysis] = await Promise.all([
      (async () => {
        const data = await processDataExtraction(textSections, sessionId);
        console.log('✅ Step 3/4: LLM data extraction completed');
        console.log(`   - Creative Activities: ${data.creativeActivities?.창의적체험활동상황.length || 0} entries`);
        console.log(`   - Academic Developments: ${data.academicDevelopments?.교과학습발달상황.length || 0} entries`);
        console.log(`   - Detailed Abilities: ${data.detailedAbilities?.세부특기사항.length || 0} entries`);
        if (onStatusUpdate) {
          const session = getSession(sessionId);
          if (session) onStatusUpdate(session.status);
        }
        return data;
      })(),
      (async () => {
        const validation = await processValidation(textSections, sessionId);
        console.log('✅ Step 4/4: Validation analysis completed');
        const totalFeedbacks = Object.values(validation).reduce((sum, result) => sum + result.Feedbacks.length, 0);
        console.log(`   - Total validation feedback items: ${totalFeedbacks}`);
        if (onStatusUpdate) {
          const session = getSession(sessionId);
          if (session) onStatusUpdate(session.status);
        }
        return validation;
      })()
    ]);

    // Mark as completed when both are done
    markCompletedIfAllDone(sessionId);
    if (onStatusUpdate) {
      const session = getSession(sessionId);
      if (session) onStatusUpdate(session.status);
    }

    const finalSession = getSession(sessionId);
    if (!finalSession) {
      throw new MedskyError('Session lost during processing', ERROR_CODES.UNKNOWN_ERROR);
    }

    console.log('🎉 Complete medsky analysis pipeline finished successfully!');
    return {
      sessionId,
      result: finalSession.result
    };

  } catch (error) {
    console.error(`❌ Error in medsky pipeline (sessionId: ${sessionId}):`, error);
    if (sessionId && onStatusUpdate) {
      const session = getSession(sessionId);
      if (session) onStatusUpdate(session.status);
    }
    throw error;
  }
}

/**
 * Start complete processing pipeline in background for an existing session.
 * Returns immediately; updates session status/result as it progresses.
 */
export function startProcessingPipeline(sessionId: string, file: File, userInfo?: UserInfo, onStatusUpdate?: (status: ProcessingStatus) => void): void {
  // Add user info to session if provided
  if (userInfo) {
    const session = sessions.get(sessionId);
    if (session) {
      session.userInfo = userInfo;
      sessions.set(sessionId, session);
      // Persist updated session
      persistSession(session);
    }
  }

  // Fire-and-forget async pipeline
  (async () => {
    try {
      // Step 1: Parse PDF
      const pdfResult = await processPDFUpload(file, sessionId);
      onStatusUpdate?.(getProcessingStatus(sessionId)!);

      // Step 2: Extract text sections
      const textSections = await processTextExtraction(pdfResult.parsedText, sessionId);
      onStatusUpdate?.(getProcessingStatus(sessionId)!);

      // Steps 3 & 4 in parallel: extraction and validation
      await Promise.all([
        (async () => {
          await processDataExtraction(textSections, sessionId);
          onStatusUpdate?.(getProcessingStatus(sessionId)!);
        })(),
        (async () => {
          await processValidation(textSections, sessionId);
          onStatusUpdate?.(getProcessingStatus(sessionId)!);
        })()
      ]);

      // Mark as completed when both are done
      markCompletedIfAllDone(sessionId);
      onStatusUpdate?.(getProcessingStatus(sessionId)!);
    } catch (error) {
      // Errors are already recorded in session status by each step
      // No-op here
    }
  })();
}

// ===========================
// Status Monitoring
// ===========================

/**
 * Get current processing status for a session
 */
export function getProcessingStatus(sessionId: string): ProcessingStatus | null {
  let session = sessions.get(sessionId);
  if (!session) {
    // Try to synchronously fetch from Redis (async not allowed here), so we initiate load and return null if not cached yet
    // Next poll will likely hit warmed cache
    return null;
  }
  return session.status;
}

/**
 * Async variant that can load from Redis if not present in memory.
 */
export async function getProcessingStatusAsync(sessionId: string): Promise<ProcessingStatus | null> {
  let session = sessions.get(sessionId);
  if (session) return session.status;
  const loaded = await loadSessionFromStore(sessionId);
  return loaded ? loaded.status : null;
}

/**
 * Get complete processing result for a session
 */
export function getProcessingResult(sessionId: string): ProcessingResult | null {
  let session = sessions.get(sessionId);
  if (!session) {
    return null;
  }
  return session.result;
}

/**
 * Async variant that can load from Redis if not present in memory.
 */
export async function getProcessingResultAsync(sessionId: string): Promise<ProcessingResult | null> {
  let session = sessions.get(sessionId);
  if (session) return session.result;
  const loaded = await loadSessionFromStore(sessionId);
  return loaded ? loaded.result : null;
}

/**
 * Check if processing is complete for a session
 */
export function isProcessingComplete(sessionId: string): boolean {
  const status = getProcessingStatus(sessionId);
  return status ? (status.stage === 'completed' || status.stage === 'error') : false;
}

// ===========================
// Error Recovery
// ===========================

/**
 * Retry failed processing from the last successful stage
 */
export async function retryProcessing(
  sessionId: string,
  file?: File,
  onStatusUpdate?: (status: ProcessingStatus) => void
): Promise<ProcessingResult> {
  const session = getSession(sessionId);
  if (!session) {
    throw new MedskyError('Session not found', ERROR_CODES.UNKNOWN_ERROR);
  }

  const { result } = session;
  
  try {
    // Determine where to restart based on what data we have
    if (!result.parsedText && file) {
      // Restart from PDF parsing
      const pdfResult = await processPDFUpload(file, sessionId);
      result.parsedText = pdfResult.parsedText;
    }

    if (!result.textSections && result.parsedText) {
      // Restart from text extraction
      result.textSections = await processTextExtraction(result.parsedText, sessionId);
    }

    if (!result.extractedData && result.textSections) {
      // Restart from data extraction
      result.extractedData = await processDataExtraction(result.textSections, sessionId);
    }

    if (!result.validationAnalysis && result.textSections) {
      // Restart from validation
      result.validationAnalysis = await processValidation(result.textSections, sessionId);
    }

    if (onStatusUpdate) {
      const updatedSession = getSession(sessionId);
      if (updatedSession) onStatusUpdate(updatedSession.status);
    }

    return result;

  } catch (error) {
    if (onStatusUpdate) {
      const updatedSession = getSession(sessionId);
      if (updatedSession) onStatusUpdate(updatedSession.status);
    }
    throw error;
  }
}

// ===========================
// Configuration Validation
// ===========================

/**
 * Validate that all required environment variables are set
 */
export function validateConfiguration(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check PDF parsing config
  if (!process.env.LLAMA_API_KEY) {
    errors.push('LLAMA_API_KEY environment variable is required');
  }

  // Check LLM config
  if (!process.env.OPENAI_API_KEY) {
    errors.push('OPENAI_API_KEY environment variable is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// ===========================
// Health Check
// ===========================

/**
 * Check system health and external service availability
 */
export async function healthCheck(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    llamaCloud: 'available' | 'unavailable';
    openai: 'available' | 'unavailable';
  };
  errors: string[];
}> {
  const errors: string[] = [];
  const services: {
    llamaCloud: 'available' | 'unavailable';
    openai: 'available' | 'unavailable';
  } = {
    llamaCloud: 'unavailable',
    openai: 'unavailable'
  };

  // Test LlamaCloud availability (simple ping)
  try {
    const response = await fetch('https://api.llamaindex.ai/health', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.LLAMA_API_KEY}`
      },
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    
    if (response.ok) {
      services.llamaCloud = 'available';
    }
  } catch (error) {
    errors.push(`LlamaCloud: ${error}`);
  }

  // Test OpenAI availability
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    
    if (response.ok) {
      services.openai = 'available';
    }
  } catch (error) {
    errors.push(`OpenAI: ${error}`);
  }

  // Determine overall status
  let status: 'healthy' | 'degraded' | 'unhealthy';
  const availableServices = Object.values(services).filter(s => s === 'available').length;
  
  if (availableServices === 2) {
    status = 'healthy';
  } else if (availableServices === 1) {
    status = 'degraded';
  } else {
    status = 'unhealthy';
  }

  return { status, services, errors };
}