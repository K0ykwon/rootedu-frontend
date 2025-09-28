'use client';

/**
 * Role-play Conversation Component
 *
 * Christine의 Role-play 대화 연습 기능:
 * - 사용자 입력 상황 기반 AI 대화 생성
 * - 실시간 대화 연습
 * - 자연스러운 표현 학습
 * - 맞춤형 피드백 제공
 */

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

interface ConversationMessage {
  id: string;
  role: 'user' | 'ai' | 'system';
  content: string;
  timestamp: number;
  feedback?: MessageFeedback;
}

interface MessageFeedback {
  score: number;
  naturalness: string;
  suggestions: string[];
  improvedVersion?: string;
}

interface ConversationSession {
  id: string;
  scenario: string;
  context: string;
  messages: ConversationMessage[];
  totalScore: number;
  completedTurns: number;
}

type ConversationMode = 'setup' | 'conversation' | 'feedback' | 'summary';

// Predefined scenarios for quick start
const QUICK_SCENARIOS = [
  {
    title: '공항에서 체크인하기',
    icon: '✈️',
    scenario: 'airport_checkin',
    context: '당신은 해외여행을 위해 공항에 도착했습니다. 항공사 카운터에서 체크인을 하려고 합니다.',
    difficulty: 'beginner'
  },
  {
    title: '레스토랑에서 주문하기',
    icon: '🍽️',
    scenario: 'restaurant_order',
    context: '당신은 외국 레스토랑에서 식사를 하려고 합니다. 서버와 대화하며 메뉴를 주문해보세요.',
    difficulty: 'beginner'
  },
  {
    title: '회사 동료와 스몰토크',
    icon: '💼',
    scenario: 'office_smalltalk',
    context: '새로운 직장에서 동료와 처음 만났습니다. 자연스럽게 인사를 나누고 친해져보세요.',
    difficulty: 'intermediate'
  },
  {
    title: '호텔에서 문제 해결하기',
    icon: '🏨',
    scenario: 'hotel_complaint',
    context: '호텔 방에 문제가 있어서 프런트 데스크에 도움을 요청해야 합니다.',
    difficulty: 'intermediate'
  },
  {
    title: '비즈니스 미팅 진행',
    icon: '🤝',
    scenario: 'business_meeting',
    context: '중요한 비즈니스 미팅에서 당신의 의견을 제시하고 협의해야 합니다.',
    difficulty: 'advanced'
  },
  {
    title: '의견이 다를 때 대화하기',
    icon: '💭',
    scenario: 'disagreement_discussion',
    context: '동료나 친구와 의견이 다른 상황에서 예의 바르게 자신의 생각을 전달해보세요.',
    difficulty: 'advanced'
  }
];

