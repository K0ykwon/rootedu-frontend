'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  Target, ChevronRight, ChevronLeft, BookOpen, 
  CheckCircle, AlertCircle, Sparkles, TrendingUp,
  Award, Brain, Users, Heart, Share2
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import AuthModal from '@/components/auth/AuthModal';
import { useAuth } from '@/hooks/useAuth';
import { 
  CAREER_QUESTIONS, 
  CareerAnswer, 
  CareerActivity,
  CareerActivitiesResult 
} from '@/types/career-activities';

export default function CareerActivitiesPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { requireAuth, showAuthModal, closeAuthModal } = useAuth();
  
  // Quiz state
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [otherInputs, setOtherInputs] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activities, setActivities] = useState<CareerActivity[] | null>(null);
  const [existingResult, setExistingResult] = useState<CareerActivitiesResult | null>(null);
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
      const response = await fetch('/api/career-activities');
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
    setSelectedOptions([]);
    setOtherInputs({});
    setActivities(null);
    setSubmitError(null);
    setIsStarted(true);
  };

  const handleAnswer = (answer: any) => {
    const currentQuestion = CAREER_QUESTIONS[currentStep];
    
    if (currentQuestion.id === 'strengths') {
      // Handle multiple selection for strengths
      const newSelectedOptions = selectedOptions.includes(answer)
        ? selectedOptions.filter(opt => opt !== answer)
        : [...selectedOptions, answer].slice(0, 3);
      
      setSelectedOptions(newSelectedOptions);
      setAnswers({
        ...answers,
        [currentQuestion.id]: newSelectedOptions
      });
    } else {
      // Single selection
      setAnswers({
        ...answers,
        [currentQuestion.id]: answer
      });
      
      if (currentQuestion.type !== 'essay' && answer !== 'other') {
        handleNext();
      }
    }
  };

  const handleOtherInputChange = (value: string) => {
    const currentQuestion = CAREER_QUESTIONS[currentStep];
    setOtherInputs(prev => ({
      ...prev,
      [currentQuestion.id]: value
    }));
    
    if (answers[currentQuestion.id] === 'other') {
      setAnswers({
        ...answers,
        [currentQuestion.id]: `기타: ${value}`
      });
    }
  };

  const handleNext = () => {
    const currentQuestion = CAREER_QUESTIONS[currentStep];
    
    if (currentQuestion.type === 'essay' && currentQuestion.id !== 'additional_info' && !answers[currentQuestion.id]) {
      return;
    }
    
    if (currentStep < CAREER_QUESTIONS.length - 1) {
      setCurrentStep(prev => prev + 1);
      setSelectedOptions([]);
    } else {
      handleSubmitQuiz();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      const prevQuestion = CAREER_QUESTIONS[currentStep - 1];
      if (prevQuestion.id === 'strengths') {
        setSelectedOptions(answers['strengths'] || []);
      }
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
      const response = await fetch('/api/career-activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers: Object.entries(answers).map(([questionId, answer]) => ({
            questionId,
            answer: answer,
            selectedOptions: Array.isArray(answer) ? answer : undefined
          })),
          userId: session.user.id
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities);
      } else {
        const errorData = await response.json();
        setSubmitError(errorData.error || '활동 생성 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Submit error:', error);
      setSubmitError('네트워크 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCurrentQuestionAnswered = () => {
    if (currentStep >= CAREER_QUESTIONS.length) return true;
    const question = CAREER_QUESTIONS[currentStep];
    const answer = answers[question.id];
    
    if (question.id === 'strengths') {
      return selectedOptions.length > 0;
    }
    
    if (question.id === 'additional_info') {
      return true; // Optional question
    }
    
    if (answer === 'other') {
      return !!otherInputs[question.id];
    }
    
    return !!answer;
  };

  // Loading state
  if (isLoadingExisting) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-[var(--color-text-secondary)]">기존 결과 확인 중...</p>
        </div>
      </div>
    );
  }

  // Results view
  if (activities) {
    return <CareerActivitiesResultView activities={activities} onRetake={handleRetakeQuiz} />;
  }

  // Show existing results if available
  if (!isStarted && existingResult) {
    return <CareerActivitiesResultView 
      activities={existingResult.activities} 
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
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl mb-6 shadow-lg">
                <BookOpen className="w-10 h-10 text-white" />
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold text-[var(--color-text-primary)] mb-4">
                생기부 활동 추천
              </h1>
              
              <p className="text-xl text-[var(--color-text-secondary)] max-w-3xl mx-auto leading-relaxed">
                진로에 맞는 맞춤형 생기부 활동을 추천받아보세요
              </p>
            </div>

            {/* Features */}
            <div className="grid md:grid-cols-3 gap-6 mb-10">
              <Card className="p-6">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <Target className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">진로 맞춤</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  희망 진로에 최적화된 활동 추천
                </p>
              </Card>
              
              <Card className="p-6">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">실행 가이드</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  구체적인 활동 예시와 실행 방법 제공
                </p>
              </Card>
              
              <Card className="p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <Award className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">성공 전략</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  생기부 작성 팁과 성공 전략 안내
                </p>
              </Card>
            </div>

            {/* Quiz Info */}
            <Card className="p-6 mb-8 max-w-2xl mx-auto bg-gradient-to-r from-green-600 to-emerald-600 text-white">
              <h3 className="text-xl font-bold mb-3">진단 정보</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-semibold">질문 수</div>
                  <div>9개 문항</div>
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
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              진단 시작하기
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
  const currentQuestion = CAREER_QUESTIONS[currentStep];
  const progress = ((currentStep + 1) / CAREER_QUESTIONS.length) * 100;

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gray-700 z-50">
        <div 
          className="h-full bg-gradient-to-r from-green-600 to-emerald-600 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="container mx-auto px-4 py-6 md:py-8 pt-12 md:pt-16">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6 md:mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl mb-3 md:mb-4">
              <BookOpen className="w-7 h-7 md:w-8 md:h-8 text-white" />
            </div>
            <div className="text-sm text-[var(--color-text-tertiary)] mb-2">
              질문 {currentStep + 1} / {CAREER_QUESTIONS.length}
            </div>
            <div className="text-xs md:text-sm text-green-400 font-medium mb-3 md:mb-4 px-4">
              {currentQuestion.intent}
            </div>
          </div>

          {/* Question */}
          <Card className="p-4 md:p-8 mb-6 md:mb-8">
            <h2 className="text-lg md:text-2xl font-bold text-[var(--color-text-primary)] mb-6 md:mb-8 leading-relaxed">
              {currentQuestion.question}
            </h2>

            {currentQuestion.type === 'multiple_choice' ? (
              <div className={`${currentQuestion.id === 'strengths' ? 'space-y-3' : 'grid gap-3'} ${
                currentQuestion.options!.length > 4 ? 'md:grid-cols-2' : ''
              }`}>
                {currentQuestion.options?.map((option) => {
                  const isSelected = currentQuestion.id === 'strengths'
                    ? selectedOptions.includes(option.id)
                    : answers[currentQuestion.id] === option.id || 
                      (option.id === 'other' && typeof answers[currentQuestion.id] === 'string' && 
                       answers[currentQuestion.id]?.startsWith('기타:'));
                  
                  return (
                    <div key={option.id}>
                      <button
                        onClick={() => handleAnswer(option.id)}
                        className={`w-full text-left p-4 md:p-6 rounded-xl border-2 transition-all ${
                          isSelected
                            ? 'border-green-500 bg-green-900/20'
                            : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/50'
                        }`}
                      >
                        <div className="flex items-start md:items-center gap-3 md:gap-4">
                          <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 md:mt-0 ${
                            isSelected ? 'border-green-500 bg-green-500' : 'border-gray-600'
                          }`}>
                            {isSelected && <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-white" />}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-[var(--color-text-primary)] text-sm md:text-base leading-relaxed">
                              {option.text}
                            </div>
                            {option.description && (
                              <div className="text-sm text-[var(--color-text-secondary)] mt-1">
                                {option.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                      
                      {/* Other input field */}
                      {option.id === 'other' && (isSelected || (currentQuestion.id === 'strengths' && selectedOptions.includes('other'))) && (
                        <div className="mt-3 ml-6">
                          <input
                            type="text"
                            value={otherInputs[currentQuestion.id] || ''}
                            onChange={(e) => handleOtherInputChange(e.target.value)}
                            placeholder="직접 입력해주세요..."
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors placeholder-gray-500"
                            autoFocus
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div>
                <textarea
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswer(e.target.value)}
                  placeholder="답변을 입력해주세요... (선택사항)"
                  className="w-full h-32 p-4 bg-gray-800 border border-gray-700 text-white rounded-xl resize-none focus:border-green-500 focus:outline-none placeholder-gray-500"
                  maxLength={currentQuestion.maxLength}
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-sm text-[var(--color-text-tertiary)]">
                    {currentQuestion.id === 'additional_info' ? '선택사항' : '필수 입력'}
                  </p>
                  <p className="text-sm text-[var(--color-text-secondary)] font-medium">
                    {answers[currentQuestion.id]?.length || 0}/{currentQuestion.maxLength}
                  </p>
                </div>
              </div>
            )}

            {/* Special instruction for strengths question */}
            {currentQuestion.id === 'strengths' && (
              <p className="text-sm text-[var(--color-text-tertiary)] mt-4 text-center">
                최대 3개까지 선택 가능합니다 ({selectedOptions.length}/3)
              </p>
            )}
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

            {(currentQuestion.type === 'essay' || currentQuestion.id === 'strengths' || 
              answers[currentQuestion.id] === 'other' || 
              (typeof answers[currentQuestion.id] === 'string' && answers[currentQuestion.id]?.startsWith('기타:'))) && (
              <Button
                variant="primary"
                onClick={handleNext}
                disabled={!isCurrentQuestionAnswered() || isSubmitting}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin w-4 h-4 md:w-5 md:h-5 border-2 border-white border-t-transparent rounded-full mr-2" />
                    분석 중...
                  </>
                ) : currentStep === CAREER_QUESTIONS.length - 1 ? (
                  <>
                    결과 보기
                    <Sparkles className="w-4 h-4 md:w-5 md:h-5 ml-2" />
                  </>
                ) : (
                  <>
                    다음
                    <ChevronRight className="w-4 h-4 md:w-5 md:h-5 ml-2" />
                  </>
                )}
              </Button>
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
function CareerActivitiesResultView({ 
  activities, 
  showRetakeButton = false,
  onRetake 
}: { 
  activities: CareerActivity[];
  showRetakeButton?: boolean;
  onRetake?: () => void;
}) {
  const router = useRouter();

  const shareToInstagram = () => {
    const text = encodeURIComponent(
      `나만의 맞춤형 생기부 활동을 찾았어요! 🎯\n\n` +
      `@root._.education\n` +
      `#생기부 #진로활동 #대입준비 #맞춤추천`
    );
    window.open(`https://www.instagram.com/share?text=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] py-8 md:py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 md:mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl mb-4 md:mb-6 shadow-lg">
              <Target className="w-8 h-8 md:w-10 md:h-10 text-white" />
            </div>
            <h1 className="text-2xl md:text-4xl font-bold text-[var(--color-text-primary)] mb-2 md:mb-4">
              맞춤형 생기부 활동 추천 완료! 🎉
            </h1>
            <p className="text-lg md:text-xl text-[var(--color-text-secondary)]">
              진로에 최적화된 활동들을 준비했어요
            </p>
          </div>

          {/* Activity Cards */}
          <div className="space-y-6 mb-8">
            {activities.map((activity, index) => (
              <Card key={index} className="p-6 md:p-8">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="success">
                        {activity.category}
                      </Badge>
                      <Badge variant={
                        activity.impact === 'high' ? 'error' : 
                        activity.impact === 'medium' ? 'warning' : 'default'
                      }>
                        {activity.impact === 'high' ? '높은 임팩트' : 
                         activity.impact === 'medium' ? '중간 임팩트' : '기초 활동'}
                      </Badge>
                    </div>
                    <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
                      {activity.title}
                    </h3>
                    <p className="text-[var(--color-text-secondary)] mb-4">
                      {activity.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-[var(--color-text-tertiary)]">예상 소요시간</p>
                    <p className="font-medium text-[var(--color-text-primary)]">{activity.timeRequired}</p>
                  </div>
                </div>

                {/* Skills */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">개발 가능한 역량</p>
                  <div className="flex flex-wrap gap-2">
                    {activity.skills.map((skill, idx) => (
                      <Badge key={idx} variant="default" size="sm">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Examples */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">구체적인 예시</p>
                  <ul className="space-y-1">
                    {activity.examples.map((example, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-[var(--color-text-secondary)]">{example}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Tips */}
                <div className="bg-amber-900/20 border border-amber-800 rounded-lg p-4">
                  <p className="text-sm font-medium text-amber-400 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    성공 팁
                  </p>
                  <ul className="space-y-1">
                    {activity.tips.map((tip, idx) => (
                      <li key={idx} className="text-sm text-amber-300">
                        • {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            ))}
          </div>

          {/* Instagram Sharing */}
          <Card className="p-6 md:p-8 bg-gradient-to-r from-indigo-600 to-purple-600 text-white mb-6 md:mb-8">
            <div className="text-center">
              <div className="text-2xl md:text-3xl mb-3 md:mb-4">📸</div>
              <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">
                📱 인스타그램 공유 이벤트
              </h3>
              <p className="text-indigo-100 mb-4 md:mb-6 leading-relaxed text-sm md:text-base">
                이 결과 스크린샷을 인스타그램에 올리고 <span className="font-bold text-white">@root._.education</span>를 태그하면
                <br className="hidden md:block" />
                <span className="font-bold text-yellow-300">맞춤형 생기부 가이드북</span>을 무료로 드려요! 🎁
              </p>
              <Button 
                variant="secondary"
                onClick={shareToInstagram}
                className="bg-white text-indigo-600 hover:bg-gray-100"
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
                  다시 진단하기
                </Button>
              )}
              
              <Button
                variant="primary"
                size="lg"
                onClick={() => router.push('/assessments')}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
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