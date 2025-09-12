import { createClient } from 'redis'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

// Initialize Redis client
const redis = createClient({
  url: process.env.REDIS_URL
})

const updateProduct = async () => {
  const updatedProduct = {
    id: 'p1',
    influencerSlug: 'yaktoon',
    title: '생기부 완벽 컨설팅',
    subtitle: '대입 성공을 위한 체계적 생기부 관리 시스템',
    price: 500000,
    level: 'advanced',
    thumbnail: '/thumbs/p1.jpg',
    summary: '진단부터 마감까지 1:1 맞춤 생기부 컨설팅. 학기별 4회 필수 세션과 장기 관리를 통한 완벽한 생활기록부 구성',
    description: {
      overview: '학생부종합전형 대비 체계적 생기부 관리 프로그램. 진단-점검-마감의 필수 4회 세션과 추가 장기관리로 완벽한 생활기록부를 완성합니다.',
      
      timeline: [
        {
          phase: '1회차 - 진단 & 로드맵',
          timing: '학기 초 (시기 무관)',
          duration: '60분',
          content: [
            '생기부 작성 요령 및 평가자 관점 이해',
            '학생 스토리 파악 및 내러티브 점검',
            '과목별 세특 및 성적 세부 진단',
            '생기부 종합 평가 및 우선순위 선정',
            '개인 맞춤 로드맵 수립'
          ],
          deliverables: ['개인 진단서', '종합평가 리포트', '과목별 세부 진단표', '학기별 로드맵']
        },
        {
          phase: '중간점검 1',
          timing: '중간고사 직후 (5월/10월)',
          duration: '60분',
          content: [
            '모의고사 및 내신 성적 분석',
            '로드맵 진행상황 점검',
            '우선순위 재조정',
            '과목별 보고서 초안 작성'
          ],
          deliverables: ['성적 분석 리포트', '업데이트 로드맵', '컨설턴트 총평', '보고서 초안']
        },
        {
          phase: '중간점검 2',
          timing: '기말고사 직후 (7월/12월)',
          duration: '60분',
          content: [
            '기말 성적 반영 분석',
            '로드맵 재점검 및 보완',
            '마감 대비 총평',
            '보고서 개정 작업'
          ],
          deliverables: ['보완 체크리스트', '개정 로드맵', '보고서 개정안']
        },
        {
          phase: '마감 컨설팅',
          timing: '생기부 마감시즌 (7-8월/12월)',
          duration: '60분',
          content: [
            '로드맵 최종 점검',
            '증빙 자료 확인',
            '과목별 세특 실시간 수정',
            '보고서 최종 마감'
          ],
          deliverables: ['세특 수정안/완성안', '최종 보고서']
        }
      ],
      
      additionalServices: {
        longTermManagement: {
          title: '장기 관리 수업 (N회)',
          description: '필수 4회 외 추가 세션. 과목별 보고서 작성과 세특 준비에 집중',
          modules: [
            '과목별 심화 보고서 작성',
            '세특 준비 및 증빙 정리',
            '수행평가/발표 보조',
            '활동 기록 정리 및 키워드 설계'
          ],
          duration: '30분 또는 60분 선택'
        },
        continuousFeedback: {
          title: '상시 피드백',
          description: '수업 사이 채팅 지원으로 빠른 질의응답',
          services: [
            '보고서 주제 추천',
            '세특 문구 빠른 수정',
            '계획 점검 및 일정 조정',
            '과제 체크리스트 확인'
          ]
        }
      },
      
      expectedOutcomes: [
        '유기적 스토리 설계: 흩어진 활동을 체계적 구조로 연결',
        '기록 품질 향상: 근거와 결과가 연결된 신뢰도 높은 세특',
        '시간 관리 효율화: 핵심 시점 개입으로 막판 품질 저하 방지',
        '학생부종합전형 경쟁력 극대화'
      ],
      
      methodology: {
        principle: '세특은 대필하지 않습니다. 컨설턴트는 가이드와 증빙을 준비하고, 학생과 함께 최종 문장을 완성합니다.',
        approach: [
          '객관적 진단 기반 맞춤 전략',
          '실시간 협업을 통한 공동 작업',
          '증빙 기반 스토리텔링',
          '평가자 관점의 구조화'
        ]
      },
      
      targetAudience: [
        '학생부종합전형 준비 학생',
        '체계적 생기부 관리가 필요한 학생',
        '세특 작성에 어려움을 겪는 학생',
        '대입 경쟁력을 높이고자 하는 학생'
      ]
    },
    features: [
      '1:1 맞춤 컨설팅',
      '학기별 체계적 관리',
      '실시간 협업 작업',
      '상시 피드백 지원',
      '증빙 기반 스토리텔링'
    ],
    duration: '학기별 필수 4회 + 추가 N회',
    format: '온라인 1:1 컨설팅',
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now()
  }

  try {
    console.log('Connecting to Redis at:', process.env.REDIS_URL)
    
    // Connect to Redis
    await redis.connect()
    console.log('✅ Connected to Redis successfully')
    
    // Update the product in Redis - using the correct key format
    const productKey = `product:${updatedProduct.id}`;
    const productData: Record<string, string> = {
      id: updatedProduct.id,
      influencerSlug: updatedProduct.influencerSlug,
      title: updatedProduct.title,
      subtitle: updatedProduct.subtitle || '',
      price: updatedProduct.price.toString(),
      level: updatedProduct.level,
      thumbnail: updatedProduct.thumbnail,
      summary: updatedProduct.summary,
      description: JSON.stringify(updatedProduct.description),
      features: JSON.stringify(updatedProduct.features),
      duration: updatedProduct.duration || '',
      format: updatedProduct.format || '',
      createdAt: updatedProduct.createdAt.toString(),
      updatedAt: updatedProduct.updatedAt.toString()
    };
    
    await redis.hSet(productKey, productData);
    console.log(`✅ Updated product at key: ${productKey}`)
    
    // Also ensure it's in the influencer's product set
    await redis.sAdd(`influencer:${updatedProduct.influencerSlug}:products`, updatedProduct.id);
    console.log(`✅ Added to influencer:${updatedProduct.influencerSlug}:products set`)
    
    console.log('✅ Product p1 updated successfully!')
    console.log('Updated product:', updatedProduct)
  } catch (error) {
    console.error('❌ Error updating product:', error)
    process.exit(1)
  } finally {
    await redis.disconnect()
  }
}

// Run the update
updateProduct()
  .then(() => {
    console.log('Update complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Update failed:', error)
    process.exit(1)
  })