export function RolePlayConversation() {
  const { data: session } = useSession();
  const [mode, setMode] = useState<ConversationMode>('setup');
  const [customScenario, setCustomScenario] = useState('');
  const [selectedScenario, setSelectedScenario] = useState<typeof QUICK_SCENARIOS[0] | null>(null);
  const [currentSession, setCurrentSession] = useState<ConversationSession | null>(null);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const userId = session?.user?.name || 'anonymous';

  // Auto scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.messages]);

  // Start new conversation session
  const startConversation = async () => {
    if (!selectedScenario && !customScenario.trim()) {
      setError('시나리오를 선택하거나 직접 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const scenario = selectedScenario || {
        title: '사용자 정의 시나리오',
        scenario: 'custom',
        context: customScenario.trim(),
        difficulty: 'intermediate'
      };

      const response = await fetch('/api/influencers/christine/roleplay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'start_conversation',
          userId,
          scenario: scenario.scenario,
          context: scenario.context,
          difficulty: scenario.difficulty
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCurrentSession(data.session);
        setMode('conversation');
      } else {
        setError(data.error || 'Failed to start conversation');
      }
    } catch (err) {
      setError('대화 시작 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // Send user message
  const sendMessage = async () => {
    if (!userInput.trim() || !currentSession) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/influencers/christine/roleplay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'send_message',
          userId,
          sessionId: currentSession.id,
          message: userInput.trim()
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCurrentSession(data.session);
        setUserInput('');

        // Check if conversation should end
        if (data.session.completedTurns >= 6) { // End after 6 turns
          setTimeout(() => {
            setMode('summary');
          }, 2000);
        }
      } else {
        setError(data.error || 'Failed to send message');
      }
    } catch (err) {
      setError('메시지 전송 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // Get feedback for a specific message
  const getFeedback = async (messageId: string) => {
    if (!currentSession) return;

    try {
      setLoading(true);

      const response = await fetch('/api/influencers/christine/roleplay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'get_feedback',
          userId,
          sessionId: currentSession.id,
          messageId
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCurrentSession(data.session);
      } else {
        setError(data.error || 'Failed to get feedback');
      }
    } catch (err) {
      setError('피드백 요청 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // Reset to setup
  const resetToSetup = () => {
    setMode('setup');
    setCurrentSession(null);
    setSelectedScenario(null);
    setCustomScenario('');
    setUserInput('');
    setError(null);
  };

  // Render setup mode
  if (mode === 'setup') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <Card className="p-6" glass={false}>
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-500/20 to-teal-500/20 rounded-full flex items-center justify-center">
              <span className="text-4xl">🎭</span>
            </div>
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
              Role-play 대화 연습
            </h2>
            <p className="text-[var(--color-text-secondary)] max-w-2xl mx-auto">
              실제 상황을 시뮬레이션하여 자연스러운 영어 대화 능력을 기를 수 있습니다.
              AI와 함께 다양한 상황에서 대화를 연습해보세요!
            </p>
          </div>
        </Card>

        {/* Quick Scenarios */}
        <Card className="p-6" glass={false}>
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
            🚀 빠른 시작 - 추천 시나리오
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {QUICK_SCENARIOS.map((scenario, index) => (
              <Card
                key={index}
                className={`p-4 cursor-pointer transition-all duration-200 ${
                  selectedScenario === scenario
                    ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'hover:shadow-sm bg-[var(--color-bg-secondary)]'
                }`}
                glass={false}
                onClick={() => {
                  setSelectedScenario(scenario);
                  setCustomScenario('');
                }}
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{scenario.icon}</span>
                    <Badge
                      variant={
                        scenario.difficulty === 'beginner' ? 'success' :
                        scenario.difficulty === 'intermediate' ? 'warning' : 'error'
                      }
                      size="sm"
                    >
                      {scenario.difficulty === 'beginner' ? '초급' :
                       scenario.difficulty === 'intermediate' ? '중급' : '고급'}
                    </Badge>
                  </div>
                  <h4 className="font-medium text-[var(--color-text-primary)]">
                    {scenario.title}
                  </h4>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {scenario.context}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </Card>

        {/* Custom Scenario */}
        <Card className="p-6" glass={false}>
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
            ✏️ 사용자 정의 시나리오
          </h3>
          <div className="space-y-4">
            <textarea
              value={customScenario}
              onChange={(e) => {
                setCustomScenario(e.target.value);
                if (e.target.value.trim()) {
                  setSelectedScenario(null);
                }
              }}
              placeholder="원하는 상황을 자세히 설명해주세요. 예: '카페에서 친구와 만나서 최근 근황을 나누는 상황', '온라인 쇼핑몰에 전화해서 반품 문의를 하는 상황' 등"
              className="w-full p-4 border rounded-lg resize-none h-24 bg-[var(--color-bg-primary)]"
            />
            <p className="text-sm text-[var(--color-text-tertiary)]">
              💡 구체적이고 상세한 상황 설명일수록 더 맞춤형 대화를 연습할 수 있습니다.
            </p>
          </div>
        </Card>

        {/* Start Button */}
        <Card className="p-6 text-center" glass={false}>
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-[var(--color-text-primary)]">
              {selectedScenario ? selectedScenario.title : customScenario ? '사용자 정의 시나리오' : '시나리오를 선택해주세요'}
            </h4>
            {(selectedScenario || customScenario) && (
              <p className="text-sm text-[var(--color-text-secondary)] max-w-2xl mx-auto">
                {selectedScenario ? selectedScenario.context : customScenario}
              </p>
            )}
            <Button
              onClick={startConversation}
              disabled={loading || (!selectedScenario && !customScenario.trim())}
              variant="primary"
              size="lg"
            >
              {loading ? 'AI 준비 중...' : '🎭 Role-play 시작하기'}
            </Button>
          </div>
        </Card>

        {error && (
          <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          </Card>
        )}
      </div>
    );
  }

  // Render conversation mode
  if (mode === 'conversation' && currentSession) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <Card className="p-4" glass={false}>
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                🎭 {selectedScenario?.title || '사용자 정의 시나리오'}
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                진행: {currentSession.completedTurns}/6 턴
              </p>
            </div>
            <Button
              onClick={resetToSetup}
              variant="outline"
              size="sm"
            >
              새 시나리오 선택
            </Button>
          </div>
        </Card>

        {/* Conversation Area */}
        <Card className="p-6" glass={false}>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {currentSession.messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : message.role === 'system'
                      ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 text-sm'
                      : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]'
                  }`}
                >
                  <p>{message.content}</p>

                  {/* Feedback section for user messages */}
                  {message.role === 'user' && (
                    <div className="mt-2">
                      {message.feedback ? (
                        <div className="text-xs bg-white/20 p-2 rounded mt-2">
                          <div className="flex items-center gap-1 mb-1">
                            <span>점수: {message.feedback.score}/10</span>
                            <Badge variant="success" size="sm">피드백</Badge>
                          </div>
                          <p className="mb-1">{message.feedback.naturalness}</p>
                          {message.feedback.suggestions.length > 0 && (
                            <div>
                              <p className="text-xs opacity-75 mb-1">개선 제안:</p>
                              <ul className="text-xs opacity-75">
                                {message.feedback.suggestions.map((suggestion, idx) => (
                                  <li key={idx}>• {suggestion}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {message.feedback.improvedVersion && (
                            <p className="text-xs bg-white/10 p-1 rounded mt-1">
                              개선: "{message.feedback.improvedVersion}"
                            </p>
                          )}
                        </div>
                      ) : (
                        <Button
                          onClick={() => getFeedback(message.id)}
                          variant="outline"
                          size="sm"
                          className="text-xs mt-2 opacity-75 hover:opacity-100"
                        >
                          피드백 요청
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="mt-6 space-y-4">
            <div className="flex gap-3">
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="영어로 답변을 입력하세요..."
                className="flex-1 p-3 border rounded-lg resize-none h-20 bg-[var(--color-bg-primary)]"
                disabled={loading}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <Button
                onClick={sendMessage}
                disabled={loading || !userInput.trim()}
                variant="primary"
                className="h-20"
              >
                {loading ? '전송 중...' : '전송'}
              </Button>
            </div>

            <div className="text-xs text-[var(--color-text-tertiary)] text-center">
              💡 Enter를 눌러 전송, Shift+Enter로 줄바꿈
            </div>
          </div>
        </Card>

        {error && (
          <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          </Card>
        )}
      </div>
    );
  }

  // Render summary mode
  if (mode === 'summary' && currentSession) {
    const userMessages = currentSession.messages.filter(m => m.role === 'user');
    const avgScore = userMessages.reduce((sum, msg) => sum + (msg.feedback?.score || 0), 0) / userMessages.length;

    return (
      <Card className="p-8 text-center" glass={false}>
        <div className="space-y-6">
          <span className="text-6xl">🎉</span>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
            대화 연습 완료!
          </h2>

          {/* Final Score */}
          <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
              📊 종합 평가
            </h3>
            <p className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
              {Math.round(avgScore * 10)}/100
            </p>
            <p className="text-sm text-[var(--color-text-secondary)]">
              총 {currentSession.completedTurns}턴 완료
            </p>
          </div>

          {/* Detailed Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-medium text-blue-700 dark:text-blue-200 mb-1">자연스러움</h4>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-300">
                {avgScore >= 8 ? '매우 좋음' : avgScore >= 6 ? '좋음' : '보통'}
              </p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h4 className="font-medium text-green-700 dark:text-green-200 mb-1">참여도</h4>
              <p className="text-xl font-bold text-green-600 dark:text-green-300">
                {currentSession.completedTurns}/6턴
              </p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <h4 className="font-medium text-purple-700 dark:text-purple-200 mb-1">표현력</h4>
              <p className="text-xl font-bold text-purple-600 dark:text-purple-300">
                {userMessages.length}개 표현
              </p>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg text-left">
            <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
              💡 다음 단계 추천
            </h4>
            <ul className="text-sm text-yellow-700 dark:text-yellow-100 space-y-1">
              {avgScore >= 8 ? (
                <>
                  <li>• 더 복잡한 비즈니스 상황에 도전해보세요</li>
                  <li>• 의견이 다른 상황에서의 대화를 연습해보세요</li>
                  <li>• 실제 원어민과의 대화에 자신감을 가지세요!</li>
                </>
              ) : avgScore >= 6 ? (
                <>
                  <li>• 다양한 표현을 사용해보세요</li>
                  <li>• 같은 상황을 다시 연습해서 완벽하게 만들어보세요</li>
                  <li>• Core Phrase 패턴 연습으로 기본기를 다져보세요</li>
                </>
              ) : (
                <>
                  <li>• 기본 패턴부터 차근차근 연습하세요</li>
                  <li>• 간단한 상황부터 시작해보세요</li>
                  <li>• 피드백을 꼼꼼히 확인하고 개선해보세요</li>
                </>
              )}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => {
                setMode('conversation');
                setCurrentSession(null);
                startConversation();
              }}
              variant="outline"
            >
              같은 시나리오 다시 연습
            </Button>
            <Button
              onClick={resetToSetup}
              variant="primary"
            >
              새로운 시나리오 선택
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="text-center py-8">
      <div className="text-[var(--color-text-primary)]">로딩 중...</div>
    </div>
  );
}