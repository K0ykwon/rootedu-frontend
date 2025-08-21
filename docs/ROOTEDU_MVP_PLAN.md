# RootEdu MVP Page & Component Plan

Status: v1.1 — Concrete Spec
Last updated: 2025-08-17 07:17 KST

## Context & Decisions
- Brand: RootEdu — 전문적이고 양심적인 톤, SKY 학생들이 만드는 교육 플랫폼 컨셉
- Stack: Next.js (App Router), Tailwind v4, TypeScript
- Auth: NextAuth Credentials only (이메일/비밀번호 회원가입·로그인)
- Data: Redis (local dev: redis://default:********@localhost:6380) — 실제 값은 .env.local에 보관
- Payment: 구매 버튼은 비활성 스텁(UX만)
- Skip: 인플루언서 FAQ AI 챗봇(향후)

## Non-Goals (MVP)
- 실결제/정산(결제 게이트웨이 연동, 환불, 세금계산서)
- 추천/랭킹 알고리즘 고도화(간단 정렬/필터만)
- 고급 채팅/FAQ AI(모달 자리만, 실제 모델 연동 제외)
- 실시간 알림(WebSocket/Push), DM/팔로우 네트워크 그래프
- 다국어 i18n(한국어만)

## Information Architecture (Routes)
- `/` 메인 랜딩
- `/influencers` 인플루언서 디렉토리
- `/influencer/[slug]` 인플루언서 상세 (프로필, 상품, 리뷰, 구매 스텁)
- `/community` 커뮤니티 피드 (글 목록, 글쓰기)
- `/community/[postId]` 게시글 상세 (댓글/답글)
- `/tools` 무료 AI 기능(샘플 도구 + 템플릿 기반)
- `/auth/login`, `/auth/register` (커스텀 페이지) + NextAuth 기본 라우트(`/api/auth/[...nextauth]`)
- `/api/*` RESTful Route Handlers (Redis 연동)

## Global Layout & Navigation
- `app/layout.tsx`: 브랜드 메타, 글로벌 스타일(`app/globals.css`) 유지
- Header: RootEdu 로고/타이틀, 링크(탐색, 커뮤니티, 무료 AI, 로그인/프로필)
- Mobile: `components/ui/BottomNav.tsx` 고정 하단 네비게이션
- Footer: 저작권, 약관/개인정보, 문의

## Client/Server Component Boundaries
- Server(기본): `app/layout.tsx`, 대부분의 페이지 쉘. 데이터 패칭은 Route Handlers/서버 컴포넌트에서 수행.
- Client(상호작용): `components/ui/InfluencerGrid.tsx`, `SearchBar.tsx`, `Tabs.tsx`, `HorizontalScrollSection.tsx`, `HeroSection.tsx` 등 훅 사용 컴포넌트 상단 `'use client'` 필수.
- 패턴: 페이지는 가능하면 서버 컴포넌트로 유지하고, 검색/필터/탭/토글 같은 UI 상태는 클라이언트 하위 컴포넌트로 위임.
- 내비게이션: `next/link` 우선 사용, imperative navigation은 최소화.

## Component Inventory (to reuse)
- Discovery: `components/ui/InfluencerGrid.tsx`, `InfluencerCard.tsx`, `TrendingBadge.tsx`, `SearchBar.tsx`, `CategoryFilter.tsx`
- Profile: `InfluencerProfile.tsx` (Header/Stats/Social), `Avatar.tsx`, `Badge.tsx`
- Courses/Products: `CourseCard.tsx`, `HorizontalScrollSection.tsx`
- Community/UX: `Card.tsx`, `List.tsx`, `Form.tsx`, `Modal.tsx`, `Toast.tsx`, `Tabs.tsx`, `Skeleton.tsx`
- Chat (placeholder/utility): `AIChat.tsx`, `EnhancedChat.tsx` (FAQ는 이후)
- Nav: `BottomNav.tsx`, `Button.tsx`, `SearchBar.tsx`
- Motion/Gamification (선택): `CelebrationAnimations.tsx`, `Gamification.tsx` — 톤에 맞게 절제 사용

## Page Specs (by route)

### `/` — Landing (유입/탐색/회원가입 CTA)
- Hero(브랜드 메시지): SKY 학생들이 만드는 학습/진로 인사이트 — 전문적·차분한 카피
  - Use `HeroSection` 커스터마이즈 (색/카피), 보조 `Button`
- 핵심 카드 3개: 인플루언서 탐색, 커뮤니티, 무료 AI
  - Use `Card`, `Button`, `TrendingBadge`(선택)
- 프리뷰 섹션: 인기 인플루언서 6명 그리드
  - Use `InfluencerGrid` (상위 N)
- 프리뷰 섹션: 인기 강좌/상품 가로 스크롤
  - Use `HorizontalScrollSection` + `CourseCard`
- CTA: 회원가입 유도(학습 동기부여 카피) — `Button`
- Mobile: `BottomNav` 노출

#### Acceptance Criteria
- Hero/카피/CTA가 렌더되고 버튼 포커스/대비가 접근성 기준을 만족한다.
- 인기 인플루언서 미리보기 6개가 mock 데이터로 노출된다.
- "인플루언서 탐색" CTA 클릭 시 `/influencers`로 이동한다.
- 강좌 가로 스크롤 프리뷰가 표시되고 넘김이 가능하다.
- 콘솔 에러가 없다(클라이언트/서버).
- 모바일 뷰에서 `BottomNav`가 표시된다.

### `/influencers` — 인플루언서 디렉토리
- 상단 검색/필터: 과목, 학년, 지역, 태그
  - Use `SearchBar`, `CategoryFilter`(멀티 태그)
- 정렬: 최신/인기/평점 — `Tabs` 또는 드롭다운
- 결과 그리드: `InfluencerCard` 반복, `Skeleton` 로딩
- 페이징/무한스크롤: 추후 (MVP는 페이지네이션 간단 구현)

#### Acceptance Criteria
- 검색어 입력/수정 시 클라이언트 사이드에서 결과가 즉시 반영된다.
- 카테고리/정렬 제어가 클라이언트 사이드로 적용된다.
- 뷰 모드 토글(grid/list/compact)이 동작한다.
- 페이지당 12개 노출, Prev/Next 기본 페이지네이션 동작.
- 카드 클릭 시 해당 `/influencer/[slug]`로 이동한다.
- 로딩 시 `Skeleton`이 표시된다(모의 지연 가능).
- 콘솔 에러가 없다.

### `/influencer/[slug]` — 인플루언서 상세
- 헤더: 프로필, 인증 뱃지(필요 시), 주요 지표
  - Use `InfluencerProfileHeader`, `InfluencerStats`, `InfluencerSocialLinks`
- 소개: 이력/전공/합격실적/멘토링 철학 — `Card`
- 상품/강의: `CourseCard` 리스트 (가격/난이도/포맷)
  - 구매 버튼: 비활성 스텁 (클릭 시 `Toast`로 안내)
- 리뷰/평점: `List` + `Avatar` + 간단 별점 표기 (추가 컴포넌트 필요 시 경량 구현)
- FAQ 챗봇: 자리만 (`Modal` + 설명 텍스트), 실제 기능은 이후

#### Acceptance Criteria
- 이름/아이디/아바타/인증 배지가 헤더에 표시된다.
- 주요 지표(팔로워/수강생/강좌/평점)와 소셜 링크가 표시된다.
- 강좌 섹션에서 최소 3개 아이템이 노출되고 "구매" 클릭 시 `Toast` 안내가 뜬다.
- 존재하지 않는 slug는 404 또는 안내 페이지로 처리. mock 데이터 fallback 허용.
- 콘솔 에러가 없다.

### `/community` — 커뮤니티 피드
- 글 작성: 제목/본문/태그 — `Form`(Input, Textarea, Select), 게시 버튼
- 피드 목록: `Card` + 작성자 `Avatar`, 태그 `Badge`, 미리보기 2~3줄
- 정렬/필터: 최신/좋아요/댓글 많은 — `Tabs`
- 무한 스크롤(선택) 또는 페이지네이션, `Skeleton` 로딩

#### Acceptance Criteria
- 글 작성 시 Redis 또는 임시 메모리 저장으로 성공하며 `Toast` 노출.
- 피드 목록이 최신순으로 표시되고 정렬 탭이 동작(클라이언트 기준)한다.
- 로딩 상태에 `Skeleton`이 보인다.
- 콘솔 에러가 없다.

### `/community/[postId]` — 게시글 상세
- 본문: 제목, 메타(작성자/시간/태그), 내용
- 좋아요/저장(추후), 신고(추후)
- 댓글/대댓글: `List` + `Avatar` + 답글 `Form`
- 입력 UX: 낙관적 UI, 실패 시 `Toast` 안내

#### Acceptance Criteria
- 게시글 본문/메타가 표시된다.
- 댓글 목록이 표시되고 새 댓글 작성이 가능하다(빈 값 검증).
- 실패 시 `Toast`로 에러를 안내한다.
- 콘솔 에러가 없다.

### `/tools` — 무료 AI 기능(템플릿형)
- 목적: 유료 전환 유도 전 무료 맛보기
- 툴 예시: 학습 계획 템플릿, 과목별 질문 템플릿, 강좌 추천 질문 가이드
  - Use `AIChat`(간단 메시지 컴포넌트) + 프리셋 버튼들(`Button`) → 정적/규칙 기반 응답
- 상단 주의: “고도화된 AI 기능은 멘토 상품과 연동됩니다” 안내 `Alert`

#### Acceptance Criteria
- 기본 챗 UI가 로드되고 프리셋 버튼 클릭 시 정해진 응답이 출력된다.
- 외부 API 호출 없음(완전 로컬 동작).
- 상단 안내 배너가 노출된다.
- 콘솔 에러가 없다.

### `/auth/*` — 로그인/회원가입
- `/auth/register`: 이름, 이메일, 비밀번호(확인) — `Form`
- `/auth/login`: 이메일, 비밀번호 — `Form`
- 에러/성공: `Toast`/`Alert` 사용
- NextAuth Credentials Provider 연동 (세션 유지)

## Sorting & Filtering Definitions
- Popular(인기): `influencers:trending` zset 점수 내림차순, 없을 경우 `followers` 내림차순 fallback
- Rating(평점): `stats.rating` 내림차순, 동률 시 `reviews` 많은 순
- Students(수강생): `monthlyStudents` 내림차순, 없으면 누적 `students`
- Recent(최신): `updatedAt` 또는 `joinDate` 최신순
- Search(검색): `name`, `username`, `tags[]`, `subjects[]` 대상 부분 일치(클라이언트 기준)
- Category(카테고리): `subjects[]` 또는 `tags[]` 포함 필터
- Pagination(페이지네이션): `page`(기본 1), `pageSize`(기본 12, 최대 24)

## Data Model (Redis)
- User
  - Key: `user:{id}` → `{ id, name, email, passwordHash, createdAt }`
  - Index: `user:email:{email}` → `{id}` (존재 체크/로그인용)
- Influencer
  - Key: `influencer:{slug}` → `{ slug, name, avatar, bio, subjects[], tags[], stats{followers, rating}, socials{} }`
  - List: `influencers` (전체 슬러그 목록) / 정렬 세트 `influencers:trending`
- Product (강의/상품)
  - Key: `product:{id}` → `{ id, influencerSlug, title, price, level, thumbnail, summary }`
  - Set: `influencer:{slug}:products` → product ids
- Community
  - Post: `post:{id}` → `{ id, authorId, title, body, tags[], createdAt, stats{likes, comments} }`
  - List: `community:posts` (최신 순) 또는 `zset` 정렬 키
  - Comments: `post:{id}:comments` → 리스트 요소 `{ id, authorId, body, createdAt }`

## Mock Data & Seeding Plan
- 경로: `lib/redis.ts` 클라이언트 구성 → `scripts/seed.ts`(또는 `node scripts/seed.mjs`)에서 시드 수행
- 시드 데이터: 인플루언서 12명, 제품 8~12개, 커뮤니티 글 10개, 댓글 일부
- 규칙:
  - 슬러그: `kebab-case` (`name` 기반)
  - 인플루언서: `{ slug, name, username, avatar, bio, subjects, tags, stats{followers,rating,reviews,students,courses}, socials }`
  - 제품: `{ id, influencerSlug, title, price, level, thumbnail, summary }`
  - 커뮤니티 글/댓글: 간단 필드만 유지
- 실행: 개발 환경에서 `.env.local`의 `REDIS_URL` 설정 후 시드 스크립트 1회 실행

## API Design (Next.js Route Handlers under `app/api/*`)
- Auth
  - `POST /api/auth/register` → {name,email,password} → 201 or 409
  - `POST /api/auth/login` → NextAuth Credentials flow (provider 내부 검증)
- Influencers
  - `GET /api/influencers` → 목록/필터/정렬
  - `GET /api/influencers/[slug]` → 상세 + products
- Products
  - `GET /api/products/[id]`
  - `POST /api/products/[id]/purchase` → 501 (스텁, Toast 안내)
- Community
  - `GET /api/posts` → 목록(페이지네이션/필터)
  - `POST /api/posts` → 생성
  - `GET /api/posts/[id]` → 상세(+댓글 count)
  - `POST /api/posts/[id]/comments` → 댓글 생성

## API Contracts
### GET /api/influencers
Query: `q`, `category`, `sort`, `page`, `pageSize`

Response:
```json
{
  "items": [
    {
      "slug": "jane-doe",
      "name": "Jane Doe",
      "username": "janedoe",
      "avatar": "/avatars/jane.jpg",
      "bio": "CS @ SKY, 알고리즘 멘토",
      "tags": ["알고리즘", "면접"],
      "stats": { "followers": 15200, "rating": 4.8, "reviews": 123, "students": 1200, "courses": 4 }
    }
  ],
  "page": 1,
  "pageSize": 12,
  "total": 84
}
```

### GET /api/influencers/[slug]
Response:
```json
{
  "influencer": {
    "slug": "jane-doe",
    "name": "Jane Doe",
    "username": "janedoe",
    "avatar": "/avatars/jane.jpg",
    "bio": "CS @ SKY",
    "socials": { "youtube": "https://..." },
    "stats": { "followers": 15200, "rating": 4.8, "reviews": 123, "students": 1200, "courses": 4 }
  },
  "products": [
    { "id": "p1", "title": "PS 초격차", "price": 49000, "level": "중급", "thumbnail": "/thumbs/p1.jpg" }
  ]
}
```

### POST /api/posts
Request:
```json
{ "title": "합격 후기", "body": "...", "tags": ["수시", "자소서"] }
```
Response 201:
```json
{ "id": "post_123", "createdAt": 1723852800000 }
```

### GET /api/posts
Query: `page`, `pageSize`, `sort`

Response:
```json
{ "items": [{"id":"post_123","title":"..."}], "page":1, "pageSize":10, "total":37 }
```

## Auth Flow (NextAuth Credentials)
- Registration: 커스텀 `/api/auth/register` → bcrypt 해시 저장 (Redis)
- Login: CredentialsProvider(authorize) → Redis에서 `user:email:{email}`로 id 찾고 패스워드 검증
- Session: JWT 기반(기본) — 사용자 `id`, `name`, `email` 포함
- Env: `AUTH_SECRET`, `REDIS_URL=redis://default:********@localhost:6380`

## UX & Brand Tone
- 색상/타이포: `app/globals.css` 변수에 맞춰 통일감 유지
- 모션: 과도한 애니메이션 지양, 주요 CTA에만 `hover-lift/hover-glow` 절제 사용
- 접근성: 대비/포커스 표시, 키보드 접근, 스크린리더 레이블

## Observability & QA
- 로딩/에러 상태: `Skeleton`, `Toast`, `Alert`
- 로그: 서버 Route Handler에서 에러 로깅(간단 console 준수)
- 테스트: 핵심 플로우(회원가입/로그인/글작성) 플레이

## Milestones & Timeline
- D0: 라우트 스캐폴딩, 글로벌 레이아웃/네비
- D1: `/` 랜딩, 인플루언서 프리뷰, 강좌 프리뷰
- D2: `/influencers` 검색/필터/정렬/뷰모드/페이지네이션(클라)
- D3: `/influencer/[slug]` 상세 + 구매 스텁
- D4: `/community`/`[postId]` CRUD 최소 구현
- D5: `/tools` 템플릿 챗, 접근성/모바일 QA
- D6: Auth/세션, 시드/문서화/README

## Implementation Checklist (Dev Tasks)
1) 라우트 스캐폴딩(`/`, `/influencers`, `/influencer/[slug]`, `/community`, `/community/[postId]`, `/tools`, `/auth/*`, `/api/*`)
2) `lib/redis.ts` 클라이언트 (ioredis or redis)
3) NextAuth 설정( CredentialsProvider ), `/api/auth/[...nextauth]`, 회원가입 API
4) Influencers/Products/Community API + seed 스크립트(개발용)
5) 각 페이지 UI 구성: 기존 컴포넌트 연결 및 데이터 바인딩
6) 구매 버튼 스텁 처리(Toast/Modal)
7) 글로벌 네비/푸터 + BottomNav(모바일)
8) QA(모바일/접근성/성능) & README 업데이트

## Definition of Done
- 본 문서의 Acceptance Criteria 충족 및 주요 경로 수동 테스트 통과
- 타입/빌드 오류 0, 콘솔 에러 0
- 모바일 뷰(375px)에서 주요 화면 레이아웃 무너짐 없음
- 접근성: 포커스 이동/레이블링/대비 주요 요소 확인
- 시크릿은 `.env.local`에만 존재, 레포 내 하드코딩 없음

---

Open Questions
- 정렬/필터 상세 기준 확정 필요(인기/평점 정의)
- 리뷰/평점 컴포넌트는 경량 구현 예정(필요 시 별점 컴포넌트 추가)
- 무료 AI 툴의 초기 템플릿 문구 확정 필요(과목/학년별 샘플)

