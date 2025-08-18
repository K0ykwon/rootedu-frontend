export interface AdaptationQuestion {
  id: string;
  question: string;
  type: 'scale' | 'multiple_choice';
  options?: Array<{ id: string; text: string; score?: number }>;
  intent: string;
}

export interface AdaptationAnswer {
  questionId: string;
  score: number;
}

export interface AdaptationResult {
  overallScore: number;
  category: 'excellent' | 'good' | 'moderate' | 'needs_support' | 'high_risk';
  strengths: string[];
  challenges: string[];
  recommendations: string[];
  burnoutRisk: 'low' | 'moderate' | 'high';
  adaptationAreas: {
    academic: number;
    social: number;
    independence: number;
    mentalHealth: number;
  };
}

export interface CollegeAdaptationAnalysis {
  id: string;
  userId: string;
  answers: AdaptationAnswer[];
  result: AdaptationResult;
  createdAt: string;
  updatedAt: string;
}

export const ADAPTATION_QUESTIONS: AdaptationQuestion[] = [
  {
    id: 'academic_confidence',
    question: '대학 수준의 학업을 따라갈 수 있을까 걱정됩니다',
    type: 'scale',
    options: [
      { id: '1', text: '전혀 걱정 안 됨', score: 5 },
      { id: '2', text: '별로 걱정 안 됨', score: 4 },
      { id: '3', text: '보통', score: 3 },
      { id: '4', text: '조금 걱정됨', score: 2 },
      { id: '5', text: '매우 걱정됨', score: 1 }
    ],
    intent: '학업 적응도 예측'
  },
  {
    id: 'social_skills',
    question: '새로운 사람들과 친해지는 것이 어렵게 느껴집니다',
    type: 'scale',
    options: [
      { id: '1', text: '전혀 그렇지 않음', score: 5 },
      { id: '2', text: '그렇지 않음', score: 4 },
      { id: '3', text: '보통', score: 3 },
      { id: '4', text: '그런 편', score: 2 },
      { id: '5', text: '매우 그럼', score: 1 }
    ],
    intent: '사회성 평가'
  },
  {
    id: 'independence',
    question: '부모님 없이 혼자 생활하는 것에 대해 어떻게 생각하나요?',
    type: 'multiple_choice',
    options: [
      { id: 'excited', text: '기대되고 자신 있어요', score: 5 },
      { id: 'ready', text: '준비됐다고 생각해요', score: 4 },
      { id: 'worried', text: '조금 걱정되지만 할 수 있을 것 같아요', score: 3 },
      { id: 'anxious', text: '많이 불안해요', score: 2 },
      { id: 'unprepared', text: '전혀 준비가 안 됐어요', score: 1 }
    ],
    intent: '독립성 수준 파악'
  },
  {
    id: 'time_management',
    question: '현재 시간 관리를 얼마나 잘하고 있나요?',
    type: 'scale',
    options: [
      { id: '1', text: '매우 잘함', score: 5 },
      { id: '2', text: '잘하는 편', score: 4 },
      { id: '3', text: '보통', score: 3 },
      { id: '4', text: '못하는 편', score: 2 },
      { id: '5', text: '매우 못함', score: 1 }
    ],
    intent: '자기관리 능력 평가'
  },
  {
    id: 'stress_management',
    question: '스트레스를 받을 때 어떻게 대처하나요?',
    type: 'multiple_choice',
    options: [
      { id: 'healthy', text: '운동, 취미활동 등 건강한 방법으로 해소', score: 5 },
      { id: 'talk', text: '친구나 가족과 대화로 풀어요', score: 4 },
      { id: 'alone', text: '혼자 참고 견뎌요', score: 2 },
      { id: 'avoid', text: '회피하거나 미루는 편이에요', score: 1 },
      { id: 'mixed', text: '상황에 따라 달라요', score: 3 }
    ],
    intent: '스트레스 대처 능력'
  },
  {
    id: 'goal_clarity',
    question: '대학에서 이루고 싶은 목표가 명확한가요?',
    type: 'scale',
    options: [
      { id: '1', text: '매우 명확함', score: 5 },
      { id: '2', text: '명확한 편', score: 4 },
      { id: '3', text: '어느 정도 있음', score: 3 },
      { id: '4', text: '막연함', score: 2 },
      { id: '5', text: '전혀 없음', score: 1 }
    ],
    intent: '목표 의식 평가'
  },
  {
    id: 'financial_awareness',
    question: '용돈/생활비 관리를 얼마나 잘 할 수 있을까요?',
    type: 'scale',
    options: [
      { id: '1', text: '매우 자신 있음', score: 5 },
      { id: '2', text: '자신 있음', score: 4 },
      { id: '3', text: '보통', score: 3 },
      { id: '4', text: '자신 없음', score: 2 },
      { id: '5', text: '전혀 자신 없음', score: 1 }
    ],
    intent: '경제 관념 평가'
  },
  {
    id: 'burnout_risk',
    question: '지금도 가끔 번아웃을 느끼나요?',
    type: 'scale',
    options: [
      { id: '1', text: '전혀 없음', score: 5 },
      { id: '2', text: '거의 없음', score: 4 },
      { id: '3', text: '가끔', score: 3 },
      { id: '4', text: '자주', score: 2 },
      { id: '5', text: '항상', score: 1 }
    ],
    intent: '번아웃 위험도 측정'
  },
  {
    id: 'help_seeking',
    question: '어려움이 있을 때 도움을 요청하는 편인가요?',
    type: 'multiple_choice',
    options: [
      { id: 'always', text: '적극적으로 도움을 요청해요', score: 5 },
      { id: 'sometimes', text: '필요할 때는 요청해요', score: 4 },
      { id: 'reluctant', text: '정말 급할 때만 요청해요', score: 3 },
      { id: 'rarely', text: '거의 요청하지 않아요', score: 2 },
      { id: 'never', text: '절대 요청하지 않아요', score: 1 }
    ],
    intent: '도움 요청 성향'
  },
  {
    id: 'expectation_reality',
    question: '대학 생활에 대한 기대가 어떤가요?',
    type: 'multiple_choice',
    options: [
      { id: 'realistic', text: '현실적인 기대를 가지고 있어요', score: 5 },
      { id: 'optimistic', text: '긍정적이지만 현실도 알아요', score: 4 },
      { id: 'uncertain', text: '잘 모르겠어요', score: 3 },
      { id: 'overly_optimistic', text: '매우 환상적인 기대만 있어요', score: 2 },
      { id: 'pessimistic', text: '부정적인 생각이 많아요', score: 1 }
    ],
    intent: '기대치 현실성'
  }
];