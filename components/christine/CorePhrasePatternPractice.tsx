'use client';

/**
 * Core Phrase Pattern Practice Component
 *
 * Christine의 핵심 패턴 연습 기능:
 * - 3개월차 커리큘럼 기반 (여행/스몰토크/비즈니스)
 * - AI 자동 변형 문제 생성
 * - 빈칸 채우기 + 문장 완성
 * - 단계별 난이도 조절
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

// Core Phrase Data Structure
const CORE_PHRASES = {
  '1개월차': {
    name: '여행 (Travel)',
    icon: '✈️',
    weeks: {
      '1주차': {
        name: '공항 (Airport)',
        icon: '🛫',
        phrases: [
          "I'd like to check in.",
          "Can I get a window seat?",
          "How many bags can I check in?",
          "Do I need to pay for overweight luggage?",
          "Where is gate 12?"
        ]
      },
      '2주차': {
        name: '기내 (On the Plane)',
        icon: '✈️',
        phrases: [
          "Could I get some water?",
          "Can I have a blanket?",
          "Excuse me, that's my seat.",
          "Can we switch seats?",
          "How long is the flight?"
        ]
      },
      '3주차': {
        name: '호텔 (Hotel)',
        icon: '🏨',
        phrases: [
          "I have a reservation.",
          "Can I check out late?",
          "Could I get extra towels?",
          "The air conditioner isn't working.",
          "Is breakfast included?"
        ]
      },
      '4주차': {
        name: '카페·레스토랑·쇼핑',
        icon: '🛍️',
        phrases: [
          "Can I get an iced latte?",
          "Do you have a table for two?",
          "What do you recommend?",
          "How much is this?",
          "Do you have it in another size?"
        ]
      }
    }
  },
  '2개월차': {
    name: '스몰토크 (Small Talk)',
    icon: '💬',
    weeks: {
      '1주차': {
        name: '날씨 (Weather)',
        icon: '🌤️',
        phrases: [
          "It's chilly today.",
          "Feels like autumn already.",
          "This weather makes me sleepy.",
          "It's perfect for a walk.",
          "You must be cold."
        ]
      },
      '2주차': {
        name: '근황 (Catching Up)',
        icon: '👥',
        phrases: [
          "I've been busy with work.",
          "I just got back from a trip.",
          "My son started school.",
          "I've been working on my cooking.",
          "Nothing much, same as usual."
        ]
      },
      '3주차': {
        name: '칭찬·공감 (Compliments & Empathy)',
        icon: '👏',
        phrases: [
          "I love your outfit.",
          "That's impressive!",
          "That sounds fun.",
          "I know what you mean.",
          "No way!"
        ]
      },
      '4주차': {
        name: '대화 이어가기·마무리 (Conversation Flow)',
        icon: '🔄',
        phrases: [
          "By the way, …",
          "Speaking of that, …",
          "It was nice chatting.",
          "I'll let you go now.",
          "Let's grab coffee sometime."
        ]
      }
    }
  },
  '3개월차': {
    name: '회사 (Work & Business)',
    icon: '💼',
    weeks: {
      '1주차': {
        name: '회의 시작·동의/비동의',
        icon: '🤝',
        phrases: [
          "Shall we get started?",
          "I agree with you.",
          "I'm not sure about that.",
          "Can we try another option?",
          "Let's hear from others."
        ]
      },
      '2주차': {
        name: '의견 제시·대안 제안',
        icon: '💡',
        phrases: [
          "In my opinion, …",
          "I suggest we …",
          "What if we …?",
          "That might work.",
          "We need more data."
        ]
      },
      '3주차': {
        name: '일정·시간 협의',
        icon: '📅',
        phrases: [
          "When is the deadline?",
          "Can we move the meeting?",
          "Let's set a timeline.",
          "I'm available on Monday.",
          "Does that work for you?"
        ]
      },
      '4주차': {
        name: '네트워킹·인사',
        icon: '🤝',
        phrases: [
          "Nice to meet you.",
          "What do you do?",
          "It was great talking with you.",
          "Let's keep in touch.",
          "See you at the next meeting."
        ]
      }
    }
  }
};

interface PracticeQuestion {
  id: string;
  type: 'fill_blank' | 'complete_sentence' | 'variation';
  originalPhrase: string;
  question: string;
  answer: string;
  options?: string[];
  explanation?: string;
}

interface PracticeProgress {
  monthKey: string;
  weekKey: string;
  completedQuestions: string[];
  score: number;
}

type PracticeMode = 'selection' | 'practice' | 'results';

export function CorePhrasePatternPractice() {
  const { data: session } = useSession();
  const [mode, setMode] = useState<PracticeMode>('selection');
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{[key: string]: string}>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<PracticeProgress | null>(null);

  const userId = session?.user?.name || 'anonymous';

  // Load practice progress
  const loadProgress = useCallback(async () => {
    if (!selectedMonth || !selectedWeek) return;

    try {
      const response = await fetch(
        `/api/influencers/christine/core-phrase?action=progress&userId=${userId}&month=${selectedMonth}&week=${selectedWeek}`
      );
      const data = await response.json();

      if (data.success && data.progress) {
        setProgress(data.progress);
      }
    } catch (err) {
      console.error('Progress loading error:', err);
    }
  }, [userId, selectedMonth, selectedWeek]);

  // Generate practice questions
  const generateQuestions = async () => {
    if (!selectedMonth || !selectedWeek) return;

    try {
      setLoading(true);
      setError(null);

      const monthData = CORE_PHRASES[selectedMonth as keyof typeof CORE_PHRASES];
      const weekData = monthData.weeks[selectedWeek as keyof typeof monthData.weeks];
      const phrases = weekData.phrases;

      const response = await fetch('/api/influencers/christine/core-phrase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generate_questions',
          userId,
          month: selectedMonth,
          week: selectedWeek,
          phrases,
          count: 10
        }),
      });

      const data = await response.json();

      if (data.success) {
        setQuestions(data.questions || []);
        setMode('practice');
        setCurrentQuestionIndex(0);
        setUserAnswers({});
      } else {
        setError(data.error || 'Failed to generate questions');
      }
    } catch (err) {
      setError('문제 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // Handle answer selection
  const handleAnswer = (questionId: string, answer: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  // Move to next question
  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // All questions completed - show results
      calculateAndShowResults();
    }
  };

  // Calculate results
  const calculateAndShowResults = async () => {
    try {
      const response = await fetch('/api/influencers/christine/core-phrase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'calculate_results',
          userId,
          month: selectedMonth,
          week: selectedWeek,
          questions,
          userAnswers
        }),
      });

      const data = await response.json();

      if (data.success) {
        setProgress(data.progress);
        setMode('results');
      } else {
        setError(data.error || 'Failed to calculate results');
      }
    } catch (err) {
      setError('결과 계산 중 오류가 발생했습니다.');
    }
  };

  // Reset to selection
  const resetToSelection = () => {
    setMode('selection');
    setSelectedMonth(null);
    setSelectedWeek(null);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setError(null);
    setProgress(null);
  };

  // Load progress when selection changes
  useEffect(() => {
    if (selectedMonth && selectedWeek) {
      loadProgress();
    }
  }, [selectedMonth, selectedWeek, loadProgress]);

  // Render month/week selection
  if (mode === 'selection') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <Card className="p-6" glass={false}>
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
              <span className="text-4xl">📝</span>
            </div>
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
              Core Phrase 패턴 연습
            </h2>
            <p className="text-[var(--color-text-secondary)] max-w-2xl mx-auto">
              Christine의 체계적인 3개월 커리큘럼으로 실전 영어 패턴을 마스터하세요!
              각 상황별 핵심 표현을 다양한 방식으로 연습할 수 있습니다.
            </p>
          </div>
        </Card>

        {/* Month Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(CORE_PHRASES).map(([monthKey, monthData]) => (
            <Card
              key={monthKey}
              className={`p-6 cursor-pointer transition-all duration-200 ${
                selectedMonth === monthKey
                  ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'hover:shadow-md'
              }`}
              glass={false}
              onClick={() => {
                setSelectedMonth(monthKey);
                setSelectedWeek(null);
              }}
            >
              <div className="text-center space-y-3">
                <div className="text-4xl">{monthData.icon}</div>
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                  {monthKey}
                </h3>
                <p className="text-[var(--color-text-secondary)]">
                  {monthData.name}
                </p>
              </div>
            </Card>
          ))}
        </div>

        {/* Week Selection */}
        {selectedMonth && (
          <Card className="p-6" glass={false}>
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4 text-center">
              {CORE_PHRASES[selectedMonth as keyof typeof CORE_PHRASES].name} - 주차 선택
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(CORE_PHRASES[selectedMonth as keyof typeof CORE_PHRASES].weeks).map(([weekKey, weekData]) => (
                <Card
                  key={weekKey}
                  className={`p-4 cursor-pointer transition-all duration-200 ${
                    selectedWeek === weekKey
                      ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'hover:shadow-sm bg-[var(--color-bg-secondary)]'
                  }`}
                  glass={false}
                  onClick={() => setSelectedWeek(weekKey)}
                >
                  <div className="text-center space-y-2">
                    <div className="text-2xl">{weekData.icon}</div>
                    <h4 className="font-medium text-[var(--color-text-primary)]">
                      {weekKey}
                    </h4>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      {weekData.name}
                    </p>
                    <Badge variant="info" size="sm">
                      {weekData.phrases.length}개 패턴
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        )}

        {/* Start Practice Button */}
        {selectedMonth && selectedWeek && (
          <Card className="p-6 text-center" glass={false}>
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-[var(--color-text-primary)]">
                준비 완료! 패턴 연습을 시작하시겠습니까?
              </h4>
              {progress && (
                <div className="text-sm text-[var(--color-text-secondary)]">
                  이전 점수: {progress.score}점 ({progress.completedQuestions.length}문제 완료)
                </div>
              )}
              <Button
                onClick={generateQuestions}
                disabled={loading}
                variant="primary"
                size="lg"
              >
                {loading ? 'AI 문제 생성 중...' : '🚀 패턴 연습 시작하기'}
              </Button>
            </div>
          </Card>
        )}

        {error && (
          <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          </Card>
        )}
      </div>
    );
  }

  // Render practice session
  if (mode === 'practice' && questions.length > 0) {
    const currentQuestion = questions[currentQuestionIndex];
    const progressPercent = Math.round(((currentQuestionIndex + 1) / questions.length) * 100);

    // Get current week name safely
    const getCurrentWeekName = () => {
      if (!selectedMonth || !selectedWeek) return '패턴 연습';
      const monthData = CORE_PHRASES[selectedMonth as keyof typeof CORE_PHRASES];
      if (!monthData) return '패턴 연습';
      const weekData = monthData.weeks[selectedWeek as keyof typeof monthData.weeks];
      return weekData ? weekData.name : '패턴 연습';
    };

    return (
      <div className="space-y-6">
        {/* Progress Header */}
        <Card className="p-4" glass={false}>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
              📝 {selectedMonth} - {getCurrentWeekName()}
            </h3>
            <Button
              onClick={resetToSelection}
              variant="outline"
              size="sm"
            >
              선택으로 돌아가기
            </Button>
          </div>
          <div className="w-full bg-[var(--color-bg-tertiary)] rounded-full h-2 mb-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {currentQuestionIndex + 1} / {questions.length} ({progressPercent}% 완료)
          </p>
        </Card>

        {/* Question Card */}
        <Card className="p-8" glass={false}>
          <div className="space-y-6">
            <div className="text-center">
              <Badge
                variant={
                  currentQuestion.type === 'fill_blank' ? 'primary' :
                  currentQuestion.type === 'complete_sentence' ? 'success' : 'warning'
                }
                size="sm"
                className="mb-4"
              >
                {currentQuestion.type === 'fill_blank' ? '빈칸 채우기' :
                 currentQuestion.type === 'complete_sentence' ? '문장 완성' : '패턴 변형'}
              </Badge>
              <h4 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">
                문제 {currentQuestionIndex + 1}
              </h4>
            </div>

            {/* Original Phrase */}
            <div className="bg-[var(--color-bg-secondary)] p-4 rounded-lg text-center">
              <p className="text-sm text-[var(--color-text-secondary)] mb-1">원본 패턴:</p>
              <p className="text-lg font-medium text-[var(--color-text-primary)]">
                "{currentQuestion.originalPhrase}"
              </p>
            </div>

            {/* Question */}
            <div className="text-center">
              <p className="text-lg text-[var(--color-text-primary)] mb-6">
                {currentQuestion.question}
              </p>

              {/* Answer Options */}
              {currentQuestion.options ? (
                <div className="grid grid-cols-1 gap-3 max-w-md mx-auto">
                  {currentQuestion.options.map((option, index) => (
                    <Button
                      key={index}
                      onClick={() => handleAnswer(currentQuestion.id, option)}
                      variant={userAnswers[currentQuestion.id] === option ? 'primary' : 'outline'}
                      className="text-left justify-start"
                    >
                      {index + 1}. {option}
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="max-w-md mx-auto">
                  <textarea
                    value={userAnswers[currentQuestion.id] || ''}
                    onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                    placeholder="답을 입력하세요..."
                    className="w-full p-4 border rounded-lg resize-none h-24 bg-[var(--color-bg-primary)]"
                  />
                </div>
              )}
            </div>

            {/* Explanation */}
            {currentQuestion.explanation && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  💡 <strong>힌트:</strong> {currentQuestion.explanation}
                </p>
              </div>
            )}

            {/* Next Button */}
            <div className="text-center">
              <Button
                onClick={nextQuestion}
                disabled={!userAnswers[currentQuestion.id]}
                variant="primary"
                size="lg"
              >
                {currentQuestionIndex < questions.length - 1 ? '다음 문제 →' : '완료! 결과 보기 🎉'}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Render results
  if (mode === 'results' && progress) {
    return (
      <Card className="p-8 text-center" glass={false}>
        <div className="space-y-6">
          <span className="text-6xl">🎉</span>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
            패턴 연습 완료!
          </h2>

          {/* Score */}
          <div className="bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
              📊 최종 점수
            </h3>
            <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              {progress.score}점
            </p>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {progress.completedQuestions.length}문제 완료
            </p>
          </div>

          {/* Performance Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-medium text-blue-700 dark:text-blue-200 mb-1">정확도</h4>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-300">
                {Math.round((progress.score / questions.length) * 10)}%
              </p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h4 className="font-medium text-green-700 dark:text-green-200 mb-1">완료 문제</h4>
              <p className="text-xl font-bold text-green-600 dark:text-green-300">
                {progress.completedQuestions.length}개
              </p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <h4 className="font-medium text-purple-700 dark:text-purple-200 mb-1">패턴 습득</h4>
              <p className="text-xl font-bold text-purple-600 dark:text-purple-300">
                {(() => {
                  if (!selectedMonth || !selectedWeek) return 0;
                  const monthData = CORE_PHRASES[selectedMonth as keyof typeof CORE_PHRASES];
                  if (!monthData) return 0;
                  const weekData = monthData.weeks[selectedWeek as keyof typeof monthData.weeks];
                  return weekData ? weekData.phrases.length : 0;
                })()}개
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => {
                setMode('practice');
                setCurrentQuestionIndex(0);
                setUserAnswers({});
                generateQuestions();
              }}
              variant="outline"
            >
              다시 연습하기
            </Button>
            <Button
              onClick={resetToSelection}
              variant="primary"
            >
              다른 패턴 선택하기
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