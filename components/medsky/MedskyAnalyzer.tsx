'use client';

/**
 * Medsky Analyzer - Main Component
 * 
 * This is the main component that orchestrates the entire medsky analysis workflow.
 * It handles PDF upload, processing status tracking, and results display.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { ProcessingResult, ProcessingStatus, MedskyProps } from '@/types/medsky';
import { PDFUploader } from './PDFUploader';
import { ProcessingStatusDisplay } from './ProcessingStatusDisplay';
import { ValidationResults } from './ValidationResults';
import { AnalysisOverview } from './AnalysisOverview';
import { StructuredDataTabs } from './StructuredDataTabs';
import { GradeTrendChart } from './GradeTrendChart';
import { CompetencyDistribution } from './CompetencyDistribution';
import { MajorAlignmentMatrix } from './MajorAlignmentMatrix';
import { KeywordMatrixView } from './KeywordMatrixView';
import { SummaryEditor } from './SummaryEditor';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

// AI Enhanced Components
import { AIKeywordAnalysisView } from './AIKeywordAnalysisView';
import { AISectionScoringView } from './AISectionScoringView';
import { EnhancedAcademicAnalysisView } from './EnhancedAcademicAnalysisView';
import { AIMajorRecommendationsView } from './AIMajorRecommendationsView';
import { NextSemesterPlanView } from './NextSemesterPlanView';

export function MedskyAnalyzer({ className, productId, onComplete, onStatusChange }: MedskyProps) {
  const { data: session, status: sessionStatus } = useSession();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [activeResultsTab, setActiveResultsTab] = useState<
    'overview' | 'trends' | 'competency' | 'major' | 'keywords' | 'structured' | 'detailed' | 'summary' | 'ai-keywords' | 'ai-scoring' | 'ai-academic' | 'ai-majors' | 'ai-study-plan'
  >('overview');

  // Helper function to get progress percentage for stage
  const getProgressForStage = (stage: string): number => {
    switch (stage) {
      case 'uploading': return 10;
      case 'parsing': return 25;
      case 'extracting': return 50;
      case 'analyzing': return 75;
      case 'validating': return 90;
      case 'completed': return 100;
      case 'error': return 0;
      default: return 0;
    }
  };

  /**
   * Handle PDF file upload and start processing
   */
  const handleFileUpload = useCallback(async (file: File) => {
    setError(null);
    setIsProcessing(true);
    setProcessingStatus({
      stage: 'uploading',
      progress: 0,
      message: '파일 업로드 중...'
    });

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Include productId if provided
      if (productId) {
        formData.append('productId', productId);
      }

      const response = await fetch('/api/medsky/process', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Processing failed');
      }

      setSessionId(data.sessionId);
      // Initialize status from server response if available; otherwise keep uploading
      if (data.result?.status) {
        setProcessingStatus(data.result.status);
        onStatusChange?.(data.result.status);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setProcessingStatus({
        stage: 'error',
        progress: 0,
        message: errorMessage,
        error: errorMessage
      });
    } finally {
      setIsProcessing(false);
    }
  }, [onComplete, onStatusChange]);

  /**
   * Reset the analyzer to initial state
   */
  const handleReset = useCallback(() => {
    setIsProcessing(false);
    setProcessingStatus(null);
    setProcessingResult(null);
    setError(null);
    setSessionId(null);
    setActiveResultsTab('overview');
  }, []);

  /**
   * Retry failed processing
   */
  const handleRetry = useCallback(async () => {
    if (!sessionId) {
      return;
    }

    setError(null);
    setIsProcessing(true);

    try {
      const response = await fetch(`/api/medsky/process?sessionId=${sessionId!}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Retry failed');
      }

      setProcessingResult(data.result);
      const finalStatus = data.result.status;
      setProcessingStatus(finalStatus);
      onStatusChange?.(finalStatus);

      if (finalStatus.stage === 'completed') {
        onComplete?.(data.result);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Retry failed';
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [sessionId, onComplete, onStatusChange]);

  // Poll processing status while in-flight
  useEffect(() => {
    if (!sessionId || processingResult) return; // Don't poll if we already have results

    let isCancelled = false;
    const pollIntervalMs = 2000;
    let timerId: ReturnType<typeof setInterval> | undefined;

    async function poll() {
      if (isCancelled) return; // Check at start of each poll
      
      try {
        const res = await fetch(`/api/medsky/status?sessionId=${sessionId}&_ts=${Date.now()}`, {
          cache: 'no-store',
        });
        const data: { success: boolean; status?: ProcessingStatus; error?: string } = await res.json();
        
        if (isCancelled) return; // Check after fetch
        
        if (data.success && data.status) {
          setProcessingStatus(data.status);
          onStatusChange?.(data.status);

          if (data.status.stage === 'completed') {
            // Fetch final result when completed
            try {
              const resultRes = await fetch(`/api/medsky/process?sessionId=${sessionId}&_ts=${Date.now()}`, {
                cache: 'no-store',
              });
              const resultData: { success: boolean; result?: ProcessingResult } = await resultRes.json();
              if (resultData.success && resultData.result) {
                setProcessingResult(resultData.result);
                onComplete?.(resultData.result);
                // Stop polling AFTER we have the result
                isCancelled = true;
                if (timerId) clearInterval(timerId);
              }
            } catch (err) {
              console.error('Failed to fetch final result:', err);
              // Stop polling even if result fetch fails
              isCancelled = true;
              if (timerId) clearInterval(timerId);
            }
            return;
          }

          if (data.status.stage === 'error') {
            // Stop polling on error
            isCancelled = true;
            if (timerId) clearInterval(timerId);
            return;
          }
        }
      } catch (error) {
        console.warn('Status polling failed:', error);
        }
    }

    // Start immediate poll, then interval
    poll();
    timerId = setInterval(() => {
      if (!isCancelled) {
        poll();
      }
    }, pollIntervalMs);
    
    return () => {
      isCancelled = true;
      if (timerId) clearInterval(timerId);
    };
  }, [sessionId, onStatusChange, onComplete, processingResult]);

  // Show loading while checking authentication
  if (sessionStatus === 'loading') {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center">
        <div className="text-[var(--color-text-primary)]">로딩 중...</div>
      </div>
    );
  }

  // Show sign-in prompt if not authenticated
  if (!session) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="p-8 text-center" glass={false}>
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
                로그인이 필요합니다
              </h2>
              <p className="text-[var(--color-text-secondary)]">
                생활기록부 전문 분석을 이용하려면 먼저 로그인해주세요.
              </p>
              <Button 
                onClick={() => signIn()}
                variant="primary"
                size="lg"
              >
                로그인하기
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`medsky-analyzer space-y-6 ${className || ''}`}>
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
          학생생활기록부 전문 분석
        </h2>
        <p className="text-[var(--color-text-secondary)]">
          PDF를 업로드하면 전문 분석 시스템이 진로 역량, 구체적 노력, 연계성 등을 분석해드립니다
        </p>
      </div>

      {/* Upload Section */}
      {!processingResult && (
        <Card className="p-6" glass={false}>
          <PDFUploader
            onUpload={handleFileUpload}
            isLoading={isProcessing}
            error={error || undefined}
          />
        </Card>
      )}

      {/* Processing Status */}
      {processingStatus && (
        <ProcessingStatusDisplay 
          status={processingStatus}
        />
      )}

      {/* Error State with Retry */}
      {error && processingStatus?.stage === 'error' && (
        <Card className="p-6 border-red-500 bg-red-50 dark:bg-red-900/20" glass={false}>
          <div className="text-center space-y-4">
            <div className="text-red-800 dark:text-red-200">
              <h3 className="font-semibold text-lg">처리 중 오류가 발생했습니다</h3>
              <p className="text-sm mt-1">{error}</p>
            </div>
            <div className="flex gap-2 justify-center">
              <Button
                onClick={handleRetry}
                variant="primary"
                size="sm"
                disabled={isProcessing}
              >
                다시 시도
              </Button>
              <Button
                onClick={handleReset}
                variant="secondary"
                size="sm"
              >
                새로 시작
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Submission Confirmation - Show instead of immediate results */}
      {processingStatus?.stage === 'completed' && sessionId && (
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-green-200 dark:border-green-700">
          <div className="text-center py-12 px-6">
            <div className="text-6xl mb-6">✅</div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              분석이 완료되었습니다!
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6 text-lg">
              알약툰 전문가가 검토 후 결과를 전달드립니다
            </p>

            {/* Analysis ID Display */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 inline-block max-w-md mb-6 shadow-sm">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 font-medium">분석 ID</p>
              <p className="font-mono text-sm text-gray-800 dark:text-gray-200 break-all">{sessionId}</p>
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  💡 이 ID로 분석 결과를 조회할 수 있습니다
                </p>
              </div>
            </div>

            {/* What happens next */}
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-6 max-w-2xl mx-auto mb-6">
              <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center justify-center gap-2">
                <span>📋</span> 다음 단계
              </h4>
              <ol className="text-left space-y-3 text-sm text-blue-800 dark:text-blue-200">
                <li className="flex items-start gap-3">
                  <span className="font-bold text-blue-600 dark:text-blue-400 min-w-[24px]">1.</span>
                  <span>전문가가 분석 결과를 검토합니다</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-bold text-blue-600 dark:text-blue-400 min-w-[24px]">2.</span>
                  <span>검토가 완료되면 "내 분석 결과" 탭에서 확인하실 수 있습니다</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-bold text-blue-600 dark:text-blue-400 min-w-[24px]">3.</span>
                  <span>결과가 준비되면 알림을 보내드립니다</span>
                </li>
              </ol>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              📧 검토 완료 시 알림을 받으시려면 프로필에서 알림 설정을 확인해주세요
            </p>

            <Button
              onClick={handleReset}
              variant="primary"
              size="lg"
            >
              새 분석 시작하기
            </Button>
          </div>
        </Card>
      )}

      {/* Results Display - HIDDEN FOR NOW, kept for future reference */}
      {false && processingResult &&
       processingResult?.extractedData &&
       processingResult?.validationAnalysis &&
       processingStatus?.stage === 'completed' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">
              분석 결과
            </h3>
            <Button
              onClick={handleReset}
              variant="secondary"
              size="sm"
            >
              새 분석 시작
            </Button>
          </div>

          {/* Results Tab Navigation */}
                <Card className="p-1" glass={false}>
                  <nav className="flex flex-wrap gap-2">
                    {[
                      { id: 'overview', name: '종합 개요', icon: '📊', description: '핵심 통계 및 인사이트' },
                      { id: 'ai-keywords', name: '키워드 분석', icon: '🔑', description: '문맥 키워드 추출 및 분류', category: 'ai' },
                      { id: 'ai-scoring', name: '세부 점수', icon: '⚡', description: '다기준 섹션별 채점', category: 'ai' },
                      { id: 'ai-academic', name: '학업 분석', icon: '🎓', description: '심화 학업 성취 분석', category: 'ai' },
                      { id: 'ai-majors', name: '전공 추천', icon: '🚀', description: '전공 적성 평가', category: 'ai' },
                      { id: 'ai-study-plan', name: '학습 계획', icon: '📋', description: '차학기 학습 계획', category: 'ai' },
                      { id: 'trends', name: '성적 추이', icon: '📈', description: '학기별 성적 변화' },
                      { id: 'competency', name: '역량 점수화', icon: '🎯', description: '역량별 점수와 백분위' },
                      { id: 'major', name: '전공 연계', icon: '🎓', description: '필수/권장 과목 충족도' },
                      { id: 'keywords', name: '키워드 맵', icon: '🔑', description: '세특 키워드 요약' },
                      { id: 'structured', name: '구조화 데이터', icon: '📋', description: '정리된 활동 및 성취 정보' },
                      { id: 'detailed', name: '세부 분석', icon: '🔍', description: '원문 기반 피드백' },
                      { id: 'summary', name: '총평', icon: '📝', description: 'AI 초안 및 편집본' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveResultsTab(tab.id as any)}
                        className={`
                          flex-1 min-w-[120px] px-4 py-3 text-sm font-medium rounded-md transition-colors flex items-center justify-center space-x-2
                          ${activeResultsTab === tab.id
                            ? (tab.category === 'ai' ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-md' : 'bg-blue-500 text-white shadow-md')
                            : (tab.category === 'ai' ? 'text-purple-600 hover:text-purple-800 hover:bg-purple-50 border border-purple-200' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]')
                          }
                  `}
                  title={tab.description}
                >
                  <span>{tab.icon}</span>
                  <span className="hidden md:inline">{tab.name}</span>
                  <span className="md:hidden">{tab.name.split(' ')[0]}</span>
                </button>
              ))}
            </nav>
          </Card>

          {/* Tab Content */}
                <div className="min-h-[600px]">
                  {processingResult && (() => {
                    const result = processingResult!;
                    return (
                    <>
                      {activeResultsTab === 'overview' && result.extractedData && result.validationAnalysis && (
                        <AnalysisOverview
                          extractedData={result.extractedData!}
                          validationAnalysis={result.validationAnalysis!}
                        />
                      )}

                      {activeResultsTab === 'trends' && result.gradeTrends && (
                        <GradeTrendChart report={result.gradeTrends!} />
                      )}

                      {activeResultsTab === 'competency' && result.competencyScores && (
                        <CompetencyDistribution data={result.competencyScores!} />
                      )}

                      {activeResultsTab === 'major' && result.majorAlignment && (
                        <MajorAlignmentMatrix report={result.majorAlignment!} />
                      )}

                      {activeResultsTab === 'keywords' && result.keywordMatrix && (
                        <KeywordMatrixView matrix={result.keywordMatrix!} />
                      )}

                      {activeResultsTab === 'structured' && result.extractedData && (
                        <StructuredDataTabs
                          extractedData={result.extractedData!}
                        />
                      )}

                      {activeResultsTab === 'detailed' && result.textSections && result.extractedData && result.validationAnalysis && (
                        <ValidationResults
                          textSections={result.textSections!}
                          extractedData={result.extractedData!}
                          validationAnalysis={result.validationAnalysis!}
                          activeFilters={['blue_highlight', 'red_line', 'blue_line', 'black_line', 'red_check']}
                          onFilterChange={() => {}}
                        />
                      )}

                      {activeResultsTab === 'summary' && result.summaryDraft && (
                        <SummaryEditor summary={result.summaryDraft!} />
                      )}

                      {/* AI Enhanced Features */}
                      {activeResultsTab === 'ai-keywords' && (
                        <div className="space-y-6">
                          {result.ai_keyword_analysis ? (
                        <AIKeywordAnalysisView data={result.ai_keyword_analysis!} />
                      ) : (
                        <Card className="p-8 text-center border-purple-200 bg-purple-50" glass={false}>
                          <div className="text-purple-600">
                            <h3 className="text-lg font-semibold mb-2">키워드 분석 결과가 없습니다</h3>
                            <p className="text-sm">키워드 추출이 아직 완료되지 않았거나 오류가 발생했습니다.</p>
                          </div>
                        </Card>
                      )}
                    </div>
                  )}

                  {activeResultsTab === 'ai-scoring' && (
                    <div className="space-y-6">
                      {result.ai_section_scoring ? (
                        <AISectionScoringView data={result.ai_section_scoring!} />
                      ) : (
                        <Card className="p-8 text-center border-purple-200 bg-purple-50" glass={false}>
                          <div className="text-purple-600">
                            <h3 className="text-lg font-semibold mb-2">AI 섹션 채점 결과가 없습니다</h3>
                            <p className="text-sm">AI 다기준 채점이 아직 완료되지 않았거나 오류가 발생했습니다.</p>
                          </div>
                        </Card>
                      )}
                    </div>
                  )}

                  {activeResultsTab === 'ai-academic' && (
                    <div className="space-y-6">
                      {result.enhanced_academic_analysis ? (
                        <EnhancedAcademicAnalysisView data={result.enhanced_academic_analysis!} />
                      ) : (
                        <Card className="p-8 text-center border-purple-200 bg-purple-50" glass={false}>
                          <div className="text-purple-600">
                            <h3 className="text-lg font-semibold mb-2">학업 분석 결과가 없습니다</h3>
                            <p className="text-sm">심화 학업 분석이 아직 완료되지 않았거나 오류가 발생했습니다.</p>
                          </div>
                        </Card>
                      )}
                    </div>
                  )}

                  {activeResultsTab === 'ai-majors' && (
                    <div className="space-y-6">
                      {result.ai_major_recommendations ? (
                        <AIMajorRecommendationsView data={result.ai_major_recommendations!} />
                      ) : (
                        <Card className="p-8 text-center border-purple-200 bg-purple-50" glass={false}>
                          <div className="text-purple-600">
                            <h3 className="text-lg font-semibold mb-2">전공 추천 결과가 없습니다</h3>
                            <p className="text-sm">전공 적성 평가가 아직 완료되지 않았거나 오류가 발생했습니다.</p>
                          </div>
                        </Card>
                      )}
                    </div>
                  )}

                  {activeResultsTab === 'ai-study-plan' && (
                    <div className="space-y-6">
                      {result.next_semester_plan ? (
                        <NextSemesterPlanView data={result.next_semester_plan!} />
                      ) : (
                        <Card className="p-8 text-center border-purple-200 bg-purple-50" glass={false}>
                          <div className="text-purple-600">
                            <h3 className="text-lg font-semibold mb-2">학습 계획 결과가 없습니다</h3>
                            <p className="text-sm">차학기 학습 계획이 아직 완료되지 않았거나 오류가 발생했습니다.</p>
                          </div>
                        </Card>
                      )}
                    </div>
                  )}
                    </>
                    );
                  })()}
                </div>
        </div>
      )}
    </div>
  </div>
</div>
  );
}
