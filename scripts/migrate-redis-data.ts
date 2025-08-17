#!/usr/bin/env ts-node

import { createClient } from 'redis';
import bcrypt from 'bcryptjs';

// 타입 정의
interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: number;
}

interface Influencer {
  slug: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  subjects: string[];
  tags: string[];
  stats: {
    followers: number;
    rating: number;
    reviews: number;
    students: number;
    courses: number;
  };
  socials: {
    youtube?: string;
    instagram?: string;
    twitter?: string;
  };
  joinDate: number;
  updatedAt: number;
}

interface Product {
  id: string;
  influencerSlug: string;
  title: string;
  price: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  thumbnail: string;
  summary: string;
  description?: string;
  createdAt: number;
}

interface Post {
  id: string;
  authorId: string;
  title: string;
  body: string;
  tags: string[];
  createdAt: number;
  stats: {
    likes: number;
    comments: number;
  };
}

interface Comment {
  id: string;
  postId: string;
  authorId: string;
  body: string;
  createdAt: number;
}

// Redis 클라이언트 설정
const sourceClient = createClient({ url: 'redis://localhost:6379' });
const targetClient = createClient({ url: 'redis://localhost:6380' });

// 더미 데이터 생성 함수들
async function generateUsers(): Promise<User[]> {
  const saltRounds = 10;
  
  return [
    {
      id: 'user_1',
      name: '김지민',
      email: 'jimin.kim@rootedu.com',
      passwordHash: await bcrypt.hash('password123', saltRounds),
      createdAt: Date.now()
    },
    {
      id: 'user_2', 
      name: '이서현',
      email: 'seohyun.lee@rootedu.com',
      passwordHash: await bcrypt.hash('password123', saltRounds),
      createdAt: Date.now()
    },
    {
      id: 'user_3',
      name: '박민수',
      email: 'minsu.park@rootedu.com', 
      passwordHash: await bcrypt.hash('password123', saltRounds),
      createdAt: Date.now()
    },
    {
      id: 'user_4',
      name: '최영희',
      email: 'younghee.choi@rootedu.com',
      passwordHash: await bcrypt.hash('password123', saltRounds),
      createdAt: Date.now()
    },
    {
      id: 'user_5',
      name: '정다현',
      email: 'dahyun.jung@rootedu.com',
      passwordHash: await bcrypt.hash('password123', saltRounds),
      createdAt: Date.now()
    }
  ];
}

