'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Brain, 
  Target, 
  GraduationCap, 
  Calendar,
  ArrowRight,
  Clock,
  Award,
  CheckCircle,
  ChevronRight
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';

interface AssessmentCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  duration: string;
  questions: number;
  category: string;
  path: string;
  benefits: string[];
  isCompleted?: boolean;
  lastResult?: string;
}

const assessments: AssessmentCard[] = [
  {
    id: 'study-type',
    title: '공부 유형 진단',
    description: '나만의 학습 스타일을 발견하고 맞춤형 공부 전략을 받아보세요',
    icon: <Brain className="w-6 h-6" />,
    duration: '3-4분',
    questions: 10,
    category: '학습 진단',
    path: '/assessments/study-type',
    benefits: [
      'AI 정밀 분석으로 8가지 공부 유형 중 최적 유형 발견',
      '맞춤형 학습 전략 및 구체적인 공부 방법 제시',
      '강점 활용 및 약점 보완 방법 안내'
    ]
  },
  {
    id: 'career-activities',
    title: '생기부 활동 추천',
    description: '진로에 맞는 맞춤형 생기부 활동을 추천받아보세요',
    icon: <Target className="w-6 h-6" />,
    duration: '3-5분',
    questions: 9,
    category: '진로 계획',
    path: '/assessments/career-activities',
    benefits: [
      '희망 진로에 최적화된 활동 추천',
      '구체적인 활동 예시와 실행 방법 제공',
      '생기부 작성 팁과 성공 전략 안내'
    ]
  },
  {
    id: 'college-adaptation',
    title: '대학생활 적응도',
    description: '대학생활 준비도를 점검하고 성공적인 적응 전략을 세워보세요',
    icon: <GraduationCap className="w-6 h-6" />,
    duration: '3-5분',
    questions: 10,
    category: '대학 준비',
    path: '/assessments/college-adaptation',
    benefits: [
      '학업, 사회성, 독립성, 정신건강 종합 평가',
      '영역별 적응도 분석 및 개선 방안',
      '번아웃 위험도 측정 및 예방 전략'
    ]
  },
  {
    id: 'vacation-planner',
    title: '방학 계획 설정',
    description: '효과적인 방학 계획을 세우고 목표를 달성해보세요',
    icon: <Calendar className="w-6 h-6" />,
    duration: '3-5분',
    questions: 8,
    category: '목표 설정',
    path: '/assessments/vacation-planner',
    benefits: [
      '개인 맞춤형 주간 계획 자동 생성',
      '현실적이고 달성 가능한 목표 설정',
      '체크포인트와 동기부여 전략 제공'
    ]
  }
];

export default function AssessmentsPage() {
  const router = useRouter();
  const [completedAssessments, setCompletedAssessments] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Load completed assessments from localStorage
    const saved = localStorage.getItem('completedAssessments');
    if (saved) {
      setCompletedAssessments(new Set(JSON.parse(saved)));
    }
  }, []);

  const handleAssessmentClick = (path: string) => {
    router.push(path);
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--color-text-primary)] mb-2">
            진단평가 센터
          </h1>
          <p className="text-sm sm:text-base text-[var(--color-text-secondary)]">
            AI 기반 맞춤형 진단으로 당신의 학습 전략을 설계하세요
          </p>
        </div>

        {/* Notice */}
        <Alert variant="info" className="mb-6 sm:mb-8 text-sm sm:text-base">
          <strong>안내:</strong> 모든 진단평가는 무료로 제공됩니다. 
          더 자세한 분석과 1:1 컨설팅을 원하시면 멘토링 서비스를 이용해보세요.
        </Alert>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-[var(--color-text-primary)]">4개</div>
            <div className="text-sm text-[var(--color-text-secondary)]">진단 종류</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-[var(--color-text-primary)]">5분</div>
            <div className="text-sm text-[var(--color-text-secondary)]">평균 시간</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-[var(--color-text-primary)]">95%</div>
            <div className="text-sm text-[var(--color-text-secondary)]">정확도</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-[var(--color-text-primary)]">10K+</div>
            <div className="text-sm text-[var(--color-text-secondary)]">이용자</div>
          </Card>
        </div>

        {/* Assessment Cards */}
        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
          {assessments.map((assessment) => (
            <Card 
              key={assessment.id}
              className="hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
              onClick={() => handleAssessmentClick(assessment.path)}
            >
              <div className="p-4 sm:p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-[var(--color-bg-tertiary)] flex items-center justify-center text-[var(--color-primary)]">
                      {assessment.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-1">
                        {assessment.title}
                      </h3>
                      <Badge variant="default" className="text-xs">
                        {assessment.category}
                      </Badge>
                    </div>
                  </div>
                  {completedAssessments.has(assessment.id) && (
                    <Badge variant="success" className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      완료
                    </Badge>
                  )}
                </div>

                {/* Description */}
                <p className="text-[var(--color-text-secondary)] mb-4">
                  {assessment.description}
                </p>

                {/* Benefits */}
                <div className="space-y-2 mb-4">
                  {assessment.benefits.map((benefit, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-[var(--color-success)] mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-[var(--color-text-secondary)]">{benefit}</span>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border-primary)]">
                  <div className="flex items-center gap-4 text-sm text-[var(--color-text-secondary)]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {assessment.duration}
                    </span>
                    <span>
                      {assessment.questions}문항
                    </span>
                  </div>
                  
                  <Button variant="primary" size="sm" className="flex items-center gap-1">
                    시작하기
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <Card className="mt-8 p-8 text-center bg-[var(--color-bg-secondary)]">
          <Award className="w-12 h-12 text-[var(--color-primary)] mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-2">
            모든 진단을 완료하고 종합 리포트를 받아보세요
          </h2>
          <p className="text-[var(--color-text-secondary)] mb-6">
            4가지 진단을 모두 완료하면 AI가 분석한 종합적인 성장 로드맵을 제공해드립니다
          </p>
          <div className="flex items-center justify-center gap-4">
            <Badge variant="default">100% 무료</Badge>
            <Badge variant="default">회원가입 필요</Badge>
          </div>
        </Card>
      </div>
    </div>
  );
}