'use client';

import { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

interface WeeklyData {
  homeworkProcrastination: number;
  averageConcentrationTime: number;
  praiseCount: number;
  feedbackCount: number;
  studyEnvironmentScore: number;
  moodScore: number;
  completedGoals: string[];
  challenges: string[];
}

interface WeeklyReport {
  weeklyReport: {
    overallScore: number;
    improvementAreas: string[];
    challenges: string[];
    achievements: string[];
    summary: string;
  };
  nextWeekPlan: {
    focusAreas: string[];
    goals: string[];
    dailyRoutine: string;
    parentActions: string[];
  };
  recommendations: {
    category: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }[];
  conversationTopics: {
    topic: string;
    opening: string;
    keyPoints: string[];
  }[];
  celebrationIdeas: string[];
}

interface WeeklyCheckProps {
  onBack: () => void;
}

export default function WeeklyCheck({ onBack }: WeeklyCheckProps) {
  const [currentStep, setCurrentStep] = useState<'input' | 'report'>('input');
  const [isLoading, setIsLoading] = useState(false);
  const [weeklyData, setWeeklyData] = useState<WeeklyData>({
    homeworkProcrastination: 0,
    averageConcentrationTime: 0,
    praiseCount: 0,
    feedbackCount: 0,
    studyEnvironmentScore: 5,
    moodScore: 5,
    completedGoals: [],
    challenges: []
  });
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null);

  const goalOptions = [
    '숙제를 제시간에 완료했다',
    '집중 시간이 늘었다',
    '학습 계획을 잘 지켰다',
    '부모와 대화를 많이 했다',
    '학습 환경을 개선했다',
    '스트레스를 잘 관리했다',
    '새로운 학습 방법을 시도했다',
    '시험 준비를 체계적으로 했다'
  ];

  const challengeOptions = [
    '숙제를 자주 미뤘다',
    '집중력이 부족했다',
    '학습 계획을 지키지 못했다',
    '부모와 갈등이 있었다',
    '학습 환경이 방해가 되었다',
    '스트레스가 많았다',
    '학습 방법이 맞지 않았다',
    '시험 불안이 심했다'
  ];

  const toggleGoal = (goal: string) => {
    setWeeklyData(prev => ({
      ...prev,
      completedGoals: prev.completedGoals.includes(goal)
        ? prev.completedGoals.filter(g => g !== goal)
        : [...prev.completedGoals, goal]
    }));
  };

  const toggleChallenge = (challenge: string) => {
    setWeeklyData(prev => ({
      ...prev,
      challenges: prev.challenges.includes(challenge)
        ? prev.challenges.filter(c => c !== challenge)
        : [...prev.challenges, challenge]
    }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/influencers/parents_note/weekly-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId: 'current-child', // 실제로는 사용자 ID나 자녀 ID를 사용
          weekData: weeklyData
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setWeeklyReport(result.data);
        setCurrentStep('report');
      } else {
        alert('주간 체크 처리 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('주간 체크 오류:', error);
      alert('주간 체크 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 dark:text-red-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'low': return 'text-green-600 dark:text-green-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  if (currentStep === 'input') {
    return (
      <div className="space-y-6">
        <Card className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/50 dark:to-blue-900/50 border-green-200 dark:border-green-500/30">
          <div className="p-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              📊 주간 학습 체크
            </h2>
            <p className="text-gray-700 dark:text-green-100">
              이번 주 자녀의 학습 상황을 체크해보세요
            </p>
          </div>
        </Card>

        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">이번 주 데이터 입력</h3>
            
            <div className="space-y-6">
              {/* 기본 지표 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    숙제 미루기 횟수 (이번 주)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={weeklyData.homeworkProcrastination}
                    onChange={(e) => setWeeklyData(prev => ({
                      ...prev,
                      homeworkProcrastination: parseInt(e.target.value) || 0
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    평균 집중 시간 (분)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="180"
                    value={weeklyData.averageConcentrationTime}
                    onChange={(e) => setWeeklyData(prev => ({
                      ...prev,
                      averageConcentrationTime: parseInt(e.target.value) || 0
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    칭찬 횟수 (이번 주)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={weeklyData.praiseCount}
                    onChange={(e) => setWeeklyData(prev => ({
                      ...prev,
                      praiseCount: parseInt(e.target.value) || 0
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    피드백 횟수 (이번 주)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={weeklyData.feedbackCount}
                    onChange={(e) => setWeeklyData(prev => ({
                      ...prev,
                      feedbackCount: parseInt(e.target.value) || 0
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* 점수 평가 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    학습 환경 점수 (1-10)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={weeklyData.studyEnvironmentScore}
                      onChange={(e) => setWeeklyData(prev => ({
                        ...prev,
                        studyEnvironmentScore: parseInt(e.target.value)
                      }))}
                      className="flex-1"
                    />
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400 w-8">
                      {weeklyData.studyEnvironmentScore}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    자녀 기분 점수 (1-10)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={weeklyData.moodScore}
                      onChange={(e) => setWeeklyData(prev => ({
                        ...prev,
                        moodScore: parseInt(e.target.value)
                      }))}
                      className="flex-1"
                    />
                    <span className="text-lg font-bold text-green-600 dark:text-green-400 w-8">
                      {weeklyData.moodScore}
                    </span>
                  </div>
                </div>
              </div>

              {/* 완료된 목표 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  이번 주 완료된 목표들
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {goalOptions.map((goal) => (
                    <button
                      key={goal}
                      onClick={() => toggleGoal(goal)}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        weeklyData.completedGoals.includes(goal)
                          ? 'border-green-500 bg-green-500/20 text-green-700 dark:text-green-300'
                          : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {goal}
                    </button>
                  ))}
                </div>
              </div>

              {/* 겪은 어려움 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  이번 주 겪은 어려움들
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {challengeOptions.map((challenge) => (
                    <button
                      key={challenge}
                      onClick={() => toggleChallenge(challenge)}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        weeklyData.challenges.includes(challenge)
                          ? 'border-red-500 bg-red-500/20 text-red-700 dark:text-red-300'
                          : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {challenge}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <Button
                onClick={onBack}
                className="bg-gray-600 hover:bg-gray-700 text-white"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
                메인으로
              </Button>
              
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
              >
                {isLoading ? '분석 중...' : '주간 리포트 생성'}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (currentStep === 'report' && weeklyReport) {
    return (
      <div className="space-y-6">
        {/* 주간 리포트 헤더 */}
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/50 dark:to-purple-900/50 border-blue-200 dark:border-blue-500/30">
          <div className="p-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              📊 주간 학습 리포트
            </h2>
            <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              {weeklyReport.weeklyReport.overallScore}점
            </div>
            <p className="text-gray-700 dark:text-blue-100">
              {weeklyReport.weeklyReport.summary}
            </p>
          </div>
        </Card>

        {/* 개선 영역과 성과 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span>📈</span>
                개선된 영역
              </h3>
              <div className="space-y-2">
                {weeklyReport.weeklyReport.improvementAreas.map((area, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <span className="text-green-500 mt-1">✓</span>
                    <span className="text-gray-700 dark:text-gray-300">{area}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span>🏆</span>
                이번 주 성과
              </h3>
              <div className="space-y-2">
                {weeklyReport.weeklyReport.achievements.map((achievement, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <span className="text-blue-500 mt-1">🎉</span>
                    <span className="text-gray-700 dark:text-gray-300">{achievement}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* 다음 주 계획 */}
        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span>📅</span>
              다음 주 계획
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">집중 영역</h4>
                <div className="space-y-2">
                  {weeklyReport.nextWeekPlan.focusAreas.map((area, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <span className="text-yellow-500 mt-1">🎯</span>
                      <span className="text-gray-700 dark:text-gray-300">{area}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">학부모 행동</h4>
                <div className="space-y-2">
                  {weeklyReport.nextWeekPlan.parentActions.map((action, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <span className="text-purple-500 mt-1">👨‍👩‍👧‍👦</span>
                      <span className="text-gray-700 dark:text-gray-300">{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">일일 루틴</h4>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-gray-700 dark:text-gray-300">
                  {weeklyReport.nextWeekPlan.dailyRoutine}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* 추천사항 */}
        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span>💡</span>
              맞춤 추천사항
            </h3>
            <div className="space-y-4">
              {weeklyReport.recommendations.map((rec, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">{rec.title}</h4>
                    <div className="flex items-center gap-1">
                      <span>{getPriorityIcon(rec.priority)}</span>
                      <span className={`text-sm ${getPriorityColor(rec.priority)}`}>
                        {rec.priority === 'high' ? '높음' : rec.priority === 'medium' ? '보통' : '낮음'}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{rec.category}</p>
                  <p className="text-gray-700 dark:text-gray-300">{rec.description}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* 대화 주제 */}
        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span>💬</span>
              이번 주 대화 주제
            </h3>
            <div className="space-y-4">
              {weeklyReport.conversationTopics.map((topic, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{topic.topic}</h4>
                  <p className="text-gray-700 dark:text-gray-300 mb-3">"{topic.opening}"</p>
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-white mb-2">핵심 포인트:</h5>
                    <ul className="space-y-1">
                      {topic.keyPoints.map((point, pointIndex) => (
                        <li key={pointIndex} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                          <span>•</span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* 축하 아이디어 */}
        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span>🎉</span>
              축하 아이디어
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {weeklyReport.celebrationIdeas.map((idea, index) => (
                <div key={index} className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-gray-700 dark:text-gray-300">{idea}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* 액션 버튼 */}
        <div className="flex justify-center gap-4">
          <Button
            onClick={() => setCurrentStep('input')}
            className="bg-gray-600 hover:bg-gray-700 text-white"
          >
            다시 체크하기
          </Button>
          <Button
            onClick={onBack}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            메인으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
