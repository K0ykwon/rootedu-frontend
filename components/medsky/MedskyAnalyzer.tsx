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
import { useMedskyAnalysis } from '@/lib/medsky/analysisContext';

export function MedskyAnalyzer({ className, onComplete, onStatusChange }: MedskyProps) {
  const { data: session, status: sessionStatus } = useSession();
  const { startAnalysis, updateProgress, completeAnalysis, failAnalysis } = useMedskyAnalysis();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [activeResultsTab, setActiveResultsTab] = useState<
    'overview' | 'trends' | 'competency' | 'major' | 'keywords' | 'structured' | 'detailed' | 'summary'
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
    
    // Start the toast notification
    startAnalysis(file);

    try {
      const formData = new FormData();
      formData.append('file', file);

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
      // Update toast with error
      failAnalysis(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [onComplete, onStatusChange, startAnalysis, failAnalysis]);

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
          
          // Update toast progress based on stage
          const progress = getProgressForStage(data.status.stage);
          updateProgress(progress, data.status.message || data.status.stage);

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
                // Update toast with completion
                completeAnalysis(resultData.result);
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
            // Update toast with error and stop polling
            failAnalysis(data.status.error || 'Processing failed');
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
  }, [sessionId, onStatusChange, onComplete, processingResult, updateProgress, completeAnalysis, failAnalysis]);

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
                생활기록부 AI 분석을 이용하려면 먼저 로그인해주세요.
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
          학생생활기록부 AI 분석
        </h2>
        <p className="text-[var(--color-text-secondary)]">
          PDF를 업로드하면 AI가 진로 역량, 구체적 노력, 연계성 등을 분석해드립니다
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

      {/* Results Display */}
      {processingResult && 
       processingResult.extractedData && 
       processingResult.validationAnalysis && 
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
                            ? 'bg-blue-500 text-white shadow-md' 
                            : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]'
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
                  {activeResultsTab === 'overview' && (
                    <AnalysisOverview
                      extractedData={processingResult.extractedData}
                      validationAnalysis={processingResult.validationAnalysis}
                    />
                  )}

                  {activeResultsTab === 'trends' && (
                    <GradeTrendChart report={processingResult.gradeTrends} />
                  )}

                  {activeResultsTab === 'competency' && (
                    <CompetencyDistribution data={processingResult.competencyScores} />
                  )}

                  {activeResultsTab === 'major' && (
                    <MajorAlignmentMatrix report={processingResult.majorAlignment} />
                  )}

                  {activeResultsTab === 'keywords' && (
                    <KeywordMatrixView matrix={processingResult.keywordMatrix} />
                  )}

                  {activeResultsTab === 'structured' && (
                    <StructuredDataTabs
                      extractedData={processingResult.extractedData}
                    />
                  )}

                  {activeResultsTab === 'detailed' && (
                    <ValidationResults
                      textSections={processingResult.textSections!}
                extractedData={processingResult.extractedData}
                validationAnalysis={processingResult.validationAnalysis}
                activeFilters={['blue_highlight', 'red_line', 'blue_line', 'black_line', 'red_check']}
                onFilterChange={() => {}} // Will be implemented in ValidationResults
                    />
                  )}

                  {activeResultsTab === 'summary' && (
                    <SummaryEditor summary={processingResult.summaryDraft} />
                  )}
                </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}
