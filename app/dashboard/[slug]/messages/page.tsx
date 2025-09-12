'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Card from '../../../../components/ui/Card';
import Button from '../../../../components/ui/Button';
import { toast, Toaster } from 'react-hot-toast';

interface ReviewRequest {
  id: string;
  userName: string;
  userEmail: string;
  originalMessage: string;
  aiResponse: string;
  reviewReason: string;
  timestamp: string;
  status: 'pending' | 'responded';
}

export default function InfluencerMessagesPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  const [reviewRequests, setReviewRequests] = useState<ReviewRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ReviewRequest | null>(null);
  const [editedResponse, setEditedResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [showAIDraft, setShowAIDraft] = useState(true);

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
    
    // Allow access if:
    // 1. User is admin, OR
    // 2. User is an influencer and their slug matches the page slug
    const isInfluencer = userType === 'influencer' && (influencerSlug === slug || userId === slug);
    
    if (userRole !== 'admin' && !isInfluencer) {
      router.push('/');
      return;
    }

    loadReviewRequests();
    // Poll for new review requests every 10 seconds
    const interval = setInterval(loadReviewRequests, 10000);
    return () => clearInterval(interval);
  }, [session, status, slug]);

  const loadReviewRequests = async () => {
    try {
      const response = await fetch(`/api/dashboard/${slug}/review-requests`);
      if (response.ok) {
        const data = await response.json();
        setReviewRequests(data.reviewRequests || []);
      }
    } catch (error) {
      console.error('Failed to load review requests:', error);
      toast.error('검토 요청을 불러오는데 실패했습니다.');
    } finally {
      setLoadingMessages(false);
    }
  };

  const selectRequest = (request: ReviewRequest) => {
    setSelectedRequest(request);
    setEditedResponse(''); // Start with empty response for review requests
    setShowAIDraft(true);
  };

  const useAIResponse = () => {
    if (selectedRequest) {
      setEditedResponse(selectedRequest.aiResponse);
    }
  };

  const sendResponse = async () => {
    if (!selectedRequest || !editedResponse.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/dashboard/${slug}/send-response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewRequestId: selectedRequest.id,
          response: editedResponse,
          isReviewResponse: true
        }),
      });

      if (response.ok) {
        toast.success('답변이 전송되었습니다.');
        
        // Remove from review requests list
        setReviewRequests(prev => prev.filter(r => r.id !== selectedRequest.id));
        setSelectedRequest(null);
        setEditedResponse('');
        
        // Reload review requests
        loadReviewRequests();
      } else {
        toast.error('답변 전송에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to send response:', error);
      toast.error('답변 전송 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading' || loadingMessages) {
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
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
              AI 답변 검토 요청
            </h1>
            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/${slug}`)}
            >
              대시보드로 돌아가기
            </Button>
          </div>
          <p className="text-[var(--color-text-secondary)]">
            고객이 AI 답변에 만족하지 않아 검토를 요청한 메시지들입니다
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Message List */}
          <div className="lg:col-span-1">
            <Card className="p-4">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
                검토 요청 ({reviewRequests.length})
              </h2>
              
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {reviewRequests.length === 0 ? (
                  <p className="text-center py-8 text-[var(--color-text-secondary)]">
                    새로운 검토 요청이 없습니다
                  </p>
                ) : (
                  reviewRequests.map((request) => (
                    <div
                      key={request.id}
                      onClick={() => selectRequest(request)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedRequest?.id === request.id
                          ? 'bg-[var(--color-bg-tertiary)] border-[var(--color-primary-500)]'
                          : 'bg-[var(--color-bg-secondary)] border-[var(--color-border-primary)] hover:border-[var(--color-primary-500)]'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium text-[var(--color-text-primary)]">
                          {request.userName}
                        </div>
                        <div className="text-xs text-[var(--color-text-tertiary)]">
                          {new Date(request.timestamp).toLocaleString('ko-KR', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                      <div className="text-sm text-[var(--color-text-secondary)] line-clamp-2">
                        {request.originalMessage}
                      </div>
                      <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                        AI 답변에 불만족
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Review Request Detail & Response */}
          <div className="lg:col-span-2">
            {selectedRequest ? (
              <Card className="p-6">
                {/* Customer Info */}
                <div className="mb-6">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                        {selectedRequest.userName}
                      </h3>
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        {selectedRequest.userEmail}
                      </p>
                    </div>
                    <div className="text-sm text-[var(--color-text-tertiary)]">
                      {new Date(selectedRequest.timestamp).toLocaleString('ko-KR')}
                    </div>
                  </div>
                </div>

                {/* Original Customer Question */}
                <div className="mb-6">
                  <h4 className="font-medium text-[var(--color-text-primary)] mb-3">
                    고객 질문
                  </h4>
                  <div className="bg-[var(--color-bg-secondary)] rounded-lg p-4">
                    <p className="text-[var(--color-text-primary)] whitespace-pre-wrap">
                      {selectedRequest.originalMessage}
                    </p>
                  </div>
                </div>

                {/* AI Response that customer didn't like */}
                {showAIDraft && (
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-[var(--color-text-primary)]">
                        고객이 불만족한 AI 답변
                      </h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={useAIResponse}
                      >
                        AI 답변 참고하기
                      </Button>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                      <p className="text-[var(--color-text-primary)] whitespace-pre-wrap">
                        {selectedRequest.aiResponse}
                      </p>
                    </div>
                  </div>
                )}

                {/* Your Response Editor */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-[var(--color-text-primary)]">
                      개선된 답변 작성
                    </h4>
                    <button
                      onClick={() => setShowAIDraft(!showAIDraft)}
                      className="text-sm text-[var(--color-primary-500)] hover:underline"
                    >
                      {showAIDraft ? 'AI 답변 숨기기' : 'AI 답변 보기'}
                    </button>
                  </div>
                  
                  <textarea
                    value={editedResponse}
                    onChange={(e) => setEditedResponse(e.target.value)}
                    placeholder="고객에게 더 나은 답변을 작성해주세요..."
                    className="w-full h-48 rounded-lg border border-[var(--color-border-primary)] 
                             bg-[var(--color-bg-primary)] px-4 py-3 text-[var(--color-text-primary)]
                             placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 
                             focus:ring-[var(--color-primary-500)] resize-none"
                  />
                  
                  <div className="mt-4 flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedRequest(null);
                        setEditedResponse('');
                      }}
                      disabled={isLoading}
                    >
                      취소
                    </Button>
                    <Button
                      variant="primary"
                      onClick={sendResponse}
                      disabled={!editedResponse.trim() || isLoading}
                    >
                      {isLoading ? '전송중...' : '개선된 답변 보내기'}
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-12">
                <div className="text-center">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
                    검토 요청을 선택하세요
                  </h3>
                  <p className="text-[var(--color-text-secondary)]">
                    왼쪽 목록에서 검토할 요청을 선택해주세요
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
      
      <Toaster position="top-right" />
    </div>
  );
}