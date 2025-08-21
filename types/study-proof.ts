// 공부 인증 관련 타입 정의

export interface StudySession {
  id: string;
  userId: string;
  startTime: number;
  endTime?: number;
  duration: number; // minutes
  subject: StudySubject;
  goal: string;
  location?: string; // 도서관, 독서실, 카페, 집 등
  isActive: boolean;
  focusScore: number; // 집중도 점수 (0-100)
  breaks: number; // 휴식 횟수
}

export interface StudyProof {
  id: string;
  userId: string;
  sessionId: string;
  photo?: string; // 인증샷 URL
  description: string;
  subjects: StudySubject[];
  studyHours: number;
  location: string;
  mood: StudyMood;
  achievements: Achievement[];
  likes: string[]; // userId array
  cheers: Cheer[];
  createdAt: number;
  tags: string[];
  isPublic: boolean;
  studyMethod: StudyMethod;
}

export interface Cheer {
  id: string;
  userId: string;
  userName: string;
  message: string;
  emoji: string;
  createdAt: number;
}

export interface DailyStudyStats {
  userId: string;
  date: string; // YYYY-MM-DD
  totalMinutes: number;
  subjects: SubjectStats[];
  focusScore: number;
  streakDays: number;
  rank?: number;
  achievements: Achievement[];
}

export interface SubjectStats {
  subject: StudySubject;
  minutes: number;
  sessions: number;
  averageFocusScore: number;
}

export interface StudyStreak {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string;
  totalDays: number;
  freezeTokens: number; // 스트릭 보호권
}

export interface StudyBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: BadgeTier;
  requirement: BadgeRequirement;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: number;
}

export interface BadgeRequirement {
  type: 'streak' | 'hours' | 'subject' | 'special';
  value: number;
  subject?: StudySubject;
  condition?: string;
}

export interface StudyChallenge {
  id: string;
  title: string;
  description: string;
  startDate: number;
  endDate: number;
  type: ChallengeType;
  goal: ChallengeGoal;
  participants: string[];
  winners?: string[];
  rewards: Reward[];
  isActive: boolean;
}

export interface ChallengeGoal {
  type: 'hours' | 'streak' | 'subject' | 'focus';
  target: number;
  subject?: StudySubject;
}

export interface Reward {
  type: 'badge' | 'points' | 'title' | 'item';
  value: string | number;
  description: string;
}

export interface StudyRanking {
  daily: RankingEntry[];
  weekly: RankingEntry[];
  monthly: RankingEntry[];
  allTime: RankingEntry[];
}

export interface RankingEntry {
  rank: number;
  userId: string;
  userName: string;
  userAvatar: string;
  school?: string;
  grade?: string;
  totalMinutes: number;
  streakDays: number;
  level: number;
  badges: string[]; // badge IDs
}

// Enums
export enum StudySubject {
  KOREAN = '국어',
  MATH = '수학',
  ENGLISH = '영어',
  KOREAN_HISTORY = '한국사',
  SOCIAL = '사회탐구',
  SCIENCE = '과학탐구',
  SECOND_LANGUAGE = '제2외국어',
  OTHER = '기타'
}

export enum StudyMood {
  FOCUSED = '집중됨',
  MOTIVATED = '의욕충만',
  TIRED = '피곤함',
  STRESSED = '스트레스',
  RELAXED = '편안함',
  DETERMINED = '결연함'
}

export enum StudyMethod {
  TEXTBOOK = '교과서',
  WORKBOOK = '문제집',
  ONLINE_LECTURE = '인강',
  ACADEMY = '학원',
  SELF_STUDY = '자습',
  GROUP_STUDY = '그룹스터디',
  TUTORING = '과외'
}

export enum BadgeTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
  DIAMOND = 'diamond'
}

export enum ChallengeType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  SPECIAL = 'special'
}

export interface Achievement {
  id: string;
  type: 'first_study' | 'early_bird' | 'night_owl' | 'marathon' | 'perfect_week' | 'subject_master';
  name: string;
  description: string;
  icon: string;
  unlockedAt: number;
}

export interface UserStudyProfile {
  userId: string;
  level: number;
  exp: number;
  nextLevelExp: number;
  title: string; // 칭호
  badges: StudyBadge[];
  totalStudyMinutes: number;
  averageDailyMinutes: number;
  favoriteSubject: StudySubject;
  favoriteStudyTime: 'morning' | 'afternoon' | 'evening' | 'night';
  studyStyle: 'sprinter' | 'marathoner' | 'balanced';
  school?: string;
  grade?: string;
  targetUniversity?: string;
  motto?: string;
}