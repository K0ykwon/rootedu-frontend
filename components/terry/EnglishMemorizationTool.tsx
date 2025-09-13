'use client';

/**
 * Terry English Memorization Tool
 * 
 * PDF-based English text memorization system with interactive quizzes:
 * - Fill-in-the-blank questions
 * - Word order arrangement
 * - Vocabulary matching
 */

import React, { useState, useCallback, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useSession, signIn } from 'next-auth/react';
import { VocabularyMemoizer } from './VocabularyMemoizer';

interface ProcessingStatus {
  stage: 'uploading' | 'parsing' | 'extracting' | 'generating' | 'completed' | 'error';
  progress: number;
  message: string;
  error?: string;
}

interface QuizData {
  originalText: string;
  sentences: string[];
  fillInBlankQuiz: Array<{
    sentence: string;
    blanks: string[];
    options: string[][];
    correct: number[];
  }>;
  wordOrderQuiz: Array<{
    originalSentence: string;
    scrambledWords: string[];
    correctOrder: number[];
  }>;
  vocabularyQuiz: Array<{
    word: string;
    meaning: string;
    context: string;
    options: string[];
    correct: number;
  }>;
}

type QuizType = 'fillInBlank' | 'wordOrder' | 'vocabulary';
type ToolType = 'menu' | 'pdf-quiz' | 'vocabulary-memorizer';

