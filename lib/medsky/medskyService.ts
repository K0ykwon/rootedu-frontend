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
  ProcessingStage,
  ManualInputState,
  ManualCompetencyInput,
  KeywordOverride,
} from '@/types/medsky';
import { getRedisClient } from '@/lib/redis';
import { parsePDFFile, createPDFConfig, validateStudentRecord } from './pdfService';
import { parseAllSections, cleanAllSections, validateParsedSections } from './textParser';
import {
  extractAllData,
  runComprehensiveValidation,
  createLLMConfig,
  validateLLMConfig,
  generateSummaryDraft,
  SummaryDraftInput,
} from './llmService';
import { buildGradeTrendReport } from './transformers/gradeTrends';
import { buildCompetencyScores } from './transformers/competencyScores';
import { buildMajorAlignment } from './transformers/majorAlignment';
import { buildKeywordMatrix } from './transformers/keywordMatrix';
// Enhanced AI services
import { extractAIKeywords } from './ai/keywordExtractor';
import { performAISectionScoring } from './ai/sectionScorer';
import { performEnhancedAcademicAnalysis } from './ai/academicAnalyzer';
import { generateAIMajorRecommendations } from './ai/majorRecommender';
import { generateNextSemesterPlan } from './ai/studyPlanner';

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
// Dynamic analysis prefix - will be set based on product context
let CURRENT_INFLUENCER_SLUG = 'yaktoon'; // Default fallback

/**
 * Generate Redis key prefix for analysis data based on influencer slug
 */
function getAnalysisPrefix(influencerSlug: string = CURRENT_INFLUENCER_SLUG): string {
  return `${influencerSlug}:analysis_data:`;
}

/**
 * Generate Redis key for analysis sessions list
 */
function getSessionsKey(influencerSlug: string = CURRENT_INFLUENCER_SLUG): string {
  return `${influencerSlug}:analysis_sessions`;
}

/**
 * Extract influencer slug from various sources with fallback
 */
function getInfluencerSlug(session?: ProcessingSession, explicit?: string): string {
  // Priority: explicit > session.userInfo.productId > session.userInfo.id > default
  return explicit ||
         session?.userInfo?.productId ||
         session?.userInfo?.id ||
         CURRENT_INFLUENCER_SLUG;
}

/**
 * Validate that analysis data is complete and ready for storage
 */
