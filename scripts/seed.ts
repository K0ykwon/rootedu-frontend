import { createClient } from 'redis';
import { Influencer, Product, Post, Comment } from '../lib/redis';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local file explicitly
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Create Redis client that ONLY uses Redis Cloud URL
const REDIS_CLOUD_URL = process.env.REDIS_URL || 'redis://default:uidvu100wo6pdWxdrXoE1HaHx33mWDRA@redis-15676.c266.us-east-1-3.ec2.redns.redis-cloud.com:15676';
const redis = createClient({
  url: REDIS_CLOUD_URL,
  database: 0
});

const mockInfluencers: Influencer[] = [
  {
    id: '1',
    slug: 'yaktoon',
    name: '알약툰',
    username: 'yaktoon',
    instagram: 'yaktoon',
    avatar: '',
    bio: 'Medical, SKY 출신 대학 멘토들의 대입 컨설팅',
    description: '1:1 맞춤 코칭 + 알약툰 무료 체험으로 배우는 스마트 학습 관리',
    tags: ['생기부관리', '수시 컨설팅', '정시 컨설팅'],
    stats: {
      followers: 24700,
      free_courses: 1,
      paid_courses: 1
    }
  },
  {
    id: '2',
    slug: 'hana',
    name: '하나쌤',
    username: 'studypacer_hana',
    instagram: 'studypacer_hana',
    avatar: '',
    bio: '초, 중, 고 학습 & 진로설계, 20년 현장 경험',
    description: 'AI 분석을 통한 아이 공부를 위한 학부모 컨설팅 & 멘탈관리 서비스',
    tags: ['학부모상담', '공부법 관리', '멘탈관리'],
    stats: {
      followers: 21400,
      free_courses: 1,
      paid_courses: 1
    }
  },
  {
    id: '3',
    slug: 'parantsnote',
    name: '부모노트',
    username: 'parants.note',
    instagram: 'parants.note',
    avatar: '',
    bio: '대기업연구원, 육아서 2권 출간, 조선일보 칼럼기고 6년',
    description: '우리 아이에게 맞춤 공부 루틴과 부모 코칭 VOD 제공하는 AI 서비스',
    tags: ['맞춤공부', '학부모코칭', '학습코치'],
    stats: {
      followers: 21400,
      free_courses: 1,
      paid_courses: 1
    }
  },
  {
    id: '4',
    slug: 'terry',
    name: '테리영어',
    username: 'terry_english153',
    instagram: 'terry_english153',
    avatar: '',
    bio: '토론토대학교 언어학과, 케나다/한국 이중국적, 25년 영어과외 경력',
    description: '유학생과 학부모를 위한 시간 아껴주는 실전 영어 학습 AI',
    tags: ['시간절약영어', '실전회화'],
    stats: {
      followers: 21400,
      free_courses: 1,
      paid_courses: 1
    }
  },
  {
    id: '5',
    slug: 'unova',
    name: '유노바',
    username: 'unova_study',
    instagram: 'unova_study',
    avatar: '',
    bio: '최상위권 선생님들이 집필한 올인원 수능 과외책 및 코칭',
    description: '문제 풀이의 알고리즘을 배우는 체계적인 구조 기반 수능 수학·물리 AI 코칭',
    tags: ['문제풀이 알고리즘', '수학코칭', '물리코칭'],
    stats: {
      followers: 6571,
      free_courses: 1,
      paid_courses: 1
    }
  },
  {
    id: '6',
    slug: 'kor.artis',
    name: '길품국어',
    username: 'kor.artis',
    instagram: 'kor.artis',
    avatar: '',
    bio: '고려대학교 국어국문학과 | 수능 국어 길잡이',
    description: 'AI가 우리 아이 국어 독해·어휘 수준을 진단하고, 맞춤 루틴과 실행 코칭을 제공하는 학습 서비스',
    tags: ['국어코칭', '맞춤독해루틴', '어휘력성정'],
    stats: {
      followers: 8935,
      free_courses: 1,
      paid_courses: 1
    }
  },
  {
    id: '7',
    slug: 'christine',
    name: '크리스틴영어',
    username: 'englishlab_christine',
    instagram: 'englishlab_christine',
    avatar: '',
    bio: '14년차 영어강사 | 영어를 통한 당신의 변화를 돕습니다.',
    description: '비즈니스·취업·일상·다문화까지, 상황별 맞춤형 영어 학습과 실전 코칭을 제공하는 올인원 교육 패키지',
    tags: ['비즈니스영어', '취업영어', '실전회화'],
    stats: {
      followers: 8681,
      free_courses: 1,
      paid_courses: 1
    }
  }
];

