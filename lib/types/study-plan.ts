// Study Plan Type Definitions

// 개별 과목 계획
export interface SubjectPlan {
  id: string;                    // 고유 ID
  subject: string;                // 과목명
  content: string;                // 학습 내용
  startTime: string;              // 시작 시간 (HH:mm)
  endTime: string;                // 종료 시간 (HH:mm)
  completed: boolean;             // 완료 여부
  reflection?: string;            // 회고 내용
}

// 일일 학습 계획
export interface DailyStudyPlan {
  id: string;                     // 계획 ID (UUID)
  userId: string;                 // 사용자 ID
  date: string;                   // 날짜 (YYYY-MM-DD)
  totalStartTime: string;         // 전체 시작 시간
  totalEndTime: string;           // 전체 종료 시간
  motivationalQuote?: string;     // 동기부여 문구
  plans: SubjectPlan[];           // 과목별 계획 배열
  createdAt: string;              // 생성 시간 (ISO 8601)
  updatedAt: string;              // 수정 시간 (ISO 8601)
}

// 채팅 세션 상태
export type ChatStep =
  | 'time_range'
  | 'subjects'
  | 'subject_details'
  | 'time_allocation'
  | 'motivational_quote'
  | 'generating'
  | 'completed';

export interface TimeRange {
  start: string;  // HH:mm format in 24h
  end: string;    // HH:mm format in 24h
}

export interface ChatResponses {
  timeRanges?: TimeRange[];  // Changed to array to support multiple time ranges
  subjects?: string[];
  subjectDetails?: { subject: string; content: string }[];
  timeAllocation?: { subject: string; duration: number }[];
  motivationalQuote?: string;
}

export interface ChatSessionState {
  sessionId: string;
  userId: string;
  step: ChatStep;
  responses: ChatResponses;
  createdAt: string;
  updatedAt: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CreatePlanRequest {
  responses: ChatResponses;
}

export interface UpdateSubjectRequest {
  startTime?: string;
  endTime?: string;
  content?: string;
  completed?: boolean;
}

export interface CreateSubjectRequest {
  subject: string;
  content: string;
  startTime: string;
  endTime: string;
  completed?: boolean;
}

export interface AddReflectionRequest {
  reflection: string;
}

export interface ChatMessageRequest {
  sessionId: string;
  message: string;
}

export interface ChatInitResponse {
  sessionId: string;
  question: string;
  step: ChatStep;
}

export interface ChatMessageResponse {
  question?: string;
  step: ChatStep;
  isComplete: boolean;
  plan?: DailyStudyPlan;
}

// History and Statistics Response Types
export interface PlanHistoryResponse {
  plans: DailyStudyPlan[];
  totalCount: number;
  hasMore: boolean;
}

export interface PlanStatistics {
  totalPlans: number;
  completedSubjects: number;
  totalSubjects: number;
  averageCompletionRate: number;
  totalStudyHours: number;
  studyStreak: number;
  mostStudiedSubjects: { subject: string; count: number }[];
}

export interface HistoryFilters {
  startDate?: string;
  endDate?: string;
  completed?: boolean;
  subjects?: string[];
}

// Reflection Types
export interface ReflectionMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ReflectionSession {
  id: string;
  planId: string;
  userId: string;
  messages: ReflectionMessage[];
  turnCount: number;
  isComplete: boolean;
  report?: ReflectionReport;
  createdAt: string;
  updatedAt: string;
}

export interface ReflectionReport {
  strengths: string[];      // 잘한 점 3가지
  improvements: string[];   // 개선할 점 2가지
  tomorrowPlan: string;    // 내일 학습 제안
  motivation: string;      // 동기부여 메시지
  overallScore: number;    // 전체 평가 점수 (1-10)
}

// Reflection API Request/Response Types
export interface InitializeReflectionRequest {
  planId: string;
}

export interface InitializeReflectionResponse {
  sessionId: string;
  message: string;
}

export interface ReflectionMessageRequest {
  sessionId: string;
  message: string;
}

export interface ReflectionMessageResponse {
  content?: string;
  isComplete?: boolean;
  report?: ReflectionReport;
  turnCount?: number;
}

export interface ReflectionCompleteRequest {
  sessionId: string;
}

export interface ReflectionCompleteResponse {
  report: ReflectionReport;
  turnCount: number;
  isComplete: boolean;
}