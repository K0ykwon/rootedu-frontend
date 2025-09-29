'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatSession } from '../hooks/useChatSession';
import { useRouter } from 'next/navigation';
import TimeRangeSelector from './TimeRangeSelector';
import SubjectDetailsInput from './SubjectDetailsInput';
import SubjectListInput from './SubjectListInput';
import TimeAllocationSlider from './TimeAllocationSlider';
import type { TimeRange } from '@/lib/types/study-plan';

export default function ChatInterface() {
  const router = useRouter();
  const [inputValue, setInputValue] = useState('');
  const [selectedTimeRanges, setSelectedTimeRanges] = useState<TimeRange[]>([]);
  const [enteredSubjects, setEnteredSubjects] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    sessionId,
    currentStep,
    loading,
    error,
    generatedPlan,
    messages,
    initializeChat,
    sendMessage,
    resetChat,
    getStepProgress,
  } = useChatSession();

  // Initialize chat on mount
  useEffect(() => {
    // Check if force parameter is present in URL
    const searchParams = new URLSearchParams(window.location.search);
    const force = searchParams.get('force') === 'true';
    initializeChat(force);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle plan completion
  useEffect(() => {
    if (generatedPlan) {
      setTimeout(() => {
        router.push('/study-plan');
      }, 2000);
    }
  }, [generatedPlan, router]);

  // Extract subjects and time ranges from conversation history
  useEffect(() => {
    if (messages.length === 0) return;

    // Extract time ranges from messages
    if (selectedTimeRanges.length === 0) {
      for (const msg of messages) {
        if (msg.role === 'user') {
          // Look for time range patterns (e.g., "09:00-12:00, 14:00-18:00")
          const timeRangeMatch = msg.content.match(/(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/g);
          if (timeRangeMatch) {
            const ranges: TimeRange[] = timeRangeMatch.map(match => {
              const [start, end] = match.split('-');
              return { start, end };
            });
            if (ranges.length > 0) {
              setSelectedTimeRanges(ranges);
              break;
            }
          }
        }
      }
    }

    // Extract subjects from messages
    if (enteredSubjects.length === 0) {
      for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        if (msg.role === 'user') {
          // Look for subject responses (usually after time range and before detailed content)
          const nextMsg = messages[i + 1];
          if (nextMsg && nextMsg.role === 'assistant' && nextMsg.content.includes('각 과목별로')) {
            // This user message likely contains subjects
            const subjects = msg.content.split(/[,，]/).map(s => s.trim()).filter(s => s.length > 0);
            if (subjects.length > 0 && subjects.every(s => s.length < 20)) { // Basic validation
              setEnteredSubjects(subjects);
              break;
            }
          }
        }
      }
    }
  }, [messages, selectedTimeRanges.length, enteredSubjects.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;

    const message = inputValue.trim();
    setInputValue('');

    // Store subjects when they are entered
    if (currentStep === 'subjects') {
      const subjects = message.split(',').map(s => s.trim()).filter(s => s);
      setEnteredSubjects(subjects);
    }

    await sendMessage(message);

    // Focus textarea for next question
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const handleSkip = async () => {
    if (currentStep === 'motivational_quote') {
      await sendMessage('skip');
    }
  };

  const handleTimeRangeConfirm = async () => {
    if (selectedTimeRanges.length === 0) return;

    // Convert time ranges to formatted string for backend
    const timeRangeString = selectedTimeRanges
      .map(range => `${range.start}-${range.end}`)
      .join(', ');

    await sendMessage(timeRangeString);
    // Don't clear selectedTimeRanges - we need them for time allocation step
  };

  const handleSubjectDetailsSubmit = async (details: Record<string, string>) => {
    // Format subject details as a string for the backend
    const detailsString = Object.entries(details)
      .map(([subject, detail]) => `${subject}: ${detail}`)
      .join(', ');

    await sendMessage(detailsString);
  };

  const handleSubjectsSubmit = async (subjects: string[]) => {
    // Store subjects for later use in time allocation
    setEnteredSubjects(subjects);

    // Send subjects as formatted string to backend
    const subjectsString = subjects.join(', ');
    await sendMessage(subjectsString);
  };

  const handleTimeAllocationSubmit = async (allocations: { subject: string; duration: number }[]) => {
    // Format time allocations as string for backend
    const allocationsString = allocations
      .map(({ subject, duration }) => `${subject}: ${duration}분`)
      .join(', ');

    await sendMessage(allocationsString);
  };

  const getStepLabel = () => {
    const labels: Record<string, string> = {
      time_range: '학습 시간 설정',
      subjects: '학습 과목 선택',
      subject_details: '학습 내용 입력',
      time_allocation: '시간 배분',
      motivational_quote: '동기부여 문구',
      generating: '계획 생성 중...',
      completed: '완료!',
    };
    return labels[currentStep] || '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-800">
              📚 AI 학습 계획 도우미
            </h1>
            <button
              onClick={() => router.push('/')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>{getStepLabel()}</span>
              <span>{Math.round(getStepProgress())}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className="bg-blue-600 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${getStepProgress()}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {/* Messages */}
          <div className="h-96 overflow-y-auto mb-4 space-y-4">
            <AnimatePresence initial={false}>
              {messages.map((msg, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-gray-100 px-4 py-3 rounded-2xl">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
                </div>
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg"
              >
                {error}
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Form or Specialized Components */}
          {!generatedPlan && currentStep !== 'generating' && (
            <>
              {/* Show TimeRangeSelector for time_range step */}
              {currentStep === 'time_range' ? (
                <TimeRangeSelector
                  value={selectedTimeRanges}
                  onChange={setSelectedTimeRanges}
                  onConfirm={handleTimeRangeConfirm}
                />
              ) : currentStep === 'subjects' ? (
                // Show SubjectListInput for subjects step
                <SubjectListInput
                  onSubmit={handleSubjectsSubmit}
                  loading={loading}
                  minSubjects={1}
                  maxSubjects={8}
                />
              ) : currentStep === 'subject_details' && enteredSubjects.length > 0 ? (
                // Show SubjectDetailsInput for subject_details step
                <SubjectDetailsInput
                  subjects={enteredSubjects}
                  onSubmit={handleSubjectDetailsSubmit}
                  loading={loading}
                />
              ) : currentStep === 'time_allocation' ? (
                // Show TimeAllocationSlider for time_allocation step if we have subjects
                enteredSubjects.length > 0 && selectedTimeRanges.length > 0 ? (
                  <TimeAllocationSlider
                    subjects={enteredSubjects}
                    timeRanges={selectedTimeRanges}
                    onSubmit={handleTimeAllocationSubmit}
                    loading={loading}
                  />
                ) : (
                  // Fallback: show message if data is missing
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                    <p className="text-yellow-800">
                      시간 배분 설정을 위해 과목과 시간대 정보가 필요합니다.
                    </p>
                    <p className="text-sm text-yellow-600 mt-1">
                      디버그: 과목수={enteredSubjects.length}, 시간대수={selectedTimeRanges.length}
                    </p>
                  </div>
                )
              ) : (
                <form onSubmit={handleSubmit} className="space-y-2">
                  <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="답변을 입력하세요..."
                    disabled={loading || !sessionId}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 resize-none"
                    rows={3}
                    onKeyDown={(e) => {
                      // Allow submit on Enter if not holding Shift
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                  />

                  <div className="flex gap-2">
                    {currentStep === 'motivational_quote' && (
                      <button
                        type="button"
                        onClick={handleSkip}
                        disabled={loading}
                        className="px-4 py-3 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                      >
                        건너뛰기
                      </button>
                    )}

                    <button
                      type="submit"
                      disabled={loading || !inputValue.trim() || !sessionId}
                      className="ml-auto px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          <span>전송</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="text-xs text-gray-400 text-right">
                    Shift + Enter로 줄바꿈, Enter로 전송
                  </div>
                </form>
              )}
            </>
          )}

          {generatedPlan && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                학습 계획이 완성되었습니다!
              </h2>
              <p className="text-gray-600">
                잠시 후 계획 페이지로 이동합니다...
              </p>
            </motion.div>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-4 text-center text-sm text-gray-500">
          <p>단계별로 질문에 답변해주시면 맞춤형 학습 계획을 만들어드립니다.</p>
        </div>
      </div>
    </div>
  );
}