function generateInfluencers(): Influencer[] {
  return [
    {
      slug: 'korean-master-kim',
      name: '김한국어',
      username: '@korean_master_kim',
      avatar: '/avatars/kim-korean.jpg',
      bio: '서울대 국어국문학과 재학 중입니다. 수능 국어 1등급과 내신 1등급을 달성한 노하우를 공유합니다. 문학부터 비문학까지 체계적으로 지도해드려요.',
      subjects: ['국어'],
      tags: ['수능1등급', '내신관리', '문학해석', '비문학독해', '어법'],
      stats: {
        followers: 15420,
        rating: 4.9,
        reviews: 234,
        students: 1250,
        courses: 8
      },
      socials: {
        youtube: 'https://youtube.com/@koreanmasterkim',
        instagram: 'https://instagram.com/korean_master_kim'
      },
      joinDate: Date.now() - 365 * 24 * 60 * 60 * 1000,
      updatedAt: Date.now()
    },
    {
      slug: 'math-genius-lee',
      name: '이수학',
      username: '@math_genius_lee',
      avatar: '/avatars/lee-math.jpg',
      bio: '연세대 수학과 재학생입니다. 고등학교 때 수학 올림피아드 금상을 수상했고, 수능 수학 만점을 받았습니다. 개념부터 심화까지 단계별로 가르쳐드려요.',
      subjects: ['수학'],
      tags: ['수능만점', '올림피아드', '개념정리', '문제해결', '심화학습'],
      stats: {
        followers: 18950,
        rating: 4.8,
        reviews: 312,
        students: 1580,
        courses: 12
      },
      socials: {
        youtube: 'https://youtube.com/@mathgeniuslee',
        instagram: 'https://instagram.com/math_genius_lee',
        twitter: 'https://twitter.com/math_lee'
      },
      joinDate: Date.now() - 280 * 24 * 60 * 60 * 1000,
      updatedAt: Date.now()
    },
    {
      slug: 'english-expert-park',
      name: '박영어',
      username: '@english_expert_park',
      avatar: '/avatars/park-english.jpg',
      bio: '고려대 영어영문학과 재학생입니다. TOEFL 120점 만점, 수능 영어 1등급을 달성했습니다. 영어의 기초부터 고급 독해, 작문까지 모든 영역을 가르쳐드려요.',
      subjects: ['영어'],
      tags: ['TOEFL만점', '수능1등급', '영어독해', '영작문', '영어회화'],
      stats: {
        followers: 12800,
        rating: 4.9,
        reviews: 198,
        students: 980,
        courses: 10
      },
      socials: {
        youtube: 'https://youtube.com/@englishexpertpark',
        instagram: 'https://instagram.com/english_expert_park'
      },
      joinDate: Date.now() - 220 * 24 * 60 * 60 * 1000,
      updatedAt: Date.now()
    },
    {
      slug: 'essay-master-choi',
      name: '최논술',
      username: '@essay_master_choi',
      avatar: '/avatars/choi-essay.jpg',
      bio: '서울대 철학과 재학생입니다. 고등학교 때 전국 논술대회에서 대상을 수상했고, 여러 대학 논술전형으로 합격한 경험이 있습니다. 논리적 사고와 글쓰기를 가르쳐드려요.',
      subjects: ['논술'],
      tags: ['논술대회대상', '논리적사고', '글쓰기', '비판적사고', '인문논술'],
      stats: {
        followers: 8750,
        rating: 4.8,
        reviews: 145,
        students: 650,
        courses: 6
      },
      socials: {
        youtube: 'https://youtube.com/@essaymasterchoi',
        instagram: 'https://instagram.com/essay_master_choi',
        twitter: 'https://twitter.com/essay_choi'
      },
      joinDate: Date.now() - 190 * 24 * 60 * 60 * 1000,
      updatedAt: Date.now()
    },
    {
      slug: 'record-specialist-jung',
      name: '정생기부',
      username: '@record_specialist_jung',
      avatar: '/avatars/jung-record.jpg',
      bio: '연세대 교육학과 재학생입니다. 고등학교 때 학생회장, 동아리 부장 등 다양한 활동을 통해 풍부한 생활기록부를 만들었습니다. 진로에 맞는 활동 설계를 도와드려요.',
      subjects: ['생활기록부'],
      tags: ['진로활동', '동아리관리', '리더십', '봉사활동', '자기소개서'],
      stats: {
        followers: 6420,
        rating: 4.7,
        reviews: 89,
        students: 420,
        courses: 5
      },
      socials: {
        youtube: 'https://youtube.com/@recordspecialistjung',
        instagram: 'https://instagram.com/record_specialist_jung'
      },
      joinDate: Date.now() - 150 * 24 * 60 * 60 * 1000,
      updatedAt: Date.now()
    },
    {
      slug: 'korean-literature-han',
      name: '한문학',
      username: '@korean_literature_han',
      avatar: '/avatars/han-literature.jpg',
      bio: '서울대 국어교육과 재학생입니다. 문학 작품 분석과 해석에 특화되어 있으며, 고전문학부터 현대문학까지 체계적으로 가르쳐드립니다.',
      subjects: ['국어'],
      tags: ['문학분석', '고전문학', '현대문학', '작품해석', '문학사'],
      stats: {
        followers: 9320,
        rating: 4.9,
        reviews: 167,
        students: 720,
        courses: 7
      },
      socials: {
        youtube: 'https://youtube.com/@koreanliteraturehan',
        instagram: 'https://instagram.com/korean_literature_han'
      },
      joinDate: Date.now() - 320 * 24 * 60 * 60 * 1000,
      updatedAt: Date.now()
    },
    {
      slug: 'calc-master-yoo',
      name: '유미적분',
      username: '@calc_master_yoo',
      avatar: '/avatars/yoo-calc.jpg',
      bio: '고려대 수학교육과 재학생입니다. 미적분과 확률통계 분야에서 특히 강점을 보이며, 어려운 개념도 쉽게 설명해드립니다.',
      subjects: ['수학'],
      tags: ['미적분', '확률통계', '개념설명', '문제풀이', '수학의정석'],
      stats: {
        followers: 11650,
        rating: 4.8,
        reviews: 201,
        students: 890,
        courses: 9
      },
      socials: {
        youtube: 'https://youtube.com/@calcmasteryoo',
        instagram: 'https://instagram.com/calc_master_yoo',
        twitter: 'https://twitter.com/calc_yoo'
      },
      joinDate: Date.now() - 240 * 24 * 60 * 60 * 1000,
      updatedAt: Date.now()
    },
    {
      slug: 'toeic-master-shin',
      name: '신토익',
      username: '@toeic_master_shin',
      avatar: '/avatars/shin-toeic.jpg',
      bio: '연세대 통번역학과 재학생입니다. TOEIC 990점 만점을 3번 달성했으며, 실용영어와 시험영어 모두에 강점이 있습니다.',
      subjects: ['영어'],
      tags: ['TOEIC만점', '실용영어', '시험영어', '영어듣기', '영어문법'],
      stats: {
        followers: 14200,
        rating: 4.9,
        reviews: 256,
        students: 1120,
        courses: 11
      },
      socials: {
        youtube: 'https://youtube.com/@toeicmastershin',
        instagram: 'https://instagram.com/toeic_master_shin'
      },
      joinDate: Date.now() - 200 * 24 * 60 * 60 * 1000,
      updatedAt: Date.now()
    }
  ];
}

