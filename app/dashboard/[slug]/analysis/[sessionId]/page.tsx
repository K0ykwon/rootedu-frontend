'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { toast, Toaster } from 'react-hot-toast';
import Card from '../../../../../components/ui/Card';
import Button from '../../../../../components/ui/Button';
import { ValidationResults } from '../../../../../components/medsky/ValidationResults';

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

  // Check if user has access to this analysis
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/login');
      return;
    }

    // Check if user is the right influencer or admin
    const userRole = (session.user as any)?.role;
    const userId = (session.user as any)?.userId;
    
    if (userRole !== 'admin' && (userRole !== 'influencer' || userId !== slug)) {
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

                <ValidationResults
                  textSections={analysisResult.analysisData.textSections}
                  extractedData={analysisResult.analysisData.extractedData}
                  validationAnalysis={analysisResult.analysisData.validationAnalysis}
                  activeFilters={['blue_highlight', 'red_line', 'blue_line', 'black_line', 'red_check']}
                  onFilterChange={() => {}} // Read-only mode for dedicated page
                />

                {/* Summary Section */}
                <div className="mt-8 bg-[var(--color-bg-secondary)] rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
                    분석 요약
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[var(--color-primary-500)] mb-1">
                        {analysisResult.analysisData?.totalActivities || 0}
                      </div>
                      <div className="text-sm text-[var(--color-text-secondary)]">총 활동 수</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-medium text-[var(--color-text-primary)] mb-1">
                        {analysisResult.analysisData?.mainField || '미분류'}
                      </div>
                      <div className="text-sm text-[var(--color-text-secondary)]">주요 관심 분야</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-medium text-[var(--color-text-primary)] mb-1">
                        {analysisResult.analysisData?.recommendedCareer || '추가 분석 필요'}
                      </div>
                      <div className="text-sm text-[var(--color-text-secondary)]">추천 진로</div>
                    </div>
                  </div>
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
                  이 분석 결과는 완전하지 않습니다. 원시 데이터를 확인해보세요.
                </p>
                
                <details className="text-left bg-[var(--color-bg-secondary)] rounded-lg p-4">
                  <summary className="cursor-pointer font-medium text-[var(--color-text-primary)]">
                    원시 분석 데이터 보기
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