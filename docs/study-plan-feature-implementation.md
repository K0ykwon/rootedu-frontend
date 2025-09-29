# AI 기반 학습 계획 생성 기능 구현 계획서

## 1. 기능 개요

### 1.1 핵심 기능
- **일일 학습 계획 자동 생성**: AI가 사용자와의 대화를 통해 맞춤형 학습 계획 수립
- **계획 관리 및 조정**: 생성된 계획을 조회, 수정, 완료 표시 가능
- **학습 회고 기록**: 각 과목별 학습 완료 후 회고 작성 기능

### 1.2 주요 특징
- OpenAI Structured Output을 활용한 정형화된 계획 생성
- Redis 기반 실시간 데이터 저장 및 조회
- 대화형 인터페이스를 통한 직관적인 사용자 경험

## 2. 기술 스택

### 2.1 기존 활용 기술
- **Frontend**: Next.js 15.4.6, React 19.1.0, TypeScript
- **Backend**: Next.js API Routes
- **Database**: Redis 5.8.1
- **Authentication**: NextAuth.js 4.24.11
- **AI**: OpenAI SDK 4.104.0
- **Styling**: Tailwind CSS v4
- **UI Components**: Framer Motion, Lucide React

### 2.2 추가 필요 라이브러리
- **Zod** (이미 설치됨): 스키마 검증 및 OpenAI Structured Output 정의

## 3. 데이터 모델

### 3.1 TypeScript 인터페이스 정의

```typescript
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
export interface ChatSessionState {
  step: 'time_range' | 'subjects' | 'subject_details' | 'time_allocation' | 'motivational_quote' | 'generating' | 'completed';
  responses: {
    timeRange?: { start: string; end: string };
    subjects?: string[];
    subjectDetails?: { subject: string; content: string }[];
    timeAllocation?: { subject: string; duration: number }[];
    motivationalQuote?: string;
  };
}
```

### 3.2 Redis 데이터 구조

```
# 사용자별 오늘의 계획 ID 매핑
plan:today:{userId}:{date} -> planId

# 계획 상세 정보 (Hash)
plan:{userId}:{planId} -> {
  id: planId,
  userId: userId,
  date: "2024-01-23",
  totalStartTime: "09:00",
  totalEndTime: "18:00",
  motivationalQuote: "오늘도 화이팅!",
  createdAt: "2024-01-23T00:00:00Z",
  updatedAt: "2024-01-23T00:00:00Z"
}

# 과목별 계획 리스트 (List of JSON)
plan:subjects:{userId}:{planId} -> [
  {
    "id": "sub1",
    "subject": "수학",
    "content": "미적분 3단원",
    "startTime": "09:00",
    "endTime": "11:00",
    "completed": false,
    "reflection": null
  },
  ...
]

# 채팅 세션 상태 (Hash)
chat:planner:{userId}:{sessionId} -> {
  step: "time_range",
  responses: "{ JSON 형태의 응답 데이터 }",
  createdAt: "2024-01-23T00:00:00Z"
}
```

## 4. API 엔드포인트 설계

### 4.1 계획 생성 관련

#### `POST /api/study-plan/chat/initialize`
- **목적**: 새 채팅 세션 초기화
- **인증**: 필수 (NextAuth)
- **응답**: 세션 ID, 첫 질문

#### `POST /api/study-plan/chat/message`
- **목적**: 사용자 응답 처리 및 다음 질문 생성
- **인증**: 필수
- **요청**:
  ```json
  {
    "sessionId": "string",
    "message": "string"
  }
  ```
- **응답**: 다음 질문 또는 생성된 계획

#### `POST /api/study-plan/generate`
- **목적**: 수집된 정보로 계획 생성 (OpenAI Structured Output 활용)
- **인증**: 필수
- **내부 호출용 (chat/message에서 자동 호출)

### 4.2 계획 조회 및 관리

#### `GET /api/study-plan/today`
- **목적**: 오늘의 학습 계획 조회
- **인증**: 필수
- **응답**: 오늘의 계획 또는 null

#### `GET /api/study-plan/{planId}`
- **목적**: 특정 계획 상세 조회
- **인증**: 필수

#### `PATCH /api/study-plan/{planId}/subjects/{subjectId}`
- **목적**: 과목별 계획 수정 (시간, 내용, 완료 상태)
- **인증**: 필수
- **요청**:
  ```json
  {
    "startTime": "10:00",
    "endTime": "12:00",
    "content": "수정된 내용",
    "completed": true
  }
  ```

#### `POST /api/study-plan/{planId}/subjects/{subjectId}/reflection`
- **목적**: 과목별 회고 추가
- **인증**: 필수
- **요청**:
  ```json
  {
    "reflection": "오늘 학습한 내용..."
  }
  ```

## 5. OpenAI Structured Output 구현

### 5.1 Zod 스키마 정의

```typescript
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';

// OpenAI 응답을 위한 스키마
const SubjectPlanSchema = z.object({
  subject: z.string().describe("과목명"),
  content: z.string().describe("학습할 구체적인 내용"),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).describe("시작 시간 (HH:mm)"),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).describe("종료 시간 (HH:mm)")
});

const StudyPlanResponseSchema = z.object({
  plans: z.array(SubjectPlanSchema).describe("과목별 학습 계획"),
  motivationalQuote: z.string().optional().describe("동기부여 문구")
});
```