function generateProducts(): Product[] {
  const now = Date.now();
  
  return [
    {
      id: 'prod_1',
      influencerSlug: 'korean-master-kim',
      title: '수능 국어 1등급을 위한 완벽 가이드',
      price: 89000,
      level: 'intermediate',
      thumbnail: '/thumbnails/korean-grade1.jpg',
      summary: '수능 국어 1등급 달성을 위한 체계적인 학습법과 실전 문제 해결 노하우를 전수합니다.',
      description: '문학부터 비문학까지, 수능 국어의 모든 영역을 효율적으로 마스터할 수 있습니다.',
      createdAt: now - 30 * 24 * 60 * 60 * 1000
    },
    {
      id: 'prod_2', 
      influencerSlug: 'korean-literature-han',
      title: '고전문학 완전 정복',
      price: 69000,
      level: 'beginner',
      thumbnail: '/thumbnails/classic-literature.jpg',
      summary: '고전문학의 핵심 작품들을 체계적으로 분석하고 해석하는 능력을 기릅니다.',
      description: '조선시대부터 일제강점기까지, 주요 고전문학 작품의 배경과 의미를 깊이 있게 학습합니다.',
      createdAt: now - 20 * 24 * 60 * 60 * 1000
    },
    {
      id: 'prod_3',
      influencerSlug: 'math-genius-lee',
      title: '수능 수학 만점 도전 과정',
      price: 129000,
      level: 'advanced',
      thumbnail: '/thumbnails/math-perfect.jpg',
      summary: '수능 수학 만점을 목표로 하는 최고 난이도 문제 해결 능력을 기릅니다.',
      description: '올림피아드 출신 멘토의 노하우로 어떤 킬러 문제도 해결할 수 있는 실력을 만듭니다.',
      createdAt: now - 45 * 24 * 60 * 60 * 1000
    },
    {
      id: 'prod_4',
      influencerSlug: 'calc-master-yoo',
      title: '미적분 개념부터 심화까지',
      price: 99000,
      level: 'intermediate',
      thumbnail: '/thumbnails/calculus-master.jpg',
      summary: '미적분의 기초 개념부터 고난도 응용 문제까지 단계별로 학습합니다.',
      description: '극한, 미분, 적분의 개념을 완벽히 이해하고 실전 문제에 적용하는 능력을 기릅니다.',
      createdAt: now - 15 * 24 * 60 * 60 * 1000
    },
    {
      id: 'prod_5',
      influencerSlug: 'english-expert-park',
      title: 'TOEFL 120점 만점 달성 과정',
      price: 149000,
      level: 'advanced',
      thumbnail: '/thumbnails/toefl-perfect.jpg',
      summary: 'TOEFL 만점 달성을 위한 체계적인 학습 전략과 실전 노하우를 제공합니다.',
      description: 'Reading, Listening, Speaking, Writing 모든 영역에서 만점을 받을 수 있는 실력을 기릅니다.',
      createdAt: now - 25 * 24 * 60 * 60 * 1000
    },
    {
      id: 'prod_6',
      influencerSlug: 'toeic-master-shin',
      title: 'TOEIC 990점 만점 단기 달성',
      price: 119000,
      level: 'intermediate',
      thumbnail: '/thumbnails/toeic-990.jpg',
      summary: '3개월 만에 TOEIC 990점 만점을 달성할 수 있는 효율적인 학습법을 알려드립니다.',
      description: 'LC와 RC 각 영역별 핵심 전략과 실전 문제 풀이 노하우를 체계적으로 학습합니다.',
      createdAt: now - 10 * 24 * 60 * 60 * 1000
    },
    {
      id: 'prod_7',
      influencerSlug: 'essay-master-choi',
      title: '논술 완벽 마스터 - 인문계열',
      price: 109000,
      level: 'intermediate',
      thumbnail: '/thumbnails/essay-humanities.jpg',
      summary: '인문계열 논술의 핵심인 논리적 사고와 체계적인 글쓰기 능력을 기릅니다.',
      description: '비판적 사고력을 바탕으로 한 논리적 글쓰기와 창의적 문제 해결 능력을 개발합니다.',
      createdAt: now - 35 * 24 * 60 * 60 * 1000
    },
    {
      id: 'prod_8',
      influencerSlug: 'essay-master-choi',
      title: '논술 실전 문제 해결 전략',
      price: 89000,
      level: 'advanced',
      thumbnail: '/thumbnails/essay-strategy.jpg',
      summary: '대학별 논술 기출문제 분석과 실전 대응 전략을 통해 합격 가능성을 높입니다.',
      description: '서울대, 연세대, 고려대 등 주요 대학의 논술 유형별 접근법과 답안 작성 노하우를 제공합니다.',
      createdAt: now - 18 * 24 * 60 * 60 * 1000
    },
    {
      id: 'prod_9',
      influencerSlug: 'record-specialist-jung',
      title: '생활기록부 완벽 설계 가이드',
      price: 79000,
      level: 'beginner',
      thumbnail: '/thumbnails/record-design.jpg',
      summary: '진로에 맞는 체계적인 생활기록부 설계와 관리 방법을 알려드립니다.',
      description: '동아리 활동부터 봉사활동까지, 대학 입시에 도움이 되는 생활기록부 작성법을 배웁니다.',
      createdAt: now - 12 * 24 * 60 * 60 * 1000
    },
    {
      id: 'prod_10',
      influencerSlug: 'record-specialist-jung',
      title: '자기소개서 작성의 모든 것',
      price: 69000,
      level: 'intermediate',
      thumbnail: '/thumbnails/self-intro.jpg',
      summary: '합격하는 자기소개서 작성법과 면접 대비 전략을 제공합니다.',
      description: '개인의 경험과 역량을 효과적으로 어필하는 자기소개서 작성 노하우를 배웁니다.',
      createdAt: now - 5 * 24 * 60 * 60 * 1000
    }
  ];
}