function validateAnalysisData(session: ProcessingSession): { isValid: boolean; missingFields: string[] } {
  const missing: string[] = [];

  if (!session.userInfo) {
    missing.push('userInfo');
  } else {
    if (!session.userInfo.id) missing.push('userInfo.id');
    if (!session.userInfo.name) missing.push('userInfo.name');
    if (!session.userInfo.email) missing.push('userInfo.email');
  }

  if (!session.result) {
    missing.push('result');
  } else {
    if (!session.result.textSections) missing.push('result.textSections');
    if (!session.result.extractedData) missing.push('result.extractedData');
    if (!session.result.validationAnalysis) missing.push('result.validationAnalysis');
  }

  return {
    isValid: missing.length === 0,
    missingFields: missing
  };
}

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
async function storeAnalysisForAdmin(sessionId: string, session: ProcessingSession, influencerSlug?: string): Promise<void> {
  console.log(`🏪 Attempting to store analysis for admin access: ${sessionId}`);

  // Validate analysis data is complete
  const validation = validateAnalysisData(session);
  if (!validation.isValid) {
    console.warn(`⚠️ Analysis data incomplete for session ${sessionId}:`, {
      missingFields: validation.missingFields
    });
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
        gradeTrends: session.result.gradeTrends,
        competencyScores: session.result.competencyScores,
        majorAlignment: session.result.majorAlignment,
        keywordMatrix: session.result.keywordMatrix,
        summaryDraft: session.result.summaryDraft,
        consultantNotes: session.result.consultantNotes,
        status: session.result.status,
        // AI Enhanced Analysis Fields
        ai_keyword_analysis: session.result.ai_keyword_analysis,
        ai_section_scoring: session.result.ai_section_scoring,
        enhanced_academic_analysis: session.result.enhanced_academic_analysis,
        ai_major_recommendations: session.result.ai_major_recommendations,
        next_semester_plan: session.result.next_semester_plan,
        ai_analysis_timestamp: session.result.ai_analysis_timestamp,
        ai_model_versions: session.result.ai_model_versions
      },
      processingTime: session.lastUpdate.getTime() - session.startTime.getTime(),
      // Approval workflow fields
      approvalStatus: 'pending_review',
      approvedAt: null,
      approvedBy: null,
      influencerNotes: null
    };

    // Batch writes to reduce round-trips
    const ttl = 60 * 60 * 24 * 365; // 1 year (effectively permanent)
    const metadata = {
      sessionId,
      productId: session.userInfo!.productId || null,
      userId: session.userInfo!.id,
      name: session.userInfo!.name,
      email: session.userInfo!.email,
      createdAt: session.startTime.toISOString(),
      completedAt: new Date().toISOString()
    };

    // Determine influencer slug using helper function
    const slug = getInfluencerSlug(session, influencerSlug);

    const analysisKey = `${getAnalysisPrefix(slug)}${sessionId}`;
    const sessionsKey = getSessionsKey(slug);
    const metadataKey = `analysis:${sessionId}:metadata`;

    // Validate user ID exists
    if (!session.userInfo?.id) {
      throw new Error('User ID is required for storing analysis data');
    }

    console.log(`📝 Storing analysis data in Redis for influencer "${slug}":`, {
      analysisKey,
      sessionsKey,
      metadataKey,
      influencerSlug: slug,
      userInfo: {
        id: session.userInfo!.id,
        name: session.userInfo!.name,
        productId: session.userInfo!.productId
      },
      ttl: `${ttl} seconds (${Math.round(ttl / 60 / 60 / 24)} days)`
    });

    // Also store under user-specific key for user's own access with product namespace
    const userAnalysisKey = `user:${session.userInfo!.id}:medsky:analysis:${sessionId}`;
    const userSessionsKey = `user:${session.userInfo!.id}:medsky:analysis_sessions`;

    // Approval workflow tracking keys
    const pendingReviewsKey = `${slug}:pending_reviews`;

    const multi = client.multi();

    // Store under influencer key (for admin/influencer access)
    multi.set(analysisKey, JSON.stringify(analysisData), { EX: ttl } as any);
    multi.sAdd(sessionsKey, sessionId);
    multi.set(metadataKey, JSON.stringify(metadata), { EX: ttl } as any);

    // Store under user key (for user's own access)
    multi.set(userAnalysisKey, JSON.stringify(analysisData), { EX: ttl } as any);
    multi.sAdd(userSessionsKey, sessionId);

    // Add to pending reviews set for influencer workflow
    multi.sAdd(pendingReviewsKey, sessionId);

    await multi.exec();

    await client.quit();
    console.log(`✅ Analysis data stored for admin and user access: ${sessionId}`, {
      sessionId,
      influencerKey: analysisKey,
      userKey: userAnalysisKey,
      userId: session.userInfo!.id,
      userIdType: typeof session.userInfo!.id
    });
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
      // Determine influencer slug from session userInfo
      const influencerSlug = session.userInfo?.productId || undefined;
      void storeAnalysisForAdmin(sessionId, session, influencerSlug);
    }
  }
}

/**
 * Update session result and persist to Redis analysis_data key
 */
