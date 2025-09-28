'use client';

/**
 * Christine Vocabulary Memorization Component
 *
 * Christine의 실용 단어 암기 시스템:
 * - SRS 알고리즘 기반 효율적 암기
 * - 상황별 분류된 실용 단어 (여행/스몰토크/비즈니스)
 * - 문맥 중심 예문 제공
 * - 개인 맞춤 복습 일정
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

interface VocabularyWord {
  id: string;
  word: string;
  meaning: string;
  category: 'travel' | 'smalltalk' | 'business';
  subcategory: string;
  pronunciation: string;
  example: string;
  translation: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  createdAt: number;
  nextReviewDate: number;
  interval: number;
  easinessFactor: number;
  correctCount: number;
  incorrectCount: number;
  lastReviewed?: number;
}

interface StudyProgress {
  totalWords: number;
  todayStudied: number;
  dueCount: number;
  studyStreak: number;
  categoryProgress: {
    travel: number;
    smalltalk: number;
    business: number;
  };
}

interface StudySession {
  word: VocabularyWord;
  userAnswer: string;
  isCorrect: boolean;
  timeSpent: number;
}

type StudyMode = 'dashboard' | 'category_selection' | 'study' | 'review' | 'results';

// Vocabulary categories with subcategories
const VOCABULARY_CATEGORIES = {
  travel: {
    name: '여행 영어',
    icon: '✈️',
    color: 'blue',
    subcategories: {
      airport: '공항',
      hotel: '호텔',
      restaurant: '레스토랑',
      shopping: '쇼핑',
      transportation: '교통',
      emergency: '응급상황'
    }
  },
  smalltalk: {
    name: '일상 대화',
    icon: '💬',
    color: 'green',
    subcategories: {
      weather: '날씨',
      hobbies: '취미',
      work: '직장',
      family: '가족',
      food: '음식',
      entertainment: '엔터테인먼트'
    }
  },
  business: {
    name: '비즈니스 영어',
    icon: '💼',
    color: 'purple',
    subcategories: {
      meetings: '회의',
      presentations: '발표',
      emails: '이메일',
      negotiations: '협상',
      networking: '네트워킹',
      reports: '보고서'
    }
  }
};

export function ChristineVocabulary() {
  const { data: session } = useSession();
  const [mode, setMode] = useState<StudyMode>('dashboard');
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof VOCABULARY_CATEGORIES | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [studyWords, setStudyWords] = useState<VocabularyWord[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [studySession, setStudySession] = useState<StudySession[]>([]);
  const [progress, setProgress] = useState<StudyProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState(0);

  const userId = session?.user?.name || 'anonymous';

  // Load study progress
  const loadProgress = useCallback(async () => {
    try {
      const response = await fetch(`/api/influencers/christine/vocabulary?action=progress&userId=${userId}`);
      const data = await response.json();

      if (data.success) {
        setProgress(data.progress);
      }
    } catch (err) {
      console.error('Progress loading error:', err);
    }
  }, [userId]);

  // Load study words for selected category
  const loadStudyWords = async (category: string, subcategory?: string, studyType: 'new' | 'review' = 'new') => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/influencers/christine/vocabulary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: studyType === 'new' ? 'generate_study_words' : 'get_due_words',
          userId,
          category,
          subcategory,
          count: 10
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStudyWords(data.words || []);
        setMode('study');
        setCurrentWordIndex(0);
        setUserAnswer('');
        setShowAnswer(false);
        setStudySession([]);
        setSessionStartTime(Date.now());
      } else {
        setError(data.error || 'Failed to load words');
      }
    } catch (err) {
      setError('단어 로딩 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // Submit answer and get feedback
  const submitAnswer = async () => {
    if (!userAnswer.trim() || !studyWords[currentWordIndex]) return;

    const currentWord = studyWords[currentWordIndex];
    const startTime = sessionStartTime;
    const timeSpent = Date.now() - startTime;

    try {
      setLoading(true);

      const response = await fetch('/api/influencers/christine/vocabulary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'check_answer',
          userId,
          wordId: currentWord.id,
          userAnswer: userAnswer.trim(),
          timeSpent
        }),
      });

      const data = await response.json();

      if (data.success) {
        const sessionItem: StudySession = {
          word: currentWord,
          userAnswer: userAnswer.trim(),
          isCorrect: data.isCorrect,
          timeSpent
        };

        setStudySession(prev => [...prev, sessionItem]);
        setShowAnswer(true);

        // Update word's SRS data
        if (data.updatedWord) {
          setStudyWords(prev =>
            prev.map(w => w.id === currentWord.id ? data.updatedWord : w)
          );
        }
      } else {
        setError(data.error || 'Failed to check answer');
      }
    } catch (err) {
      setError('답변 확인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // Move to next word
  const nextWord = () => {
    if (currentWordIndex < studyWords.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
      setUserAnswer('');
      setShowAnswer(false);
      setSessionStartTime(Date.now());
    } else {
      // Study session completed
      setMode('results');
    }
  };

  // Load initial progress
  useEffect(() => {
    if (session) {
      loadProgress();
    }
  }, [session, loadProgress]);

  // Render dashboard
  if (mode === 'dashboard') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <Card className="p-6" glass={false}>
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center">
              <span className="text-4xl">📚</span>
            </div>
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
              Christine 실용 단어 암기
            </h2>
            <p className="text-[var(--color-text-secondary)] max-w-2xl mx-auto">
              SRS(간격 반복) 시스템으로 효율적인 단어 암기!
              실제 상황에서 바로 사용할 수 있는 실용적인 단어들을 체계적으로 학습하세요.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant="primary" size="sm">SRS 알고리즘</Badge>
              <Badge variant="success" size="sm">실용 중심</Badge>
              <Badge variant="warning" size="sm">상황별 분류</Badge>
            </div>
          </div>
        </Card>

        {/* Progress Overview */}
        {progress && (
          <Card className="p-6" glass={false}>
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
              📊 학습 현황
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-[var(--color-bg-secondary)] rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{progress.totalWords}</div>
                <div className="text-sm text-[var(--color-text-secondary)]">총 학습 단어</div>
              </div>
              <div className="text-center p-4 bg-[var(--color-bg-secondary)] rounded-lg">
                <div className="text-2xl font-bold text-green-600">{progress.todayStudied}</div>
                <div className="text-sm text-[var(--color-text-secondary)]">오늘 학습</div>
              </div>
              <div className="text-center p-4 bg-[var(--color-bg-secondary)] rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{progress.dueCount}</div>
                <div className="text-sm text-[var(--color-text-secondary)]">복습 예정</div>
              </div>
              <div className="text-center p-4 bg-[var(--color-bg-secondary)] rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{progress.studyStreak}</div>
                <div className="text-sm text-[var(--color-text-secondary)]">연속 학습일</div>
              </div>
            </div>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* New Words */}
          <Card className="p-6" glass={false}>
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
              🌟 새로운 단어 학습
            </h3>
            <p className="text-[var(--color-text-secondary)] mb-4">
              상황별로 분류된 실용적인 새 단어들을 학습해보세요.
            </p>
            <Button
              onClick={() => setMode('category_selection')}
              variant="primary"
              className="w-full"
            >
              📝 새 단어 학습 시작
            </Button>
          </Card>

          {/* Review */}
          <Card className="p-6" glass={false}>
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
              🔄 복습하기
            </h3>
            {progress && progress.dueCount > 0 ? (
              <div className="space-y-4">
                <p className="text-[var(--color-text-secondary)]">
                  {progress.dueCount}개의 단어가 복습을 기다리고 있습니다.
                </p>
                <Button
                  onClick={() => loadStudyWords('all', undefined, 'review')}
                  variant="outline"
                  className="w-full bg-yellow-50 border-yellow-300 hover:bg-yellow-100"
                >
                  📝 복습 시작하기
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-[var(--color-text-secondary)]">
                  복습할 단어가 없습니다. 훌륭해요! 🎉
                </p>
                <div className="text-center py-4">
                  <span className="text-3xl">✅</span>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Category Progress */}
        {progress && (
          <Card className="p-6" glass={false}>
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
              📈 카테고리별 진도
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(VOCABULARY_CATEGORIES).map(([categoryKey, categoryData]) => {
                const categoryProgress = progress.categoryProgress[categoryKey as keyof typeof progress.categoryProgress] || 0;
                return (
                  <div
                    key={categoryKey}
                    className={`p-4 rounded-lg border border-${categoryData.color}-200 dark:border-${categoryData.color}-800 bg-${categoryData.color}-50 dark:bg-${categoryData.color}-900/20`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{categoryData.icon}</span>
                      <h4 className={`font-medium text-${categoryData.color}-700 dark:text-${categoryData.color}-200`}>
                        {categoryData.name}
                      </h4>
                    </div>
                    <div className={`text-2xl font-bold text-${categoryData.color}-600 dark:text-${categoryData.color}-300`}>
                      {categoryProgress}개
                    </div>
                    <div className={`text-sm text-${categoryData.color}-600 dark:text-${categoryData.color}-400`}>
                      학습 완료
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>
    );
  }

  // Render category selection
  if (mode === 'category_selection') {
    return (
      <div className="space-y-6">
        <Card className="p-6" glass={false}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">
              카테고리 선택
            </h3>
            <Button
              onClick={() => setMode('dashboard')}
              variant="outline"
              size="sm"
            >
              ← 대시보드로
            </Button>
          </div>
          <p className="text-[var(--color-text-secondary)] mb-6">
            학습하고 싶은 분야를 선택해주세요. 각 분야별로 실무에서 자주 사용되는 단어들을 준비했습니다.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(VOCABULARY_CATEGORIES).map(([categoryKey, categoryData]) => (
              <Card
                key={categoryKey}
                className={`p-6 cursor-pointer transition-all duration-200 ${
                  selectedCategory === categoryKey
                    ? `ring-2 ring-${categoryData.color}-500 bg-${categoryData.color}-50 dark:bg-${categoryData.color}-900/20`
                    : 'hover:shadow-md'
                }`}
                glass={false}
                onClick={() => {
                  setSelectedCategory(categoryKey as keyof typeof VOCABULARY_CATEGORIES);
                  setSelectedSubcategory(null);
                }}
              >
                <div className="text-center space-y-4">
                  <div className="text-4xl">{categoryData.icon}</div>
                  <h4 className="text-lg font-semibold text-[var(--color-text-primary)]">
                    {categoryData.name}
                  </h4>
                  <div className="flex flex-wrap gap-1 justify-center">
                    {Object.values(categoryData.subcategories).map((sub, idx) => (
                      <Badge key={idx} variant="info" size="sm">
                        {sub}
                      </Badge>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Subcategory Selection */}
          {selectedCategory && (
            <Card className="p-6 mt-6" glass={false}>
              <h4 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
                세부 분야 선택 (선택사항)
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <Button
                  variant={selectedSubcategory === null ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedSubcategory(null)}
                  className="text-sm"
                >
                  전체
                </Button>
                {Object.entries(VOCABULARY_CATEGORIES[selectedCategory].subcategories).map(([subKey, subName]) => (
                  <Button
                    key={subKey}
                    variant={selectedSubcategory === subKey ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedSubcategory(subKey)}
                    className="text-sm"
                  >
                    {subName}
                  </Button>
                ))}
              </div>
            </Card>
          )}

          {/* Start Button */}
          {selectedCategory && (
            <Card className="p-6 text-center" glass={false}>
              <Button
                onClick={() => loadStudyWords(selectedCategory, selectedSubcategory || undefined)}
                disabled={loading}
                variant="primary"
                size="lg"
              >
                {loading ? 'AI 단어 생성 중...' : '🚀 단어 학습 시작하기'}
              </Button>
            </Card>
          )}
        </Card>

        {error && (
          <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          </Card>
        )}
      </div>
    );
  }

  // Render study session
  if (mode === 'study' && studyWords.length > 0) {
    const currentWord = studyWords[currentWordIndex];
    const progressPercent = Math.round(((currentWordIndex + 1) / studyWords.length) * 100);

    return (
      <div className="space-y-6">
        {/* Progress Header */}
        <Card className="p-4" glass={false}>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
              📚 단어 학습 진행 중
            </h3>
            <Button
              onClick={() => setMode('dashboard')}
              variant="outline"
              size="sm"
            >
              대시보드로
            </Button>
          </div>
          <div className="w-full bg-[var(--color-bg-tertiary)] rounded-full h-2 mb-2">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {currentWordIndex + 1} / {studyWords.length} ({progressPercent}% 완료)
          </p>
        </Card>

        {/* Word Card */}
        <Card className="p-8 text-center" glass={false}>
          <div className="space-y-6">
            {/* Category Badge */}
            <div className="flex justify-center">
              <Badge variant="primary" size="sm">
                {currentWord.category === 'travel' ? '여행' :
                 currentWord.category === 'smalltalk' ? '일상 대화' : '비즈니스'} • {currentWord.subcategory}
              </Badge>
            </div>

            {/* Word */}
            <div>
              <h2 className="text-4xl font-bold text-[var(--color-text-primary)] mb-2">
                {currentWord.word}
              </h2>
              <p className="text-lg text-[var(--color-text-secondary)]">
                [{currentWord.pronunciation}]
              </p>
            </div>

            {/* Example Sentence */}
            <div className="bg-[var(--color-bg-secondary)] p-4 rounded-lg">
              <p className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
                "{currentWord.example}"
              </p>
              <p className="text-sm text-[var(--color-text-tertiary)]">
                {currentWord.translation}
              </p>
            </div>

            {!showAnswer ? (
              // Answer Input
              <div className="space-y-4">
                <h4 className="font-medium text-[var(--color-text-primary)]">
                  ✍️ 이 단어의 뜻을 한글로 입력하세요:
                </h4>
                <input
                  type="text"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="단어의 뜻을 입력하세요..."
                  className="w-full p-4 border rounded-lg text-center bg-[var(--color-bg-primary)] text-lg"
                  disabled={loading}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      submitAnswer();
                    }
                  }}
                />
                <Button
                  onClick={submitAnswer}
                  disabled={loading || !userAnswer.trim()}
                  variant="primary"
                  size="lg"
                >
                  {loading ? '확인 중...' : '✅ 답안 확인'}
                </Button>
              </div>
            ) : (
              // Answer Result
              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${
                  studySession[studySession.length - 1]?.isCorrect
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                }`}>
                  <div className="text-center">
                    <h4 className={`text-xl font-semibold mb-2 ${
                      studySession[studySession.length - 1]?.isCorrect
                        ? 'text-green-700 dark:text-green-200'
                        : 'text-red-700 dark:text-red-200'
                    }`}>
                      {studySession[studySession.length - 1]?.isCorrect ? '정답! 🎉' : '틀렸습니다 😅'}
                    </h4>
                    <p className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
                      정답: {currentWord.meaning}
                    </p>
                    <p className={`text-sm ${
                      studySession[studySession.length - 1]?.isCorrect
                        ? 'text-green-600 dark:text-green-300'
                        : 'text-red-600 dark:text-red-300'
                    }`}>
                      입력한 답: {userAnswer}
                    </p>
                  </div>
                </div>

                <Button
                  onClick={nextWord}
                  variant="primary"
                  size="lg"
                >
                  {currentWordIndex < studyWords.length - 1 ? '다음 단어 →' : '완료! 결과 보기 🎉'}
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // Render results
  if (mode === 'results') {
    const correctAnswers = studySession.filter(s => s.isCorrect).length;
    const totalAnswers = studySession.length;
    const accuracy = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;

    return (
      <Card className="p-8 text-center" glass={false}>
        <div className="space-y-6">
          <span className="text-6xl">🎉</span>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
            단어 학습 완료!
          </h2>

          {/* Score */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
              📊 학습 결과
            </h3>
            <p className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
              {correctAnswers}/{totalAnswers}
            </p>
            <p className="text-xl font-semibold text-purple-700 dark:text-purple-300 mb-1">
              정확도: {accuracy}%
            </p>
            <p className="text-sm text-[var(--color-text-secondary)]">
              총 학습 시간: {Math.round(studySession.reduce((sum, s) => sum + s.timeSpent, 0) / 1000)}초
            </p>
          </div>

          {/* Detailed Results */}
          <div className="max-h-60 overflow-y-auto">
            <div className="space-y-2">
              {studySession.map((session, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    session.isCorrect
                      ? 'bg-green-50 dark:bg-green-900/20'
                      : 'bg-red-50 dark:bg-red-900/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-lg ${session.isCorrect ? '✅' : '❌'}`}>
                      {session.isCorrect ? '✅' : '❌'}
                    </span>
                    <div className="text-left">
                      <p className="font-medium text-[var(--color-text-primary)]">
                        {session.word.word}
                      </p>
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        정답: {session.word.meaning} | 입력: {session.userAnswer}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-[var(--color-text-tertiary)]">
                    {Math.round(session.timeSpent / 1000)}초
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => setMode('category_selection')}
              variant="outline"
            >
              다른 카테고리 학습
            </Button>
            <Button
              onClick={() => setMode('dashboard')}
              variant="primary"
            >
              대시보드로 돌아가기
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