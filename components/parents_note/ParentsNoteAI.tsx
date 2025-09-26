'use client';

import { useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import OnboardingQuestionnaire from './OnboardingQuestionnaire';
import CustomEducationGuide from './CustomEducationGuide';
import WeeklyCheck from './WeeklyCheck';

interface DiagnosisResult {
  diagnosis: {
    mainIssues: string[];
    strengths: string[];
    priorityAreas: string[];
    overallAssessment: string;
  };
  customGuide: {
    title: string;
    summary: string;
    todayAction: {
      title: string;
      steps: string[];
    };
    weeklyPlan: {
      title: string;
      goals: string[];
      dailyRoutine: string;
    };
    conversationScripts: {
      title: string;
      scenarios: {
        situation: string;
        parentScript: string;
        expectedResponse: string;
        followUp: string;
      }[];
    };
    environmentChecklist: {
      title: string;
      items: {
        item: string;
        status: 'check' | 'warning' | 'error';
        description: string;
      }[];
    };
  };
  weeklyTracking: {
    metrics: string[];
    questions: string[];
  };
}

export default function ParentsNoteAI() {
  const { data: session } = useSession();
  const [appState, setAppState] = useState<'main' | 'onboarding' | 'guide' | 'weekly'>('main');
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleOnboardingComplete = async (data: any) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/influencers/parents_note/diagnosis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      
      if (result.success) {
        setDiagnosisResult(result.data);
        setAppState('guide');
      } else {
        alert('진단 처리 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('진단 오류:', error);
      alert('진단 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartWeeklyTracking = () => {
    setAppState('weekly');
  };

  const handleBackToMain = () => {
    setAppState('main');
  };

  // 로딩 화면
  if (isLoading) {
    return (
      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">AI가 분석 중입니다...</h2>
          <p className="text-gray-600 dark:text-gray-300">잠시만 기다려주세요!</p>
        </div>
      </Card>
    );
  }

  // 로그인 필요
  if (!session) {
    return (
      <Card className="p-8 text-center" glass={false}>
        <div className="space-y-4">
          <span className="text-6xl">🔒</span>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
            로그인이 필요합니다
          </h2>
          <p className="text-[var(--color-text-secondary)]">
          부모노트의 무료 AI 학습 도구를 이용하려면 먼저 로그인해주세요.
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

  // 온보딩 설문
  if (appState === 'onboarding') {
    return <OnboardingQuestionnaire onComplete={handleOnboardingComplete} onBackToMain={handleBackToMain} />;
  }

  // 맞춤형 교육 가이드
  if (appState === 'guide' && diagnosisResult) {
    return (
      <CustomEducationGuide 
        diagnosisResult={diagnosisResult}
        onStartWeeklyTracking={handleStartWeeklyTracking}
        onBackToMain={handleBackToMain}
      />
    );
  }

  // 주간 체크
  if (appState === 'weekly') {
    return <WeeklyCheck onBack={handleBackToMain} />;
  }

  // 메인 화면
  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <Card className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/50 dark:to-purple-900/50 border-pink-200 dark:border-pink-500/30">
        <div className="p-6 text-center">
          <div className="mb-4">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
              <span className="text-3xl">👨‍👩‍👧‍👦</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            학부모 맞춤 교육법 진단 AI
          </h2>
          <p className="text-gray-700 dark:text-pink-100 max-w-2xl mx-auto mb-4">
            우리 아이의 학습 습관과 환경을 분석하여<br />
            <span className="font-semibold text-purple-600 dark:text-purple-300">맞춤형 교육 전략</span>을 제공합니다
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="success" size="sm" className="bg-green-100 dark:bg-green-600 text-green-800 dark:text-white border border-green-200 dark:border-green-500">
              AI 진단
            </Badge>
            <Badge variant="primary" size="sm" className="bg-blue-100 dark:bg-blue-600 text-blue-800 dark:text-white border border-blue-200 dark:border-blue-500">
              맞춤 가이드
            </Badge>
            <Badge variant="warning" size="sm" className="bg-yellow-100 dark:bg-yellow-600 text-yellow-800 dark:text-white border border-yellow-200 dark:border-yellow-500">
              주간 추적
            </Badge>
          </div>
        </div>
      </Card>

      {/* 주요 기능 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 학습 습관 진단 */}
        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
          <div className="p-6">
            <div className="text-center mb-4">
              <div className="w-12 h-12 mx-auto bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full flex items-center justify-center mb-3">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">학습 습관 진단</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                아이의 집중력, 학습 환경, 성격을 분석하여 맞춤형 진단을 제공합니다
              </p>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-600/20 text-blue-700 dark:text-blue-300 text-xs rounded-full">집중력 분석</span>
              <span className="px-2 py-1 bg-cyan-100 dark:bg-cyan-600/20 text-cyan-700 dark:text-cyan-300 text-xs rounded-full">환경 평가</span>
              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-600/20 text-purple-700 dark:text-purple-300 text-xs rounded-full">성격 분석</span>
            </div>
            <Button 
              onClick={() => setAppState('onboarding')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              진단 시작하기
            </Button>
          </div>
        </Card>

        {/* 맞춤 교육 가이드 */}
        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
          <div className="p-6">
            <div className="text-center mb-4">
              <div className="w-12 h-12 mx-auto bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center mb-3">
                <span className="text-2xl">📋</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">맞춤 교육 가이드</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                진단 결과를 바탕으로 오늘부터 실행할 수 있는 구체적인 교육법을 제시합니다
              </p>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-2 py-1 bg-green-100 dark:bg-green-600/20 text-green-700 dark:text-green-300 text-xs rounded-full">실행 가이드</span>
              <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 text-xs rounded-full">대화 스크립트</span>
              <span className="px-2 py-1 bg-teal-100 dark:bg-teal-600/20 text-teal-700 dark:text-teal-300 text-xs rounded-full">환경 체크</span>
            </div>
            <Button 
              onClick={() => diagnosisResult ? setAppState('guide') : setAppState('onboarding')}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              {diagnosisResult ? '가이드 보기' : '먼저 진단하기'}
            </Button>
          </div>
        </Card>

        {/* 주간 추적 시스템 */}
        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
          <div className="p-6">
            <div className="text-center mb-4">
              <div className="w-12 h-12 mx-auto bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-full flex items-center justify-center mb-3">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">주간 추적 시스템</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                매주 아이의 변화를 체크하고 AI가 맞춤형 피드백과 다음 주 계획을 제공합니다
              </p>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-2 py-1 bg-orange-100 dark:bg-orange-600/20 text-orange-700 dark:text-orange-300 text-xs rounded-full">주간 리포트</span>
              <span className="px-2 py-1 bg-red-100 dark:bg-red-600/20 text-red-700 dark:text-red-300 text-xs rounded-full">피드백</span>
              <span className="px-2 py-1 bg-pink-100 dark:bg-pink-600/20 text-pink-700 dark:text-pink-300 text-xs rounded-full">계획 수정</span>
            </div>
            <Button 
              onClick={() => setAppState('weekly')}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
            >
              주간 체크하기
            </Button>
          </div>
        </Card>
      </div>

      {/* 기능 소개 */}
      <Card className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 text-center">
            🎯 학부모 맞춤 교육법의 특별한 기능들
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-10 h-10 mx-auto bg-blue-100 dark:bg-blue-600 rounded-full flex items-center justify-center mb-2">
                <span className="text-lg">🤖</span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">AI 진단</h3>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                아이의 특성을 정확히 파악하여 맞춤형 분석 제공
              </p>
            </div>

            <div className="text-center">
              <div className="w-10 h-10 mx-auto bg-green-100 dark:bg-green-600 rounded-full flex items-center justify-center mb-2">
                <span className="text-lg">⚡</span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">즉시 실행</h3>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                오늘부터 바로 적용할 수 있는 구체적인 실행 방법
              </p>
            </div>

            <div className="text-center">
              <div className="w-10 h-10 mx-auto bg-purple-100 dark:bg-purple-600 rounded-full flex items-center justify-center mb-2">
                <span className="text-lg">💬</span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">대화 가이드</h3>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                상황별 부모-자녀 대화 스크립트와 팁 제공
              </p>
            </div>

            <div className="text-center">
              <div className="w-10 h-10 mx-auto bg-orange-100 dark:bg-orange-600 rounded-full flex items-center justify-center mb-2">
                <span className="text-lg">📈</span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">지속 추적</h3>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                주간별 변화 추적과 맞춤형 피드백 제공
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
