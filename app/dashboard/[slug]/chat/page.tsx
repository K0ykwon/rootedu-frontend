'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Card from '../../../../components/ui/Card';
import Button from '../../../../components/ui/Button';
import { toast, Toaster } from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

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

interface ChatMetadata {
  chatId: string;
  sessionId: string;
  studentName: string;
  title: string;
  createdAt: string;
  lastMessage: string;
  messageCount: number;
}

export default function ConsultantChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const sessionId = searchParams.get('sessionId');
  const initialChatId = searchParams.get('chatId');
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(true);
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string>(initialChatId || '');
  const [chatHistory, setChatHistory] = useState<ChatMetadata[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Check authentication and load analysis data
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

    // Only load data once
    if (sessionId && !hasLoadedData) {
      setHasLoadedData(true);
      loadAnalysisData();
      loadChatHistory();
      if (initialChatId) {
        loadExistingChat(initialChatId);
      } else {
        // Create a new chat ID if none provided
        setCurrentChatId(uuidv4());
      }
    } else if (!sessionId) {
      setLoadingAnalysis(false);
    }
  }, [session, status, slug, sessionId, hasLoadedData]);

  // Auto-save messages when they change
  useEffect(() => {
    if (messages.length > 0 && autoSaveEnabled && currentChatId && analysisResult) {
      // Clear existing timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      // Set new timeout to save after 2 seconds of inactivity
      autoSaveTimeoutRef.current = setTimeout(() => {
        saveChatToRedis();
      }, 2000);
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [messages, currentChatId, analysisResult]);

  const loadChatHistory = async () => {
    if (!sessionId) return;
    
    setLoadingHistory(true);
    try {
      const response = await fetch(`/api/dashboard/${slug}/chat/list?sessionId=${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setChatHistory(data.chats || []);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadExistingChat = async (chatId: string) => {
    if (!sessionId) return;
    
    try {
      const response = await fetch(`/api/dashboard/${slug}/chat/${chatId}?sessionId=${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.messages) {
          setMessages(data.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          })));
        }
      }
    } catch (error) {
      console.error('Failed to load existing chat:', error);
      toast.error('채팅 내역을 불러오는데 실패했습니다.');
    }
  };

  const saveChatToRedis = async () => {
    if (!currentChatId || !sessionId || messages.length === 0) return;

    try {
      const response = await fetch(`/api/dashboard/${slug}/chat/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          chatId: currentChatId,
          messages: messages.map(msg => ({
            ...msg,
            timestamp: msg.timestamp.toISOString()
          })),
          studentName: analysisResult?.userName || 'Unknown',
          title: messages[0]?.content?.substring(0, 50) || 'New Chat'
        }),
      });

      if (!response.ok) {
        console.error('Failed to save chat');
      } else {
        // Refresh chat history
        loadChatHistory();
      }
    } catch (error) {
      console.error('Error saving chat:', error);
    }
  };

  const startNewChat = () => {
    const newChatId = uuidv4();
    setCurrentChatId(newChatId);
    setMessages([]);
    
    // Update URL without page refresh
    const newUrl = `/dashboard/${slug}/chat?sessionId=${sessionId}`;
    window.history.pushState({}, '', newUrl);
    
    // Load initial context message for new chat
    if (analysisResult) {
      setMessages([{
        id: '1',
        role: 'assistant',
        content: `안녕하세요! ${analysisResult.userName} 학생의 생활기록부 분석 결과를 바탕으로 상담 준비를 도와드리겠습니다. 
        
이 학생의 주요 특징:
- 학생 이름: ${analysisResult.userName}
- 분석 완료일: ${new Date(analysisResult.completedAt).toLocaleDateString('ko-KR')}
${analysisResult.analysisData?.totalActivities ? `- 총 활동 수: ${analysisResult.analysisData.totalActivities}개` : ''}
${analysisResult.analysisData?.mainField ? `- 주요 관심 분야: ${analysisResult.analysisData.mainField}` : ''}
${analysisResult.analysisData?.recommendedCareer ? `- 추천 진로: ${analysisResult.analysisData.recommendedCareer}` : ''}

학생의 강점, 개선점, 진로 상담 방향 등 궁금하신 점을 자유롭게 질문해주세요.`,
        timestamp: new Date()
      }]);
    }
  };

  const selectChat = (chatId: string) => {
    setCurrentChatId(chatId);
    loadExistingChat(chatId);
    
    // Update URL with chatId
    const newUrl = `/dashboard/${slug}/chat?sessionId=${sessionId}&chatId=${chatId}`;
    window.history.pushState({}, '', newUrl);
  };

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
    <div className="h-screen bg-[var(--color-bg-primary)] overflow-hidden">
      <div className="flex h-full">
        {/* Sidebar */}
        <div className={`${showSidebar ? 'w-80' : 'w-0'} transition-all duration-300 bg-[var(--color-bg-secondary)] border-r border-[var(--color-border-primary)] overflow-hidden flex-shrink-0`}>
          <div className="p-4 h-full flex flex-col">
            {/* Sidebar Header */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">대화 기록</h3>
              <Button
                variant="primary"
                className="w-full"
                onClick={startNewChat}
                disabled={!analysisResult}
              >
                + 새 대화 시작
              </Button>
            </div>

            {/* Chat History List */}
            <div className="flex-1 overflow-y-auto space-y-2">
              {loadingHistory ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--color-primary-500)] mx-auto"></div>
                </div>
              ) : chatHistory.length > 0 ? (
                chatHistory.map((chat) => (
                  <div
                    key={chat.chatId}
                    onClick={() => selectChat(chat.chatId)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      currentChatId === chat.chatId
                        ? 'bg-[var(--color-bg-tertiary)] border border-[var(--color-primary-500)]'
                        : 'hover:bg-[var(--color-bg-tertiary)] border border-transparent'
                    }`}
                  >
                    <div className="font-medium text-[var(--color-text-primary)] text-sm mb-1 truncate">
                      {chat.title}
                    </div>
                    <div className="text-xs text-[var(--color-text-secondary)]">
                      {new Date(chat.createdAt).toLocaleDateString('ko-KR')}
                    </div>
                    <div className="text-xs text-[var(--color-text-tertiary)] mt-1 truncate">
                      {chat.messageCount}개 메시지
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-[var(--color-text-secondary)]">
                  대화 기록이 없습니다
                </div>
              )}
            </div>

            {/* Auto-save indicator */}
            <div className="mt-4 pt-4 border-t border-[var(--color-border-primary)]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--color-text-secondary)]">자동 저장</span>
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${autoSaveEnabled ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                  <span className="text-[var(--color-text-secondary)]">
                    {autoSaveEnabled ? '활성화' : '비활성화'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex-shrink-0 px-6 py-4 border-b border-[var(--color-border-primary)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSidebar(!showSidebar)}
                >
                  <span className="text-xl">{showSidebar ? '◀' : '▶'}</span>
                </Button>
                <div>
                  <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
                    상담 준비 AI 도우미
                  </h1>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {analysisResult 
                      ? `${analysisResult.userName} 학생의 상담 준비`
                      : '학생을 선택해주세요'
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/dashboard/${slug}`)}
                >
                  대시보드로 돌아가기
                </Button>
              </div>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-0">
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
                    message.role === 'user' ? 'text-white/70 dark:text-white/70' : 'text-[var(--color-text-tertiary)]'
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
            <div className="flex-shrink-0 border-t border-[var(--color-border-primary)] px-6 py-4">
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

            {/* Help Text */}
            <div className="flex-shrink-0 bg-[var(--color-bg-secondary)] border-t border-[var(--color-border-primary)] px-6 py-4">
              <div className="text-sm text-[var(--color-text-secondary)]">
                <p className="font-semibold mb-2">💡 추천 질문:</p>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setInputMessage('이 학생의 주요 강점은 무엇인가요?')}
                    className="text-left p-2 rounded hover:bg-[var(--color-bg-tertiary)] transition-colors"
                  >
                    • 이 학생의 주요 강점은 무엇인가요?
                  </button>
                  <button 
                    onClick={() => setInputMessage('진로 상담 시 어떤 점을 중점적으로 다뤄야 할까요?')}
                    className="text-left p-2 rounded hover:bg-[var(--color-bg-tertiary)] transition-colors"
                  >
                    • 진로 상담 시 중점 사항은?
                  </button>
                  <button 
                    onClick={() => setInputMessage('학생의 활동 중 더 발전시킬 수 있는 부분은 무엇인가요?')}
                    className="text-left p-2 rounded hover:bg-[var(--color-bg-tertiary)] transition-colors"
                  >
                    • 발전시킬 수 있는 활동은?
                  </button>
                  <button 
                    onClick={() => setInputMessage('대학 입시 전략은 어떻게 세우면 좋을까요?')}
                    className="text-left p-2 rounded hover:bg-[var(--color-bg-tertiary)] transition-colors"
                  >
                    • 대학 입시 전략 수립 방향은?
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Toaster position="top-right" />
    </div>
  );
}