async function updateSessionResult(sessionId: string, updates: Partial<ProcessingResult>): Promise<void> {
  const session = sessions.get(sessionId);
  if (!session) {
    console.warn(`⚠️ Session ${sessionId} not found for update`);
    return;
  }

  // Update in-memory session
  session.result = { ...session.result, ...updates };
  session.lastUpdate = new Date();

  // Persist to Redis - write to the SAME key frontend reads from
  try {
    const client = await getRedisClient();

    // Determine influencer slug from session
    const slug = getInfluencerSlug(session);

    // Primary key: influencer's analysis data (what frontend reads)
    const analysisKey = `${getAnalysisPrefix(slug)}${sessionId}`;

    // Get existing analysis data
    const existingData = await client.get(analysisKey);

    if (existingData) {
      const analysisData = JSON.parse(existingData);

      // Update the nested result object with new data
      analysisData.result = {
        ...analysisData.result,
        ...updates
      };

      // Save back with permanent TTL (1 year)
      const ttl = 60 * 60 * 24 * 365;
      await client.set(analysisKey, JSON.stringify(analysisData), { EX: ttl });

      console.log(`✅ Updated analysis key: ${analysisKey}`, {
        updatedFields: Object.keys(updates)
      });

      // Also update user-specific key if it exists
      if (session.userInfo?.id) {
        const userKey = `user:${session.userInfo.id}:medsky:analysis:${sessionId}`;
        const userData = await client.get(userKey);

        if (userData) {
          const userAnalysisData = JSON.parse(userData);
          userAnalysisData.result = {
            ...userAnalysisData.result,
            ...updates
          };
          await client.set(userKey, JSON.stringify(userAnalysisData), { EX: ttl });
          console.log(`✅ Updated user key: ${userKey}`);
        }
      }
    } else {
      console.warn(`⚠️ Analysis data key not found: ${analysisKey}. This may be a new session.`);
    }

    await client.quit();
  } catch (error) {
    console.error(`❌ Failed to update analysis data for ${sessionId}:`, error);
    // Don't throw - allow in-memory session to continue
  }
}

/**
 * Mark session completed if both extraction and validation are done
 */
function markCompletedIfAllDone(sessionId: string): void {
  const session = sessions.get(sessionId);
  if (!session) {
    console.warn(`⚠️ Session ${sessionId} not found when trying to mark as completed`);
    return;
  }

  const hasExtraction = Boolean(session.result.extractedData);
  const hasValidation = Boolean(session.result.validationAnalysis);

  console.log(`🔍 Checking completion status for session ${sessionId}:`, {
    hasExtraction,
    hasValidation,
    hasUserInfo: !!session.userInfo,
    currentStage: session.status.stage
  });

  if (hasExtraction && hasValidation) {
    console.log(`🎉 Marking session ${sessionId} as completed!`);
    updateSessionStatus(sessionId, {
      stage: 'completed',
      progress: 100,
      message: '모든 분석이 완료되었습니다!'
    });
  } else {
    console.log(`⏳ Session ${sessionId} not ready for completion yet`);
  }
}

