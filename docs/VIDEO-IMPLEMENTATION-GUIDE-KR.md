# 📹 RootEdu 플랫폼 YouTube 영상 통합 가이드

## 목차
- [개요](#개요)
- [시스템 아키텍처](#시스템-아키텍처)
- [빠른 시작](#빠른-시작)
- [상세 구현 가이드](#상세-구현-가이드)
- [데이터베이스 스키마](#데이터베이스-스키마)
- [API 사용법](#api-사용법)
- [프론트엔드 통합](#프론트엔드-통합)
- [보안 고려사항](#보안-고려사항)
- [문제 해결](#문제-해결)

---

## 개요

### 목적
RootEdu 플랫폼에 YouTube 영상 기반 강의 콘텐츠를 통합하여, 구매한 사용자만 영상을 시청할 수 있도록 하는 시스템입니다.

### 핵심 기능
- ✅ YouTube Unlisted/Private 영상 연동
- ✅ 구매 기반 접근 제어
- ✅ 모바일 최적화 영상 플레이어
- ✅ 실시간 접근 권한 확인
- ✅ 안전한 데이터 마이그레이션

### MVP 특징
- **비용 제로**: YouTube 호스팅 활용으로 별도 서버 비용 없음
- **즉시 배포**: 인코딩/트랜스코딩 불필요
- **모바일 최적화**: YouTube 플레이어의 검증된 성능
- **확장 가능**: 향후 Vimeo, Cloudflare Stream 등 다른 플랫폼 추가 가능

---

## 시스템 아키텍처

### 데이터 흐름도

```
┌─────────────┐
│   사용자    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────┐
│  상품 페이지 접속       │
│  /influencers/[slug]/   │
│  product/[productId]    │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│  로그인 상태 확인       │
│  (NextAuth Session)     │
└──────┬──────────────────┘
       │
       ├─ 비로그인 ─────────────────┐
       │                             │
       ├─ 로그인 (미구매) ──────────┤
       │                             │
       └─ 로그인 (구매 완료) ────────┤
                                      │
                                      ▼
                         ┌────────────────────────┐
                         │  접근 권한 확인 API    │
                         │  GET /api/products/    │
                         │  [id]/access           │
                         └────────┬───────────────┘
                                  │
                                  ▼
                         ┌────────────────────────┐
                         │  Redis 권한 체크       │
                         │  purchase:{userId}:    │
                         │  {productId}           │
                         └────────┬───────────────┘
                                  │
                 ┌────────────────┴────────────────┐
                 │                                  │
           권한 없음                           권한 있음
                 │                                  │
                 ▼                                  ▼
        ┌─────────────────┐              ┌─────────────────┐
        │  구매 유도 UI   │              │  VideoPlayer    │
        │  (구매 버튼)    │              │  (YouTube 재생) │
        └─────────────────┘              └─────────────────┘
```

### 기술 스택

| 레이어 | 기술 | 역할 |
|--------|------|------|
| **프론트엔드** | React 19, Next.js 15 | 사용자 인터페이스 |
| **인증** | NextAuth.js | 세션 관리 |
| **데이터베이스** | Redis (Upstash) | 사용자 구매 정보 저장 |
| **영상 호스팅** | YouTube | 영상 스트리밍 |
| **스타일링** | Tailwind CSS, Framer Motion | UI 디자인 |

---

## 빠른 시작

### 1. 전체 상품 목록 확인

```bash
npm run add-videos -- --list
```

**출력 예시:**
```
📋 Fetching all products from Redis...

Found 15 products:

📦 p1
   Title: 생기부 관리 컨설팅
   Influencer: yaktoon
   Price: ₩350,000
   Has Video: No

📹 p2
   Title: 국어 독해 마스터
   Influencer: kor.artis
   Price: ₩180,000
   Has Video: Yes
   Video URL: https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

### 2. YouTube 영상 준비

#### YouTube 영상 업로드 방법

1. **YouTube Studio 접속**
   - https://studio.youtube.com 로그인

2. **영상 업로드**
   - 우측 상단 "만들기" → "동영상 업로드" 클릭
   - 강의 영상 파일 선택

3. **공개 설정 (중요!)**
   - **비공개 목록** (Unlisted) 선택 ✅ **권장**
     - 링크를 아는 사람만 시청 가능
     - YouTube 검색에 노출되지 않음
     - 공유하기 쉬움

   또는

   - **비공개** (Private) 선택
     - 특정 이메일 주소만 시청 가능
     - 더 높은 보안 (단, 관리 복잡)

4. **영상 URL 복사**
   - 예시: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`

### 3. 상품에 영상 추가 (테스트)

먼저 **Dry Run 모드**로 테스트:

```bash
npm run add-videos -- \
  --product-id=p1 \
  --video-url=https://www.youtube.com/watch?v=dQw4w9WgXcQ \
  --dry-run
```

**출력 예시:**
```
🔍 Starting safe product video update...

Product ID: p1
Video URL: https://www.youtube.com/watch?v=dQw4w9WgXcQ
Mode: DRY RUN (no changes)

✅ Video URL format validated
✅ Product exists in database

📖 Current Product Data:
{
  "id": "p1",
  "title": "생기부 관리 컨설팅",
  "price": "350000",
  "influencerSlug": "yaktoon",
  ...
}

📝 Updated Product Data (with video fields):
{
  "id": "p1",
  "title": "생기부 관리 컨설팅",
  "price": "350000",
  "influencerSlug": "yaktoon",
  ...
  "videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "videoType": "youtube",
  "hasVideo": "true"
}

🔍 DRY RUN - No changes made to database
   Run without --dry-run to apply changes
```

### 4. 실제 적용

테스트 결과가 정상이면 `--dry-run` 제거하고 실행:

```bash
npm run add-videos -- \
  --product-id=p1 \
  --video-url=https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

**출력 예시:**
```
✅ Product updated successfully!
   - Video URL: https://www.youtube.com/watch?v=dQw4w9WgXcQ
   - Video Type: youtube
   - Has Video: true
   - All existing fields preserved ✓

💾 Backup created at: product:p1:backup:1704567890123
```

### 5. 웹사이트에서 확인

1. 브라우저에서 상품 페이지 접속:
   ```
   http://localhost:3000/influencers/yaktoon/product/p1
   ```

2. 영상 섹션이 표시되는지 확인
3. 로그인 후 구매 → 영상 재생 테스트

---

## 상세 구현 가이드

### A. 데이터 구조

#### 1. Product 인터페이스 확장

**파일**: `lib/redis.ts`

```typescript
export interface Product {
  // 기존 필드들 (그대로 유지)
  id: string;
  influencerSlug: string;
  title: string;
  price: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  thumbnail: string;
  summary: string;
  description?: string;
  createdAt: number;

  // 새로 추가된 영상 필드들 (선택적)
  videoUrl?: string;              // YouTube URL
  videoType?: 'youtube';          // 플랫폼 타입
  hasVideo?: boolean;             // 영상 유무 플래그
}
```

**중요**: 모든 영상 필드는 **선택적(`?`)**이므로 기존 상품 데이터는 영향 없음

#### 2. UserProduct 인터페이스 (신규)

```typescript
export interface UserProduct {
  userId: string;              // 구매 사용자 ID
  productId: string;           // 구매한 상품 ID
  purchasedAt: number;         // 구매 시각 (timestamp)
  accessStatus: 'active' | 'expired' | 'revoked';
  expiresAt?: number;          // 만료 시각 (구독형 상품용)
}
```

### B. Redis 키 구조

#### 기존 키 (변경 없음)
```
product:{productId}              → Product 해시
user:{userId}                    → User 해시
```

#### 신규 키 (추가됨)
```
purchase:{userId}:{productId}    → UserProduct JSON
user:products:{userId}           → Set<productId>
product:users:{productId}        → Set<userId>
```

**예시**:
```redis
# 사용자 "student123"이 상품 "p1"을 구매한 경우

# 1. 구매 기록
purchase:student123:p1 → {
  "userId": "student123",
  "productId": "p1",
  "purchasedAt": 1704567890000,
  "accessStatus": "active"
}

# 2. 사용자의 상품 목록
user:products:student123 → ["p1", "p5", "p8"]

# 3. 상품의 구매자 목록 (분석용)
product:users:p1 → ["student123", "student456"]
```

### C. 접근 제어 메서드

#### 1. 접근 권한 부여

```typescript
// lib/redis.ts
export async function grantProductAccess(
  userId: string,
  productId: string
): Promise<void>
```

**사용 예시**:
```typescript
// 구매 완료 후 호출
await grantProductAccess('student123', 'p1');

// Redis에 자동으로 저장:
// 1. purchase:student123:p1
// 2. user:products:student123 (집합에 p1 추가)
// 3. product:users:p1 (집합에 student123 추가)
```

#### 2. 접근 권한 확인

```typescript
export async function checkProductAccess(
  userId: string,
  productId: string
): Promise<boolean>
```

**사용 예시**:
```typescript
const hasAccess = await checkProductAccess('student123', 'p1');

if (hasAccess) {
  // 영상 URL 반환
} else {
  // 구매 유도
}
```

**확인 로직**:
1. `purchase:{userId}:{productId}` 존재 여부
2. `accessStatus`가 'active'인지
3. `expiresAt`이 설정되었다면 만료되지 않았는지

#### 3. 사용자 구매 목록 조회

```typescript
export async function getUserProducts(
  userId: string
): Promise<Product[]>
```

**사용 예시**:
```typescript
// 사용자가 구매한 모든 상품 조회
const myProducts = await getUserProducts('student123');

myProducts.forEach(product => {
  console.log(product.title, product.videoUrl);
});
```

#### 4. 접근 권한 취소

```typescript
export async function revokeProductAccess(
  userId: string,
  productId: string
): Promise<void>
```

**사용 예시** (환불 처리):
```typescript
await revokeProductAccess('student123', 'p1');

// 결과:
// - accessStatus → 'revoked' (기록 보존)
// - user:products:student123 에서 p1 제거
// - product:users:p1 에서 student123 제거
```

---

## API 사용법

### API 1: 구매 처리

**엔드포인트**: `POST /api/products/[id]/purchase`

**요청**:
```http
POST /api/products/p1/purchase
Content-Type: application/json
Cookie: next-auth.session-token=...
```

**응답** (성공):
```json
{
  "success": true,
  "message": "Product purchased successfully",
  "accessGranted": true,
  "productId": "p1",
  "userId": "student123"
}
```

**응답** (실패 - 비로그인):
```json
{
  "error": "Authentication required"
}
```
**HTTP 상태**: `401 Unauthorized`

**프론트엔드 사용 예시**:
```typescript
const handlePurchase = async (productId: string) => {
  const response = await fetch(`/api/products/${productId}/purchase`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });

  const data = await response.json();

  if (data.success) {
    toast.success('구매 완료! 영상을 시청하세요.');
    // 영상 섹션 표시
  } else {
    toast.error(data.error);
  }
};
```

### API 2: 접근 권한 확인

**엔드포인트**: `GET /api/products/[id]/access`

**요청**:
```http
GET /api/products/p1/access
Cookie: next-auth.session-token=...
```

**응답** (접근 권한 있음):
```json
{
  "hasAccess": true,
  "videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "productId": "p1"
}
```

**응답** (접근 권한 없음):
```json
{
  "hasAccess": false,
  "productId": "p1"
}
```

**프론트엔드 사용 예시**:
```typescript
useEffect(() => {
  const checkAccess = async () => {
    const response = await fetch(`/api/products/${productId}/access`);
    const data = await response.json();

    setHasAccess(data.hasAccess);
    if (data.videoUrl) {
      setVideoUrl(data.videoUrl);
    }
  };

  checkAccess();
}, [productId]);
```

### API 3: 내 구매 목록

**엔드포인트**: `GET /api/user/products`

**요청**:
```http
GET /api/user/products
Cookie: next-auth.session-token=...
```

**응답**:
```json
{
  "products": [
    {
      "id": "p1",
      "title": "생기부 관리 컨설팅",
      "price": 350000,
      "hasVideo": true,
      "videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      ...
    },
    {
      "id": "p5",
      "title": "국어 독해 마스터",
      "price": 180000,
      "hasVideo": true,
      ...
    }
  ],
  "count": 2
}
```

**프론트엔드 사용 예시** (내 강의실 페이지):
```typescript
const MyCoursesPage = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch('/api/user/products')
      .then(res => res.json())
      .then(data => setProducts(data.products));
  }, []);

  return (
    <div>
      <h1>내 강의실</h1>
      {products.map(product => (
        <CourseCard key={product.id} product={product} />
      ))}
    </div>
  );
};
```

---

## 프론트엔드 통합

### 컴포넌트 구조

```
ProductDetailClient
├─ 로그인 상태 확인 (useSession)
├─ 접근 권한 확인 (useEffect → API 호출)
└─ 조건부 렌더링
   ├─ isCheckingAccess → 로딩 스피너
   ├─ 비로그인 → 로그인 유도
   ├─ 로그인 (미구매) → 구매 버튼
   └─ 로그인 (구매 완료) → VideoPlayer
```

### 상태 관리

```typescript
const [hasAccess, setHasAccess] = useState(false);
const [isCheckingAccess, setIsCheckingAccess] = useState(true);
const [isPurchasing, setIsPurchasing] = useState(false);
const { data: session, status } = useSession();
```

**상태 흐름**:
```
초기 → isCheckingAccess = true
     ↓
API 호출 완료 → isCheckingAccess = false, hasAccess = true/false
     ↓
구매 버튼 클릭 → isPurchasing = true
     ↓
구매 완료 → isPurchasing = false, hasAccess = true
```

### UI 상태별 렌더링

```typescript
{product.hasVideo && (
  <section>
    {isCheckingAccess ? (
      // 상태 1: 로딩 중
      <LoadingSpinner />
    ) : hasAccess && product.videoUrl ? (
      // 상태 2: 영상 재생
      <VideoPlayer videoUrl={product.videoUrl} title={product.title} />
    ) : status === 'unauthenticated' ? (
      // 상태 3: 비로그인
      <LoginPrompt />
    ) : (
      // 상태 4: 구매 유도
      <PurchaseButton onClick={handlePurchase} disabled={isPurchasing} />
    )}
  </section>
)}
```

### VideoPlayer 컴포넌트

**파일**: `components/video/VideoPlayer.tsx`

**주요 기능**:
- YouTube URL → Embed URL 자동 변환
- 16:9 반응형 레이아웃
- 로딩 상태 표시
- 모바일 최적화

**사용법**:
```typescript
<VideoPlayer
  videoUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  title="강의 제목"
  className="mb-8"
/>
```

**YouTube URL 형식 지원**:
- `https://www.youtube.com/watch?v=VIDEO_ID` ✅
- `https://youtu.be/VIDEO_ID` ✅
- `https://www.youtube.com/embed/VIDEO_ID` ✅

---

## 데이터베이스 스키마

### Redis 데이터 타입별 정리

#### 1. Hash (제품 정보)

```redis
# Key: product:{productId}
# Type: Hash

HGETALL product:p1

1) "id"
2) "p1"
3) "title"
4) "생기부 관리 컨설팅"
5) "price"
6) "350000"
7) "influencerSlug"
8) "yaktoon"
9) "videoUrl"
10) "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
11) "videoType"
12) "youtube"
13) "hasVideo"
14) "true"
```

#### 2. JSON (구매 기록)

```redis
# Key: purchase:{userId}:{productId}
# Type: RedisJSON

JSON.GET purchase:student123:p1

{
  "userId": "student123",
  "productId": "p1",
  "purchasedAt": 1704567890000,
  "accessStatus": "active"
}
```

#### 3. Set (관계 매핑)

```redis
# Key: user:products:{userId}
# Type: Set

SMEMBERS user:products:student123

1) "p1"
2) "p5"
3) "p8"

# Key: product:users:{productId}
# Type: Set

SMEMBERS product:users:p1

1) "student123"
2) "student456"
3) "student789"
```

### 데이터 무결성 보장

#### 트랜잭션 예시
```typescript
// grantProductAccess 내부 동작

async function grantProductAccess(userId, productId) {
  const redis = await ensureConnection();

  // 1. 구매 기록 저장
  await redis.json.set(
    `purchase:${userId}:${productId}`,
    '$',
    userProduct
  );

  // 2. 사용자 상품 목록 업데이트
  await redis.sAdd(`user:products:${userId}`, productId);

  // 3. 상품 구매자 목록 업데이트 (분석용)
  await redis.sAdd(`product:users:${productId}`, userId);

  // 모두 성공해야 완료
}
```

---

## 보안 고려사항

### 1. YouTube 영상 보안 설정

#### ✅ 권장: Unlisted (비공개 목록)
```
장점:
- 링크를 아는 사람만 접근 가능
- YouTube 검색에 노출되지 않음
- 공유 링크 관리 간편

단점:
- 링크 유출 시 누구나 시청 가능
```

**대응책**:
- 정기적으로 영상 URL 변경 (마이그레이션 스크립트 재실행)
- 워터마크 추가 (사용자 ID 표시)
- YouTube Analytics로 비정상 트래픽 모니터링

#### 🔒 고보안: Private (비공개)
```
장점:
- 특정 이메일 주소만 접근 가능
- 최고 수준의 보안

단점:
- 각 사용자 이메일을 YouTube에 등록 필요
- 관리 복잡도 증가
```

### 2. 서버 사이드 접근 제어

**중요**: 영상 URL은 **절대로** 클라이언트에 노출하지 않음

```typescript
// ❌ 잘못된 예시 (보안 취약)
const product = await getProduct(id);
return { videoUrl: product.videoUrl }; // 누구나 접근 가능

// ✅ 올바른 예시 (보안)
const hasAccess = await checkProductAccess(userId, productId);
if (!hasAccess) {
  return { error: 'Access denied' };
}
const product = await getProduct(id);
return { videoUrl: product.videoUrl }; // 권한 확인 후 반환
```

### 3. Rate Limiting (추후 구현 권장)

```typescript
// 예시: 구매 API에 Rate Limiting 추가
import rateLimit from 'express-rate-limit';

const purchaseLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 5, // 최대 5회 시도
  message: '너무 많은 구매 시도입니다. 잠시 후 다시 시도해주세요.'
});
```

### 4. 세션 검증

```typescript
// 모든 보호된 API에서 세션 확인
const session = await getServerSession(authOptions);

if (!session || !(session.user as any)?.userId) {
  return NextResponse.json(
    { error: 'Authentication required' },
    { status: 401 }
  );
}
```

---

## 문제 해결

### Q1: 영상이 재생되지 않아요

**원인 1**: YouTube URL 형식 오류
```bash
# 확인
npm run add-videos -- --list

# 올바른 형식
https://www.youtube.com/watch?v=VIDEO_ID
https://youtu.be/VIDEO_ID

# 잘못된 형식
https://www.youtube.com/watch?v=VIDEO_ID&t=10s  # &t= 제거 필요
```

**원인 2**: 영상이 Private로 설정됨
- YouTube Studio에서 "비공개 목록(Unlisted)"으로 변경

**원인 3**: 브라우저 차단
- 시크릿 모드에서 테스트
- 광고 차단 확장 프로그램 비활성화

### Q2: 구매 후에도 영상이 안 보여요

**디버깅 단계**:

1. **Redis에서 구매 기록 확인**:
```bash
redis-cli -h redis-15676.c266.us-east-1-3.ec2.redns.redis-cloud.com \
          -p 15676 \
          -a uidvu100wo6pdWxdrXoE1HaHx33mWDRA

# 구매 기록 확인
JSON.GET purchase:student123:p1

# 사용자 상품 목록 확인
SMEMBERS user:products:student123
```

2. **API 응답 확인**:
```bash
# 브라우저 개발자 도구 → Network 탭
# /api/products/p1/access 응답 확인

{
  "hasAccess": true,  # false면 구매 기록 없음
  "videoUrl": "...",
  "productId": "p1"
}
```

3. **세션 확인**:
```typescript
// ProductDetailClient.tsx에 로그 추가
useEffect(() => {
  console.log('Session:', session);
  console.log('User ID:', (session?.user as any)?.userId);
}, [session]);
```

### Q3: 마이그레이션 스크립트 오류

**오류**: `Product with ID "p1" not found`

**해결**:
```bash
# 1. 상품 목록 확인
npm run add-videos -- --list

# 2. Redis에서 직접 확인
redis-cli> KEYS product:*

# 3. 정확한 product ID 사용
npm run add-videos -- --product-id=올바른ID --video-url=...
```

**오류**: `Invalid YouTube URL format`

**해결**:
```bash
# URL에서 불필요한 파라미터 제거
# Before: https://www.youtube.com/watch?v=VIDEO_ID&list=...&index=1
# After:  https://www.youtube.com/watch?v=VIDEO_ID
```

### Q4: 기존 데이터가 사라졌어요

**확인**:
```bash
# 백업이 자동 생성되었는지 확인
redis-cli> KEYS product:p1:backup:*

# 백업에서 복구
redis-cli> HGETALL product:p1:backup:1704567890123
# 해당 데이터를 product:p1로 복사
```

**예방**:
- 항상 `--dry-run`으로 먼저 테스트
- 중요한 변경 전 Redis 전체 백업

### Q5: 모바일에서 영상이 작게 보여요

**해결**: VideoPlayer 컴포넌트가 이미 반응형으로 구현됨

확인 사항:
```typescript
// 부모 컨테이너가 padding을 제한하는지 확인
<div className="max-w-4xl mx-auto px-4 sm:px-6">
  <VideoPlayer ... />
</div>

// VideoPlayer는 자동으로 16:9 비율 유지
```

---

## 고급 활용

### 1. 여러 영상 일괄 추가

**스크립트**: `scripts/batch-add-videos.ts` (직접 작성)

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const videos = [
  { productId: 'p1', url: 'https://www.youtube.com/watch?v=VIDEO_1' },
  { productId: 'p2', url: 'https://www.youtube.com/watch?v=VIDEO_2' },
  { productId: 'p3', url: 'https://www.youtube.com/watch?v=VIDEO_3' },
];

async function batchAddVideos() {
  for (const video of videos) {
    console.log(`Adding video to ${video.productId}...`);

    await execAsync(
      `npm run add-videos -- --product-id=${video.productId} --video-url=${video.url}`
    );

    console.log(`✅ ${video.productId} complete\n`);
  }
}

batchAddVideos();
```

**실행**:
```bash
npx tsx scripts/batch-add-videos.ts
```

### 2. 기존 사용자에게 자동으로 접근 권한 부여

레거시 구매 데이터가 있는 경우:

```typescript
// scripts/grant-legacy-access.ts

import { grantProductAccess } from '../lib/redis';

// 기존 구매 기록 (예시)
const legacyPurchases = [
  { userId: 'student123', productId: 'p1' },
  { userId: 'student456', productId: 'p1' },
  { userId: 'student123', productId: 'p5' },
];

async function grantLegacyAccess() {
  for (const purchase of legacyPurchases) {
    await grantProductAccess(purchase.userId, purchase.productId);
    console.log(`✅ Granted access: ${purchase.userId} → ${purchase.productId}`);
  }
}

grantLegacyAccess();
```

### 3. 영상 시청 통계 (추후 확장)

```typescript
// lib/redis.ts에 추가

export async function trackVideoView(userId: string, productId: string) {
  const redis = await ensureConnection();

  const key = `video:views:${productId}:${userId}`;
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  await redis.hIncrBy(key, today, 1);
}

// API 호출 예시
export async function getVideoStats(productId: string) {
  const redis = await ensureConnection();

  const userIds = await redis.sMembers(`product:users:${productId}`);
  let totalViews = 0;

  for (const userId of userIds) {
    const views = await redis.hGetAll(`video:views:${productId}:${userId}`);
    totalViews += Object.values(views).reduce((sum, v) => sum + parseInt(v), 0);
  }

  return {
    totalViewers: userIds.length,
    totalViews,
    avgViewsPerUser: totalViews / userIds.length
  };
}
```

---

## 체크리스트

### 배포 전 확인사항

- [ ] YouTube 영상을 "비공개 목록(Unlisted)"으로 설정
- [ ] 최소 1개 상품에 영상 추가 (테스트용)
- [ ] 테스트 계정으로 구매 → 영상 시청 플로우 확인
- [ ] 모바일 브라우저에서 영상 재생 테스트
- [ ] 비로그인 상태에서 접근 차단 확인
- [ ] Redis 백업 설정 확인

### 운영 가이드라인

- [ ] 주 1회 YouTube Analytics 확인 (비정상 트래픽 감지)
- [ ] 월 1회 구매 기록과 실제 접근 권한 동기화 확인
- [ ] 분기 1회 사용하지 않는 영상 정리
- [ ] 새 인플루언서 onboarding 시 영상 업로드 가이드 제공

---

## 문의 및 지원

### 기술 지원
- **개발 문서**: 이 파일 (`docs/VIDEO-IMPLEMENTATION-GUIDE-KR.md`)
- **API 문서**: Postman Collection (추후 제공)

### 추가 자료
- [YouTube API 문서](https://developers.google.com/youtube)
- [Redis JSON 문서](https://redis.io/docs/stack/json/)
- [NextAuth.js 문서](https://next-auth.js.org/)

---

**마지막 업데이트**: 2025년 1월
**버전**: 1.0.0 (MVP)
