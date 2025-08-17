'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  Brain, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Clock, 
  Users, 
  Target,
  TrendingUp,
  BookOpen,
  Lightbulb,
  Award,
  ChevronRight,
  Share2,
  Download
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Progress from '@/components/ui/Progress';
import Badge from '@/components/ui/Badge';
import { QUIZ_QUESTIONS, QuizAnswer, QuizResult, STUDY_TYPES } from '@/types/assessments';

export default function StudyTypeAssessmentPage() {
  const router = useRouter();
  
  // Quiz state
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Handle start quiz
  const handleStartQuiz = () => {
    setIsStarted(true);
  };

  // Handle retake quiz
  const handleRetakeQuiz = () => {
    setCurrentStep(0);
    setAnswers([]);
    setQuizResult(null);
    setSubmitError(null);
    setIsStarted(true);
  };

  // Handle answer selection
  const handleAnswerSelect = (questionId: string, answer: string, selectedOption?: string) => {
    const newAnswer: QuizAnswer = {
      questionId,
      answer,
      selectedOption
    };

    setAnswers(prev => {
      const existing = prev.findIndex(a => a.questionId === questionId);
      if (existing !== -1) {
        const updated = [...prev];
        updated[existing] = newAnswer;
        return updated;
      }
      return [...prev, newAnswer];
    });
  };

  // Navigate between questions
  const handleNext = () => {
    if (currentStep < QUIZ_QUESTIONS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleSubmitQuiz();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Submit quiz
  const handleSubmitQuiz = async () => {
    if (answers.length !== QUIZ_QUESTIONS.length) {
      setSubmitError('모든 질문에 답변해주세요.');
      return;
    }

    // Validate essay questions have minimum length
    const essayQuestions = QUIZ_QUESTIONS.filter(q => q.type === 'essay');
    for (const question of essayQuestions) {
      const answer = answers.find(a => a.questionId === question.id);
      if (!answer || answer.answer.trim().length < 50) {
        setSubmitError(`서술형 질문은 최소 50자 이상 작성해주세요.`);
        return;
      }
    }

    setIsSubmitting(true);
    setSubmitError(null);

    // For now, generate a mock result
    // In production, this would call the API
    setTimeout(() => {
      const mockResult: QuizResult = {
        id: `quiz_${Date.now()}`,
        userId: 'mock_user',
        answers,
        analysis: {
          studyType: STUDY_TYPES[Math.floor(Math.random() * STUDY_TYPES.length)],
          reasoning: '당신의 답변을 분석한 결과, 학습 패턴과 선호도가 이 유형과 가장 잘 맞습니다. 특히 시간 관리와 학습 환경 선호도에서 명확한 특징을 보였습니다.',
          confidence: 85,
          dimensionScores: {
            timeManagement: Math.floor(Math.random() * 4) + 7,
            socialLearning: Math.floor(Math.random() * 4) + 5,
            informationProcessing: Math.floor(Math.random() * 4) + 6,
            perfectionism: Math.floor(Math.random() * 4) + 5,
            motivation: Math.floor(Math.random() * 4) + 7,
            stressResponse: Math.floor(Math.random() * 4) + 6,
            goalOrientation: Math.floor(Math.random() * 4) + 7,
            learningDepth: Math.floor(Math.random() * 4) + 6
          }
        },
        completedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      setQuizResult(mockResult);
      setIsSubmitting(false);
    }, 2000);
  };

  // Get current answer for a question
  const getCurrentAnswer = (questionId: string) => {
    return answers.find(a => a.questionId === questionId);
  };

  // Check if current question is answered
  const isCurrentQuestionAnswered = () => {
    if (currentStep >= QUIZ_QUESTIONS.length) return true;
    const question = QUIZ_QUESTIONS[currentStep];
    const answer = getCurrentAnswer(question.id);
    
    if (!answer || !answer.answer.trim()) return false;
    
    // For essay questions, check minimum length
    if (question.type === 'essay') {
      return answer.answer.trim().length >= 50;
    }
    
    return true;
  };

  // Results view
  if (quizResult) {
    return <QuizResultsView result={quizResult} onRetake={handleRetakeQuiz} />;
  }

  // Welcome screen
  if (!isStarted) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)]">
        <div className="container mx-auto px-4 py-6 sm:py-12">
          <div className="max-w-4xl mx-auto text-center">
            <button
              onClick={() => router.push('/assessments')}
              className="inline-flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-8 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              진단평가 목록으로
            </button>

            <div className="inline-flex items-center justify-center w-20 h-20 bg-[var(--color-primary)] rounded-2xl mb-6">
              <Brain className="w-10 h-10 text-white" />
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--color-text-primary)] mb-4">
              나의 공부 유형 진단하기
            </h1>
            
            <p className="text-lg sm:text-xl text-[var(--color-text-secondary)] max-w-3xl mx-auto leading-relaxed mb-8 sm:mb-12">
              10개의 질문으로 당신만의 학습 스타일을 발견하고
              <br />
              <span className="text-[var(--color-primary)] font-semibold">맞춤형 공부 전략</span>을 받아보세요
            </p>

            <div className="grid sm:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
              <Card className="p-6">
                <div className="w-12 h-12 bg-[var(--color-bg-tertiary)] rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <Brain className="w-6 h-6 text-[var(--color-primary)]" />
                </div>
                <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">AI 정밀 분석</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">8가지 공부 유형 중 최적의 유형을 찾아드립니다</p>
              </Card>
              
              <Card className="p-6">
                <div className="w-12 h-12 bg-[var(--color-bg-tertiary)] rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <Target className="w-6 h-6 text-[var(--color-primary)]" />
                </div>
                <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">맞춤형 전략</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">당신의 유형에 맞는 구체적인 공부 방법을 제시합니다</p>
              </Card>
              
              <Card className="p-6">
                <div className="w-12 h-12 bg-[var(--color-bg-tertiary)] rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <TrendingUp className="w-6 h-6 text-[var(--color-success)]" />
                </div>
                <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">성과 향상</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">강점을 활용하고 약점을 보완하여 학습 효율을 극대화합니다</p>
              </Card>
            </div>

            <Card className="bg-[var(--color-bg-secondary)] p-6 mb-8 max-w-2xl mx-auto">
              <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-3">진단 정보</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-semibold text-[var(--color-text-primary)]">질문 수</div>
                  <div className="text-[var(--color-text-secondary)]">객관식 8개 + 서술형 2개</div>
                </div>
                <div>
                  <div className="font-semibold text-[var(--color-text-primary)]">소요 시간</div>
                  <div className="text-[var(--color-text-secondary)]">약 3-4분</div>
                </div>
              </div>
            </Card>

            <Button
              onClick={handleStartQuiz}
              variant="primary"
              size="lg"
              className="inline-flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              진단 시작하기
              <ArrowRight className="w-5 h-5" />
            </Button>

            <p className="text-sm text-[var(--color-text-tertiary)] mt-4">
              완전 무료 · 로그인 후 이용 가능
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Quiz interface
  const currentQuestion = QUIZ_QUESTIONS[currentStep];
  const progress = ((currentStep + 1) / QUIZ_QUESTIONS.length) * 100;

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-[var(--color-bg-tertiary)] z-50">
        <div
          className="h-full bg-[var(--color-primary)] transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="container mx-auto px-4 py-4 sm:py-8 pt-12 sm:pt-16">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[var(--color-primary)] rounded-xl mb-4">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div className="text-sm text-[var(--color-text-tertiary)] mb-2">
              질문 {currentStep + 1} / {QUIZ_QUESTIONS.length}
            </div>
            <div className="text-sm text-[var(--color-primary)] font-medium mb-4">
              {currentQuestion.intent}
            </div>
          </div>

          {/* Question Card */}
          <Card className="p-4 sm:p-8 mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)] mb-6 sm:mb-8">
              {currentQuestion.question}
            </h2>

            {currentQuestion.type === 'multiple_choice' ? (
              <div className="space-y-4">
                {currentQuestion.options?.map((option) => {
                  const isSelected = getCurrentAnswer(currentQuestion.id)?.selectedOption === option.id;
                  return (
                    <button
                      key={option.id}
                      onClick={() => handleAnswerSelect(currentQuestion.id, option.text, option.id)}
                      className={`w-full text-left p-4 sm:p-6 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'border-[var(--color-primary)] bg-[var(--color-bg-tertiary)]'
                          : 'border-[var(--color-border-primary)] hover:border-[var(--color-border-secondary)] hover:bg-[var(--color-bg-secondary)]'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? 'border-[var(--color-primary)] bg-[var(--color-primary)]' : 'border-[var(--color-border-secondary)]'
                        }`}>
                          {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                        </div>
                        <div className="flex-1">
                          <span className="font-semibold text-[var(--color-primary)] mr-2">{option.id}.</span>
                          <span className="text-[var(--color-text-primary)]">{option.text}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div>
                <textarea
                  value={getCurrentAnswer(currentQuestion.id)?.answer || ''}
                  onChange={(e) => handleAnswerSelect(currentQuestion.id, e.target.value)}
                  placeholder="구체적이고 솔직하게 답변해주세요..."
                  className="w-full h-32 p-4 border border-[var(--color-border-primary)] rounded-xl resize-none focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    최소 50자 이상 작성해주세요
                  </p>
                  <p className="text-sm text-[var(--color-text-primary)] font-medium">
                    {getCurrentAnswer(currentQuestion.id)?.answer?.length || 0}/50
                  </p>
                </div>
              </div>
            )}
          </Card>

          {/* Error Message */}
          {submitError && (
            <div className="bg-[var(--color-error-bg)] border border-[var(--color-error)] text-[var(--color-error)] px-4 py-3 rounded-xl mb-4">
              {submitError}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <Button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              이전
            </Button>

            <Button
              onClick={handleNext}
              disabled={!isCurrentQuestionAnswered() || isSubmitting}
              variant="primary"
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  분석 중...
                </>
              ) : currentStep === QUIZ_QUESTIONS.length - 1 ? (
                <>
                  결과 보기
                  <Sparkles className="w-5 h-5" />
                </>
              ) : (
                <>
                  다음
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Results view component
function QuizResultsView({ 
  result, 
  onRetake 
}: { 
  result: QuizResult;
  onRetake: () => void;
}) {
  const router = useRouter();
  const { studyType, reasoning, confidence, dimensionScores } = result.analysis;

  // Get study type emoji
  const getStudyTypeEmoji = (typeId: string) => {
    const emojiMap: { [key: string]: string } = {
      'focused_marathoner': '🎯',
      'strategic_sprinter': '⚡',
      'social_studier': '👥',
      'perfectionist_detailer': '💎',
      'intuitive_connector': '🧩',
      'practical_applicator': '🔧',
      'emotional_motivator': '🔥',
      'balanced_allrounder': '⚖️'
    };
    return emojiMap[typeId] || '🎯';
  };

  // Calculate dimension levels
  const getDimensionLevel = (score: number) => {
    if (score >= 8) return { level: '매우 높음', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (score >= 6) return { level: '높음', color: 'text-blue-600', bgColor: 'bg-blue-100' };
    if (score >= 4) return { level: '보통', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    return { level: '낮음', color: 'text-gray-600', bgColor: 'bg-gray-100' };
  };

  const dimensionLabels = {
    timeManagement: '시간 관리',
    socialLearning: '사회적 학습',
    informationProcessing: '정보 처리',
    perfectionism: '완벽주의',
    motivation: '내재적 동기',
    stressResponse: '스트레스 대응',
    goalOrientation: '목표 지향',
    learningDepth: '학습 깊이'
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] py-6 sm:py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => router.push('/assessments')}
            className="inline-flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            진단평가 목록으로
          </button>

          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-[var(--color-primary)] rounded-2xl mb-6">
              <Brain className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-[var(--color-text-primary)] mb-4">
              진단 완료!
            </h1>
            <p className="text-xl text-[var(--color-text-secondary)]">
              당신만의 학습 DNA를 발견했어요
            </p>
          </div>

          {/* Main Result Card */}
          <Card className="p-4 sm:p-8 mb-6 sm:mb-8">
            {/* Study Type Display */}
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">
                {getStudyTypeEmoji(studyType.id)}
              </div>
              <h2 className="text-3xl font-bold text-[var(--color-text-primary)] mb-3">
                {studyType.name}
              </h2>
              <p className="text-lg text-[var(--color-text-secondary)] mb-4">
                {studyType.description}
              </p>
              <Badge variant="success" className="inline-flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                AI 분석 신뢰도 {confidence}%
              </Badge>
            </div>

            {/* AI Analysis */}
            <Card className="bg-[var(--color-bg-secondary)] border-[var(--color-border-secondary)] p-4 sm:p-6 mb-6 sm:mb-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-[var(--color-primary)] rounded-lg flex items-center justify-center">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-bold text-[var(--color-text-primary)] text-xl">AI 전문가 분석</h3>
              </div>
              <p className="text-[var(--color-text-secondary)] leading-relaxed">
                {reasoning}
              </p>
            </Card>

            {/* Dimension Scores */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-[var(--color-primary)]" />
                상세 분석 결과
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(dimensionScores).map(([key, score]) => {
                  const dimension = getDimensionLevel(score);
                  const label = dimensionLabels[key as keyof typeof dimensionLabels];
                  return (
                    <div key={key} className="bg-[var(--color-bg-tertiary)] rounded-xl p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-[var(--color-text-primary)]">{label}</span>
                        <Badge className={`${dimension.color} ${dimension.bgColor}`}>
                          {dimension.level}
                        </Badge>
                      </div>
                      <div className="w-full bg-[var(--color-bg-secondary)] rounded-full h-2">
                        <div
                          className="bg-[var(--color-primary)] h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${score * 10}%` }}
                        />
                      </div>
                      <div className="text-xs text-[var(--color-text-tertiary)] mt-1">{score}/10</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Characteristics */}
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[var(--color-success)]" />
                  나의 강점
                </h3>
                <div className="space-y-3">
                  {studyType.strengths.map((strength, index) => (
                    <div 
                      key={index}
                      className="flex items-center gap-3 p-3 bg-[var(--color-bg-tertiary)] rounded-lg border border-[var(--color-success)]/20"
                    >
                      <CheckCircle className="w-4 h-4 text-[var(--color-success)] flex-shrink-0" />
                      <span className="text-[var(--color-text-secondary)]">{strength}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-[var(--color-warning)]" />
                  개선 포인트
                </h3>
                <div className="space-y-3">
                  {studyType.weaknesses.map((weakness, index) => (
                    <div 
                      key={index}
                      className="flex items-center gap-3 p-3 bg-[var(--color-bg-tertiary)] rounded-lg border border-[var(--color-warning)]/20"
                    >
                      <div className="w-4 h-4 rounded-full bg-[var(--color-warning)] flex-shrink-0" />
                      <span className="text-[var(--color-text-secondary)]">{weakness}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Recommendations */}
          <Card className="bg-[var(--color-bg-secondary)] p-4 sm:p-8 mb-6 sm:mb-8">
            <h3 className="text-2xl font-bold text-[var(--color-text-primary)] mb-6 flex items-center gap-2">
              <Lightbulb className="w-6 h-6 text-[var(--color-warning)]" />
              맞춤형 학습 전략
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              {studyType.recommendations.map((recommendation, index) => (
                <div 
                  key={index}
                  className="bg-[var(--color-bg-primary)] rounded-xl p-4 border border-[var(--color-border-primary)]"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                      {index + 1}
                    </div>
                    <p className="text-[var(--color-text-secondary)]">{recommendation}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* CTA Section */}
          <Card className="bg-[var(--color-primary)] p-4 sm:p-8 mb-6 sm:mb-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-4 text-white">
                결과를 공유하고 친구와 비교해보세요!
              </h3>
              <p className="text-white/90 mb-6">
                인스타그램에 공유하면 더 자세한 학습 가이드를 받을 수 있어요
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="secondary" size="lg" className="bg-white text-[var(--color-primary)] hover:bg-gray-100">
                  <Share2 className="w-5 h-5" />
                  결과 공유하기
                </Button>
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                  <Download className="w-5 h-5" />
                  PDF 다운로드
                </Button>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="text-center space-y-4">
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <Button
                onClick={() => router.push('/assessments')}
                variant="primary"
                size="lg"
                className="inline-flex items-center gap-2"
              >
                <Award className="w-5 h-5" />
                다른 진단 받아보기
              </Button>
              
              <Button
                onClick={onRetake}
                variant="outline"
                size="lg"
              >
                다시 진단하기
              </Button>
            </div>
            
            <p className="text-sm text-[var(--color-text-tertiary)] max-w-md mx-auto">
              모든 진단을 완료하면 종합 리포트를 받을 수 있어요!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}