async function finalizeReportAnalytics(
  sessionId: string,
  extractedData: ExtractedData | undefined,
  validationAnalysis: ValidationAnalysis | undefined
): Promise<void> {
  if (!extractedData || !validationAnalysis) {
    return;
  }

  const session = getSession(sessionId);
  const manualInputs = session?.result.manualInputs;
  const consultantNotes = session?.result.consultantNotes;

  // Build traditional transformers first
  const gradeTrends = buildGradeTrendReport(extractedData);
  const competencyScores = buildCompetencyScores(validationAnalysis, manualInputs);
  const majorAlignment = buildMajorAlignment(extractedData, manualInputs);
  const keywordMatrix = buildKeywordMatrix(extractedData, manualInputs);

  const analyticsUpdates: Partial<ProcessingResult> = {};
  if (gradeTrends) analyticsUpdates.gradeTrends = gradeTrends;
  if (competencyScores) analyticsUpdates.competencyScores = competencyScores;
  if (majorAlignment) analyticsUpdates.majorAlignment = majorAlignment;
  if (keywordMatrix) analyticsUpdates.keywordMatrix = keywordMatrix;

  if (Object.keys(analyticsUpdates).length > 0) {
    updateSessionResult(sessionId, analyticsUpdates);
  }

  // Enhanced AI Analysis Pipeline
  console.log('🤖 Starting enhanced AI analysis pipeline...');

  try {
    // Get text sections for AI analysis
    const textSections = session?.result.textSections;
    if (!textSections) {
      console.warn('⚠️ No text sections available for AI analysis');
      return;
    }

    // Step 1: AI Keyword Extraction
    console.log('📝 1/5 Extracting AI keywords...');
    const aiKeywords = await extractAIKeywords(textSections, extractedData);

    // Step 2: AI Section Scoring
    console.log('🎯 2/5 Performing AI section scoring...');
    const aiScoring = await performAISectionScoring(textSections, extractedData, validationAnalysis);

    // Step 3: Enhanced Academic Analysis
    console.log('📚 3/5 Performing enhanced academic analysis...');
    const enhancedAcademic = await performEnhancedAcademicAnalysis(extractedData);

    // Step 4: AI Major Recommendations
    console.log('🎓 4/5 Generating AI major recommendations...');
    const aiMajorRecommendations = await generateAIMajorRecommendations(
      extractedData,
      aiKeywords,
      aiScoring,
      enhancedAcademic
    );

    // Step 5: Next Semester Study Plan
    console.log('📅 5/5 Generating next semester study plan...');
    const nextSemesterPlan = await generateNextSemesterPlan(
      extractedData,
      aiKeywords,
      aiScoring,
      enhancedAcademic,
      aiMajorRecommendations
    );

    // Store enhanced AI results
    const enhancedAnalysisUpdates = {
      ai_keyword_analysis: aiKeywords,
      ai_section_scoring: aiScoring,
      enhanced_academic_analysis: enhancedAcademic,
      ai_major_recommendations: aiMajorRecommendations,
      next_semester_plan: nextSemesterPlan,
      ai_analysis_timestamp: new Date().toISOString(),
      ai_model_versions: {
        keyword_model: 'gpt-4o-mini',
        scoring_model: 'gpt-4o-mini',
        recommendation_model: 'gpt-4o-mini'
      }
    };

    updateSessionResult(sessionId, enhancedAnalysisUpdates);

    console.log('✅ Enhanced AI analysis pipeline completed successfully!', {
      keywordsExtracted: aiKeywords.sections.length,
      sectionsScored: aiScoring.section_scores.length,
      subjectsAnalyzed: enhancedAcademic.subject_analysis.length,
      topRecommendations: aiMajorRecommendations.top_recommendations.length,
      hasStudyPlan: !!nextSemesterPlan.academic_plan
    });

  } catch (aiError) {
    console.error('❌ Enhanced AI analysis failed:', aiError);

    // Store error information but don't fail the entire pipeline
    updateSessionResult(sessionId, {
      ai_analysis_error: {
        message: aiError instanceof Error ? aiError.message : 'Unknown AI analysis error',
        timestamp: new Date().toISOString(),
        stage: 'ai_analysis'
      }
    });
  }

  try {
    const llmConfig = createLLMConfig();
    const configErrors = validateLLMConfig(llmConfig);
    if (configErrors.length > 0) {
      throw new Error(`LLM config invalid: ${configErrors.join(', ')}`);
    }

    const summaryInput: SummaryDraftInput = {
      gradeTrends,
      competencyScores,
      majorAlignment,
      keywordMatrix,
      consultantNotes,
    };

    const summary = await generateSummaryDraft(summaryInput, llmConfig);
    updateSessionResult(sessionId, { summaryDraft: summary });
  } catch (error) {
    console.warn('Summary draft generation failed:', error);
    updateSessionResult(sessionId, {
      summaryDraft: {
        aiDraft: '자동 요약을 생성하지 못했습니다. 수동으로 요약을 입력해주세요.',
        strengths: [],
        improvements: [],
        recommendations: [],
        updatedAt: new Date().toISOString(),
      },
    });
  }

  markCompletedIfAllDone(sessionId);
}