const mockProducts: Product[] = [
  {
    id: 'p1',
    influencerSlug: 'yaktoon',
    title: '생기부 완벽 가이드',
    price: 49000,
    level: 'intermediate',
    thumbnail: '/thumbs/p1.jpg',
    summary: 'SKY 멘토들의 생기부 관리 전략과 실전 팁',
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000
  },
  {
    id: 'p2',
    influencerSlug: 'hana',
    title: '학부모 공부법 코칭',
    price: 79000,
    level: 'beginner',
    thumbnail: '/thumbs/p2.jpg',
    summary: '20년 현장 경험의 노하우로 배우는 자녀 학습 관리',
    createdAt: Date.now() - 45 * 24 * 60 * 60 * 1000
  },
  {
    id: 'p3',
    influencerSlug: 'parantsnote',
    title: '맞춤 공부 루틴 설계',
    price: 65000,
    level: 'beginner',
    thumbnail: '/thumbs/p3.jpg',
    summary: 'AI 기반 우리 아이 맞춤형 학습 전략',
    createdAt: Date.now() - 20 * 24 * 60 * 60 * 1000
  },
  {
    id: 'p4',
    influencerSlug: 'terry',
    title: '실전 영어 속성 코스',
    price: 89000,
    level: 'intermediate',
    thumbnail: '/thumbs/p4.jpg',
    summary: '유학생과 학부모를 위한 실용 영어 마스터',
    createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000
  },
  {
    id: 'p5',
    influencerSlug: 'unova',
    title: '수능 수학 알고리즘',
    price: 55000,
    level: 'advanced',
    thumbnail: '/thumbs/p5.jpg',
    summary: '문제 풀이의 체계적 알고리즘 학습',
    createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000
  },
  {
    id: 'p6',
    influencerSlug: 'kor.artis',
    title: '국어 독해력 완성',
    price: 45000,
    level: 'intermediate',
    thumbnail: '/thumbs/p6.jpg',
    summary: 'AI 진단 기반 맞춤 독해 루틴',
    createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000
  },
  {
    id: 'p7',
    influencerSlug: 'christine',
    title: '비즈니스 영어 마스터',
    price: 75000,
    level: 'advanced',
    thumbnail: '/thumbs/p7.jpg',
    summary: '실무에 바로 쓰는 비즈니스 영어 완성',
    createdAt: Date.now() - 25 * 24 * 60 * 60 * 1000
  }
];

const mockPosts: Post[] = [
  {
    id: 'post1',
    authorId: 'user1',
    communityType: 'high',
    title: 'SKY 합격 후기 - 수시 전형 준비법',
    body: '안녕하세요! 올해 SKY 대학에 합격한 학생입니다. 수시 전형 준비 과정에서 도움이 되었던 경험들을 공유하고자 합니다...',
    tags: ['수시', '합격후기', 'SKY'],
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
    stats: { likes: 42, comments: 8, views: 324 }
  },
  {
    id: 'post2',
    authorId: 'user2',
    communityType: 'high',
    title: '의대 입시 준비 - 생명과학 공부법',
    body: '의대 입시를 준비하는 학생들을 위한 생명과학 효율적 공부법을 소개합니다...',
    tags: ['의대', '생명과학', '입시'],
    createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
    stats: { likes: 28, comments: 12, views: 156 }
  }
];

async function seedData() {
  try {
    console.log('🌱 Starting database seeding...');
    console.log(`📍 Connecting to Redis Cloud at: ${REDIS_CLOUD_URL.replace(/:[^:@]+@/, ':****@')}`);

    // Connect to Redis if not connected
    if (!redis.isOpen) {
      await redis.connect();
    }

    // Clear existing data
    await redis.flushDb();

    // Seed influencers
    for (const influencer of mockInfluencers) {
      // Convert objects to JSON strings for Redis storage, and ensure hash values are strings
      const influencerData: Record<string, string> = {
        id: influencer.id,
        slug: influencer.slug,
        name: influencer.name,
        username: influencer.username,
        instagram: influencer.instagram,
        avatar: influencer.avatar,
        bio: influencer.bio,
        description: influencer.description,
        tags: JSON.stringify(influencer.tags),
        stats: JSON.stringify(influencer.stats)
      };

      await redis.hSet(`influencer:${influencer.slug}`, influencerData);
      await redis.sAdd('influencers', influencer.slug);
      await redis.zAdd('influencers:trending', {
        score: influencer.stats.followers,
        value: influencer.slug
      });
    }

    // Seed products
    for (const product of mockProducts) {
      const productData: Record<string, string> = {
        id: product.id,
        influencerSlug: product.influencerSlug,
        title: product.title,
        price: String(product.price),
        level: product.level,
        thumbnail: product.thumbnail,
        summary: product.summary,
        createdAt: String(product.createdAt),
      };
      await redis.hSet(`product:${product.id}`, productData);
      await redis.sAdd(`influencer:${product.influencerSlug}:products`, product.id);
    }

    // Seed posts
    for (const post of mockPosts) {
      const postData: Record<string, string> = {
        id: post.id,
        authorId: post.authorId,
        title: post.title,
        body: post.body,
        tags: JSON.stringify(post.tags),
        createdAt: String(post.createdAt),
        stats: JSON.stringify(post.stats),
      };
      await redis.hSet(`post:${post.id}`, postData);
      await redis.lPush('community:posts', post.id);
    }

    console.log('✅ Database seeding completed successfully!');
    console.log(`   - ${mockInfluencers.length} influencers`);
    console.log(`   - ${mockProducts.length} products`);
    console.log(`   - ${mockPosts.length} posts`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await redis.quit();
  }
}

if (require.main === module) {
  seedData();
}

export default seedData;