function generatePosts(): Post[] {
  const now = Date.now();
  
  return [
    {
      id: 'post_1',
      authorId: 'user_1',
      title: '코딩 초보자를 위한 학습 로드맵',
      body: '프로그래밍을 처음 시작하는 분들을 위한 단계별 학습 가이드입니다. 1단계: 기초 문법 익히기, 2단계: 간단한 프로젝트 만들기, 3단계: 협업 도구 사용법 배우기...',
      tags: ['초보자', '학습', '로드맵', '프로그래밍'],
      createdAt: now - 7 * 24 * 60 * 60 * 1000,
      stats: {
        likes: 24,
        comments: 8
      }
    },
    {
      id: 'post_2',
      authorId: 'user_2',
      title: 'React vs Vue, 어떤 프레임워크를 선택해야 할까?',
      body: '프론트엔드 프레임워크 선택에 고민이 많으신가요? 각각의 장단점을 비교해보고 프로젝트 성격에 따른 선택 기준을 알려드리겠습니다...',
      tags: ['React', 'Vue', '프레임워크', '비교'],
      createdAt: now - 5 * 24 * 60 * 60 * 1000,
      stats: {
        likes: 18,
        comments: 12
      }
    },
    {
      id: 'post_3',
      authorId: 'user_3',
      title: '데이터 사이언티스트가 되기 위한 필수 스킬',
      body: '데이터 사이언스 분야로 전향을 고려하고 계신가요? 통계학, 프로그래밍, 도메인 지식까지 필요한 모든 스킬셋을 정리해드렸습니다...',
      tags: ['데이터사이언스', '커리어', '스킬', '전향'],
      createdAt: now - 3 * 24 * 60 * 60 * 1000,
      stats: {
        likes: 31,
        comments: 15
      }
    },
    {
      id: 'post_4',
      authorId: 'user_4',
      title: 'UI/UX 디자인 트렌드 2024',
      body: '올해 주목해야 할 디자인 트렌드들을 정리해봤습니다. 뉴모피즘의 재등장, 다크모드의 고도화, 마이크로 인터랙션의 중요성...',
      tags: ['UI/UX', '디자인', '트렌드', '2024'],
      createdAt: now - 2 * 24 * 60 * 60 * 1000,
      stats: {
        likes: 42,
        comments: 9
      }
    },
    {
      id: 'post_5',
      authorId: 'user_5',
      title: '블록체인 개발자 로드맵',
      body: 'Web3 개발자가 되고 싶다면? Solidity 기초부터 DeFi 프로토콜 개발까지, 단계별 학습 계획을 세워봤습니다...',
      tags: ['블록체인', 'Web3', '개발자', 'DeFi'],
      createdAt: now - 1 * 24 * 60 * 60 * 1000,
      stats: {
        likes: 27,
        comments: 6
      }
    }
  ];
}