async function recomputeAnalytics(sessionId: string): Promise<ProcessingResult> {
  const currentResult = await getOrLoadSessionResult(sessionId);
  await finalizeReportAnalytics(sessionId, currentResult.extractedData, currentResult.validationAnalysis);
  return await getOrLoadSessionResult(sessionId);
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

async function getOrLoadSessionResult(sessionId: string): Promise<ProcessingResult> {
  const session = sessions.get(sessionId);
  if (session) return session.result;
  const loaded = await loadSessionFromStore(sessionId);
  if (!loaded) {
    throw new MedskyError('Session not found', ERROR_CODES.UNKNOWN_ERROR);
  }
  return loaded.result;
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

    await finalizeReportAnalytics(sessionId, extractedData, validationAnalysis);

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
      const [extractedData, validationAnalysis] = await Promise.all([
        (async () => {
          const data = await processDataExtraction(textSections, sessionId);
          onStatusUpdate?.(getProcessingStatus(sessionId)!);
          return data;
        })(),
        (async () => {
          const validation = await processValidation(textSections, sessionId);
          onStatusUpdate?.(getProcessingStatus(sessionId)!);
          return validation;
        })()
      ]);

      await finalizeReportAnalytics(sessionId, extractedData, validationAnalysis);
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

export async function updateManualCompetencyScores(
  sessionId: string,
  inputs: ManualCompetencyInput[]
): Promise<ProcessingResult> {
  const now = new Date().toISOString();
  const current = await getOrLoadSessionResult(sessionId);
  const manualInputs: ManualInputState = {
    ...(current.manualInputs ?? {}),
    competencyInputs: inputs,
    updatedAt: now,
  };
  updateSessionResult(sessionId, { manualInputs });
  return await recomputeAnalytics(sessionId);
}

export async function updateManualTargetMajor(
  sessionId: string,
  payload: { targetUniversity?: string; targetMajor?: string }
): Promise<ProcessingResult> {
  const now = new Date().toISOString();
  const current = await getOrLoadSessionResult(sessionId);
  const manualInputs: ManualInputState = {
    ...(current.manualInputs ?? {}),
    targetUniversity: payload.targetUniversity ?? current.manualInputs?.targetUniversity,
    targetMajor: payload.targetMajor ?? current.manualInputs?.targetMajor,
    updatedAt: now,
  };
  updateSessionResult(sessionId, { manualInputs });
  return await recomputeAnalytics(sessionId);
}

export async function updateKeywordOverridesForSession(
  sessionId: string,
  overrides: KeywordOverride[]
): Promise<ProcessingResult> {
  const now = new Date().toISOString();
  const current = await getOrLoadSessionResult(sessionId);
  const manualInputs: ManualInputState = {
    ...(current.manualInputs ?? {}),
    keywordOverrides: overrides,
    updatedAt: now,
  };
  updateSessionResult(sessionId, { manualInputs });
  return await recomputeAnalytics(sessionId);
}

export async function updateSummaryOverride(
  sessionId: string,
  consultantDraft: string
): Promise<ProcessingResult> {
  const now = new Date().toISOString();
  const current = await getOrLoadSessionResult(sessionId);
  const summary = current.summaryDraft ?? {
    aiDraft: '',
    strengths: [],
    improvements: [],
    recommendations: [],
    updatedAt: now,
  };

  updateSessionResult(sessionId, {
    summaryDraft: {
      ...summary,
      consultantDraft,
      updatedAt: now,
    },
  });

  return await getOrLoadSessionResult(sessionId);
}

/**
 * Update AI section scoring data
 */
export async function updateAISectionScoring(
  sessionId: string,
  scoringData: any
): Promise<ProcessingResult> {
  const now = new Date().toISOString();

  await updateSessionResult(sessionId, {
    ai_section_scoring: scoringData,
    ai_analysis_timestamp: now
  });

  return await getOrLoadSessionResult(sessionId);
}

/**
 * Update AI keyword analysis data
 */
export async function updateAIKeywordAnalysis(
  sessionId: string,
  keywordData: any
): Promise<ProcessingResult> {
  const now = new Date().toISOString();

  await updateSessionResult(sessionId, {
    ai_keyword_analysis: keywordData,
    ai_analysis_timestamp: now
  });

  return await getOrLoadSessionResult(sessionId);
}

/**
 * Update enhanced academic analysis data
 */
export async function updateEnhancedAcademicAnalysis(
  sessionId: string,
  academicData: any
): Promise<ProcessingResult> {
  const now = new Date().toISOString();

  await updateSessionResult(sessionId, {
    enhanced_academic_analysis: academicData,
    ai_analysis_timestamp: now
  });

  return await getOrLoadSessionResult(sessionId);
}

/**
 * Update AI major recommendations data
 */
export async function updateAIMajorRecommendations(
  sessionId: string,
  majorData: any
): Promise<ProcessingResult> {
  const now = new Date().toISOString();

  await updateSessionResult(sessionId, {
    ai_major_recommendations: majorData,
    ai_analysis_timestamp: now
  });

  return await getOrLoadSessionResult(sessionId);
}

/**
 * Update next semester study plan data
 */
export async function updateNextSemesterPlan(
  sessionId: string,
  planData: any
): Promise<ProcessingResult> {
  const now = new Date().toISOString();

  await updateSessionResult(sessionId, {
    next_semester_plan: planData,
    ai_analysis_timestamp: now
  });

  return await getOrLoadSessionResult(sessionId);
}

/**
 * Update extracted data (core student information)
 */
export async function updateExtractedData(
  sessionId: string,
  extractedData: any
): Promise<ProcessingResult> {
  await updateSessionResult(sessionId, {
    extractedData
  });

  return await getOrLoadSessionResult(sessionId);
}

/**
 * Update validation analysis
 */
export async function updateValidationAnalysis(
  sessionId: string,
  validationData: any
): Promise<ProcessingResult> {
  updateSessionResult(sessionId, {
    validationAnalysis: validationData
  });

  return await getOrLoadSessionResult(sessionId);
}

/**
 * Update grade trends analytics
 */
export async function updateGradeTrends(
  sessionId: string,
  trendsData: any
): Promise<ProcessingResult> {
  updateSessionResult(sessionId, {
    gradeTrends: trendsData
  });

  return await getOrLoadSessionResult(sessionId);
}

/**
 * Update competency scores payload
 */
export async function updateCompetencyScores(
  sessionId: string,
  scoresData: any
): Promise<ProcessingResult> {
  updateSessionResult(sessionId, {
    competencyScores: scoresData
  });

  return await getOrLoadSessionResult(sessionId);
}

/**
 * Update major alignment report
 */
export async function updateMajorAlignment(
  sessionId: string,
  alignmentData: any
): Promise<ProcessingResult> {
  updateSessionResult(sessionId, {
    majorAlignment: alignmentData
  });

  return await getOrLoadSessionResult(sessionId);
}

/**
 * Update keyword matrix
 */
export async function updateKeywordMatrix(
  sessionId: string,
  keywordMatrix: any
): Promise<ProcessingResult> {
  updateSessionResult(sessionId, {
    keywordMatrix
  });

  return await getOrLoadSessionResult(sessionId);
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
  if (!process.env.OPENAI_API_KEY && !process.env.OPENROUTER_API_KEY) {
    errors.push('Either OPENAI_API_KEY or OPENROUTER_API_KEY environment variable is required');
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

/**
 * Approve or reject an analysis result
 * This makes the analysis visible to the user or marks it for revision
 */
export async function updateAnalysisApproval(
  slug: string,
  sessionId: string,
  action: 'approve' | 'reject',
  approverId: string,
  notes?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const client = await getRedisClient();

    // Load existing analysis data
    const analysisKey = `${getAnalysisPrefix(slug)}${sessionId}`;
    const dataStr = await client.get(analysisKey);

    if (!dataStr) {
      await client.quit();
      return { success: false, message: 'Analysis not found' };
    }

    const analysisData = JSON.parse(dataStr);

    // Update approval fields
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    analysisData.approvalStatus = newStatus;
    analysisData.approvedAt = new Date().toISOString();
    analysisData.approvedBy = approverId;
    analysisData.influencerNotes = notes || null;

    const ttl = 60 * 60 * 24 * 30; // 30 days

    // Prepare Redis keys
    const pendingReviewsKey = `${slug}:pending_reviews`;
    const approvedKey = `${slug}:approved_analyses`;

    // Also update user-specific key
    const userId = analysisData.userInfo?.id;
    const userAnalysisKey = userId ? `user:${userId}:medsky:analysis:${sessionId}` : null;

    const multi = client.multi();

    // Update main analysis data
    multi.set(analysisKey, JSON.stringify(analysisData), { EX: ttl } as any);

    // Update user-specific data
    if (userAnalysisKey) {
      multi.set(userAnalysisKey, JSON.stringify(analysisData), { EX: ttl } as any);
    }

    // Move from pending to approved set
    if (action === 'approve') {
      multi.sRem(pendingReviewsKey, sessionId);
      multi.sAdd(approvedKey, sessionId);
    }

    await multi.exec();
    await client.quit();

    console.log(`✅ Analysis ${sessionId} ${newStatus} by ${approverId}`);

    return {
      success: true,
      message: action === 'approve'
        ? 'Analysis approved successfully'
        : 'Analysis marked for revision'
    };

  } catch (error) {
    console.error('Failed to update analysis approval:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
