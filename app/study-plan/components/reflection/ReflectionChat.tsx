'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Send,
  Loader2,
  AlertCircle,
  Bot,
  RotateCcw,
  Volume2,
  VolumeX,
  CheckCircle
} from 'lucide-react';
import MessageBubble from './MessageBubble';
import ReflectionReport from './ReflectionReport';
import type {
  DailyStudyPlan,
  ReflectionMessage,
  ReflectionReport as ReflectionReportType
} from '@/lib/types/study-plan';

interface ReflectionChatProps {
  isOpen: boolean;
  onClose: () => void;
  plan: DailyStudyPlan;
}

interface StreamMessage {
  type: 'content' | 'report' | 'continue' | 'error';
  content?: string;
  report?: ReflectionReportType;
  turnCount?: number;
  isComplete?: boolean;
  canComplete?: boolean;
  error?: string;
}

export default function ReflectionChat({ isOpen, onClose, plan }: ReflectionChatProps) {
  const [messages, setMessages] = useState<ReflectionMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [report, setReport] = useState<ReflectionReportType | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);
  const [canComplete, setCanComplete] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 메시지 스크롤
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 세션 초기화
  const initializeSession = async () => {
    setIsInitializing(true);
    setError(null);

    try {
      const response = await fetch('/api/study-plan/reflection/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.id })
      });

      const data = await response.json();

      if (data.success) {
        setSessionId(data.data.sessionId);

        // 첫 메시지 추가
        const firstMessage: ReflectionMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.data.message,
          timestamp: new Date().toISOString()
        };

        setMessages([firstMessage]);

        // 사운드 효과
        if (isSoundEnabled) {
          playNotificationSound();
        }
      } else {
        setError(data.error || '세션 초기화에 실패했습니다.');
      }
    } catch (err) {
      console.error('Session initialization error:', err);
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setIsInitializing(false);
    }
  };

  // 메시지 전송
  const sendMessage = async () => {
    if (!input.trim() || !sessionId || isLoading) return;

    const userMessage: ReflectionMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    // AI 응답 준비용 빈 메시지
    const aiMessageId = crypto.randomUUID();
    const aiMessage: ReflectionMessage = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, aiMessage]);

    try {
      // Abort controller 설정
      abortControllerRef.current = new AbortController();

      const response = await fetch('/api/study-plan/reflection/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: input.trim()
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Response body reader not available');
      }

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            if (data === '[DONE]') {
              setIsLoading(false);
              return;
            }

            try {
              const parsed: StreamMessage = JSON.parse(data);

              if (parsed.type === 'content' && parsed.content) {
                // 스트리밍 텍스트 업데이트
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === aiMessageId
                      ? { ...msg, content: msg.content + parsed.content }
                      : msg
                  )
                );
              } else if (parsed.type === 'report' && parsed.report) {
                // 리포트 표시
                setReport(parsed.report);
                setShowReport(true);
                setTurnCount(parsed.turnCount || 5);

                // 사운드 효과
                if (isSoundEnabled) {
                  playCompletionSound();
                }
              } else if (parsed.type === 'continue') {
                setTurnCount(parsed.turnCount || 0);
                setCanComplete(parsed.canComplete || false);
              } else if (parsed.type === 'error') {
                setError(parsed.error || '오류가 발생했습니다.');
              }
            } catch (parseError) {
              console.error('Error parsing stream data:', parseError);
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // 사용자가 중단한 경우
        return;
      }

      console.error('Message sending error:', err);
      setError('메시지 전송 중 오류가 발생했습니다.');

      // 실패한 AI 메시지 제거
      setMessages(prev => prev.filter(msg => msg.id !== aiMessageId));
    } finally {
      setIsLoading(false);
    }
  };

  // 엔터키 처리
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // 사운드 효과
  const playNotificationSound = () => {
    // 실제 구현에서는 오디오 파일 재생
    console.log('🔔 Notification sound');
  };

  const playCompletionSound = () => {
    // 실제 구현에서는 완료 사운드 재생
    console.log('🎉 Completion sound');
  };

  // 세션 재시작
  const restartSession = () => {
    setMessages([]);
    setSessionId(null);
    setReport(null);
    setShowReport(false);
    setError(null);
    setTurnCount(0);
    setInput('');
    setCanComplete(false);
    setIsCompleting(false);
    initializeSession();
  };

  // 스트림 중단
  const cancelStream = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  };

  // 수동 완료
  const completeSession = async () => {
    if (!sessionId || isCompleting) return;

    setIsCompleting(true);
    setError(null);

    try {
      const response = await fetch('/api/study-plan/reflection/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });

      const data = await response.json();

      if (data.success) {
        setReport(data.data.report);
        setShowReport(true);
        setTurnCount(data.data.turnCount);

        // 사운드 효과
        if (isSoundEnabled) {
          playCompletionSound();
        }
      } else {
        setError(data.error || '완료 처리 중 오류가 발생했습니다.');
      }
    } catch (err) {
      console.error('Session completion error:', err);
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setIsCompleting(false);
    }
  };

  // 컴포넌트 마운트 시 세션 초기화
  useEffect(() => {
    if (isOpen && !sessionId && !isInitializing) {
      initializeSession();
    }
  }, [isOpen]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // 진행률 계산
  const progress = Math.min((turnCount / 5) * 100, 100);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-md z-40"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 400 }}
              className="absolute inset-2 bg-white shadow-2xl rounded-3xl flex flex-col overflow-hidden ring-4 ring-purple-500/30 ring-offset-2"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 헤더 */}
              <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm animate-pulse">
                      <Bot className="w-10 h-10" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold mb-1 tracking-wide">AI 학습 컨설턴트</h1>
                      <p className="text-purple-100 text-lg">
                        🤖 오늘 하루 학습을 함께 돌아봐요
                      </p>
                      <p className="text-sm text-purple-200 mt-1">
                        {turnCount === 0 ? '대화를 시작해보세요' : `${turnCount}/5 단계 진행 중`}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    {/* 사운드 토글 */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                      className="p-3 bg-white/20 rounded-xl hover:bg-white/30 transition-colors backdrop-blur-sm"
                      title={isSoundEnabled ? '사운드 끄기' : '사운드 켜기'}
                    >
                      {isSoundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                    </motion.button>

                    {/* 재시작 */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={restartSession}
                      className="p-3 bg-white/20 rounded-xl hover:bg-white/30 transition-colors backdrop-blur-sm"
                      title="대화 다시 시작"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </motion.button>

                    {/* 닫기 */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={onClose}
                      className="p-3 bg-white/20 rounded-xl hover:bg-white/30 transition-colors backdrop-blur-sm"
                      title="컨설팅 종료"
                    >
                      <X className="w-5 h-5" />
                    </motion.button>
                  </div>
                </div>

                {/* 진행률 바 */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-purple-100">대화 진행률</span>
                    <span className="text-white font-medium">{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-3">
                    <motion.div
                      className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full h-3 shadow-lg"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                  {turnCount >= 5 && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center text-yellow-200 text-sm font-medium"
                    >
                      ✨ 이제 대화를 마무리할 수 있어요!
                    </motion.p>
                  )}
                </div>
              </div>

              {/* 메시지 영역 */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-gray-50 to-white">
                {isInitializing && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                    <span className="ml-2 text-gray-600">AI 컨설턴트 준비 중...</span>
                  </div>
                )}

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3"
                  >
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-800 font-medium">오류가 발생했습니다</p>
                      <p className="text-red-600 text-sm">{error}</p>
                      <button
                        onClick={restartSession}
                        className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                      >
                        다시 시도
                      </button>
                    </div>
                  </motion.div>
                )}

                {messages.map((message, index) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isTyping={isLoading && index === messages.length - 1 && message.role === 'assistant'}
                    index={index}
                  />
                ))}

                <div ref={messagesEndRef} />
              </div>

              {/* 입력 영역 */}
              {!report && (
                <div className="p-6 border-t border-gray-200 bg-white">
                  {/* 완료 버튼 (5턴 이후 표시) */}
                  {canComplete && !isLoading && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-4"
                    >
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={completeSession}
                        disabled={isCompleting}
                        className="w-full py-5 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                      >
                        {isCompleting ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>리포트 생성 중...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-5 h-5" />
                            <span>오늘 학습 회고 완료하기</span>
                          </>
                        )}
                      </motion.button>
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        대화를 마치고 최종 학습 리포트를 받아보세요
                      </p>
                    </motion.div>
                  )}

                  {/* 메시지 입력 영역 */}
                  <div className="flex gap-3">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={isLoading ? 'AI가 응답 중...' : '자유롭게 대화해보세요...'}
                      disabled={isLoading || isInitializing || isCompleting}
                      className="flex-1 px-5 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-50 disabled:cursor-not-allowed text-lg transition-all"
                    />
                    <div className="flex gap-2">
                      {isLoading && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={cancelStream}
                          className="px-5 py-4 bg-red-500 text-white rounded-2xl hover:bg-red-600 transition-colors shadow-lg"
                          title="응답 중단"
                        >
                          <X className="w-5 h-5" />
                        </motion.button>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={sendMessage}
                        disabled={!input.trim() || isLoading || isInitializing || isCompleting}
                        className="px-5 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl hover:from-purple-700 hover:to-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-lg"
                        title="메시지 전송"
                      >
                        {isLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                      </motion.button>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Enter로 전송 • 진행률: {turnCount}/5 단계
                    {canComplete && <span className="text-green-600 font-medium"> • 완료 가능</span>}
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 리포트 모달 */}
      <AnimatePresence>
        {showReport && report && (
          <ReflectionReport
            report={report}
            onClose={() => {
              setShowReport(false);
              onClose();
            }}
            onSave={() => {
              // 리포트 저장 로직
              console.log('Saving report:', report);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}