function generateComments(): Comment[] {
  const now = Date.now();
  
  return [
    {
      id: 'comment_1',
      postId: 'post_1',
      authorId: 'user_2',
      body: '정말 유용한 정보네요! 저도 이 로드맵을 따라서 공부해보겠습니다.',
      createdAt: now - 6 * 24 * 60 * 60 * 1000
    },
    {
      id: 'comment_2',
      postId: 'post_1',
      authorId: 'user_3',
      body: '초보자한테 정말 도움이 될 것 같아요. 특히 프로젝트 중심 학습 부분이 인상적입니다.',
      createdAt: now - 6 * 24 * 60 * 60 * 1000
    },
    {
      id: 'comment_3',
      postId: 'post_2',
      authorId: 'user_1',
      body: 'React를 쓰다가 Vue로 넘어갔는데, 정말 러닝커브가 낮더라고요!',
      createdAt: now - 4 * 24 * 60 * 60 * 1000
    },
    {
      id: 'comment_4',
      postId: 'post_2',
      authorId: 'user_4',
      body: '프로젝트 규모에 따라 선택하는 게 맞는 것 같아요. 좋은 비교 글 감사합니다.',
      createdAt: now - 4 * 24 * 60 * 60 * 1000
    },
    {
      id: 'comment_5',
      postId: 'post_3',
      authorId: 'user_5',
      body: '수학 기초가 부족한데 어떻게 보완하면 좋을까요?',
      createdAt: now - 2 * 24 * 60 * 60 * 1000
    }
  ];
}

