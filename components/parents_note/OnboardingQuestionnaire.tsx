'use client';

import { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

interface OnboardingData {
  childAge: number;
  studyHabits: {
    concentrationTime: number;
    smartphoneUsage: number;
    studyTime: number;
    procrastination: 'often' | 'sometimes' | 'rarely';
    studyEnvironment: 'good' | 'average' | 'poor';
  };
  personality: {
    activity: 'high' | 'medium' | 'low';
    independence: 'high' | 'medium' | 'low';
    social: 'high' | 'medium' | 'low';
    emotional: 'stable' | 'sensitive' | 'volatile';
  };
  familyEnvironment: {
    supportLevel: 'high' | 'medium' | 'low';
    communication: 'good' | 'average' | 'poor';
    rules: 'strict' | 'moderate' | 'loose';
    stressLevel: 'high' | 'medium' | 'low';
  };
  currentChallenges: string[];
}

interface OnboardingQuestionnaireProps {
  onComplete: (data: OnboardingData) => void;
  onBackToMain: () => void;
}

export default function OnboardingQuestionnaire({ onComplete, onBackToMain }: OnboardingQuestionnaireProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    childAge: 0,
    studyHabits: {
      concentrationTime: 0,
      smartphoneUsage: 0,
      studyTime: 0,
      procrastination: 'sometimes',
      studyEnvironment: 'average'
    },
    personality: {
      activity: 'medium',
      independence: 'medium',
      social: 'medium',
      emotional: 'stable'
    },
    familyEnvironment: {
      supportLevel: 'medium',
      communication: 'average',
      rules: 'moderate',
      stressLevel: 'medium'
    },
    currentChallenges: []
  });

  const steps = [
    {
      title: "기본 정보",
      component: BasicInfoStep
    },
    {
      title: "학습 습관",
      component: StudyHabitsStep
    },
    {
      title: "성격 특성",
      component: PersonalityStep
    },
    {
      title: "가정 환경",
      component: FamilyEnvironmentStep
    },
    {
      title: "현재 고민",
      component: ChallengesStep
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(data);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  function BasicInfoStep() {
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">기본 정보</h3>
          <p className="text-gray-600 dark:text-gray-300">자녀의 기본 정보를 알려주세요</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            자녀의 나이는?
          </label>
          <input
            type="number"
            min="5"
            max="18"
            value={data.childAge}
            onChange={(e) => updateData({ childAge: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="나이를 입력하세요"
          />
        </div>
      </div>
    );
  }

  function StudyHabitsStep() {
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">학습 습관</h3>
          <p className="text-gray-600 dark:text-gray-300">자녀의 학습 습관을 알려주세요</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            한 번에 집중할 수 있는 시간은?
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[15, 30, 45, 60, 90, 120].map((time) => (
              <button
                key={time}
                onClick={() => updateData({ 
                  studyHabits: { ...data.studyHabits, concentrationTime: time }
                })}
                className={`p-3 rounded-lg border-2 transition-all ${
                  data.studyHabits.concentrationTime === time
                    ? 'border-blue-500 bg-blue-500/20 text-blue-700 dark:text-blue-300'
                    : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {time}분
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            하루 스마트폰 사용 시간은?
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[0, 1, 2, 3, 4, 5, 6, 8].map((hours) => (
              <button
                key={hours}
                onClick={() => updateData({ 
                  studyHabits: { ...data.studyHabits, smartphoneUsage: hours }
                })}
                className={`p-3 rounded-lg border-2 transition-all ${
                  data.studyHabits.smartphoneUsage === hours
                    ? 'border-blue-500 bg-blue-500/20 text-blue-700 dark:text-blue-300'
                    : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {hours}시간
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            하루 공부 시간은?
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[0, 1, 2, 3, 4, 5, 6, 8].map((hours) => (
              <button
                key={hours}
                onClick={() => updateData({ 
                  studyHabits: { ...data.studyHabits, studyTime: hours }
                })}
                className={`p-3 rounded-lg border-2 transition-all ${
                  data.studyHabits.studyTime === hours
                    ? 'border-blue-500 bg-blue-500/20 text-blue-700 dark:text-blue-300'
                    : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {hours}시간
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            숙제를 미루는 빈도는?
          </label>
          <div className="space-y-2">
            {[
              { value: 'often', label: '자주 미룬다' },
              { value: 'sometimes', label: '가끔 미룬다' },
              { value: 'rarely', label: '거의 안 미룬다' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => updateData({ 
                  studyHabits: { ...data.studyHabits, procrastination: option.value as any }
                })}
                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                  data.studyHabits.procrastination === option.value
                    ? 'border-blue-500 bg-blue-500/20 text-blue-700 dark:text-blue-300'
                    : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            학습 환경은?
          </label>
          <div className="space-y-2">
            {[
              { value: 'good', label: '조용하고 정리된 환경' },
              { value: 'average', label: '보통 수준' },
              { value: 'poor', label: '개선이 필요함' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => updateData({ 
                  studyHabits: { ...data.studyHabits, studyEnvironment: option.value as any }
                })}
                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                  data.studyHabits.studyEnvironment === option.value
                    ? 'border-blue-500 bg-blue-500/20 text-blue-700 dark:text-blue-300'
                    : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function PersonalityStep() {
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">성격 특성</h3>
          <p className="text-gray-600 dark:text-gray-300">자녀의 성격을 알려주세요</p>
        </div>

        {[
          { key: 'activity', label: '활동성', options: [
            { value: 'high', label: '활발하고 에너지가 많다' },
            { value: 'medium', label: '보통 수준' },
            { value: 'low', label: '조용하고 차분하다' }
          ]},
          { key: 'independence', label: '독립성', options: [
            { value: 'high', label: '혼자서 잘한다' },
            { value: 'medium', label: '보통 수준' },
            { value: 'low', label: '도움이 필요하다' }
          ]},
          { key: 'social', label: '사회성', options: [
            { value: 'high', label: '사람들과 잘 어울린다' },
            { value: 'medium', label: '보통 수준' },
            { value: 'low', label: '조용한 편이다' }
          ]},
          { key: 'emotional', label: '감정 상태', options: [
            { value: 'stable', label: '안정적이다' },
            { value: 'sensitive', label: '민감한 편이다' },
            { value: 'volatile', label: '변동이 심하다' }
          ]}
        ].map((trait) => (
          <div key={trait.key}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {trait.label}
            </label>
            <div className="space-y-2">
              {trait.options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateData({ 
                    personality: { ...data.personality, [trait.key]: option.value as any }
                  })}
                  className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                    data.personality[trait.key as keyof typeof data.personality] === option.value
                      ? 'border-blue-500 bg-blue-500/20 text-blue-700 dark:text-blue-300'
                      : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  function FamilyEnvironmentStep() {
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">가정 환경</h3>
          <p className="text-gray-600 dark:text-gray-300">가정의 학습 환경을 알려주세요</p>
        </div>

        {[
          { key: 'supportLevel', label: '가족 지원 수준', options: [
            { value: 'high', label: '적극적으로 지원한다' },
            { value: 'medium', label: '보통 수준' },
            { value: 'low', label: '시간이 부족하다' }
          ]},
          { key: 'communication', label: '의사소통', options: [
            { value: 'good', label: '원활하게 대화한다' },
            { value: 'average', label: '보통 수준' },
            { value: 'poor', label: '대화가 부족하다' }
          ]},
          { key: 'rules', label: '규칙 수준', options: [
            { value: 'strict', label: '엄격한 편' },
            { value: 'moderate', label: '적당한 편' },
            { value: 'loose', label: '느슨한 편' }
          ]},
          { key: 'stressLevel', label: '가정 내 스트레스', options: [
            { value: 'high', label: '스트레스가 많다' },
            { value: 'medium', label: '보통 수준' },
            { value: 'low', label: '평온한 편' }
          ]}
        ].map((env) => (
          <div key={env.key}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {env.label}
            </label>
            <div className="space-y-2">
              {env.options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateData({ 
                    familyEnvironment: { ...data.familyEnvironment, [env.key]: option.value as any }
                  })}
                  className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                    data.familyEnvironment[env.key as keyof typeof data.familyEnvironment] === option.value
                      ? 'border-blue-500 bg-blue-500/20 text-blue-700 dark:text-blue-300'
                      : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  function ChallengesStep() {
    const challengeOptions = [
      '집중력이 부족해요',
      '숙제를 자꾸 미뤄요',
      '공부 시간이 부족해요',
      '학습 환경이 좋지 않아요',
      '동기부여가 어려워요',
      '스트레스 관리가 어려워요',
      '시간 관리가 안 돼요',
      '학습 계획을 세우기 어려워요',
      '시험 불안이 심해요',
      '학습 방법을 모르겠어요'
    ];

    const toggleChallenge = (challenge: string) => {
      const newChallenges = data.currentChallenges.includes(challenge)
        ? data.currentChallenges.filter(c => c !== challenge)
        : [...data.currentChallenges, challenge];
      updateData({ currentChallenges: newChallenges });
    };

    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">현재 고민</h3>
          <p className="text-gray-600 dark:text-gray-300">자녀와 관련해 현재 겪고 있는 문제들을 선택해주세요</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {challengeOptions.map((challenge) => (
            <button
              key={challenge}
              onClick={() => toggleChallenge(challenge)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                data.currentChallenges.includes(challenge)
                  ? 'border-red-500 bg-red-500/20 text-red-700 dark:text-red-300'
                  : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400'
              }`}
            >
              {challenge}
            </button>
          ))}
        </div>

        {data.currentChallenges.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">선택된 고민들:</h4>
            <div className="flex flex-wrap gap-2">
              {data.currentChallenges.map((challenge) => (
                <Badge key={challenge} variant="warning" size="sm">
                  {challenge}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
      <div className="p-6">
        {/* 진행 표시 */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>단계 {currentStep + 1} / {steps.length}</span>
            <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* 현재 단계 제목 */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          {steps[currentStep].title}
        </h2>

        {/* 현재 단계 컴포넌트 */}
        <CurrentStepComponent />

        {/* 네비게이션 버튼 */}
        <div className="flex justify-between mt-8">
          {currentStep === 0 ? (
            <Button
              onClick={onBackToMain}
              className="bg-gray-600 hover:bg-gray-700 text-white"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              메인으로
            </Button>
          ) : (
            <Button
              onClick={handlePrev}
              className="bg-gray-600 hover:bg-gray-700 text-white"
            >
              이전
            </Button>
          )}
          
          <Button
            onClick={handleNext}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {currentStep === steps.length - 1 ? '진단 시작' : '다음'}
          </Button>
        </div>
      </div>
    </Card>
  );
}
