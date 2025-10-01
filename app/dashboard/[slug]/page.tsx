'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { toast, Toaster } from 'react-hot-toast';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import MedskyAnalysis from '../../../components/medsky/MedskyAnalysis';
import { ValidationResults } from '../../../components/medsky/ValidationResults';
import ProductBasedDashboard from './ProductBasedDashboard';

interface AnalysisResult {
  id: string;
  sessionId: string;
  userId: string;
  userName: string;
  analysisData: any;
  profileGenerated?: boolean;
  generatedProfile?: string;
  createdAt: string;
  completedAt: string;
  // Approval workflow fields
  approvalStatus: 'pending_review' | 'approved' | 'rejected';
  approvedAt: string | null;
  approvedBy: string | null;
  influencerNotes: string | null;
}

interface ChatHistory {
  id: string;
  analysisSessionId: string;
  messageCount: number;
  lastMessage: any;
  createdAt: string;
  lastMessageAt: string;
}

export default function InfluencerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoadedResults, setHasLoadedResults] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [generatingProfile, setGeneratingProfile] = useState<string | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisResult | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [viewMode, setViewMode] = useState<'products' | 'analysis'>('products');
  const [reviewFilter, setReviewFilter] = useState<'all' | 'pending' | 'approved'>('pending');
  const [approvingSessionId, setApprovingSessionId] = useState<string | null>(null);

  // Check if user has access to this dashboard
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
    const userEmail = (session.user as any)?.email;
    const influencerSlug = (session.user as any)?.influencerSlug;
    
    // Special check for yaktoon dashboard - only yaktoon account can access
    if (slug === 'yaktoon') {
      const isYaktoon = userId === 'yaktoon' || userEmail === 'yaktoon@rootedu.com' || 
                        userRole === 'admin' || influencerSlug === 'yaktoon';
      if (!isYaktoon) {
        toast.error('이 대시보드에 접근 권한이 없습니다.');
        router.push('/');
        return;
      }
    } else {
      // Allow access if admin or if influencer accessing their own dashboard
      const isInfluencer = userType === 'influencer' && (influencerSlug === slug || userId === slug);
      if (userRole !== 'admin' && !isInfluencer) {
        router.push('/');
        return;
      }
    }

    // Only load results once
    if (!hasLoadedResults) {
      setHasLoadedResults(true);
      loadAnalysisResults();
      // Load chat history for yaktoon
      if (slug === 'yaktoon') {
        loadChatHistory();
      }
    }
  }, [session, status, slug, hasLoadedResults]);

  const loadAnalysisResults = async () => {
    try {
      const response = await fetch(`/api/dashboard/${slug}/analysis-results`);
      if (response.ok) {
        const data = await response.json();
        setAnalysisResults(data.results || []);
      }
    } catch (error) {
      console.error('Failed to load analysis results:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadChatHistory = async () => {
    try {
      const response = await fetch(`/api/chat/history?influencerSlug=${slug}`);
      if (response.ok) {
        const data = await response.json();
        setChatHistory(data.chatSessions || []);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  const generateProfile = async (sessionId: string) => {
    setGeneratingProfile(sessionId);
    try {
      const response = await fetch(`/api/dashboard/${slug}/generate-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('프로필이 생성되었습니다!');
        // Update the analysis result with the generated profile
        setAnalysisResults(prev =>
          prev.map(result =>
            result.sessionId === sessionId
              ? { ...result, profileGenerated: true, generatedProfile: data.profile }
              : result
          )
        );
      } else {
        toast.error('프로필 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to generate profile:', error);
      toast.error('프로필 생성 중 오류가 발생했습니다.');
    } finally {
      setGeneratingProfile(null);
    }
  };

  const handleApproveAnalysis = async (sessionId: string) => {
    setApprovingSessionId(sessionId);
    try {
      const response = await fetch(`/api/dashboard/${slug}/approve-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          action: 'approve'
        }),
      });

      if (response.ok) {
        toast.success('분석 결과가 승인되었습니다! 학생이 이제 결과를 볼 수 있습니다.');
        // Update the analysis result approval status
        setAnalysisResults(prev =>
          prev.map(result =>
            result.sessionId === sessionId
              ? { ...result, approvalStatus: 'approved', approvedAt: new Date().toISOString() }
              : result
          )
        );
        // Reload to get fresh data
        loadAnalysisResults();
      } else {
        const data = await response.json();
        toast.error(data.error || '승인 처리에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to approve analysis:', error);
      toast.error('승인 처리 중 오류가 발생했습니다.');
    } finally {
      setApprovingSessionId(null);
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

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2">
                {slug} 대시보드
              </h1>
              <p className="text-[var(--color-text-secondary)]">
                생활기록부 분석 및 학생 프로필 관리
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'products' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('products')}
              >
                제품별 보기 
              </Button>
              <Button 
                variant={viewMode === 'analysis' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('analysis')}
              >
                분석별 보기
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.push(`/dashboard/${slug}/messages`)}
              >
                고객 메시지 📬
              </Button>
            </div>
          </div>
        </div>

        {/* View Mode Based Content */}
        {viewMode === 'products' ? (
          <>
            {/* Product-Based View */}
            <ProductBasedDashboard influencerSlug={slug} />
          </>
        ) : (
          <>
            {/* Analysis Tools Section */}
            <Card className="mb-8">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">
                  분석 도구
                </h2>
                <div className="flex gap-4">
                  <Button
                    variant="primary"
                    onClick={() => setShowAnalysis(!showAnalysis)}
                  >
                    {showAnalysis ? '분석 도구 닫기' : '새 생활기록부 분석'}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={loadAnalysisResults}
                  >
                    결과 새로고침
                  </Button>
                </div>
              </div>
              
              {showAnalysis && (
                <div className="border-t border-[var(--color-border-primary)] p-6">
                  <MedskyAnalysis 
                    onAnalysisComplete={loadAnalysisResults} 
                    influencerSlug={slug}
                  />
                </div>
              )}
            </Card>

        {/* Analysis Results Section */}
        <Card>
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
                  분석 결과 ({analysisResults.length})
                </h2>
                <p className="text-sm text-[var(--color-text-secondary)] flex items-center gap-3">
                  <span className="inline-flex items-center gap-1">
                    <span className="text-base">🔒</span>
                    <span className="text-orange-600 dark:text-orange-400 font-medium">검토 대기</span>
                    <span className="text-[var(--color-text-tertiary)]">=</span>
                    <span>학생에게 숨겨짐</span>
                  </span>
                  <span className="text-[var(--color-text-tertiary)]">|</span>
                  <span className="inline-flex items-center gap-1">
                    <span className="text-base">✅</span>
                    <span className="text-green-600 dark:text-green-400 font-medium">승인 완료</span>
                    <span className="text-[var(--color-text-tertiary)]">=</span>
                    <span>학생에게 공개됨</span>
                  </span>
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-2">
                <Button
                  variant={reviewFilter === 'pending' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setReviewFilter('pending')}
                >
                  <span className="mr-1">⏳</span>
                  검토 대기 ({analysisResults.filter(r => r.approvalStatus === 'pending_review').length})
                </Button>
                <Button
                  variant={reviewFilter === 'approved' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setReviewFilter('approved')}
                >
                  <span className="mr-1">✓</span>
                  승인됨 ({analysisResults.filter(r => r.approvalStatus === 'approved').length})
                </Button>
                <Button
                  variant={reviewFilter === 'all' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setReviewFilter('all')}
                >
                  전체
                </Button>
              </div>
            </div>

            {/* Filtered Results */}
            {(() => {
              const filteredResults = analysisResults.filter(result => {
                if (reviewFilter === 'all') return true;
                if (reviewFilter === 'pending') return result.approvalStatus === 'pending_review';
                return result.approvalStatus === 'approved';
              });

              return filteredResults.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📊</div>
                  <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
                    {reviewFilter === 'pending' && '검토 대기 중인 분석이 없습니다'}
                    {reviewFilter === 'approved' && '승인된 분석이 없습니다'}
                    {reviewFilter === 'all' && '아직 분석 결과가 없습니다'}
                  </h3>
                  <p className="text-[var(--color-text-secondary)]">
                    위의 분석 도구를 사용하여 첫 번째 생활기록부를 분석해보세요.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredResults.map((result) => (
                  <div
                    key={result.sessionId}
                    className={`border rounded-lg overflow-hidden ${
                      result.approvalStatus === 'pending_review'
                        ? 'border-orange-300 bg-orange-50 dark:bg-orange-900/10'
                        : result.approvalStatus === 'approved'
                        ? 'border-green-300 bg-green-50 dark:bg-green-900/10'
                        : 'border-red-300 bg-red-50 dark:bg-red-900/10'
                    }`}
                  >
                    {/* Prominent Status Banner */}
                    {result.approvalStatus === 'pending_review' && (
                      <div className="bg-orange-500 text-white px-6 py-3 flex items-center gap-2">
                        <span className="text-xl">🔒</span>
                        <div className="flex-1">
                          <p className="font-semibold text-sm">학생에게 숨겨짐</p>
                          <p className="text-xs opacity-90">이 분석은 승인 전까지 학생이 볼 수 없습니다</p>
                        </div>
                        <Badge variant="warning" className="bg-orange-600 text-white border-0">검토 대기</Badge>
                      </div>
                    )}
                    {result.approvalStatus === 'approved' && (
                      <div className="bg-green-500 text-white px-6 py-3 flex items-center gap-2">
                        <span className="text-xl">✅</span>
                        <div className="flex-1">
                          <p className="font-semibold text-sm">학생에게 공개됨</p>
                          <p className="text-xs opacity-90">학생이 이 분석 결과를 확인할 수 있습니다</p>
                        </div>
                        <Badge variant="success" className="bg-green-600 text-white border-0">승인 완료</Badge>
                      </div>
                    )}
                    {result.approvalStatus === 'rejected' && (
                      <div className="bg-red-500 text-white px-6 py-3 flex items-center gap-2">
                        <span className="text-xl">❌</span>
                        <div className="flex-1">
                          <p className="font-semibold text-sm">거절됨</p>
                          <p className="text-xs opacity-90">이 분석은 승인되지 않았습니다</p>
                        </div>
                        <Badge variant="error" className="bg-red-600 text-white border-0">거절됨</Badge>
                      </div>
                    )}

                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="mb-2">
                            <h3 className="text-lg font-medium text-[var(--color-text-primary)]">
                              {result.userName || '익명 사용자'}
                            </h3>
                          </div>
                        <p className="text-sm text-[var(--color-text-secondary)]">
                          분석 완료: {new Date(result.completedAt).toLocaleDateString('ko-KR')}
                        </p>
                        {result.approvedAt && (
                          <p className="text-xs text-green-600">
                            승인일: {new Date(result.approvedAt).toLocaleDateString('ko-KR')}
                          </p>
                        )}
                        <p className="text-xs text-[var(--color-text-tertiary)]">
                          세션 ID: {result.sessionId}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setSelectedAnalysis(result);
                            setShowAnalysisModal(true);
                          }}
                        >
                          분석 보기
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Navigate to chat with analysis context
                            router.push(`/dashboard/${slug}/chat?sessionId=${result.sessionId}`);
                          }}
                        >
                          학생 관련 질문하기
                        </Button>

                        {!result.profileGenerated ? (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => generateProfile(result.sessionId)}
                            disabled={generatingProfile === result.sessionId}
                          >
                            {generatingProfile === result.sessionId ? '생성중...' : '프로필 생성'}
                          </Button>
                        ) : (
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => {
                              setSelectedProfile(result.generatedProfile || '');
                              setShowProfileModal(true);
                            }}
                          >
                            프로필 보기
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Analysis Summary */}
                    {result.analysisData && (
                      <div className="bg-[var(--color-bg-secondary)] rounded-lg p-4">
                        <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">
                          분석 요약
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-[var(--color-text-secondary)]">총 활동:</span>
                            <span className="ml-2 font-medium text-[var(--color-text-primary)]">
                              {result.analysisData?.totalActivities || '-'}개
                            </span>
                          </div>
                          <div>
                            <span className="text-[var(--color-text-secondary)]">주요 분야:</span>
                            <span className="ml-2 font-medium text-[var(--color-text-primary)]">
                              {result.analysisData?.mainField || '-'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[var(--color-text-secondary)]">추천 진로:</span>
                            <span className="ml-2 font-medium text-[var(--color-text-primary)]">
                              {result.analysisData?.recommendedCareer || '-'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Generated Profile Preview */}
                    {result.profileGenerated && result.generatedProfile && (
                      <div className="mt-4 border-t border-[var(--color-border-primary)] pt-4">
                        <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">
                          생성된 프로필 미리보기
                        </h4>
                        <div className="bg-[var(--color-bg-tertiary)] rounded-lg p-4">
                          <p className="text-sm text-[var(--color-text-secondary)] line-clamp-3">
                            {result.generatedProfile.substring(0, 200)}...
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Prominent Approval Section - Only for pending analyses */}
                    {result.approvalStatus === 'pending_review' && (
                      <div className="mt-6 pt-4 border-t border-orange-300 bg-orange-100 dark:bg-orange-900/30 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-orange-900 dark:text-orange-100 mb-1">
                              승인 필요
                            </p>
                            <p className="text-xs text-orange-700 dark:text-orange-200">
                              승인하면 학생이 이 분석 결과를 즉시 확인할 수 있습니다
                            </p>
                          </div>
                          <Button
                            variant="primary"
                            size="md"
                            onClick={() => handleApproveAnalysis(result.sessionId)}
                            disabled={approvingSessionId === result.sessionId}
                            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 whitespace-nowrap"
                          >
                            {approvingSessionId === result.sessionId ? '승인 중...' : '✓ 학생에게 공개하기'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </Card>
          </>
        )}

        {/* Chat History Section - Only for Yaktoon (visible in both views) */}
        {slug === 'yaktoon' && (
          <Card className="mb-8">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
                  채팅 기록
                </h2>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowChatHistory(!showChatHistory)}
                >
                  {showChatHistory ? '채팅 기록 닫기' : '채팅 기록 보기'}
                </Button>
              </div>
              
              {showChatHistory && (
                <div className="space-y-4">
                  {chatHistory.length === 0 ? (
                    <p className="text-[var(--color-text-secondary)] text-center py-8">
                      아직 채팅 기록이 없습니다.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {chatHistory.map((chat) => (
                        <div
                          key={chat.id}
                          className="bg-[var(--color-bg-secondary)] rounded-lg p-4 hover:bg-[var(--color-bg-tertiary)] transition-colors cursor-pointer"
                          onClick={() => {
                            // Navigate to chat with existing session
                            router.push(`/dashboard/${slug}/chat?sessionId=${chat.analysisSessionId}`)
                          }}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-1">
                                세션 ID: {chat.analysisSessionId.substring(0, 8)}...
                              </h4>
                              <p className="text-xs text-[var(--color-text-secondary)] mb-2">
                                메시지 수: {chat.messageCount}개 | 
                                마지막 대화: {new Date(chat.lastMessageAt).toLocaleString('ko-KR')}
                              </p>
                              {chat.lastMessage && (
                                <div className="bg-[var(--color-bg-primary)] rounded p-2">
                                  <p className="text-xs text-[var(--color-text-tertiary)]">
                                    마지막 메시지 ({chat.lastMessage.role === 'user' ? '사용자' : 'AI'}):
                                  </p>
                                  <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2 mt-1">
                                    {chat.lastMessage.content}
                                  </p>
                                </div>
                              )}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="ml-4"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/dashboard/${slug}/chat?sessionId=${chat.analysisSessionId}`);
                              }}
                            >
                              대화 계속
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Analysis Details Modal */}
        {showAnalysisModal && selectedAnalysis && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--color-bg-primary)] rounded-lg max-w-7xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-[var(--color-border-primary)]">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">
                    분석 상세 결과 - {selectedAnalysis.userName}
                  </h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Create a new URL with the analysis data as query parameters
                        const analysisUrl = `/dashboard/${slug}/analysis/${selectedAnalysis.sessionId}`;
                        window.open(analysisUrl, '_blank');
                      }}
                    >
                      새 탭에서 보기
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setShowAnalysisModal(false);
                        setSelectedAnalysis(null);
                      }}
                    >
                      닫기
                    </Button>
                  </div>
                </div>
              </div>
              <div className="p-6">
                {selectedAnalysis.analysisData?.textSections &&
                 selectedAnalysis.analysisData?.extractedData &&
                 selectedAnalysis.analysisData?.validationAnalysis ? (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <h4 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
                        생활기록부 분석 결과
                      </h4>
                      <p className="text-[var(--color-text-secondary)]">
                        AI가 분석한 진로 역량, 구체적 노력, 연계성 등의 종합 결과입니다
                      </p>
                    </div>

                    {/* Enhanced AI Features Section */}
                    {(selectedAnalysis.analysisData?.ai_keyword_analysis ||
                      selectedAnalysis.analysisData?.ai_section_scoring ||
                      selectedAnalysis.analysisData?.enhanced_academic_analysis ||
                      selectedAnalysis.analysisData?.ai_major_recommendations ||
                      selectedAnalysis.analysisData?.next_semester_plan) && (
                      <div className="mb-8 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
                        <div className="flex items-center space-x-2 mb-4">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                            <span className="text-white text-sm">🤖</span>
                          </div>
                          <h5 className="text-lg font-semibold text-gray-900">AI 향상된 분석</h5>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                          {selectedAnalysis.analysisData?.ai_keyword_analysis && (
                            <div className="bg-white p-2 rounded border text-center">
                              <span className="text-purple-600">🤖 키워드</span>
                            </div>
                          )}
                          {selectedAnalysis.analysisData?.ai_section_scoring && (
                            <div className="bg-white p-2 rounded border text-center">
                              <span className="text-purple-600">⚡ 점수</span>
                            </div>
                          )}
                          {selectedAnalysis.analysisData?.enhanced_academic_analysis && (
                            <div className="bg-white p-2 rounded border text-center">
                              <span className="text-purple-600">🎓 학업분석</span>
                            </div>
                          )}
                          {selectedAnalysis.analysisData?.ai_major_recommendations && (
                            <div className="bg-white p-2 rounded border text-center">
                              <span className="text-purple-600">🚀 전공추천</span>
                            </div>
                          )}
                          {selectedAnalysis.analysisData?.next_semester_plan && (
                            <div className="bg-white p-2 rounded border text-center">
                              <span className="text-purple-600">📋 학습계획</span>
                            </div>
                          )}
                        </div>

                        <p className="text-xs text-gray-600 mt-2">
                          💡 전체 AI 기능을 보려면 "새 탭에서 보기"를 클릭하세요
                        </p>
                      </div>
                    )}

                    <ValidationResults
                      textSections={selectedAnalysis.analysisData.textSections}
                      extractedData={selectedAnalysis.analysisData.extractedData}
                      validationAnalysis={selectedAnalysis.analysisData.validationAnalysis}
                      activeFilters={['blue_highlight', 'red_line', 'blue_line', 'black_line', 'red_check']}
                      onFilterChange={() => {}} // Read-only mode for dashboard
                    />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-medium text-[var(--color-text-primary)] mb-3">분석 데이터</h4>
                      <div className="bg-[var(--color-bg-secondary)] rounded-lg p-4">
                        <pre className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap overflow-x-auto">
                          {JSON.stringify(selectedAnalysis.analysisData, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Profile Modal */}
        {showProfileModal && selectedProfile && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--color-bg-primary)] rounded-lg max-w-2xl w-full">
              <div className="p-6 border-b border-[var(--color-border-primary)]">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">
                    생성된 학생 프로필
                  </h3>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setShowProfileModal(false);
                      setSelectedProfile(null);
                    }}
                  >
                    닫기
                  </Button>
                </div>
              </div>
              <div className="p-6">
                <div className="bg-[var(--color-bg-secondary)] rounded-lg p-6">
                  <div className="prose prose-sm max-w-none text-[var(--color-text-primary)]">
                    {selectedProfile.split('\n').map((paragraph, index) => (
                      <p key={index} className="mb-4 last:mb-0 whitespace-pre-wrap">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button
                    variant="primary"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedProfile);
                      toast.success('프로필이 클립보드에 복사되었습니다!');
                    }}
                  >
                    클립보드에 복사
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <Toaster position="top-right" />
    </div>
  );
}