// 데이터를 Redis에 저장하는 함수
async function saveUsersToRedis(client: any, users: User[]) {
  console.log('💾 사용자 데이터 저장 중...');
  
  for (const user of users) {
    // 사용자 해시 저장
    await client.hSet(`user:${user.id}`, {
      id: user.id,
      name: user.name,
      email: user.email,
      passwordHash: user.passwordHash,
      createdAt: user.createdAt.toString()
    });
    
    // 이메일 인덱스 저장
    await client.set(`user:email:${user.email}`, user.id);
  }
  
  console.log(`✅ ${users.length}명의 사용자 데이터 저장 완료`);
}

async function saveInfluencersToRedis(client: any, influencers: Influencer[]) {
  console.log('👑 인플루언서 데이터 저장 중...');
  
  // 인플루언서 목록 저장
  const influencerSlugs = influencers.map(inf => inf.slug);
  await client.del('influencers'); // 기존 데이터 삭제
  if (influencerSlugs.length > 0) {
    await client.sAdd('influencers', influencerSlugs);
  }
  
  for (const influencer of influencers) {
    // 인플루언서 해시 저장
    await client.hSet(`influencer:${influencer.slug}`, {
      slug: influencer.slug,
      name: influencer.name,
      username: influencer.username,
      avatar: influencer.avatar,
      bio: influencer.bio,
      subjects: JSON.stringify(influencer.subjects),
      tags: JSON.stringify(influencer.tags),
      stats: JSON.stringify(influencer.stats),
      socials: JSON.stringify(influencer.socials),
      joinDate: influencer.joinDate.toString(),
      updatedAt: influencer.updatedAt.toString()
    });
    
    // 인플루언서별 상품 목록 초기화
    await client.del(`influencer:${influencer.slug}:products`);
  }
  
  console.log(`✅ ${influencers.length}명의 인플루언서 데이터 저장 완료`);
}

async function saveProductsToRedis(client: any, products: Product[]) {
  console.log('📦 상품 데이터 저장 중...');
  
  for (const product of products) {
    // 상품 해시 저장
    await client.hSet(`product:${product.id}`, {
      id: product.id,
      influencerSlug: product.influencerSlug,
      title: product.title,
      price: product.price.toString(),
      level: product.level,
      thumbnail: product.thumbnail,
      summary: product.summary,
      description: product.description || '',
      createdAt: product.createdAt.toString()
    });
    
    // 인플루언서별 상품 목록에 추가
    await client.sAdd(`influencer:${product.influencerSlug}:products`, product.id);
  }
  
  console.log(`✅ ${products.length}개의 상품 데이터 저장 완료`);
}

async function savePostsToRedis(client: any, posts: Post[]) {
  console.log('📝 게시글 데이터 저장 중...');
  
  // 커뮤니티 포스트 목록 저장
  const postIds = posts.map(post => post.id);
  await client.del('community:posts'); // 기존 데이터 삭제
  if (postIds.length > 0) {
    await client.sAdd('community:posts', postIds);
  }
  
  for (const post of posts) {
    // 게시글 해시 저장
    await client.hSet(`post:${post.id}`, {
      id: post.id,
      authorId: post.authorId,
      title: post.title,
      body: post.body,
      tags: JSON.stringify(post.tags),
      createdAt: post.createdAt.toString(),
      stats: JSON.stringify(post.stats)
    });
  }
  
  console.log(`✅ ${posts.length}개의 게시글 데이터 저장 완료`);
}

