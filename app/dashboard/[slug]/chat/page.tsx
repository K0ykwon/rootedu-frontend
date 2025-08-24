'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Card from '../../../../components/ui/Card';
import Button from '../../../../components/ui/Button';
import { toast, Toaster } from 'react-hot-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AnalysisResult {
  sessionId: string;
  userName: string;
  analysisData: any;
  completedAt: string;
}

export default function ConsultantChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const sessionId = searchParams.get('sessionId');
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(true);
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check authentication and load analysis data
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

    // Only load data once
    if (sessionId && !hasLoadedData) {
      setHasLoadedData(true);
      loadAnalysisData();
    } else if (!sessionId) {
      setLoadingAnalysis(false);
    }
  }, [session, status, slug, sessionId, hasLoadedData]);

  const loadAnalysisData = async () => {
    try {
      const response = await fetch(`/api/dashboard/${slug}/analysis-results`);
      if (response.ok) {
        const data = await response.json();
        const result = data.results?.find((r: AnalysisResult) => r.sessionId === sessionId);
        
        if (result) {
          setAnalysisResult(result);
          // Add initial context message
          setMessages([{
            id: '1',
            role: 'assistant',
            content: `안녕하세요! ${result.userName} 학생의 생활기록부 분석 결과를 바탕으로 상담 준비를 도와드리겠습니다. 
            
이 학생의 주요 특징:
- 학생 이름: ${result.userName}
- 분석 완료일: ${new Date(result.completedAt).toLocaleDateString('ko-KR')}
${result.analysisData?.totalActivities ? `- 총 활동 수: ${result.analysisData.totalActivities}개` : ''}
${result.analysisData?.mainField ? `- 주요 관심 분야: ${result.analysisData.mainField}` : ''}
${result.analysisData?.recommendedCareer ? `- 추천 진로: ${result.analysisData.recommendedCareer}` : ''}

학생의 강점, 개선점, 진로 상담 방향 등 궁금하신 점을 자유롭게 질문해주세요.`,
            timestamp: new Date()
          }]);
        }
      }
    } catch (error) {
      console.error('Failed to load analysis data:', error);
      toast.error('분석 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/dashboard/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          analysisData: analysisResult?.analysisData,
          studentName: analysisResult?.userName,
          messages: messages.map(m => ({ role: m.role, content: m.content }))
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.reply,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        toast.error('메시지 전송에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('메시지 전송 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (status === 'loading' || loadingAnalysis) {
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
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/${slug}`)}
            >
              ← 대시보드로 돌아가기
            </Button>
            {analysisResult && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const analysisUrl = `/dashboard/${slug}/analysis/${sessionId}`;
                  window.open(analysisUrl, '_blank');
                }}
              >
                분석 결과 보기
              </Button>
            )}
          </div>
          
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
            상담 준비 AI 도우미
          </h1>
          <p className="text-[var(--color-text-secondary)]">
            {analysisResult 
              ? `${analysisResult.userName} 학생의 분석 결과를 바탕으로 상담을 준비하세요`
              : '학생 분석 결과를 선택하여 상담 준비를 시작하세요'
            }
          </p>
        </div>

        {/* Chat Interface */}
        <Card className="h-[600px] flex flex-col">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-4 ${
                    message.role === 'user'
                      ? 'bg-[var(--color-primary-500)] text-white'
                      : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]'
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words">{message.content}</div>
                  <div className={`text-xs mt-2 ${
                    message.role === 'user' ? 'text-white/70' : 'text-[var(--color-text-tertiary)]'
                  }`}>
                    {message.timestamp.toLocaleTimeString('ko-KR')}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-[var(--color-bg-secondary)] rounded-lg p-4">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-[var(--color-text-tertiary)] rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-[var(--color-text-tertiary)] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-[var(--color-text-tertiary)] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-[var(--color-border-primary)] p-4">
            <div className="flex space-x-2">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={analysisResult 
                  ? "학생의 강점, 개선점, 진로 상담 방향 등을 질문해보세요..."
                  : "먼저 대시보드에서 학생 분석 결과를 선택해주세요"
                }
                className="flex-1 resize-none rounded-lg border border-[var(--color-border-primary)] 
                         bg-[var(--color-bg-primary)] px-4 py-2 text-[var(--color-text-primary)]
                         placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 
                         focus:ring-[var(--color-primary-500)]"
                rows={2}
                disabled={!analysisResult || isLoading}
              />
              <Button
                variant="primary"
                onClick={handleSendMessage}
                disabled={!analysisResult || !inputMessage.trim() || isLoading}
              >
                {isLoading ? '전송중...' : '전송'}
              </Button>
            </div>
          </div>
        </Card>

        {/* Help Text */}
        <div className="mt-4 text-sm text-[var(--color-text-secondary)]">
          <p>💡 추천 질문:</p>
          <ul className="mt-2 space-y-1 ml-4">
            <li>• 이 학생의 주요 강점은 무엇인가요?</li>
            <li>• 진로 상담 시 어떤 점을 중점적으로 다뤄야 할까요?</li>
            <li>• 학생의 활동 중 더 발전시킬 수 있는 부분은 무엇인가요?</li>
            <li>• 대학 입시 전략은 어떻게 세우면 좋을까요?</li>
          </ul>
        </div>
      </div>
      
      <Toaster position="top-right" />
    </div>
  );
}