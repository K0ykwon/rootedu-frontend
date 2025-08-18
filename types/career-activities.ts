export interface CareerQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'essay' | 'ranking';
  options?: Array<{ id: string; text: string; description?: string }>;
  intent: string;
  maxLength?: number;
}

export interface CareerAnswer {
  questionId: string;
  answer: string | string[];
  selectedOptions?: string[];
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

export interface CareerActivitiesResult {
  id: string;
  userId: string;
  answers: CareerAnswer[];
  activities: CareerActivity[];
  createdAt: string;
  updatedAt: string;
}

export const CAREER_QUESTIONS: CareerQuestion[] = [
  {
    id: 'desired_career',
    question: '희망하는 진로 분야를 선택해주세요',
    type: 'multiple_choice',
    options: [
      { id: 'medicine', text: '의학/보건', description: '의사, 간호사, 약사, 생명공학자' },
      { id: 'engineering', text: '공학/IT', description: '개발자, 데이터분석가, 로봇공학자' },
      { id: 'business', text: '경영/경제', description: '경영컨설턴트, 회계사, 금융전문가' },
      { id: 'education', text: '교육/연구', description: '교사, 교수, 연구원' },
      { id: 'media', text: '미디어/예술', description: 'PD, 디자이너, 작가, 아티스트' },
      { id: 'law', text: '법/행정', description: '변호사, 판사, 공무원' },
      { id: 'science', text: '자연과학', description: '물리학자, 화학자, 생물학자' },
      { id: 'social', text: '사회과학', description: '심리학자, 사회학자, 정치학자' }
    ],
    intent: '진로에 맞는 활동을 추천하기 위해'
  },
  {
    id: 'current_grade',
    question: '현재 학년을 알려주세요',
    type: 'multiple_choice',
    options: [
      { id: 'high1', text: '고등학교 1학년' },
      { id: 'high2', text: '고등학교 2학년' },
      { id: 'high3', text: '고등학교 3학년' },
      { id: 'middle3', text: '중학교 3학년' }
    ],
    intent: '학년별 맞춤 활동을 제안하기 위해'
  },
  {
    id: 'current_activities',
    question: '현재까지 가장 열심히 한 활동 분야는?',
    type: 'multiple_choice',
    options: [
      { id: 'academic', text: '📚 학술/연구 활동' },
      { id: 'volunteer', text: '❤️ 봉사활동' },
      { id: 'club', text: '🏃 동아리/클럽 활동' },
      { id: 'competition', text: '🏆 대회/공모전' },
      { id: 'arts', text: '🎨 예술/문화 활동' },
      { id: 'sports', text: '⚽ 체육/스포츠' },
      { id: 'none', text: '😅 아직 특별히 없음' },
      { id: 'other', text: '✏️ 기타' }
    ],
    intent: '기존 활동과 연계된 심화 활동을 추천하기 위해'
  },
  {
    id: 'strengths',
    question: '자신의 강점이나 관심사를 선택해주세요 (최대 3개)',
    type: 'multiple_choice',
    options: [
      { id: 'leadership', text: '리더십' },
      { id: 'creativity', text: '창의성' },
      { id: 'analysis', text: '분석력' },
      { id: 'communication', text: '소통능력' },
      { id: 'technology', text: '기술활용' },
      { id: 'research', text: '연구능력' },
      { id: 'service', text: '봉사정신' },
      { id: 'global', text: '글로벌역량' }
    ],
    intent: '강점을 살릴 수 있는 활동을 추천하기 위해'
  },
  {
    id: 'activity_preference',
    question: '선호하는 활동 유형을 선택해주세요',
    type: 'multiple_choice',
    options: [
      { id: 'individual', text: '개인 프로젝트', description: '독립적인 연구나 창작 활동' },
      { id: 'team', text: '팀 프로젝트', description: '협업과 팀워크 중심 활동' },
      { id: 'competition', text: '대회/공모전', description: '경쟁을 통한 성장' },
      { id: 'volunteer', text: '봉사/사회공헌', description: '사회에 기여하는 활동' }
    ],
    intent: '성향에 맞는 활동 형태를 추천하기 위해'
  },
  {
    id: 'time_availability',
    question: '주당 활동 가능 시간은 어느 정도인가요?',
    type: 'multiple_choice',
    options: [
      { id: 'less5', text: '5시간 미만' },
      { id: '5to10', text: '5-10시간' },
      { id: '10to15', text: '10-15시간' },
      { id: 'more15', text: '15시간 이상' }
    ],
    intent: '실현 가능한 활동 계획을 수립하기 위해'
  },
  {
    id: 'achievement_goals',
    question: '생기부를 통해 가장 보여주고 싶은 역량은?',
    type: 'multiple_choice',
    options: [
      { id: 'leadership', text: '👑 리더십과 책임감' },
      { id: 'academic', text: '🎓 학업 우수성' },
      { id: 'creativity', text: '💡 창의성과 혁신' },
      { id: 'social', text: '🤝 사회 기여와 봉사정신' },
      { id: 'expertise', text: '🔬 전공 전문성' },
      { id: 'global', text: '🌍 글로벌 역량' },
      { id: 'consistency', text: '⏰ 꾸준함과 성실성' },
      { id: 'other', text: '✏️ 기타' }
    ],
    intent: '목표에 맞는 전략적 활동을 추천하기 위해'
  },
  {
    id: 'challenges',
    question: '생기부 활동에서 겪는 어려움이 있다면?',
    type: 'multiple_choice',
    options: [
      { id: 'ideas', text: '활동 아이디어 부족' },
      { id: 'time', text: '시간 부족' },
      { id: 'resources', text: '자원/정보 부족' },
      { id: 'guidance', text: '멘토링 부족' },
      { id: 'none', text: '특별한 어려움 없음' }
    ],
    intent: '맞춤형 해결책을 제시하기 위해'
  },
  {
    id: 'additional_info',
    question: '추가로 알려주실 내용이 있나요? (선택사항)',
    type: 'essay',
    intent: '더 정확한 맞춤형 추천을 위해',
    maxLength: 300
  }
];