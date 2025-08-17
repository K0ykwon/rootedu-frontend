// Study Type Assessment Types
export interface QuizQuestion {
  id: string;
  type: 'multiple_choice' | 'essay';
  question: string;
  intent: string;
  options?: {
    id: string;
    text: string;
    value: string;
  }[];
}

export interface QuizAnswer {
  questionId: string;
  answer: string;
  selectedOption?: string;
}

export interface StudyType {
  id: string;
  name: string;
  description: string;
  characteristics: string[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface QuizAnalysis {
  studyType: StudyType;
  reasoning: string;
  confidence: number;
  dimensionScores: {
    timeManagement: number;
    socialLearning: number;
    informationProcessing: number;
    perfectionism: number;
    motivation: number;
    stressResponse: number;
    goalOrientation: number;
    learningDepth: number;
  };
}

export interface QuizResult {
  id: string;
  userId: string;
  answers: QuizAnswer[];
  analysis: QuizAnalysis;
  completedAt: string;
  createdAt: string;
}

// Career Activities Types
export interface CareerQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'essay' | 'multi_select';
  options?: Array<{ id: string; text: string; description?: string }>;
  intent: string;
  maxLength?: number;
}

export interface CareerActivity {
  title: string;
  description: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  impact: 'high' | 'medium' | 'low';
  timeRequired: string;
  skills: string[];
  examples: string[];
  tips: string[];
}

export interface CareerAnswer {
  questionId: string;
  answer: string;
  selectedOptions?: string[];
}

// College Adaptation Types
export interface AdaptationQuestion {
  id: string;
  question: string;
  type: 'scale' | 'multiple_choice';
  options?: Array<{ id: string; text: string; score?: number }>;
  intent: string;
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

// Vacation Planner Types
export interface VacationQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'essay' | 'multi_select';
  options?: { id: string; text: string }[];
  intent: string;
}

export interface VacationAnswer {
  questionId: string;
  answer: string;
  selectedOptions?: string[];
}

export interface WeeklyGoal {
  week: number;
  theme: string;
  goals: string[];
  checkpoints: string[];
}

export interface VacationPlan {
  weeklyGoals: WeeklyGoal[];
  overallStrategy: string;
  motivationalQuote: string;
  expectedOutcomes: string[];
  tips: string[];
  shareableImageUrl?: string;
}

// Study Types Data
export const STUDY_TYPES: StudyType[] = [
  {
    id: 'focused_marathoner',
    name: '집중형 마라토너',
    description: '긴 시간 혼자 공부하며 깊이 있는 탐구를 선호하는 유형',
    characteristics: ['8-12시간 연속 공부', '조용한 환경 선호', '체계적 노트 정리', '완벽주의 성향'],
    strengths: ['높은 집중력', '지속력', '깊이 있는 이해', '자기주도학습'],
    weaknesses: ['번아웃 위험', '사회성 부족', '효율성 저하', '융통성 부족'],
    recommendations: ['정기적 휴식 필수', '그룹 스터디 참여', '운동 및 취미 활동', '효율적 학습법 도입']
  },
  {
    id: 'strategic_sprinter',
    name: '스프린터형 전략가',
    description: '짧고 강렬한 집중으로 효율성을 추구하는 유형',
    characteristics: ['2-3시간 집중 후 휴식', '핵심 위주 학습', '우선순위 설정', '시간 관리 탁월'],
    strengths: ['높은 효율성', '시간 관리', '우선순위 파악', '스트레스 관리'],
    weaknesses: ['깊이 부족', '지속력 한계', '완성도 아쉬움', '복합 문제 해결 어려움'],
    recommendations: ['심화 학습 시간 확보', '장기 프로젝트 도전', '인내력 기르기', '기초 실력 보강']
  },
  {
    id: 'social_studier',
    name: '사회형 스터디러',
    description: '그룹 스터디와 협력 학습을 선호하는 유형',
    characteristics: ['친구들과 함께 공부', '토론 학습 선호', '서로 가르치며 학습', '협력적 문제해결'],
    strengths: ['의사소통 능력', '동기부여', '다양한 관점', '리더십 발휘'],
    weaknesses: ['혼자 있을 때 집중력 저하', '의존성', '진도 차이', '산만함'],
    recommendations: ['개인 학습 시간 확보', '자기주도성 기르기', '집중력 훈련', '독립적 문제해결 연습']
  },
  {
    id: 'perfectionist_detailer',
    name: '완벽주의 세밀러',
    description: '모든 것을 완벽하게 이해하고 관리하려는 꼼꼼한 유형',
    characteristics: ['반복 학습', '오답노트 철저 관리', '세부사항 중시', '높은 완성도 추구'],
    strengths: ['정확성', '체계성', '꼼꼼함', '오류 발견 능력'],
    weaknesses: ['진도 지연', '높은 스트레스', '효율성 부족', '융통성 부족'],
    recommendations: ['시간 제한 학습', '80% 완성도 목표', '큰 그림 보기', '스트레스 관리법']
  },
  {
    id: 'intuitive_connector',
    name: '직관형 연결러',
    description: '개념 간 연결과 전체적 이해를 선호하는 유형',
    characteristics: ['마인드맵 활용', '전체 구조 파악', '패턴 인식', '창의적 연결'],
    strengths: ['창의적 사고', '통합적 이해', '빠른 학습', '응용력'],
    weaknesses: ['세부사항 놓침', '기초 부실', '체계성 부족', '암기 약함'],
    recommendations: ['기초 다지기', '세부 정리 노트', '암기법 활용', '체계적 복습']
  },
  {
    id: 'practical_applicator',
    name: '실용형 적용러',
    description: '실생활 연결과 문제 해결 중심 학습을 선호하는 유형',
    characteristics: ['실습 위주', '프로젝트 학습', '현실 적용', '실용성 중시'],
    strengths: ['문제해결력', '실무 능력', '적응력', '창업가 정신'],
    weaknesses: ['이론 약함', '기초 학문 어려움', '추상적 사고 부족', '학문적 깊이 부족'],
    recommendations: ['이론 학습 보강', '기초 개념 정리', '추상적 사고 훈련', '학문적 접근 연습']
  },
  {
    id: 'emotional_motivator',
    name: '감정형 동기부여러',
    description: '감정과 동기에 따라 학습 패턴이 변화하는 유형',
    characteristics: ['기분에 따른 학습', '관심 분야 집중', '동기부여 중요', '감정적 연결'],
    strengths: ['열정', '몰입도', '공감 능력', '예술적 감각'],
    weaknesses: ['일관성 부족', '계획 실행 어려움', '객관성 부족', '감정 기복'],
    recommendations: ['루틴 만들기', '목표 시각화', '감정 관리법', '작은 성취 축하']
  },
  {
    id: 'balanced_allrounder',
    name: '균형형 올라운더',
    description: '다양한 방법을 혼합하여 상황에 따라 적응하는 유형',
    characteristics: ['유연한 학습', '상황별 전략', '균형잡힌 접근', '다재다능'],
    strengths: ['적응력', '균형감', '다양한 역량', '위기관리'],
    weaknesses: ['특출난 강점 부족', '정체성 혼란', '깊이 부족', '우선순위 설정 어려움'],
    recommendations: ['핵심 역량 개발', '전문성 강화', '우선순위 명확화', '강점 특화']
  }
];

// Quiz Questions Data
export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'time_management',
    type: 'multiple_choice',
    question: '하루 중 가장 집중이 잘 되는 시간대는 언제인가요?',
    intent: '생체리듬과 집중력 패턴 파악',
    options: [
      { id: 'A', text: '새벽 (4-7시)', value: 'early_morning' },
      { id: 'B', text: '아침 (7-12시)', value: 'morning' },
      { id: 'C', text: '오후 (12-18시)', value: 'afternoon' },
      { id: 'D', text: '저녁/밤 (18-24시)', value: 'evening' },
      { id: 'E', text: '심야 (24-4시)', value: 'late_night' }
    ]
  },
  {
    id: 'social_learning',
    type: 'multiple_choice',
    question: '공부할 때 선호하는 환경은?',
    intent: '사회적 학습 선호도 측정',
    options: [
      { id: 'A', text: '완전히 혼자 조용한 곳', value: 'alone_quiet' },
      { id: 'B', text: '카페나 도서관 같은 적당한 소음이 있는 곳', value: 'moderate_noise' },
      { id: 'C', text: '친구들과 함께 스터디 그룹', value: 'study_group' },
      { id: 'D', text: '온라인으로 함께 공부 (화상 스터디)', value: 'online_together' },
      { id: 'E', text: '상황에 따라 다름', value: 'flexible' }
    ]
  },
  {
    id: 'information_processing',
    type: 'multiple_choice',
    question: '새로운 개념을 학습할 때 가장 효과적인 방법은?',
    intent: '정보 처리 방식 분석',
    options: [
      { id: 'A', text: '교과서를 처음부터 끝까지 정독', value: 'sequential' },
      { id: 'B', text: '핵심 개념만 빠르게 파악 후 문제 풀이', value: 'practical' },
      { id: 'C', text: '마인드맵이나 도표로 전체 구조 파악', value: 'visual' },
      { id: 'D', text: '유튜브나 인강으로 설명 듣기', value: 'auditory' },
      { id: 'E', text: '친구에게 설명하거나 토론하며 이해', value: 'interactive' }
    ]
  },
  {
    id: 'perfectionism',
    type: 'multiple_choice',
    question: '문제를 틀렸을 때 주로 어떻게 대처하나요?',
    intent: '완벽주의 성향과 실패 대처 방식',
    options: [
      { id: 'A', text: '완벽하게 이해할 때까지 반복 학습', value: 'perfectionist' },
      { id: 'B', text: '핵심만 파악하고 넘어감', value: 'efficient' },
      { id: 'C', text: '오답노트에 정리 후 주기적 복습', value: 'systematic' },
      { id: 'D', text: '비슷한 유형 문제를 추가로 풀어봄', value: 'practice_oriented' },
      { id: 'E', text: '스트레스 받아서 잠시 쉬었다가 다시 봄', value: 'emotional' }
    ]
  },
  {
    id: 'motivation',
    type: 'multiple_choice',
    question: '공부하는 가장 큰 이유는 무엇인가요?',
    intent: '내재적/외재적 동기 파악',
    options: [
      { id: 'A', text: '지적 호기심과 성장의 즐거움', value: 'intrinsic' },
      { id: 'B', text: '좋은 대학/직장을 위해', value: 'extrinsic_goal' },
      { id: 'C', text: '부모님과 주변의 기대', value: 'extrinsic_social' },
      { id: 'D', text: '경쟁에서 이기고 싶어서', value: 'competitive' },
      { id: 'E', text: '미래의 꿈을 이루기 위해', value: 'dream_driven' }
    ]
  },
  {
    id: 'stress_response',
    type: 'multiple_choice',
    question: '시험 기간 스트레스를 어떻게 관리하나요?',
    intent: '스트레스 대처 메커니즘',
    options: [
      { id: 'A', text: '운동이나 명상으로 해소', value: 'healthy_coping' },
      { id: 'B', text: '더 열심히 공부에 몰입', value: 'work_harder' },
      { id: 'C', text: '친구들과 수다나 게임', value: 'social_relief' },
      { id: 'D', text: '혼자 음악 듣거나 영상 시청', value: 'passive_escape' },
      { id: 'E', text: '특별히 관리하지 않음', value: 'no_management' }
    ]
  },
  {
    id: 'goal_orientation',
    type: 'multiple_choice',
    question: '목표를 세울 때 어떤 스타일인가요?',
    intent: '목표 설정 방식과 실행력',
    options: [
      { id: 'A', text: '구체적이고 세부적인 계획 수립', value: 'detailed_planner' },
      { id: 'B', text: '큰 방향만 정하고 유연하게 진행', value: 'flexible_direction' },
      { id: 'C', text: '단기 목표 위주로 설정', value: 'short_term' },
      { id: 'D', text: '장기적 비전 중심', value: 'long_term' },
      { id: 'E', text: '목표 설정을 잘 하지 않음', value: 'spontaneous' }
    ]
  },
  {
    id: 'learning_depth',
    type: 'multiple_choice',
    question: '어떤 방식으로 공부하는 것을 선호하나요?',
    intent: '학습 깊이와 폭의 선호도',
    options: [
      { id: 'A', text: '한 과목을 완벽하게 마스터', value: 'deep_single' },
      { id: 'B', text: '여러 과목을 골고루', value: 'broad_multiple' },
      { id: 'C', text: '관심 있는 것만 깊게', value: 'interest_driven' },
      { id: 'D', text: '시험에 나오는 것 위주로', value: 'exam_focused' },
      { id: 'E', text: '그때그때 필요한 것', value: 'need_based' }
    ]
  },
  {
    id: 'essay_challenge',
    type: 'essay',
    question: '공부하면서 가장 힘든 점과 그것을 극복하려는 나만의 방법이 있다면 설명해주세요.',
    intent: '개인적 학습 도전과제와 대처 전략 파악'
  },
  {
    id: 'essay_ideal',
    type: 'essay',
    question: '당신이 생각하는 이상적인 공부 환경과 하루 일과를 자유롭게 설명해주세요.',
    intent: '이상적 학습 환경과 루틴 파악'
  }
];