async function saveCommentsToRedis(client: any, comments: Comment[]) {
  console.log('💬 댓글 데이터 저장 중...');
  
  for (const comment of comments) {
    // 댓글 해시 저장
    await client.hSet(`comment:${comment.id}`, {
      id: comment.id,
      postId: comment.postId,
      authorId: comment.authorId,
      body: comment.body,
      createdAt: comment.createdAt.toString()
    });
    
    // 게시글별 댓글 목록에 추가
    await client.sAdd(`post:${comment.postId}:comments`, comment.id);
  }
  
  console.log(`✅ ${comments.length}개의 댓글 데이터 저장 완료`);
}

// 메인 실행 함수
async function main() {
  try {
    console.log('🚀 Redis 데이터 마이그레이션 시작...\n');
    
    // Redis 클라이언트 연결
    console.log('🔌 Redis 클라이언트 연결 중...');
    await sourceClient.connect();
    await targetClient.connect();
    console.log('✅ Redis 클라이언트 연결 완료\n');
    
    // 기존 데이터를 6380으로 마이그레이션
    console.log('📋 기존 데이터 마이그레이션 중...');
    const keys = await sourceClient.keys('*');
    console.log(`📊 마이그레이션할 키 개수: ${keys.length}`);
    
    for (const key of keys) {
      const type = await sourceClient.type(key);
      
      switch (type) {
        case 'string':
          const stringValue = await sourceClient.get(key);
          if (stringValue !== null) {
            await targetClient.set(key, stringValue);
          }
          break;
        case 'hash':
          const hashValue = await sourceClient.hGetAll(key);
          await targetClient.hSet(key, hashValue);
          break;
        case 'set':
          const setMembers = await sourceClient.sMembers(key);
          if (setMembers.length > 0) {
            await targetClient.sAdd(key, setMembers);
          }
          break;
        case 'list':
          const listValues = await sourceClient.lRange(key, 0, -1);
          if (listValues.length > 0) {
            await targetClient.rPush(key, listValues);
          }
          break;
        case 'zset':
          const zsetValues = await sourceClient.zRangeWithScores(key, 0, -1);
          if (zsetValues.length > 0) {
            const args = [];
            for (const item of zsetValues) {
              args.push({ score: item.score, value: item.value });
            }
            await targetClient.zAdd(key, args);
          }
          break;
      }
    }
    console.log('✅ 기존 데이터 마이그레이션 완료\n');
    
    // 더미 데이터 생성 및 저장
    console.log('🎲 더미 데이터 생성 중...\n');
    
    const users = await generateUsers();
    const influencers = generateInfluencers();
    const products = generateProducts();
    const posts = generatePosts();
    const comments = generateComments();
    
    // 데이터를 6380에 저장
    await saveUsersToRedis(targetClient, users);
    await saveInfluencersToRedis(targetClient, influencers);
    await saveProductsToRedis(targetClient, products);
    await savePostsToRedis(targetClient, posts);
    await saveCommentsToRedis(targetClient, comments);
    
    console.log('\n🧹 6379 데이터베이스 정리 중...');
    await sourceClient.flushDb();
    console.log('✅ 6379 데이터베이스 정리 완료');
    
    // 최종 결과 확인
    console.log('\n📊 마이그레이션 결과:');
    const finalKeys = await targetClient.keys('*');
    console.log(`✨ 6380 포트 총 키 개수: ${finalKeys.length}`);
    
    const source6379Keys = await sourceClient.keys('*');
    console.log(`🧹 6379 포트 총 키 개수: ${source6379Keys.length} (정리됨)`);
    
    console.log('\n🎉 데이터 마이그레이션이 성공적으로 완료되었습니다!');
    
  } catch (error) {
    console.error('❌ 마이그레이션 중 오류 발생:', error);
    throw error;
  } finally {
    // 연결 종료
    await sourceClient.quit();
    await targetClient.quit();
    console.log('🔌 Redis 연결 종료');
  }
}

// 스크립트 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default main;