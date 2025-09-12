'use client';

/**
 * Terry English Vocabulary Memorizer
 * 
 * Advanced vocabulary learning system with SRS (Spaced Repetition System)
 * - Daily vocabulary generation by AI
 * - Smart review scheduling (D0-D1-D3-D7-D14-D30)
 * - Interactive sentence creation with AI feedback
 * - Progress tracking and analytics
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useSession, signIn } from 'next-auth/react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

interface VocabularyWord {
  id: string;
  word: string;
  meaning: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  example: string;
  translation: string;
  createdAt: number;
  nextReviewDate: number;
  interval: number;
  easinessFactor: number;
  correctCount: number;
  incorrectCount: number;
  lastReviewed?: number;
}

interface SentenceFeedback {
  score: number;
  isCorrect: boolean;
  suggestions: string[];
  improvedSentence: string;
  grammarFeedback: string;
  naturalnessFeedback: string;
}

interface VocabularyProgress {
  totalWords: number;
  todayStudied: number;
  dueCount: number;
  studyStreak: number;
}

type VocabularyMode = 'dashboard' | 'daily' | 'review' | 'practice';

export function VocabularyMemoizer() {
  const { data: session, status: sessionStatus } = useSession();
  const [mode, setMode] = useState<VocabularyMode>('dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [todaysWords, setTodaysWords] = useState<VocabularyWord[]>([]);
  const [dueWords, setDueWords] = useState<VocabularyWord[]>([]);
  const [progress, setProgress] = useState<VocabularyProgress | null>(null);
  
  // Practice states
  const [currentWord, setCurrentWord] = useState<VocabularyWord | null>(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [userSentence, setUserSentence] = useState('');
  const [feedback, setFeedback] = useState<SentenceFeedback | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  
  // Settings
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [category, setCategory] = useState<'business' | 'academic' | 'daily' | 'toeic' | 'ielts'>('business');

  // Show loading while checking authentication
  if (sessionStatus === 'loading') {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-[var(--color-text-primary)]">로딩 중...</div>
      </div>
    );
  }

  // Show sign-in prompt if not authenticated
  if (!session) {
    return (
      <Card className="p-8 text-center" glass={false}>
        <div className="space-y-4">
          <span className="text-6xl">🔒</span>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
            로그인이 필요합니다
          </h2>
          <p className="text-[var(--color-text-secondary)]">
            테리영어의 AI 단어 암기 시스템을 이용하려면 먼저 로그인해주세요.
          </p>
          <Button 
            onClick={() => signIn()}
            variant="primary"
            size="lg"
          >
            로그인하기
          </Button>
        </div>
      </Card>
    );
  }

  const userId = session.user?.name || 'anonymous';

  // Load data functions
  const loadTodaysWords = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/influencers/terry/vocabulary?action=today&userId=${userId}`);
      const data = await response.json();
      
      if (data.success) {
        setTodaysWords(data.words || []);
      } else {
        setError(data.error || 'Failed to load today\'s words');
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const loadDueWords = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/influencers/terry/vocabulary?action=due&userId=${userId}`);
      const data = await response.json();
      
      if (data.success) {
        setDueWords(data.words || []);
      } else {
        setError(data.error || 'Failed to load due words');
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const loadProgress = useCallback(async () => {
    try {
      const response = await fetch(`/api/influencers/terry/vocabulary?action=progress&userId=${userId}`);
      const data = await response.json();
      
      if (data.success) {
        setProgress(data.progress);
      } else {
        setError(data.error || 'Failed to load progress');
      }
    } catch (err) {
      setError('진도를 불러오는 중 오류가 발생했습니다.');
    }
  }, [userId]);

  // Generate daily words
  const generateDailyWords = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/influencers/terry/vocabulary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generate_daily',
          userId,
          level,
          category,
          count: 7
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setTodaysWords(data.words || []);
        await loadProgress(); // Refresh progress
      } else {
        setError(data.error || 'Failed to generate daily words');
      }
    } catch (err) {
      setError('AI 단어 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // Submit sentence for feedback
  const submitSentence = async () => {
    if (!currentWord || !userSentence.trim()) {
      setError('문장을 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/influencers/terry/vocabulary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'feedback',
          userId,
          wordId: currentWord.id,
          userSentence
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setFeedback(data.feedback);
        setShowFeedback(true);
      } else {
        setError(data.error || 'Failed to get feedback');
      }
    } catch (err) {
      setError('피드백 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // Move to next word
  const nextWord = () => {
    setShowFeedback(false);
    setFeedback(null);
    setUserSentence('');
    
    const words = mode === 'daily' ? todaysWords : dueWords;
    if (currentWordIndex < words.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
      setCurrentWord(words[currentWordIndex + 1]);
    } else {
      // Finished all words
      setMode('dashboard');
      setCurrentWord(null);
      setCurrentWordIndex(0);
      loadProgress(); // Refresh progress
    }
  };

  // Load initial data
  useEffect(() => {
    if (session) {
      loadTodaysWords();
      loadDueWords();
      loadProgress();
    }
  }, [session, loadTodaysWords, loadDueWords, loadProgress]);

  // Start practice session
  const startPractice = (words: VocabularyWord[], practiceMode: VocabularyMode) => {
    if (words.length === 0) {
      setError('연습할 단어가 없습니다.');
      return;
    }
    
    setMode(practiceMode);
    setCurrentWordIndex(0);
    setCurrentWord(words[0]);
    setUserSentence('');
    setFeedback(null);
    setShowFeedback(false);
  };

  // Render dashboard
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6" glass={false}>
        <div className="text-center space-y-4">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-full flex items-center justify-center">
            <span className="text-5xl">📚</span>
          </div>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
            테리영어 AI 단어 암기 시스템
          </h2>
          <p className="text-[var(--color-text-secondary)] max-w-2xl mx-auto">
            SRS(간격 반복) 알고리즘으로 최적화된 단어 암기! 
            AI가 매일 새로운 단어를 선정하고, 맞춤형 복습 일정을 관리합니다.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="primary" size="sm">AI 단어 선정</Badge>
            <Badge variant="success" size="sm">SRS 복습 시스템</Badge>
            <Badge variant="info" size="sm">실시간 피드백</Badge>
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
              <div className="text-sm text-[var(--color-text-secondary)]">총 단어 수</div>
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
              <div className="text-sm text-[var(--color-text-secondary)]">연속 학습</div>
            </div>
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Today's Words */}
        <Card className="p-6" glass={false}>
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
            🌟 오늘의 새 단어
          </h3>
          
          {todaysWords.length > 0 ? (
            <div className="space-y-4">
              <p className="text-[var(--color-text-secondary)]">
                {todaysWords.length}개의 새로운 단어가 준비되었습니다.
              </p>
              <Button
                onClick={() => startPractice(todaysWords, 'daily')}
                variant="primary"
                className="w-full"
              >
                📖 오늘의 단어 학습하기
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-[var(--color-text-secondary)]">
                오늘의 새 단어를 생성해보세요!
              </p>
              
              {/* Level & Category Selection */}
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as any)}
                  className="p-2 border rounded-lg bg-[var(--color-bg-secondary)]"
                >
                  <option value="beginner">초급</option>
                  <option value="intermediate">중급</option>
                  <option value="advanced">고급</option>
                </select>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="p-2 border rounded-lg bg-[var(--color-bg-secondary)]"
                >
                  <option value="business">비즈니스</option>
                  <option value="academic">학술</option>
                  <option value="daily">일상</option>
                  <option value="toeic">토익</option>
                  <option value="ielts">아이엘츠</option>
                </select>
              </div>
              
              <Button
                onClick={generateDailyWords}
                disabled={loading}
                variant="primary"
                className="w-full"
              >
                {loading ? '생성 중...' : '🎯 AI가 단어 선정하기'}
              </Button>
            </div>
          )}
        </Card>

        {/* Review Words */}
        <Card className="p-6" glass={false}>
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
            🔄 복습할 단어
          </h3>
          
          {dueWords.length > 0 ? (
            <div className="space-y-4">
              <p className="text-[var(--color-text-secondary)]">
                {dueWords.length}개의 단어가 복습을 기다리고 있습니다.
              </p>
              <Button
                onClick={() => startPractice(dueWords, 'review')}
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
              <div className="text-center py-8">
                <span className="text-4xl">✅</span>
                <p className="text-sm text-[var(--color-text-tertiary)] mt-2">
                  모든 단어를 완료했습니다
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          <Button
            onClick={() => setError(null)}
            variant="outline"
            size="sm"
            className="mt-2"
          >
            닫기
          </Button>
        </Card>
      )}
    </div>
  );

  // Render practice session
  const renderPractice = () => {
    if (!currentWord) return null;

    const words = mode === 'daily' ? todaysWords : dueWords;
    const progress = Math.round(((currentWordIndex + 1) / words.length) * 100);

    return (
      <div className="space-y-6">
        {/* Progress Header */}
        <Card className="p-4" glass={false}>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
              {mode === 'daily' ? '🌟 오늘의 단어 학습' : '🔄 단어 복습'}
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
              className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {currentWordIndex + 1} / {words.length} ({progress}% 완료)
          </p>
        </Card>

        {/* Word Card */}
        <Card className="p-8 text-center" glass={false}>
          <div className="space-y-6">
            <div>
              <h2 className="text-4xl font-bold text-[var(--color-text-primary)] mb-2">
                {currentWord.word}
              </h2>
              <p className="text-xl text-[var(--color-text-secondary)]">
                {currentWord.meaning}
              </p>
              <Badge variant="primary" size="sm" className="mt-2">
                {currentWord.category}
              </Badge>
            </div>

            {/* Example */}
            <div className="bg-[var(--color-bg-secondary)] p-4 rounded-lg">
              <p className="text-[var(--color-text-primary)] italic mb-2">
                "{currentWord.example}"
              </p>
              <p className="text-sm text-[var(--color-text-tertiary)]">
                {currentWord.translation}
              </p>
            </div>

            {/* Sentence Input */}
            {!showFeedback && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-[var(--color-text-primary)] mb-2">
                    ✍️ 이 단어를 사용해서 문장을 만들어보세요:
                  </h4>
                  <textarea
                    value={userSentence}
                    onChange={(e) => setUserSentence(e.target.value)}
                    placeholder={`"${currentWord.word}"를 사용한 영어 문장을 작성해보세요...`}
                    className="w-full p-4 border rounded-lg resize-none h-24 bg-[var(--color-bg-primary)]"
                    disabled={loading}
                  />
                </div>
                <Button
                  onClick={submitSentence}
                  disabled={loading || !userSentence.trim()}
                  variant="primary"
                  size="lg"
                >
                  {loading ? 'AI 분석 중...' : '🤖 AI 피드백 받기'}
                </Button>
              </div>
            )}

            {/* Feedback */}
            {showFeedback && feedback && (
              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${
                  feedback.isCorrect 
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                    : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-[var(--color-text-primary)]">
                      🎯 AI 피드백 (점수: {feedback.score}/100)
                    </h4>
                    <Badge variant={feedback.isCorrect ? 'success' : 'warning'} size="sm">
                      {feedback.isCorrect ? '훌륭해요!' : '더 연습해요!'}
                    </Badge>
                  </div>

                  <div className="space-y-3 text-left">
                    <div>
                      <h5 className="text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                        📝 작성한 문장:
                      </h5>
                      <p className="text-[var(--color-text-primary)]">"{userSentence}"</p>
                    </div>

                    {feedback.improvedSentence !== userSentence && (
                      <div>
                        <h5 className="text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                          ✨ 개선된 문장:
                        </h5>
                        <p className="text-green-700 dark:text-green-300">"{feedback.improvedSentence}"</p>
                      </div>
                    )}

                    <div>
                      <h5 className="text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                        📖 문법 피드백:
                      </h5>
                      <p className="text-sm text-[var(--color-text-primary)]">{feedback.grammarFeedback}</p>
                    </div>

                    <div>
                      <h5 className="text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                        🗣️ 자연스러움:
                      </h5>
                      <p className="text-sm text-[var(--color-text-primary)]">{feedback.naturalnessFeedback}</p>
                    </div>

                    {feedback.suggestions.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                          💡 개선 제안:
                        </h5>
                        <ul className="text-sm text-[var(--color-text-primary)] space-y-1">
                          {feedback.suggestions.map((suggestion, index) => (
                            <li key={index}>• {suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  onClick={nextWord}
                  variant="primary"
                  size="lg"
                >
                  {currentWordIndex < words.length - 1 ? '다음 단어 →' : '완료! 🎉'}
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          </Card>
        )}
      </div>
    );
  };

  // Main render
  switch (mode) {
    case 'daily':
    case 'review':
      return renderPractice();
    default:
      return renderDashboard();
  }
}