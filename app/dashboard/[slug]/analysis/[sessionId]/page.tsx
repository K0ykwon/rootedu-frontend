'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { toast, Toaster } from 'react-hot-toast';
import Card from '../../../../../components/ui/Card';
import Button from '../../../../../components/ui/Button';
import { ValidationResults } from '../../../../../components/medsky/ValidationResults';
import { AnalysisOverview } from '../../../../../components/medsky/AnalysisOverview';
import { StructuredDataTabs } from '../../../../../components/medsky/StructuredDataTabs';
import { SummaryEditor } from '../../../../../components/medsky/SummaryEditor';

// AI Enhanced Components
import { AIKeywordAnalysisView } from '../../../../../components/medsky/AIKeywordAnalysisView';
import { AISectionScoringView } from '../../../../../components/medsky/AISectionScoringView';
import { EnhancedAcademicAnalysisView } from '../../../../../components/medsky/EnhancedAcademicAnalysisView';
import { AIMajorRecommendationsView } from '../../../../../components/medsky/AIMajorRecommendationsView';
import { NextSemesterPlanView } from '../../../../../components/medsky/NextSemesterPlanView';

interface AnalysisResult {
  sessionId: string;
  userId: string;
  userName: string;
  analysisData: any;
  profileGenerated?: boolean;
  generatedProfile?: string;
  createdAt: string;
  completedAt: string;
}