export function EnglishMemorizationTool() {
  const { data: session, status: sessionStatus } = useSession();
  const [currentTool, setCurrentTool] = useState<ToolType>('menu');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Quiz state
  const [currentQuizType, setCurrentQuizType] = useState<QuizType>('fillInBlank');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{[key: string]: any}>({});
  const [showResults, setShowResults] = useState(false);
  const [quizScores, setQuizScores] = useState<{[key in QuizType]: number}>({
    fillInBlank: 0,
    wordOrder: 0,
    vocabulary: 0
  });

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
            테리영어의 무료 AI 암기 도구를 이용하려면 먼저 로그인해주세요.
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

  const handleFileUpload = useCallback(async (file: File) => {
    setError(null);
    setIsProcessing(true);
    setProcessingStatus({
      stage: 'uploading',
      progress: 0,
      message: '파일 업로드 중...'
    });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/influencers/terry/process-pdf', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          // If response is not JSON, use the status text
          console.error('Response is not JSON:', parseError);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Processing failed');
      }

      setSessionId(data.sessionId);
      setProcessingStatus(data.status);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setProcessingStatus({
        stage: 'error',
        progress: 0,
        message: errorMessage,
        error: errorMessage
      });
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('PDF 파일만 업로드 가능합니다.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('파일 크기는 10MB 이하여야 합니다.');
        return;
      }
      
      setSelectedFile(file);
      setError(null);
    }
  };

  const startProcessing = () => {
    if (selectedFile) {
      handleFileUpload(selectedFile);
    }
  };

  const resetTool = () => {
    setSelectedFile(null);
    setIsProcessing(false);
    setProcessingStatus(null);
    setQuizData(null);
    setSessionId(null);
    setError(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowResults(false);
    setQuizScores({ fillInBlank: 0, wordOrder: 0, vocabulary: 0 });
  };

  // Poll processing status
  useEffect(() => {
    if (!sessionId || quizData) return;

    let isCancelled = false;
    const pollIntervalMs = 2000;
    let id: any;

    async function poll() {
      if (isCancelled) return;
      
      try {
        const res = await fetch(`/api/influencers/terry/process-pdf?sessionId=${sessionId}&_ts=${Date.now()}`, {
          cache: 'no-store',
        } as any);
        
        if (!res.ok) {
          console.error(`Polling failed: ${res.status} ${res.statusText}`);
          return;
        }
        
        const data = await res.json();
        
        if (isCancelled) return;
        
        if (data.success && data.status) {
          setProcessingStatus(data.status);

          if (data.status.stage === 'completed' && data.quizData) {
            setQuizData(data.quizData);
            isCancelled = true;
            if (id) clearInterval(id);
            return;
          }
          
          if (data.status.stage === 'error') {
            setError(data.status.error || 'Processing failed');
            isCancelled = true;
            if (id) clearInterval(id);
            return;
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }

    poll();
    id = setInterval(() => {
      if (!isCancelled) {
        poll();
      }
    }, pollIntervalMs);
    
    return () => {
      isCancelled = true;
      if (id) clearInterval(id);
    };
  }, [sessionId, quizData]);

  const handleQuizAnswer = (questionKey: string, answer: any) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionKey]: answer
    }));
  };

  const calculateScore = (quizType: QuizType) => {
    if (!quizData) return 0;
    
    let correct = 0;
    let total = 0;

    switch (quizType) {
      case 'fillInBlank':
        // Count total blanks across all questions
        quizData.fillInBlankQuiz.forEach((q, index) => {
          q.blanks.forEach((_, blankIndex) => {
            total++;
            const key = `fillInBlank-${index}-${blankIndex}`;
            if (selectedAnswers[key] === q.correct[blankIndex]) correct++;
          });
        });
        break;
      case 'vocabulary':
        total = quizData.vocabularyQuiz.length;
        quizData.vocabularyQuiz.forEach((q, index) => {
          const key = `vocabulary-${index}`;
          if (selectedAnswers[key] === q.correct) correct++;
        });
        break;
      case 'wordOrder':
        total = quizData.wordOrderQuiz.length;
        quizData.wordOrderQuiz.forEach((q, index) => {
          const key = `wordOrder-${index}`;
          const userOrder = selectedAnswers[key];
          if (userOrder && Array.isArray(userOrder)) {
            // Check if the order is correct (allowing some flexibility)
            const correctSequence = q.scrambledWords.map((word, i) => word).join(' ');
            const userSequence = userOrder.map((i: number) => q.scrambledWords[i]).join(' ');
            if (userSequence === q.originalSentence || 
                userSequence.toLowerCase().replace(/[.,!?]/g, '') === 
                q.originalSentence.toLowerCase().replace(/[.,!?]/g, '')) {
              correct++;
            }
          }
        });
        break;
    }

    return total > 0 ? Math.round((correct / total) * 100) : 0;
  };

  const showQuizResults = () => {
    const fillInBlankScore = calculateScore('fillInBlank');
    const vocabularyScore = calculateScore('vocabulary');
    const wordOrderScore = calculateScore('wordOrder');
    
    setQuizScores({
      fillInBlank: fillInBlankScore,
      vocabulary: vocabularyScore,
      wordOrder: wordOrderScore
    });
    setShowResults(true);
  };

  // Render tool selection menu
  if (currentTool === 'menu') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <Card className="p-6" glass={false}>
          <div className="text-center space-y-4">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500/20 to-green-500/20 rounded-full flex items-center justify-center">
              <span className="text-5xl">🇨🇦</span>
            </div>
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
              테리영어 AI 학습 도구
            </h2>
            <p className="text-[var(--color-text-secondary)] max-w-2xl mx-auto">
              25년 경력의 토론토대학교 언어학 전문가가 개발한 
              AI 기반 영어 학습 시스템을 선택하세요.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant="primary" size="sm">무료 제공</Badge>
              <Badge variant="success" size="sm">AI 자동 생성</Badge>
              <Badge variant="warning" size="sm">25년 교육 경험</Badge>
            </div>
          </div>
        </Card>

        {/* Tool Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* PDF Quiz Tool */}
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" glass={false}
                onClick={() => setCurrentTool('pdf-quiz')}>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full flex items-center justify-center">
                <span className="text-3xl">📄</span>
              </div>
              <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">
                PDF 본문 암기 도구
              </h3>
              <p className="text-[var(--color-text-secondary)]">
                영어 교과서나 본문 PDF를 업로드하면 AI가 자동으로 퀴즈를 생성합니다.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Badge variant="info" size="sm">빈칸 채우기</Badge>
                <Badge variant="success" size="sm">어순 배열</Badge>
                <Badge variant="warning" size="sm">단어 암기</Badge>
              </div>
              <Button variant="primary" className="w-full">
                📄 PDF 업로드하기
              </Button>
            </div>
          </Card>

          {/* Vocabulary Memorizer */}
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" glass={false}
                onClick={() => setCurrentTool('vocabulary-memorizer')}>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center">
                <span className="text-3xl">📚</span>
              </div>
              <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">
                AI 단어 암기 시스템
              </h3>
              <p className="text-[var(--color-text-secondary)]">
                SRS 간격 반복 시스템으로 최적화된 단어 학습. 매일 새로운 단어와 맞춤 복습!
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Badge variant="primary" size="sm">SRS 알고리즘</Badge>
                <Badge variant="success" size="sm">AI 단어 선정</Badge>
                <Badge variant="warning" size="sm">실시간 피드백</Badge>
              </div>
              <Button variant="primary" className="w-full">
                📚 단어 암기 시작하기
              </Button>
            </div>
          </Card>
        </div>

        {/* Features Comparison */}
        <Card className="p-6" glass={false}>
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
            💡 도구별 특징 비교
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-blue-600 dark:text-blue-400 mb-3">📄 PDF 본문 암기 도구</h4>
              <ul className="space-y-2 text-sm text-[var(--color-text-secondary)]">
                <li>• 실제 PDF 파일 업로드 및 분석</li>
                <li>• AI 자동 퀴즈 생성 (빈칸/어순/단어)</li>
                <li>• 교과서 본문 완벽 암기</li>
                <li>• 중·고등학교 영어에 최적화</li>
                <li>• 즉시 결과 확인 가능</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-purple-600 dark:text-purple-400 mb-3">📚 AI 단어 암기 시스템</h4>
              <ul className="space-y-2 text-sm text-[var(--color-text-secondary)]">
                <li>• SRS 간격 반복으로 장기 기억</li>
                <li>• 매일 7개 새 단어 자동 선정</li>
                <li>• 문장 작성 → AI 실시간 피드백</li>
                <li>• 비즈니스/학술/토익/아이엘츠 대응</li>
                <li>• 개인별 맞춤 복습 일정</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Render vocabulary memorizer
  if (currentTool === 'vocabulary-memorizer') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => setCurrentTool('menu')}
            variant="outline"
            size="sm"
          >
            ← 도구 선택으로
          </Button>
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
            📚 AI 단어 암기 시스템
          </h2>
        </div>
        <VocabularyMemoizer />
      </div>
    );
  }

  // Render PDF quiz tool (existing logic)
  if (currentTool === 'pdf-quiz') {
    // Add back button
    if (!quizData && !processingStatus) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setCurrentTool('menu')}
              variant="outline" 
              size="sm"
            >
              ← 도구 선택으로
            </Button>
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
              📄 PDF 본문 암기 도구
            </h2>
          </div>
          {renderPDFUploadSection()}
        </div>
      );
    }
  }

  // PDF Quiz upload section
  function renderPDFUploadSection() {
    return (
      <div className="space-y-6">
        {/* Header */}
        <Card className="p-6" glass={false}>
          <div className="text-center space-y-4">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500/20 to-green-500/20 rounded-full flex items-center justify-center">
              <span className="text-5xl">🇨🇦</span>
            </div>
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
              테리영어 AI 본문 암기 도구
            </h2>
            <p className="text-[var(--color-text-secondary)] max-w-2xl mx-auto">
              중·고등학생 영어 교과서나 본문을 PDF로 업로드하면, AI가 자동으로 
              <strong> 빈칸 채우기</strong>, <strong>어순 배열</strong>, <strong>단어 암기</strong> 퀴즈를 생성해드립니다!
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant="primary" size="sm">무료 제공</Badge>
              <Badge variant="success" size="sm">AI 자동 생성</Badge>
              <Badge variant="warning" size="sm">25년 교육 경험</Badge>
            </div>
          </div>
        </Card>

        {/* File Upload */}
        <Card className="p-6" glass={false}>
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
            📄 영어 본문 PDF 업로드
          </h3>
          
          <div className="space-y-4">
            <div className="border-2 border-dashed border-[var(--color-border-secondary)] rounded-lg p-8 text-center">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
                id="pdf-upload"
              />
              <label 
                htmlFor="pdf-upload"
                className="cursor-pointer block"
              >
                <div className="space-y-2">
                  <span className="text-4xl">📎</span>
                  <p className="text-[var(--color-text-secondary)]">
                    클릭해서 PDF 파일을 선택하세요
                  </p>
                  <p className="text-sm text-[var(--color-text-tertiary)]">
                    최대 10MB, PDF 파일만 가능
                  </p>
                </div>
              </label>
            </div>

            {selectedFile && (
              <div className="bg-[var(--color-bg-secondary)] p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[var(--color-text-primary)]">
                      {selectedFile.name}
                    </p>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    onClick={startProcessing}
                    disabled={isProcessing}
                    variant="primary"
                  >
                    {isProcessing ? '처리 중...' : '퀴즈 생성 시작'}
                  </Button>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Instructions */}
        <Card className="p-6" glass={false}>
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
            💡 사용법
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full mx-auto mb-3 flex items-center justify-center">
                <span className="text-2xl">1️⃣</span>
              </div>
              <h4 className="font-medium text-[var(--color-text-primary)] mb-1">PDF 업로드</h4>
              <p className="text-sm text-[var(--color-text-tertiary)]">
                영어 교과서나 본문이 담긴 PDF를 업로드하세요
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full mx-auto mb-3 flex items-center justify-center">
                <span className="text-2xl">2️⃣</span>
              </div>
              <h4 className="font-medium text-[var(--color-text-primary)] mb-1">AI 분석</h4>
              <p className="text-sm text-[var(--color-text-tertiary)]">
                AI가 영어 본문을 분석하고 퀴즈를 자동 생성합니다
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full mx-auto mb-3 flex items-center justify-center">
                <span className="text-2xl">3️⃣</span>
              </div>
              <h4 className="font-medium text-[var(--color-text-primary)] mb-1">퀴즈 풀이</h4>
              <p className="text-sm text-[var(--color-text-tertiary)]">
                3가지 유형의 퀴즈로 본문을 완벽하게 암기하세요
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Render processing status
  if (processingStatus && !quizData) {
    return (
      <Card className="p-8 text-center" glass={false}>
        <div className="space-y-6">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500/20 to-green-500/20 rounded-full flex items-center justify-center animate-pulse">
            <span className="text-5xl">⚙️</span>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">
              {processingStatus.message}
            </h3>
            
            <div className="w-full bg-[var(--color-bg-tertiary)] rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${processingStatus.progress}%` }}
              />
            </div>
            
            <p className="text-sm text-[var(--color-text-secondary)]">
              {processingStatus.progress}% 완료
            </p>
          </div>
          
          {processingStatus.stage === 'error' && (
            <div className="mt-6">
              <Button onClick={resetTool} variant="outline">
                다시 시도
              </Button>
            </div>
          )}
        </div>
      </Card>
    );
  }

  // Render quiz interface
  if (quizData && !showResults) {
    return (
      <div className="space-y-6">
        {/* Quiz Type Selector */}
        <Card className="p-6" glass={false}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
              📚 테리영어 본문 암기 퀴즈
            </h2>
            <Button onClick={resetTool} variant="outline" size="sm">
              새로운 PDF 업로드
            </Button>
          </div>
          
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setCurrentQuizType('fillInBlank')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentQuizType === 'fillInBlank'
                  ? 'bg-blue-500 text-white'
                  : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'
              }`}
            >
              🔤 빈칸 채우기 ({quizData.fillInBlankQuiz.length}문제)
            </button>
            <button
              onClick={() => setCurrentQuizType('wordOrder')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentQuizType === 'wordOrder'
                  ? 'bg-green-500 text-white'
                  : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'
              }`}
            >
              🔀 어순 배열 ({quizData.wordOrderQuiz.length}문제)
            </button>
            <button
              onClick={() => setCurrentQuizType('vocabulary')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentQuizType === 'vocabulary'
                  ? 'bg-purple-500 text-white'
                  : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'
              }`}
            >
              📚 단어 암기 ({quizData.vocabularyQuiz.length}문제)
            </button>
          </div>

          {/* Quiz Content */}
          <div className="space-y-4">
            {currentQuizType === 'fillInBlank' && (
              <div className="space-y-6">
                {quizData.fillInBlankQuiz.map((question, index) => (
                  <div key={index} className="bg-[var(--color-bg-secondary)] p-6 rounded-lg">
                    <h4 className="font-medium text-[var(--color-text-primary)] mb-4">
                      문제 {index + 1}: 빈칸에 들어갈 알맞은 단어들을 선택하세요. ({question.blanks.length}개 빈칸)
                    </h4>
                    <p className="text-lg mb-6 text-[var(--color-text-primary)] leading-relaxed">
                      {question.sentence}
                    </p>
                    
                    {/* Multiple blanks selection */}
                    <div className="space-y-4">
                      {question.blanks.map((blank, blankIndex) => (
                        <div key={blankIndex} className="border border-[var(--color-border-secondary)] p-4 rounded-lg">
                          <h5 className="font-medium text-[var(--color-text-primary)] mb-3">
                            빈칸 {blankIndex + 1}: "___"에 들어갈 단어
                          </h5>
                          <div className="grid grid-cols-2 gap-2">
                            {question.options[blankIndex]?.map((option, optionIndex) => (
                              <button
                                key={optionIndex}
                                onClick={() => handleQuizAnswer(`fillInBlank-${index}-${blankIndex}`, optionIndex)}
                                className={`p-2 rounded-lg text-left text-sm transition-colors ${
                                  selectedAnswers[`fillInBlank-${index}-${blankIndex}`] === optionIndex
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-white dark:bg-gray-800 border border-[var(--color-border-secondary)] hover:bg-[var(--color-bg-tertiary)]'
                                }`}
                              >
                                {optionIndex + 1}. {option}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {currentQuizType === 'vocabulary' && (
              <div className="space-y-6">
                {quizData.vocabularyQuiz.map((question, index) => (
                  <div key={index} className="bg-[var(--color-bg-secondary)] p-6 rounded-lg">
                    <h4 className="font-medium text-[var(--color-text-primary)] mb-4">
                      문제 {index + 1}: '<strong>{question.word}</strong>'의 뜻을 선택하세요.
                    </h4>
                    
                    {/* Context sentence */}
                    {question.context && (
                      <div className="mb-4 p-3 bg-[var(--color-bg-tertiary)] rounded-lg">
                        <p className="text-sm text-[var(--color-text-secondary)] mb-1">
                          📖 문맥:
                        </p>
                        <p className="text-[var(--color-text-primary)] italic">
                          "{question.context}"
                        </p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-3">
                      {question.options.map((option, optionIndex) => (
                        <button
                          key={optionIndex}
                          onClick={() => handleQuizAnswer(`vocabulary-${index}`, optionIndex)}
                          className={`p-3 rounded-lg text-left transition-colors ${
                            selectedAnswers[`vocabulary-${index}`] === optionIndex
                              ? 'bg-purple-500 text-white'
                              : 'bg-white dark:bg-gray-800 border border-[var(--color-border-secondary)] hover:bg-[var(--color-bg-tertiary)]'
                          }`}
                        >
                          {optionIndex + 1}. {option}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {currentQuizType === 'wordOrder' && (
              <div className="space-y-6">
                {quizData.wordOrderQuiz.map((question, index) => (
                  <WordOrderQuestion
                    key={index}
                    questionIndex={index}
                    question={question}
                    selectedAnswer={selectedAnswers[`wordOrder-${index}`]}
                    onAnswerChange={(answer) => handleQuizAnswer(`wordOrder-${index}`, answer)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="mt-8 text-center">
            <Button
              onClick={showQuizResults}
              variant="primary"
              size="lg"
              disabled={Object.keys(selectedAnswers).length === 0}
            >
              🎯 결과 확인하기
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Render results
  if (showResults) {
    return (
      <Card className="p-8 text-center" glass={false}>
        <div className="space-y-6">
          <span className="text-6xl">🎉</span>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
            퀴즈 완료! 결과를 확인하세요
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-200 mb-2">
                🔤 빈칸 채우기
              </h3>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-300">
                {quizScores.fillInBlank}%
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-green-700 dark:text-green-200 mb-2">
                🔀 어순 배열
              </h3>
              <p className="text-3xl font-bold text-green-600 dark:text-green-300">
                {quizScores.wordOrder}%
              </p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-purple-700 dark:text-purple-200 mb-2">
                📚 단어 암기
              </h3>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-300">
                {quizScores.vocabulary}%
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => {
                setShowResults(false);
                setCurrentQuestionIndex(0);
                setSelectedAnswers({});
              }}
              variant="outline"
            >
              퀴즈 다시 풀기
            </Button>
            <Button
              onClick={resetTool}
              variant="primary"
            >
              새로운 PDF 업로드
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return null;
}

// Word Order Question Component
interface WordOrderQuestionProps {
  questionIndex: number;
  question: {
    originalSentence: string;
    scrambledWords: string[];
    correctOrder: number[];
  };
  selectedAnswer?: number[];
  onAnswerChange: (answer: number[]) => void;
}

function WordOrderQuestion({ questionIndex, question, selectedAnswer, onAnswerChange }: WordOrderQuestionProps) {
  const [userOrder, setUserOrder] = useState<number[]>(selectedAnswer || []);
  const [availableWords, setAvailableWords] = useState<number[]>(
    Array.from({ length: question.scrambledWords.length }, (_, i) => i)
  );

  // Update parent when userOrder changes
  React.useEffect(() => {
    if (userOrder.length === question.scrambledWords.length) {
      onAnswerChange(userOrder);
    }
  }, [userOrder, question.scrambledWords.length, onAnswerChange]);

  const handleWordClick = (wordIndex: number, isInSentence: boolean) => {
    if (isInSentence) {
      // Remove word from sentence, add back to available
      const newUserOrder = userOrder.filter(i => i !== wordIndex);
      const newAvailableWords = [...availableWords, wordIndex].sort((a, b) => a - b);
      setUserOrder(newUserOrder);
      setAvailableWords(newAvailableWords);
    } else {
      // Add word to sentence, remove from available
      const newUserOrder = [...userOrder, wordIndex];
      const newAvailableWords = availableWords.filter(i => i !== wordIndex);
      setUserOrder(newUserOrder);
      setAvailableWords(newAvailableWords);
    }
  };

  const resetOrder = () => {
    setUserOrder([]);
    setAvailableWords(Array.from({ length: question.scrambledWords.length }, (_, i) => i));
  };

  return (
    <div className="bg-[var(--color-bg-secondary)] p-6 rounded-lg">
      <h4 className="font-medium text-[var(--color-text-primary)] mb-4">
        문제 {questionIndex + 1}: 단어들을 올바른 순서로 배열하세요
      </h4>
      
      {/* Target sentence area */}
      <div className="mb-6">
        <h5 className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">
          완성된 문장:
        </h5>
        <div className="min-h-[60px] border-2 border-dashed border-[var(--color-border-secondary)] rounded-lg p-4 flex flex-wrap gap-2 items-center">
          {userOrder.map((wordIndex, position) => (
            <button
              key={`sentence-${position}`}
              onClick={() => handleWordClick(wordIndex, true)}
              className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
            >
              {question.scrambledWords[wordIndex]}
            </button>
          ))}
          {userOrder.length === 0 && (
            <span className="text-[var(--color-text-tertiary)] text-sm">
              단어를 클릭해서 문장을 완성하세요
            </span>
          )}
        </div>
      </div>

      {/* Available words */}
      <div className="mb-4">
        <h5 className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">
          사용할 단어들:
        </h5>
        <div className="flex flex-wrap gap-2">
          {availableWords.map(wordIndex => (
            <button
              key={`available-${wordIndex}`}
              onClick={() => handleWordClick(wordIndex, false)}
              className="px-3 py-2 bg-[var(--color-primary-500)] text-white rounded-lg hover:bg-[var(--color-primary-600)] transition-colors text-sm font-medium"
            >
              {question.scrambledWords[wordIndex]}
            </button>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center">
        <button
          onClick={resetOrder}
          className="px-4 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          다시 시작
        </button>
        
        {userOrder.length === question.scrambledWords.length && (
          <div className="flex items-center text-green-600">
            <span className="text-sm font-medium">✅ 문장 완성!</span>
          </div>
        )}
      </div>

      {/* Show original sentence for reference (can be toggled) */}
      <details className="mt-4">
        <summary className="text-sm text-[var(--color-text-tertiary)] cursor-pointer hover:text-[var(--color-text-secondary)]">
          💡 정답 확인 (클릭)
        </summary>
        <div className="mt-2 p-3 bg-[var(--color-bg-tertiary)] rounded-lg">
          <p className="text-sm text-[var(--color-text-primary)] font-medium">
            {question.originalSentence}
          </p>
        </div>
      </details>
    </div>
  );
}