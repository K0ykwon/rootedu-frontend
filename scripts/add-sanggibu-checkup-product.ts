import { createClient } from 'redis'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

// Initialize Redis client
const redis = createClient({
  url: process.env.REDIS_URL
})

const addProduct = async () => {
  const newProduct = {
    id: 'p8',
    influencerSlug: 'yaktoon',
    title: '내 생활기록부 점검하기',
    subtitle: '빠르고 정확한 생기부 진단 서비스',
    price: 49000,
    level: 'beginner',
    thumbnail: '/thumbs/p8.svg',
    summary: '20분 1:1 상담으로 생활기록부 현황 진단 + 개선 포인트 제공',
    description: {
      overview: '현재 생활기록부 상태를 빠르게 진단하고 핵심 개선점을 제시하는 입문형 서비스입니다. 복잡한 장기 컨설팅 전에 현재 상황을 파악하고 싶은 학생들을 위한 맞춤 서비스로, 짧은 시간 내에 전문가의 정확한 진단을 받을 수 있습니다.',
      
      process: [
        {
          step: '1단계 - 생기부 현황 분석',
          content: [
            '현재 생활기록부 전체 구조 파악',
            '각 과목별 세특 현황 점검',
            '활동 기록의 일관성 확인',
            '누락되거나 부족한 영역 식별'
          ]
        },
        {
          step: '2단계 - 문제점 진단',
          content: [
            '스토리 연결성 부족 구간 파악',
            '평가자 관점에서의 약점 분석',
            '경쟁력 저하 요소 식별',
            '개선 우선순위 설정'
          ]
        },
        {
          step: '3단계 - 개선 방향 제시',
          content: [
            '단기 개선 가능한 영역 안내',
            '장기 전략이 필요한 부분 구분',
            '구체적인 액션 아이템 제시',
            '다음 단계 로드맵 안내'
          ]
        },
        {
          step: '4단계 - 후속 상담 연결',
          content: [
            '심화 컨설팅 필요성 판단',
            '개별 맞춤 솔루션 방향 제시',
            '추가 서비스 연결 및 안내',
            '지속적인 관리 방안 논의'
          ]
        }
      ],
      
      deliverables: [
        {
          name: '생기부 진단 체크리스트',
          description: '현재 생활기록부의 강점과 약점을 한눈에 볼 수 있는 체계적인 분석표'
        },
        {
          name: '핵심 개선점 요약서',
          description: '우선적으로 개선해야 할 3-5가지 핵심 포인트와 구체적인 개선 방안'
        },
        {
          name: '추천 액션 플랜',
          description: '단기(1개월), 중기(학기), 장기(학년) 관점의 실행 가능한 액션 아이템'
        }
      ],
      
      expectedOutcomes: [
        '현재 생기부 위치 정확한 파악',
        '개선 우선순위 명확화',
        '실행 가능한 구체적 방향 제시',
        '추가 컨설팅 필요성 판단 지원'
      ],
      
      idealFor: [
        '생기부 현재 상태가 궁금한 학생',
        '개선 방향을 모르겠는 학생',
        '본격적인 컨설팅 전 현황 파악이 필요한 학생',
        '시간과 비용을 절약하면서 전문가 조언을 받고 싶은 학생'
      ],
      
      differentiator: {
        vs_full_consulting: '장기 컨설팅 대비 빠르고 저렴한 진단 중심 서비스',
        vs_self_check: '전문가의 객관적 시각으로 놓치기 쉬운 부분까지 체크',
        unique_value: '20분 안에 핵심 포인트만 정확히 짚어주는 효율성'
      }
    },
    features: [
      '20분 1:1 전문가 상담',
      '생기부 전체 구조 진단',
      '우선순위 기반 개선점 제시',
      '실행 가능한 액션 플랜 제공',
      '후속 서비스 연결 안내'
    ],
    duration: '20분',
    format: '온라인 1:1 상담',
    createdAt: Date.now(),
    updatedAt: Date.now()
  }

  try {
    console.log('Connecting to Redis at:', process.env.REDIS_URL)
    
    // Connect to Redis
    await redis.connect()
    console.log('✅ Connected to Redis successfully')
    
    // Check if product already exists
    const existingProduct = await redis.hGetAll(`product:${newProduct.id}`);
    if (Object.keys(existingProduct).length > 0) {
      console.log(`⚠️ Product ${newProduct.id} already exists. Updating...`)
    } else {
      console.log(`✨ Creating new product ${newProduct.id}...`)
    }
    
    // Add the product to Redis - using the correct key format
    const productKey = `product:${newProduct.id}`;
    const productData: Record<string, string> = {
      id: newProduct.id,
      influencerSlug: newProduct.influencerSlug,
      title: newProduct.title,
      subtitle: newProduct.subtitle || '',
      price: newProduct.price.toString(),
      level: newProduct.level,
      thumbnail: newProduct.thumbnail,
      summary: newProduct.summary,
      description: JSON.stringify(newProduct.description),
      features: JSON.stringify(newProduct.features),
      duration: newProduct.duration || '',
      format: newProduct.format || '',
      createdAt: newProduct.createdAt.toString(),
      updatedAt: newProduct.updatedAt.toString()
    };
    
    await redis.hSet(productKey, productData);
    console.log(`✅ Added/Updated product at key: ${productKey}`)
    
    // Add to influencer's product set
    await redis.sAdd(`influencer:${newProduct.influencerSlug}:products`, newProduct.id);
    console.log(`✅ Added to influencer:${newProduct.influencerSlug}:products set`)
    
    // Verify the product was added
    const verifyProduct = await redis.hGetAll(productKey);
    console.log('✅ Product verification:', {
      id: verifyProduct.id,
      title: verifyProduct.title,
      price: verifyProduct.price,
      influencerSlug: verifyProduct.influencerSlug
    });
    
    // Verify it's in the influencer's products set
    const influencerProducts = await redis.sMembers(`influencer:${newProduct.influencerSlug}:products`);
    console.log(`✅ Yaktoon products count: ${influencerProducts.length}`)
    console.log('✅ All yaktoon products:', influencerProducts)
    
    console.log('🎉 Product "내 생활기록부 점검하기" added successfully!')
    
  } catch (error) {
    console.error('❌ Error adding product:', error)
    process.exit(1)
  } finally {
    await redis.disconnect()
  }
}

// Run the script
addProduct()
  .then(() => {
    console.log('✅ Script completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })