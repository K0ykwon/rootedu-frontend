import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';
import type { CareerAnswer, CareerActivity } from '@/types/career-activities';

// Generate activities based on answers
function generateActivities(answers: CareerAnswer[]): CareerActivity[] {
  const careerAnswer = answers.find(a => a.questionId === 'desired_career');
  const gradeAnswer = answers.find(a => a.questionId === 'current_grade');
  const strengthsAnswer = answers.find(a => a.questionId === 'strengths');
  const preferenceAnswer = answers.find(a => a.questionId === 'activity_preference');
  
  const activities: CareerActivity[] = [];
  
  // Base activities based on career choice
  const careerActivities: Record<string, CareerActivity[]> = {
    medicine: [
      {
        title: '의료 봉사활동 및 병원 탐방',
        description: '지역 의료기관과 연계한 봉사활동을 통해 의료 현장을 직접 체험하고 의료인의 자질을 기릅니다',
        category: '봉사/체험',
        difficulty: 'medium',
        impact: 'high',
        timeRequired: '주 4-6시간',
        skills: ['공감능력', '의료윤리', '현장이해', '봉사정신'],
        examples: [
          '지역 병원 봉사활동 정기 참여',
          '의료 캠프 참가 및 기초 의학 체험',
          '노인요양시설 방문 봉사'
        ],
        tips: [
          '봉사 시간보다 경험의 질과 배움에 집중하세요',
          '의료진과의 대화 기회를 적극 활용하세요',
          '봉사 일지를 구체적으로 작성하세요'
        ]
      },
      {
        title: '생명과학 실험 프로젝트',
        description: '학교 실험실을 활용한 자율적 생명과학 실험을 통해 과학적 탐구 능력을 개발합니다',
        category: '학술/연구',
        difficulty: 'hard',
        impact: 'high',
        timeRequired: '주 6-8시간',
        skills: ['연구능력', '과학적사고', '데이터분석', '보고서작성'],
        examples: [
          'DNA 추출 및 전기영동 실험',
          '미생물 배양 및 항생제 내성 연구',
          '유전자 변형 실험 관찰'
        ],
        tips: [
          '지도교사와 충분한 상담 후 주제를 선정하세요',
          '실험 과정을 상세히 기록하고 사진으로 남기세요',
          '실패한 실험도 중요한 학습 과정입니다'
        ]
      }
    ],
    engineering: [
      {
        title: '프로그래밍 프로젝트 개발',
        description: '실생활 문제를 해결하는 앱이나 웹사이트를 개발하여 기술력과 창의성을 입증합니다',
        category: '개발/창작',
        difficulty: 'hard',
        impact: 'high',
        timeRequired: '주 8-10시간',
        skills: ['프로그래밍', '문제해결', '프로젝트관리', '창의성'],
        examples: [
          '학교 급식 메뉴 알림 앱 개발',
          '시각장애인을 위한 음성 안내 시스템',
          'AI를 활용한 학습 도우미 챗봇'
        ],
        tips: [
          'GitHub에 코드를 체계적으로 관리하세요',
          '사용자 피드백을 받아 지속적으로 개선하세요',
          '개발 과정을 블로그나 문서로 정리하세요'
        ]
      },
      {
        title: '로봇공학 동아리 활동',
        description: '로봇 제작과 프로그래밍을 통해 공학적 사고력과 팀워크를 기릅니다',
        category: '동아리/팀활동',
        difficulty: 'medium',
        impact: 'high',
        timeRequired: '주 5-7시간',
        skills: ['하드웨어이해', '프로그래밍', '팀워크', '창의적설계'],
        examples: [
          '자율주행 로봇 제작 프로젝트',
          '로봇 경진대회 참가 및 수상',
          '초등학생 대상 로봇 교육 봉사'
        ],
        tips: [
          '팀 내에서 명확한 역할을 맡아 전문성을 기르세요',
          '실패와 개선 과정을 상세히 기록하세요',
          '대회 참가를 통해 객관적 성과를 만드세요'
        ]
      }
    ],
    business: [
      {
        title: '모의 창업 프로젝트',
        description: '실제 사업 아이템을 기획하고 사업계획서를 작성하여 기업가 정신을 함양합니다',
        category: '창업/경영',
        difficulty: 'hard',
        impact: 'high',
        timeRequired: '주 6-8시간',
        skills: ['기획력', '시장분석', '재무관리', '프레젠테이션'],
        examples: [
          '학생 대상 중고 교재 거래 플랫폼 기획',
          '친환경 제품 온라인 쇼핑몰 사업계획',
          '지역 특산물 브랜딩 및 마케팅 전략'
        ],
        tips: [
          '실제 시장조사와 고객 인터뷰를 진행하세요',
          '재무 계획은 구체적인 숫자로 작성하세요',
          '창업 경진대회에 참가하여 피드백을 받으세요'
        ]
      },
      {
        title: '경제 동아리 연구 활동',
        description: '경제 이슈를 분석하고 정책 제안서를 작성하여 경제적 사고력을 기릅니다',
        category: '학술/연구',
        difficulty: 'medium',
        impact: 'medium',
        timeRequired: '주 4-5시간',
        skills: ['경제분석', '데이터해석', '보고서작성', '비판적사고'],
        examples: [
          '청소년 금융교육 프로그램 개발',
          '지역경제 활성화 방안 연구',
          '주식투자 시뮬레이션 대회 참가'
        ],
        tips: [
          '경제 신문을 꾸준히 읽고 스크랩하세요',
          '통계청 자료를 활용한 데이터 분석을 포함하세요',
          '전문가 인터뷰를 통해 현장감을 더하세요'
        ]
      }
    ],
    education: [
      {
        title: '교육 봉사 멘토링',
        description: '소외계층 학생들을 대상으로 학습 멘토링을 진행하여 교육자의 자질을 기릅니다',
        category: '봉사/멘토링',
        difficulty: 'medium',
        impact: 'high',
        timeRequired: '주 4-6시간',
        skills: ['교수능력', '인내심', '공감능력', '리더십'],
        examples: [
          '지역아동센터 정기 학습 지도',
          '온라인 화상 멘토링 프로그램 운영',
          '또래 학습 도우미 활동'
        ],
        tips: [
          '학생 개인별 학습 계획을 세워 체계적으로 지도하세요',
          '교육 일지를 작성하여 성장 과정을 기록하세요',
          '다양한 교수법을 시도하고 효과를 분석하세요'
        ]
      },
      {
        title: '교육 콘텐츠 개발',
        description: '창의적인 교육 자료와 프로그램을 개발하여 교육 혁신 역량을 보여줍니다',
        category: '개발/창작',
        difficulty: 'hard',
        impact: 'high',
        timeRequired: '주 5-7시간',
        skills: ['콘텐츠개발', '창의성', '교육공학', '디자인'],
        examples: [
          '과목별 학습 동영상 제작 및 유튜브 운영',
          '게임형 학습 앱 기획 및 개발',
          '창의적 교구 제작 및 활용법 연구'
        ],
        tips: [
          '실제 학생들의 피드백을 받아 개선하세요',
          '교육 효과를 측정할 수 있는 지표를 만드세요',
          '저작권을 준수하며 콘텐츠를 제작하세요'
        ]
      }
    ],
    media: [
      {
        title: '미디어 콘텐츠 제작',
        description: '영상, 팟캐스트, 웹툰 등 다양한 미디어 콘텐츠를 제작하여 창의성을 발휘합니다',
        category: '창작/예술',
        difficulty: 'medium',
        impact: 'high',
        timeRequired: '주 6-8시간',
        skills: ['영상편집', '스토리텔링', '기획력', '창의성'],
        examples: [
          '학교 소식 유튜브 채널 운영',
          '사회 이슈 다큐멘터리 제작',
          '웹툰/일러스트 연재 활동'
        ],
        tips: [
          '꾸준한 업로드로 구독자와 소통하세요',
          '트렌드를 파악하되 자신만의 색깔을 유지하세요',
          '저작권과 초상권을 항상 고려하세요'
        ]
      },
      {
        title: '문화 기획 프로젝트',
        description: '문화 행사나 전시를 기획하고 운영하여 기획력과 실행력을 보여줍니다',
        category: '기획/운영',
        difficulty: 'hard',
        impact: 'high',
        timeRequired: '주 5-7시간',
        skills: ['기획력', '홍보마케팅', '예산관리', '네트워킹'],
        examples: [
          '교내 영화제/예술제 기획 운영',
          '지역 문화 축제 참여 및 부스 운영',
          '온라인 전시회 기획 및 큐레이팅'
        ],
        tips: [
          '기획서를 체계적으로 작성하고 실행하세요',
          '홍보 전략을 다각도로 수립하세요',
          '참가자 피드백을 수집하고 분석하세요'
        ]
      }
    ],
    law: [
      {
        title: '모의재판/모의UN 활동',
        description: '법적 사고력과 논리력을 기르며 사회정의 실현 역량을 개발합니다',
        category: '학술/토론',
        difficulty: 'hard',
        impact: 'high',
        timeRequired: '주 5-7시간',
        skills: ['논리력', '법률지식', '토론능력', '문서작성'],
        examples: [
          '교내외 모의재판 대회 참가',
          '모의UN 총회 대표 활동',
          '청소년 모의국회 참여'
        ],
        tips: [
          '실제 판례와 법령을 충분히 연구하세요',
          '상대방 논리를 예측하고 반박을 준비하세요',
          '전문 용어를 정확히 사용하세요'
        ]
      },
      {
        title: '법률 봉사 및 상담',
        description: '법률 지식을 활용한 봉사활동으로 사회 기여 정신을 실천합니다',
        category: '봉사/상담',
        difficulty: 'medium',
        impact: 'medium',
        timeRequired: '주 3-5시간',
        skills: ['법률이해', '상담능력', '공감능력', '문제해결'],
        examples: [
          '청소년 법률 상담 도우미',
          '학교폭력 예방 캠페인 활동',
          '소비자 권리 보호 활동'
        ],
        tips: [
          '기본적인 법률 지식을 꾸준히 학습하세요',
          '실제 사례를 수집하고 분석하세요',
          '전문가의 조언을 구하며 활동하세요'
        ]
      }
    ],
    science: [
      {
        title: '과학 연구 프로젝트',
        description: '자연과학 분야의 독창적인 연구를 수행하여 과학적 탐구 능력을 입증합니다',
        category: '연구/실험',
        difficulty: 'hard',
        impact: 'high',
        timeRequired: '주 7-10시간',
        skills: ['연구설계', '실험기술', '데이터분석', '논문작성'],
        examples: [
          '환경오염 측정 및 개선 방안 연구',
          '천체 관측 및 데이터 분석 프로젝트',
          '신소재 개발 실험 연구'
        ],
        tips: [
          '가설 설정부터 결론까지 과학적 방법론을 따르세요',
          '실험 노트를 상세히 작성하세요',
          '과학 논문 형식으로 보고서를 작성하세요'
        ]
      },
      {
        title: '과학 멘토링 및 과학관 봉사',
        description: '과학 지식을 나누고 대중화하는 활동으로 소통 능력을 기릅니다',
        category: '봉사/교육',
        difficulty: 'medium',
        impact: 'medium',
        timeRequired: '주 4-6시간',
        skills: ['과학소통', '교육능력', '창의성', '봉사정신'],
        examples: [
          '초등학생 대상 과학 실험 교실 운영',
          '과학관 전시 해설 봉사',
          '과학 유튜브 채널 운영'
        ],
        tips: [
          '복잡한 개념을 쉽게 설명하는 능력을 기르세요',
          '재미있는 실험으로 흥미를 유발하세요',
          '안전을 최우선으로 고려하세요'
        ]
      }
    ],
    social: [
      {
        title: '사회 문제 연구 프로젝트',
        description: '사회 현상을 분석하고 해결책을 제시하는 연구로 비판적 사고력을 기릅니다',
        category: '연구/분석',
        difficulty: 'hard',
        impact: 'high',
        timeRequired: '주 6-8시간',
        skills: ['사회분석', '통계활용', '보고서작성', '비판적사고'],
        examples: [
          '청소년 문화 트렌드 분석 연구',
          '지역 사회 문제 해결 방안 제안',
          '소셜미디어가 청소년에 미치는 영향 연구'
        ],
        tips: [
          '설문조사와 인터뷰로 실증적 데이터를 수집하세요',
          'SPSS 등 통계 프로그램 활용법을 익히세요',
          '학술 논문 형식으로 보고서를 작성하세요'
        ]
      },
      {
        title: '사회 참여 캠페인',
        description: '사회 문제 해결을 위한 캠페인을 기획하고 실행하여 실천력을 보여줍니다',
        category: '캠페인/활동',
        difficulty: 'medium',
        impact: 'high',
        timeRequired: '주 5-7시간',
        skills: ['기획력', '홍보능력', '네트워킹', '실행력'],
        examples: [
          '환경 보호 캠페인 기획 및 실행',
          '인권 신장 프로젝트 운영',
          '다문화 이해 증진 활동'
        ],
        tips: [
          'SNS를 활용한 효과적인 홍보 전략을 수립하세요',
          '지역사회와 연계하여 영향력을 확대하세요',
          '활동 성과를 수치화하여 제시하세요'
        ]
      }
    ]
  };

  // Get base activities for selected career
  const career = careerAnswer?.answer || 'engineering';
  const baseActivities = careerActivities[career as string] || careerActivities.engineering;
  activities.push(...baseActivities);

  // Add preference-based activity
  if (preferenceAnswer?.answer === 'volunteer') {
    activities.push({
      title: '전공 연계 봉사활동',
      description: '진로와 연관된 분야에서 봉사활동을 통해 실무 경험과 봉사정신을 함께 기릅니다',
      category: '봉사활동',
      difficulty: 'easy',
      impact: 'medium',
      timeRequired: '주 3-4시간',
      skills: ['봉사정신', '실무경험', '소통능력', '책임감'],
      examples: [
        '진로 관련 기관에서의 정기 봉사',
        '재능기부 활동 (튜터링, 멘토링)',
        '사회적 기업 봉사활동 참여'
      ],
      tips: [
        '봉사 시간보다 경험의 질에 집중하세요',
        '봉사 일지를 구체적으로 작성하세요',
        '봉사를 통해 배운 점을 정리하세요'
      ]
    });
  }

  // Add strength-based activity
  const strengths = strengthsAnswer?.selectedOptions || strengthsAnswer?.answer || [];
  if (Array.isArray(strengths) && strengths.includes('leadership')) {
    activities.push({
      title: '리더십 프로젝트',
      description: '학생회나 동아리에서 리더 역할을 맡아 프로젝트를 주도합니다',
      category: '리더십',
      difficulty: 'medium',
      impact: 'high',
      timeRequired: '주 5-6시간',
      skills: ['리더십', '기획력', '의사결정', '팀관리'],
      examples: [
        '학생회 주도 학교 개선 프로젝트',
        '동아리 회장으로서 대외 활동 기획',
        '학급 프로젝트 팀장 역할 수행'
      ],
      tips: [
        '팀원들의 의견을 경청하고 조율하세요',
        '명확한 목표와 일정을 설정하세요',
        '리더십 경험을 구체적으로 기록하세요'
      ]
    });
  }

  return activities.slice(0, 3); // Return top 3 activities
}

export async function GET(request: NextRequest) {
  try {
    const redis = await getRedisClient();
    
    // Get user ID from session/auth (simplified for now)
    const userId = request.headers.get('x-user-id') || 'anonymous';
    
    // Try to get existing result
    const existingResult = await redis.hGet(`career-activities:${userId}`, 'result');
    
    if (existingResult) {
      await redis.quit();
      return NextResponse.json({ result: JSON.parse(existingResult) });
    }
    
    await redis.quit();
    return NextResponse.json({ result: null });
  } catch (error) {
    console.error('Failed to fetch career activities:', error);
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { answers, userId } = body;
    
    if (!answers || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Generate activities based on answers
    const activities = generateActivities(answers);
    
    // Save to Redis
    const redis = await getRedisClient();
    
    const result = {
      id: `career_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      answers,
      activities,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Store the result
    await redis.hSet(`career-activities:${userId}`, {
      result: JSON.stringify(result)
    });
    
    await redis.quit();
    
    return NextResponse.json({ 
      activities,
      result 
    });
  } catch (error) {
    console.error('Failed to generate career activities:', error);
    return NextResponse.json(
      { error: 'Failed to generate activities' },
      { status: 500 }
    );
  }
}