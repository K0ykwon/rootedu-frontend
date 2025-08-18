'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  GraduationCap, ChevronRight, ChevronLeft, Brain, Users, 
  Heart, AlertTriangle, CheckCircle, TrendingUp, Share2,
  Zap, Shield, Target, Sparkles
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import AuthModal from '@/components/auth/AuthModal';
import { useAuth } from '@/hooks/useAuth';
import { 
  ADAPTATION_QUESTIONS, 
  AdaptationAnswer, 
  AdaptationResult,
  CollegeAdaptationAnalysis 
} from '@/types/college-adaptation';

export default function CollegeAdaptationPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { requireAuth, showAuthModal, closeAuthModal } = useAuth();
  
  // Quiz state
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<AdaptationResult | null>(null);
  const [existingResult, setExistingResult] = useState<CollegeAdaptationAnalysis | null>(null);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Check for existing results
  useEffect(() => {
    if (session?.user?.id) {
      loadExistingResult();
    }
  }, [session]);

  const loadExistingResult = async () => {
    if (!session?.user?.id) return;
    
    setIsLoadingExisting(true);
    try {
      const response = await fetch('/api/college-adaptation');
      if (response.ok) {
        const data = await response.json();
        if (data.result) {
          setExistingResult(data.result);
        }
      }
    } catch (error) {
      console.error('Failed to load existing result:', error);
    } finally {
      setIsLoadingExisting(false);
    }
  };

  const handleStartQuiz = () => {
    if (!requireAuth()) return;
    setIsStarted(true);
  };

  const handleRetakeQuiz = () => {
    setCurrentStep(0);
    setAnswers({});
    setResult(null);
    setSubmitError(null);
    setIsStarted(true);
  };

  const handleAnswer = (optionId: string) => {
    const currentQuestion = ADAPTATION_QUESTIONS[currentStep];
    const option = currentQuestion.options?.find(opt => opt.id === optionId);
    
    if (option && option.score !== undefined) {
      setAnswers({
        ...answers,
        [currentQuestion.id]: option.score
      });
      handleNext();
    }
  };

  const handleNext = () => {
    if (currentStep < ADAPTATION_QUESTIONS.length - 1) {
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

  const handleSubmitQuiz = async () => {
    if (!session?.user?.id) {
      setSubmitError('로그인이 필요합니다.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/college-adaptation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers: Object.entries(answers).map(([questionId, score]) => ({
            questionId,
            score
          })),
          userId: session.user.id
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data.result);
      } else {
        const errorData = await response.json();
        setSubmitError(errorData.error || '분석 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Submit error:', error);
      setSubmitError('네트워크 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCurrentQuestionAnswered = () => {
    if (currentStep >= ADAPTATION_QUESTIONS.length) return true;
    const question = ADAPTATION_QUESTIONS[currentStep];
    return !!answers[question.id];
  };

  // Loading state
  if (isLoadingExisting) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-[var(--color-text-secondary)]">기존 결과 확인 중...</p>
        </div>
      </div>
    );
  }

  // Results view
  if (result) {
    return <CollegeAdaptationResultView result={result} onRetake={handleRetakeQuiz} />;
  }

  // Show existing results if available
  if (!isStarted && existingResult) {
    return <CollegeAdaptationResultView 
      result={existingResult.result} 
      showRetakeButton={true} 
      onRetake={handleRetakeQuiz} 
    />;
  }

  // Welcome screen
  if (!isStarted) {
    return (
      <>
        <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center p-4">
          <div className="max-w-4xl mx-auto text-center">
            {/* Header */}
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl mb-6 shadow-lg">
                <GraduationCap className="w-10 h-10 text-white" />
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold text-[var(--color-text-primary)] mb-4">
                대학생활 적응도 테스트
              </h1>
              
              <p className="text-xl text-[var(--color-text-secondary)] max-w-3xl mx-auto leading-relaxed">
                10개의 질문으로 알아보는 나의 대학생활 준비도
              </p>
            </div>

            {/* Features */}
            <div className="grid md:grid-cols-4 gap-6 mb-10">
              <Card className="p-6">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <Brain className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">학업 적응도</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  대학 수준의 학습 준비도 평가
                </p>
              </Card>
              
              <Card className="p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">사회성</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  새로운 인간관계 형성 능력
                </p>
              </Card>
              
              <Card className="p-6">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">독립성</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  자립 생활 준비도
                </p>
              </Card>
              
              <Card className="p-6">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <Heart className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">정신건강</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  스트레스 관리 능력
                </p>
              </Card>
            </div>

            {/* Quiz Info */}
            <Card className="p-6 mb-8 max-w-2xl mx-auto bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
              <h3 className="text-xl font-bold mb-3">진단 정보</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-semibold">질문 수</div>
                  <div>10개 문항</div>
                </div>
                <div>
                  <div className="font-semibold">소요 시간</div>
                  <div>약 3-5분</div>
                </div>
              </div>
            </Card>

            {/* Start Button */}
            <Button 
              variant="primary" 
              size="lg"
              onClick={handleStartQuiz}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              테스트 시작하기
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>

            <p className="text-sm text-[var(--color-text-tertiary)] mt-4">
              완전 무료 • 로그인 후 이용 가능
            </p>
          </div>
        </div>

        {/* Auth Modal */}
        <AuthModal 
          isOpen={showAuthModal}
          onClose={closeAuthModal}
        />
      </>
    );
  }

  // Quiz interface
  const currentQuestion = ADAPTATION_QUESTIONS[currentStep];
  const progress = ((currentStep + 1) / ADAPTATION_QUESTIONS.length) * 100;

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gray-700 z-50">
        <div 
          className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="container mx-auto px-4 py-6 md:py-8 pt-12 md:pt-16">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6 md:mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl mb-3 md:mb-4">
              <GraduationCap className="w-7 h-7 md:w-8 md:h-8 text-white" />
            </div>
            <div className="text-sm text-[var(--color-text-tertiary)] mb-2">
              질문 {currentStep + 1} / {ADAPTATION_QUESTIONS.length}
            </div>
            <div className="text-xs md:text-sm text-purple-400 font-medium mb-3 md:mb-4 px-4">
              {currentQuestion.intent}
            </div>
          </div>

          {/* Question */}
          <Card className="p-4 md:p-8 mb-6 md:mb-8">
            <h2 className="text-lg md:text-2xl font-bold text-[var(--color-text-primary)] mb-6 md:mb-8 leading-relaxed">
              {currentQuestion.question}
            </h2>

            <div className={`${currentQuestion.type === 'scale' ? 'space-y-3' : 'grid gap-3'} ${
              currentQuestion.options!.length > 4 ? 'md:grid-cols-2' : ''
            }`}>
              {currentQuestion.options?.map((option) => {
                const isSelected = answers[currentQuestion.id] === option.score;
                
                return (
                  <button
                    key={option.id}
                    onClick={() => handleAnswer(option.id)}
                    className={`w-full text-left p-4 md:p-6 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-purple-500 bg-purple-900/20'
                        : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/50'
                    }`}
                  >
                    <div className="flex items-start md:items-center gap-3 md:gap-4">
                      <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 md:mt-0 ${
                        isSelected ? 'border-purple-500 bg-purple-500' : 'border-gray-600'
                      }`}>
                        {isSelected && <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-white" />}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-[var(--color-text-primary)] text-sm md:text-base leading-relaxed">
                          {option.text}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Error Message */}
          {submitError && (
            <div className="bg-red-900/20 border border-red-800 text-red-400 px-4 py-3 rounded-xl mb-4">
              {submitError}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              이전
            </Button>

            {isSubmitting && (
              <div className="flex items-center text-[var(--color-text-secondary)]">
                <div className="animate-spin w-4 h-4 md:w-5 md:h-5 border-2 border-purple-500 border-t-transparent rounded-full mr-2" />
                분석 중...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={closeAuthModal}
      />
    </div>
  );
}

// Results view component
function CollegeAdaptationResultView({ 
  result, 
  showRetakeButton = false,
  onRetake 
}: { 
  result: AdaptationResult;
  showRetakeButton?: boolean;
  onRetake?: () => void;
}) {
  const router = useRouter();

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-blue-500';
    if (score >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getCategoryInfo = (category: string) => {
    const info = {
      excellent: { text: '완벽한 준비 상태', color: 'from-green-600 to-emerald-600', icon: <Shield className="w-6 h-6" /> },
      good: { text: '좋은 준비 상태', color: 'from-blue-600 to-indigo-600', icon: <CheckCircle className="w-6 h-6" /> },
      moderate: { text: '보통 준비 상태', color: 'from-yellow-600 to-amber-600', icon: <Target className="w-6 h-6" /> },
      needs_support: { text: '지원 필요', color: 'from-orange-600 to-red-600', icon: <Heart className="w-6 h-6" /> },
      high_risk: { text: '집중 관리 필요', color: 'from-red-600 to-pink-600', icon: <AlertTriangle className="w-6 h-6" /> }
    };
    return info[category as keyof typeof info] || info.moderate;
  };

  const categoryInfo = getCategoryInfo(result.category);

  const shareToInstagram = () => {
    const text = encodeURIComponent(
      `대학생활 적응도 테스트 결과! 🎓\\n\\n` +
      `나의 적응 예상도: ${result.overallScore}%\\n` +
      `@root._.education\\n` +
      `#대학생활 #적응도테스트 #새내기 #대학준비`
    );
    window.open(`https://www.instagram.com/share?text=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] py-8 md:py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 md:mb-12">
            <div className={`inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-r ${categoryInfo.color} rounded-2xl mb-4 md:mb-6 shadow-lg text-white`}>
              {categoryInfo.icon}
            </div>
            <h1 className="text-2xl md:text-4xl font-bold text-[var(--color-text-primary)] mb-2 md:mb-4">
              대학생활 적응도 분석 결과
            </h1>
            <div className={`text-4xl md:text-5xl font-bold ${getScoreColor(result.overallScore)} mb-2`}>
              {result.overallScore}%
            </div>
            <p className="text-lg md:text-xl text-[var(--color-text-secondary)] font-medium">
              {categoryInfo.text}
            </p>
          </div>

          {/* Adaptation Areas */}
          <Card className="p-6 md:p-8 mb-8">
            <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-6">영역별 적응도</h3>
            <div className="space-y-4">
              {Object.entries(result.adaptationAreas).map(([area, score]) => (
                <div key={area}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-[var(--color-text-primary)]">
                      {area === 'academic' ? '학업 적응' : 
                       area === 'social' ? '사회성' :
                       area === 'independence' ? '독립성' : '정신건강'}
                    </span>
                    <span className={`font-bold ${getScoreColor(score)}`}>
                      {score}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full bg-gradient-to-r ${
                        score >= 80 ? 'from-green-500 to-emerald-500' :
                        score >= 60 ? 'from-blue-500 to-indigo-500' :
                        score >= 40 ? 'from-yellow-500 to-amber-500' :
                        'from-red-500 to-pink-500'
                      } transition-all duration-800`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Strengths & Challenges */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="p-6 bg-green-900/20 border-green-800">
              <h3 className="text-lg font-bold text-green-400 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                강점
              </h3>
              <ul className="space-y-2">
                {result.strengths.map((strength, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-[var(--color-text-secondary)]">{strength}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-6 bg-amber-900/20 border-amber-800">
              <h3 className="text-lg font-bold text-amber-400 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                보완점
              </h3>
              <ul className="space-y-2">
                {result.challenges.map((challenge, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span className="text-[var(--color-text-secondary)]">{challenge}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Burnout Risk Alert */}
          {result.burnoutRisk !== 'low' && (
            <Card className="p-6 bg-red-900/20 border-red-800 mb-8">
              <h3 className="text-lg font-bold text-red-400 mb-2 flex items-center gap-2">
                <Zap className="w-5 h-5" />
                번아웃 위험도: {result.burnoutRisk === 'high' ? '높음' : '보통'}
              </h3>
              <p className="text-red-300">
                {result.burnoutRisk === 'high' 
                  ? '번아웃 위험이 높습니다. 충분한 휴식과 스트레스 관리가 필요해요.'
                  : '적절한 스트레스 관리가 필요합니다. 자신만의 휴식 방법을 찾아보세요.'}
              </p>
            </Card>
          )}

          {/* Recommendations */}
          <Card className="p-6 md:p-8 mb-8">
            <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-6">맞춤 추천사항</h3>
            <div className="space-y-3">
              {result.recommendations.map((rec, idx) => (
                <div key={idx} className="flex items-start gap-3 p-4 bg-blue-900/20 border border-blue-800 rounded-lg">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">{idx + 1}</span>
                  </div>
                  <p className="text-[var(--color-text-secondary)]">{rec}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Instagram Sharing */}
          <Card className="p-6 md:p-8 bg-gradient-to-r from-purple-600 to-indigo-600 text-white mb-6 md:mb-8">
            <div className="text-center">
              <div className="text-2xl md:text-3xl mb-3 md:mb-4">📸</div>
              <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">
                📱 인스타그램 공유 이벤트
              </h3>
              <p className="text-purple-100 mb-4 md:mb-6 leading-relaxed text-sm md:text-base">
                이 결과 스크린샷을 인스타그램에 올리고 <span className="font-bold text-white">@root._.education</span>을 태그하면
                <br className="hidden md:block" />
                <span className="font-bold text-yellow-300">대학생활 성공 가이드북</span>을 무료로 드려요! 🎁
              </p>
              <Button 
                variant="secondary"
                onClick={shareToInstagram}
                className="bg-white text-purple-600 hover:bg-gray-100"
              >
                <Share2 className="w-5 h-5 mr-2" />
                인스타그램 공유하기
              </Button>
            </div>
          </Card>

          {/* Actions */}
          <div className="text-center space-y-3 md:space-y-4">
            <div className="flex flex-col md:flex-row gap-3 md:gap-4 justify-center">
              {showRetakeButton && onRetake && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={onRetake}
                >
                  다시 테스트하기
                </Button>
              )}
              
              <Button
                variant="primary"
                size="lg"
                onClick={() => router.push('/assessments')}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                <Brain className="w-5 h-5 mr-2" />
                다른 진단 보기
              </Button>
            </div>
            
            <p className="text-xs md:text-sm text-[var(--color-text-tertiary)] max-w-md mx-auto leading-relaxed">
              💡 다른 진단도 완료하면 더 정확한 분석을 받을 수 있어요!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}