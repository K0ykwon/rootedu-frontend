'use client';

import { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

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

interface CustomEducationGuideProps {
  diagnosisResult: DiagnosisResult;
  onStartWeeklyTracking: () => void;
  onBackToMain: () => void;
}

export default function CustomEducationGuide({ diagnosisResult, onStartWeeklyTracking, onBackToMain }: CustomEducationGuideProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'today' | 'weekly' | 'conversation' | 'environment'>('overview');

  const tabs = [
    { id: 'overview', label: '진단 결과', icon: '📊' },
    { id: 'today', label: '오늘의 실행', icon: '⚡' },
    { id: 'weekly', label: '주간 계획', icon: '📅' },
    { id: 'conversation', label: '대화 스크립트', icon: '💬' },
    { id: 'environment', label: '환경 체크', icon: '🏠' }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'check': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '📝';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'check': return 'text-green-600 dark:text-green-400';
      case 'warning': return 'text-yellow-600 dark:text-yellow-400';
      case 'error': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/50 dark:to-blue-900/50 border-purple-200 dark:border-purple-500/30">
        <div className="p-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {diagnosisResult.customGuide.title}
          </h2>
          <p className="text-gray-700 dark:text-purple-100">
            {diagnosisResult.customGuide.summary}
          </p>
        </div>
      </Card>

      {/* 탭 네비게이션 */}
      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
        <div className="p-4">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* 탭 컨텐츠 */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 종합 평가 */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/50 dark:to-indigo-900/50 border-blue-200 dark:border-blue-500/30">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span>📊</span>
                종합 평가
              </h3>
              <p className="text-gray-700 dark:text-blue-100 leading-relaxed">
                {diagnosisResult.diagnosis.overallAssessment}
              </p>
            </div>
          </Card>

          {/* 주요 문제점 */}
          {diagnosisResult.diagnosis.mainIssues.length > 0 && (
            <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <span>⚠️</span>
                  주요 문제점
                </h3>
                <div className="space-y-2">
                  {diagnosisResult.diagnosis.mainIssues.map((issue, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <span className="text-red-500 mt-1">•</span>
                      <span className="text-gray-700 dark:text-gray-300">{issue}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* 자녀의 강점 */}
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span>💪</span>
                자녀의 강점
              </h3>
              <div className="space-y-2">
                {diagnosisResult.diagnosis.strengths.map((strength, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <span className="text-green-500 mt-1">•</span>
                    <span className="text-gray-700 dark:text-gray-300">{strength}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* 우선 개선 영역 */}
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span>🎯</span>
                우선 개선 영역
              </h3>
              <div className="flex flex-wrap gap-2">
                {diagnosisResult.diagnosis.priorityAreas.map((area, index) => (
                  <Badge key={index} variant="primary" size="sm">
                    {area}
                  </Badge>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'today' && (
        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span>⚡</span>
              {diagnosisResult.customGuide.todayAction.title}
            </h3>
            <div className="space-y-4">
              {diagnosisResult.customGuide.todayAction.steps.map((step, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </span>
                  <span className="text-gray-700 dark:text-gray-300">{step}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-green-700 dark:text-green-300 text-sm">
                💡 <strong>팁:</strong> 작은 변화부터 시작해서 점진적으로 습관을 만들어가세요. 완벽하지 않아도 괜찮습니다!
              </p>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'weekly' && (
        <div className="space-y-6">
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span>📅</span>
                {diagnosisResult.customGuide.weeklyPlan.title}
              </h3>
              
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">이번 주 목표</h4>
                <div className="space-y-2">
                  {diagnosisResult.customGuide.weeklyPlan.goals.map((goal, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <span className="text-blue-500 mt-1">🎯</span>
                      <span className="text-gray-700 dark:text-gray-300">{goal}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">일일 루틴</h4>
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-gray-700 dark:text-gray-300">
                    {diagnosisResult.customGuide.weeklyPlan.dailyRoutine}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span>📊</span>
                주간 추적 지표
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">추적할 지표</h4>
                  <ul className="space-y-1">
                    {diagnosisResult.weeklyTracking.metrics.map((metric, index) => (
                      <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                        <span>📈</span>
                        {metric}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">체크 질문</h4>
                  <ul className="space-y-1">
                    {diagnosisResult.weeklyTracking.questions.map((question, index) => (
                      <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                        <span>❓</span>
                        {question}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'conversation' && (
        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span>💬</span>
              {diagnosisResult.customGuide.conversationScripts.title}
            </h3>
            <div className="space-y-6">
              {diagnosisResult.customGuide.conversationScripts.scenarios.map((scenario, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                    상황 {index + 1}: {scenario.situation}
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                      <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-1">부모가 할 말:</h5>
                      <p className="text-blue-800 dark:text-blue-200">"{scenario.parentScript}"</p>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                      <h5 className="font-medium text-gray-900 dark:text-white mb-1">자녀 예상 반응:</h5>
                      <p className="text-gray-700 dark:text-gray-300">"{scenario.expectedResponse}"</p>
                    </div>
                    
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                      <h5 className="font-medium text-green-900 dark:text-green-100 mb-1">후속 대화:</h5>
                      <p className="text-green-800 dark:text-green-200">"{scenario.followUp}"</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'environment' && (
        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span>🏠</span>
              {diagnosisResult.customGuide.environmentChecklist.title}
            </h3>
            <div className="space-y-3">
              {diagnosisResult.customGuide.environmentChecklist.items.map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                  <span className="text-lg">{getStatusIcon(item.status)}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900 dark:text-white">{item.item}</span>
                      <span className={`text-sm ${getStatusColor(item.status)}`}>
                        {item.status === 'check' ? '완료' : item.status === 'warning' ? '주의' : '개선 필요'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* 액션 버튼 */}
      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
        <div className="p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            이제 주간 추적을 시작해보세요!
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            매주 자녀의 변화를 체크하고 AI가 맞춤형 피드백을 제공해드립니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={onBackToMain}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              메인으로 돌아가기
            </Button>
            <Button
              onClick={onStartWeeklyTracking}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
            >
              주간 추적 시작하기
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