### 5.2 OpenAI API 호출

```typescript
const completion = await openai.beta.chat.completions.parse({
  model: "gpt-4o-2024-08-06",
  messages: [
    {
      role: "system",
      content: "당신은 학생들의 학습 계획을 도와주는 전문 교육 컨설턴트입니다."
    },
    {
      role: "user",
      content: generatePrompt(userResponses)
    }
  ],
  response_format: zodResponseFormat(StudyPlanResponseSchema, "study_plan")
});
```

## 6. Frontend 컴포넌트 구조

### 6.1 컴포넌트 계층

```
app/
├── study-plan/
│   ├── page.tsx                    # 메인 페이지
│   ├── components/
│   │   ├── StudyPlanDashboard.tsx  # 계획 대시보드
│   │   ├── ChatInterface.tsx       # 채팅 인터페이스
│   │   ├── PlanCard.tsx           # 계획 카드 컴포넌트
│   │   ├── SubjectItem.tsx        # 과목 아이템 컴포넌트
│   │   └── ReflectionModal.tsx    # 회고 작성 모달
│   └── hooks/
│       ├── useStudyPlan.ts        # 계획 관련 훅
│       └── useChatSession.ts      # 채팅 세션 관리 훅
```

### 6.2 주요 UI 플로우

#### 메인 화면 조건부 렌더링
```typescript
// 오늘의 계획 존재 여부 체크
if (todaysPlan) {
  return <StudyPlanDashboard plan={todaysPlan} />;
} else {
  return <CreatePlanPrompt onClick={startChat} />;
}
```

#### 채팅 인터페이스 상태 관리
```typescript
const chatSteps = [
  { key: 'time_range', question: '오늘 몇시부터 몇시 사이에 공부를 하실 건가요?' },
  { key: 'subjects', question: '오늘 어떤 과목들을 공부하실 건가요?' },
  { key: 'subject_details', question: '각 과목별로 어떤 내용을 공부하고자 하시나요?' },
  { key: 'time_allocation', question: '각 과목별로 공부하는데 시간은 얼마나 쓸 생각이신가요?' },
  { key: 'motivational_quote', question: '오늘 플래너의 글귀에는 어떤 내용이 담기면 좋겠나요? (선택)' }
];
```

## 7. 구현 순서

### Phase 1: 백엔드 기초 (1-2일)
1. ✅ Redis 데이터 모델 정의
2. ✅ TypeScript 인터페이스 생성
3. ✅ 기본 API 라우트 생성 (/api/study-plan/)

### Phase 2: OpenAI 통합 (1일)
1. ✅ Zod 스키마 정의
2. ✅ Structured Output API 구현
3. ✅ 프롬프트 엔지니어링 및 테스트

### Phase 3: 채팅 시스템 (2일)
1. ⬜ 채팅 세션 관리 로직
2. ⬜ 단계별 질문 처리
3. ⬜ 응답 검증 및 에러 처리

### Phase 4: Frontend 구현 (2-3일)
1. ⬜ 채팅 인터페이스 UI
2. ⬜ 계획 대시보드 UI
3. ⬜ 수정 및 회고 기능 UI
4. ⬜ 애니메이션 및 UX 개선

### Phase 5: 통합 및 테스트 (1일)
1. ⬜ E2E 테스트
2. ⬜ 성능 최적화
3. ⬜ 버그 수정

## 8. 보안 및 성능 고려사항

### 8.1 보안
- NextAuth 세션 검증 필수
- 사용자별 계획 접근 권한 체크
- API Rate Limiting 구현
- Input sanitization 및 validation

### 8.2 성능
- Redis 캐싱 활용
- OpenAI API 호출 최적화 (불필요한 호출 방지)
- Frontend 상태 관리 최적화 (React Query 고려)
- 이미지 및 에셋 최적화

### 8.3 에러 처리
- OpenAI API 실패 시 재시도 로직
- Redis 연결 실패 대응
- 사용자 친화적 에러 메시지
- 로깅 및 모니터링

## 9. 추가 고려사항

### 9.1 확장 가능성
- 주간/월간 계획으로 확장
- 학습 통계 및 분석 기능
- 친구와 계획 공유 기능
- 푸시 알림 기능

### 9.2 UI/UX 개선
- 모바일 반응형 디자인
- 다크 모드 지원
- 접근성(Accessibility) 고려
- 로딩 상태 및 스켈레톤 UI

### 9.3 데이터 관리
- 계획 히스토리 보관 정책
- 데이터 백업 전략
- GDPR 등 개인정보보호 규정 준수

## 10. 예상 일정

총 소요 기간: **7-9일**
- Phase 1-2: 2-3일
- Phase 3-4: 4-5일
- Phase 5: 1일
- 버퍼: 1일

## 11. 테스트 시나리오

### 11.1 기능 테스트
- 계획 생성 플로우 전체 테스트
- 계획 수정 및 삭제 테스트
- 회고 작성 테스트
- 권한 검증 테스트

### 11.2 엣지 케이스
- 동시에 여러 계획 생성 시도
- 네트워크 끊김 상황
- 잘못된 시간 입력
- 매우 긴 텍스트 입력

### 11.3 성능 테스트
- 동시 사용자 부하 테스트
- OpenAI API 응답 시간 측정
- Redis 쿼리 성능 측정수 