export default function AnalysisDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const sessionId = params.sessionId as string;

  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasLoadedResult, setHasLoadedResult] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeResultsTab, setActiveResultsTab] = useState<
    'overview' | 'keywords' | 'scoring' | 'academic' | 'majors' | 'study-plan' | 'structured' | 'detailed' | 'summary'
  >('overview');

  const patchAnalysis = async (endpoint: string, payload: unknown, successMessage: string) => {
    try {
      const response = await fetch(`/api/medsky/analysis/${sessionId}/${endpoint}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error || '요청이 실패했습니다');
      }

      const data = await response.json();
      if (data?.result) {
        setAnalysisResult((prev) => (prev ? { ...prev, analysisData: data.result } : prev));
      }
      toast.success(successMessage);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : '업데이트에 실패했습니다.');
    }
  };

  const handleSaveSummary = async (draft: string) => {
    await patchAnalysis('summary', { consultantDraft: draft }, '총평이 저장되었습니다.');
  };

  const handleSaveScoring = async (data: any) => {
    await patchAnalysis('ai-scoring', { data }, '점수 분석이 저장되었습니다.');
  };

  const handleSaveKeywords = async (data: any) => {
    await patchAnalysis('ai-keywords', { data }, '키워드 분석이 저장되었습니다.');
  };

  const handleSaveAcademic = async (data: any) => {
    await patchAnalysis('ai-academic', { data }, '학업 분석이 저장되었습니다.');
  };

  const handleSaveMajors = async (data: any) => {
    await patchAnalysis('ai-majors', { data }, '전공 추천이 저장되었습니다.');
  };

  const handleSaveStudyPlan = async (data: any) => {
    await patchAnalysis('ai-study-plan', { data }, '학습 계획이 저장되었습니다.');
  };

  // Check if user has access to this analysis
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/login');
      return;
    }

    // Check if user is the right influencer or admin
    const userRole = (session.user as any)?.role;
    const userType = (session.user as any)?.userType;
    const userId = (session.user as any)?.userId;
    const influencerSlug = (session.user as any)?.influencerSlug;
    
    // Allow access if admin or if influencer accessing their own dashboard
    const isInfluencer = userType === 'influencer' && (influencerSlug === slug || userId === slug);
    
    if (userRole !== 'admin' && !isInfluencer) {
      router.push('/');
      return;
    }

    // Only load result once
    if (!hasLoadedResult) {
      setHasLoadedResult(true);
      loadAnalysisResult();
    }
  }, [session, status, slug, sessionId, hasLoadedResult]);

  const loadAnalysisResult = async () => {
    try {
      const response = await fetch(`/api/dashboard/${slug}/analysis-results`);
      if (response.ok) {
        const data = await response.json();
        const result = data.results?.find((r: AnalysisResult) => r.sessionId === sessionId);
        
        if (result) {
          setAnalysisResult(result);
        } else {
          setError('분석 결과를 찾을 수 없습니다.');
        }
      } else {
        setError('분석 결과를 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to load analysis result:', error);
      setError('분석 결과를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary-500)] mx-auto mb-4"></div>
          <p className="text-[var(--color-text-secondary)]">로딩중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
              오류가 발생했습니다
            </h2>
            <p className="text-[var(--color-text-secondary)] mb-4">{error}</p>
            <Button
              variant="primary"
              onClick={() => router.push(`/dashboard/${slug}`)}
            >
              대시보드로 돌아가기
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!analysisResult) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <div className="text-center">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
              분석 결과를 찾을 수 없습니다
            </h2>
            <p className="text-[var(--color-text-secondary)] mb-4">
              요청하신 분석 결과가 존재하지 않거나 만료되었습니다.
            </p>
            <Button
              variant="primary"
              onClick={() => router.push(`/dashboard/${slug}`)}
            >
              대시보드로 돌아가기
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/${slug}`)}
            >
              ← 대시보드로 돌아가기
            </Button>
          </div>
          
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2">
            생활기록부 분석 결과
          </h1>
          <div className="text-[var(--color-text-secondary)]">
            <p><strong>학생:</strong> {analysisResult.userName || '익명 사용자'}</p>
            <p><strong>분석 완료:</strong> {new Date(analysisResult.completedAt).toLocaleDateString('ko-KR')}</p>
            <p><strong>세션 ID:</strong> {analysisResult.sessionId}</p>
          </div>
        </div>

        {/* Analysis Results */}
        <Card>
          <div className="p-6">
            {analysisResult.analysisData?.textSections && 
             analysisResult.analysisData?.extractedData && 
             analysisResult.analysisData?.validationAnalysis ? (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-2">
                    AI 생활기록부 분석 결과
                  </h2>
                  <p className="text-[var(--color-text-secondary)]">
                    진로 역량, 구체적 노력, 연계성 등을 종합적으로 분석한 결과입니다
                  </p>
                </div>

                {/* Results Tab Navigation */}
                <Card className="p-1" glass={false}>
                  <nav className="flex flex-wrap gap-2">
                    {[
                      { id: 'overview', name: '종합 개요', icon: '📊', description: '핵심 통계 및 인사이트' },
                      { id: 'keywords', name: '키워드 분석', icon: '🔑', description: '문맥 키워드 추출 및 분류' },
                      { id: 'scoring', name: '세부 점수', icon: '⚡', description: '다기준 섹션 채점' },
                      { id: 'academic', name: '학업 분석', icon: '🎓', description: '향상된 학업 분석' },
                      { id: 'majors', name: '전공 추천', icon: '🚀', description: '맞춤 전공 추천' },
                      { id: 'study-plan', name: '학습 계획', icon: '📋', description: '차학기 학습 계획' },
                      { id: 'structured', name: '구조화 데이터', icon: '📂', description: '정리된 활동 및 성취 정보' },
                      { id: 'detailed', name: '세부 분석', icon: '🔍', description: '원문 기반 세부 피드백' },
                      { id: 'summary', name: '총평', icon: '📝', description: '종합 평가 및 편집' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveResultsTab(tab.id as any)}
                        className={`
                          flex-1 min-w-[140px] px-4 py-3 text-sm font-medium rounded-md transition-colors flex items-center justify-center space-x-2
                          ${activeResultsTab === tab.id
                            ? 'bg-blue-500 text-white shadow-md'
                            : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]'
                          }
                        `}
                        title={tab.description}
                      >
                        <span>{tab.icon}</span>
                        <span className="hidden lg:inline">{tab.name}</span>
                        <span className="lg:hidden">{tab.name.split(' ')[0]}</span>
                      </button>
                    ))}
                  </nav>
                </Card>

                {/* Tab Content */}
                <div className="min-h-[600px] space-y-4">
                  {activeResultsTab === 'overview' && (
                    <AnalysisOverview
                      extractedData={analysisResult.analysisData.extractedData}
                      validationAnalysis={analysisResult.analysisData.validationAnalysis}
                      aiKeywordAnalysis={analysisResult.analysisData.ai_keyword_analysis}
                      aiSectionScoring={analysisResult.analysisData.ai_section_scoring}
                      enhancedAcademicAnalysis={analysisResult.analysisData.enhanced_academic_analysis}
                      aiMajorRecommendations={analysisResult.analysisData.ai_major_recommendations}
                      nextSemesterPlan={analysisResult.analysisData.next_semester_plan}
                    />
                  )}

                  {activeResultsTab === 'keywords' && (
                    <div className="space-y-6">
                      {analysisResult.analysisData?.ai_keyword_analysis ? (
                        <AIKeywordAnalysisView
                          data={analysisResult.analysisData.ai_keyword_analysis}
                          editable
                          onSave={handleSaveKeywords}
                        />
                      ) : (
                        <Card className="p-8 text-center border-gray-200 bg-gray-50" glass={false}>
                          <div className="text-gray-600">
                            <h3 className="text-lg font-semibold mb-2">키워드 분석 결과가 없습니다</h3>
                            <p className="text-sm">키워드 추출이 아직 완료되지 않았거나 오류가 발생했습니다.</p>
                          </div>
                        </Card>
                      )}
                    </div>
                  )}

                  {activeResultsTab === 'scoring' && (
                    <div className="space-y-6">
                      {analysisResult.analysisData?.ai_section_scoring ? (
                        <AISectionScoringView
                          data={analysisResult.analysisData.ai_section_scoring}
                          editable
                          onSave={handleSaveScoring}
                        />
                      ) : (
                        <Card className="p-8 text-center border-gray-200 bg-gray-50" glass={false}>
                          <div className="text-gray-600">
                            <h3 className="text-lg font-semibold mb-2">섹션 채점 결과가 없습니다</h3>
                            <p className="text-sm">다기준 채점이 아직 완료되지 않았거나 오류가 발생했습니다.</p>
                          </div>
                        </Card>
                      )}
                    </div>
                  )}

                  {activeResultsTab === 'academic' && (
                    <div className="space-y-6">
                      {analysisResult.analysisData?.enhanced_academic_analysis ? (
                        <EnhancedAcademicAnalysisView
                          data={analysisResult.analysisData.enhanced_academic_analysis}
                          editable
                          onSave={handleSaveAcademic}
                        />
                      ) : (
                        <Card className="p-8 text-center border-gray-200 bg-gray-50" glass={false}>
                          <div className="text-gray-600">
                            <h3 className="text-lg font-semibold mb-2">학업 분석 결과가 없습니다</h3>
                            <p className="text-sm">향상된 학업 분석이 아직 완료되지 않았거나 오류가 발생했습니다.</p>
                          </div>
                        </Card>
                      )}
                    </div>
                  )}

                  {activeResultsTab === 'majors' && (
                    <div className="space-y-6">
                      {analysisResult.analysisData?.ai_major_recommendations ? (
                        <AIMajorRecommendationsView
                          data={analysisResult.analysisData.ai_major_recommendations}
                          editable
                          onSave={handleSaveMajors}
                        />
                      ) : (
                        <Card className="p-8 text-center border-gray-200 bg-gray-50" glass={false}>
                          <div className="text-gray-600">
                            <h3 className="text-lg font-semibold mb-2">전공 추천 결과가 없습니다</h3>
                            <p className="text-sm">전공 추천이 아직 완료되지 않았거나 오류가 발생했습니다.</p>
                          </div>
                        </Card>
                      )}
                    </div>
                  )}

                  {activeResultsTab === 'study-plan' && (
                    <div className="space-y-6">
                      {analysisResult.analysisData?.next_semester_plan ? (
                        <NextSemesterPlanView
                          data={analysisResult.analysisData.next_semester_plan}
                          editable
                          onSave={handleSaveStudyPlan}
                        />
                      ) : (
                        <Card className="p-8 text-center border-gray-200 bg-gray-50" glass={false}>
                          <div className="text-gray-600">
                            <h3 className="text-lg font-semibold mb-2">학습 계획 결과가 없습니다</h3>
                            <p className="text-sm">차학기 학습 계획이 아직 완료되지 않았거나 오류가 발생했습니다.</p>
                          </div>
                        </Card>
                      )}
                    </div>
                  )}

                  {activeResultsTab === 'structured' && (
                    <StructuredDataTabs
                      extractedData={analysisResult.analysisData.extractedData}
                    />
                  )}

                  {activeResultsTab === 'detailed' && (
                    <ValidationResults
                      textSections={analysisResult.analysisData.textSections}
                      extractedData={analysisResult.analysisData.extractedData}
                      validationAnalysis={analysisResult.analysisData.validationAnalysis}
                      activeFilters={['blue_highlight', 'red_line', 'blue_line', 'black_line', 'red_check']}
                      onFilterChange={() => {}}
                    />
                  )}

                  {activeResultsTab === 'summary' && (
                    <SummaryEditor
                      summary={analysisResult.analysisData.summaryDraft}
                      editable
                      onSave={handleSaveSummary}
                    />
                  )}
                </div>

                {/* Generated Profile Section */}
                {analysisResult.profileGenerated && analysisResult.generatedProfile && (
                  <div className="mt-8 bg-[var(--color-bg-tertiary)] rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
                      AI 생성 학생 프로필
                    </h3>
                    <div className="prose prose-sm max-w-none text-[var(--color-text-primary)]">
                      {analysisResult.generatedProfile.split('\n').map((paragraph, index) => (
                        <p key={index} className="mb-4 last:mb-0 whitespace-pre-wrap">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button
                        variant="primary"
                        onClick={() => {
                          navigator.clipboard.writeText(analysisResult.generatedProfile!);
                          toast.success('프로필이 클립보드에 복사되었습니다!');
                        }}
                      >
                        클립보드에 복사
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">⚠️</div>
                <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
                  분석 데이터가 불완전합니다
                </h3>
                <p className="text-[var(--color-text-secondary)] mb-6">
                  이 분석 결과는 완전하지 않습니다. 관리자에게 문의하거나 다시 분석을 요청해주세요.
                </p>

                {/* Data completeness summary */}
                <div className="bg-[var(--color-bg-secondary)] rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-[var(--color-text-primary)] mb-3">데이터 상태</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className={`flex items-center space-x-2 ${analysisResult.analysisData?.textSections ? 'text-green-600' : 'text-red-600'}`}>
                      <span>{analysisResult.analysisData?.textSections ? '✅' : '❌'}</span>
                      <span>텍스트 섹션</span>
                    </div>
                    <div className={`flex items-center space-x-2 ${analysisResult.analysisData?.extractedData ? 'text-green-600' : 'text-red-600'}`}>
                      <span>{analysisResult.analysisData?.extractedData ? '✅' : '❌'}</span>
                      <span>추출 데이터</span>
                    </div>
                    <div className={`flex items-center space-x-2 ${analysisResult.analysisData?.validationAnalysis ? 'text-green-600' : 'text-red-600'}`}>
                      <span>{analysisResult.analysisData?.validationAnalysis ? '✅' : '❌'}</span>
                      <span>검증 분석</span>
                    </div>
                  </div>
                </div>

                <details className="text-left bg-[var(--color-bg-secondary)] rounded-lg p-4">
                  <summary className="cursor-pointer font-medium text-[var(--color-text-primary)]">
                    원시 분석 데이터 보기 (디버깅용)
                  </summary>
                  <pre className="mt-4 text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap overflow-x-auto">
                    {JSON.stringify(analysisResult.analysisData, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        </Card>
      </div>
      
      <Toaster position="top-right" />
    </div>
  );
}
