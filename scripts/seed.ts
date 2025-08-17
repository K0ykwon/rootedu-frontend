import redis, { Influencer, Product, Post, Comment } from '../lib/redis';

const mockInfluencers: Influencer[] = [
  {
    slug: 'jane-doe',
    name: 'Jane Doe',
    username: 'janedoe',
    avatar: '/avatars/jane.jpg',
    bio: 'CS @ SKY, 알고리즘 멘토',
    subjects: ['컴퓨터과학', '알고리즘'],
    tags: ['알고리즘', '면접', 'PS'],
    stats: {
      followers: 15200,
      rating: 4.8,
      reviews: 123,
      students: 1200,
      courses: 4
    },
    socials: {
      youtube: 'https://youtube.com/@janedoe'
    },
    joinDate: Date.now() - 365 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now()
  },
  {
    slug: 'john-smith',
    name: 'John Smith',
    username: 'johnsmith',
    avatar: '/avatars/john.jpg',
    bio: '경영학 @ SKY, 경영전략 전문가',
    subjects: ['경영학', '전략기획'],
    tags: ['경영전략', '컨설팅', 'MBA'],
    stats: {
      followers: 8900,
      rating: 4.6,
      reviews: 87,
      students: 650,
      courses: 3
    },
    socials: {
      instagram: 'https://instagram.com/johnsmith'
    },
    joinDate: Date.now() - 200 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now()
  },
  {
    slug: 'amy-lee',
    name: 'Amy Lee',
    username: 'amylee',
    avatar: '/avatars/amy.jpg',
    bio: '의대생 @ SKY, MCAT 만점자',
    subjects: ['의학', '생명과학'],
    tags: ['의대입시', 'MCAT', '생명과학'],
    stats: {
      followers: 12800,
      rating: 4.9,
      reviews: 156,
      students: 890,
      courses: 5
    },
    socials: {
      youtube: 'https://youtube.com/@amylee',
      instagram: 'https://instagram.com/amylee'
    },
    joinDate: Date.now() - 180 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now()
  },
  {
    slug: 'david-kim',
    name: 'David Kim',
    username: 'davidkim',
    avatar: '/avatars/david.jpg',
    bio: '법학 @ SKY, 로스쿨 진학 전문가',
    subjects: ['법학', '정치학'],
    tags: ['로스쿨', 'LEET', '법학'],
    stats: {
      followers: 7200,
      rating: 4.5,
      reviews: 92,
      students: 420,
      courses: 2
    },
    socials: {
      youtube: 'https://youtube.com/@davidkim'
    },
    joinDate: Date.now() - 150 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now()
  },
  {
    slug: 'sarah-park',
    name: 'Sarah Park',
    username: 'sarahpark',
    avatar: '/avatars/sarah.jpg',
    bio: '수학교육 @ SKY, 수학 올림피아드 금메달',
    subjects: ['수학', '수학교육'],
    tags: ['수학', '올림피아드', '입시수학'],
    stats: {
      followers: 18500,
      rating: 4.7,
      reviews: 203,
      students: 1800,
      courses: 6
    },
    socials: {
      youtube: 'https://youtube.com/@sarahpark',
      twitter: 'https://twitter.com/sarahpark'
    },
    joinDate: Date.now() - 300 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now()
  },
  {
    slug: 'michael-cho',
    name: 'Michael Cho',
    username: 'michaelcho',
    avatar: '/avatars/michael.jpg',
    bio: '물리학 @ SKY, 이론물리학 연구자',
    subjects: ['물리학', '천체물리학'],
    tags: ['물리', '과학', '연구'],
    stats: {
      followers: 6800,
      rating: 4.8,
      reviews: 74,
      students: 380,
      courses: 3
    },
    socials: {
      youtube: 'https://youtube.com/@michaelcho'
    },
    joinDate: Date.now() - 120 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now()
  }
];

const mockProducts: Product[] = [
  {
    id: 'p1',
    influencerSlug: 'jane-doe',
    title: 'PS 초격차 패키지',
    price: 49000,
    level: 'intermediate',
    thumbnail: '/thumbs/p1.jpg',
    summary: '알고리즘 문제해결 능력을 한 단계 업그레이드',
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000
  },
  {
    id: 'p2',
    influencerSlug: 'jane-doe',
    title: '코딩테스트 완전정복',
    price: 79000,
    level: 'advanced',
    thumbnail: '/thumbs/p2.jpg',
    summary: '대기업 코딩테스트 통과를 위한 완벽 가이드',
    createdAt: Date.now() - 45 * 24 * 60 * 60 * 1000
  },
  {
    id: 'p3',
    influencerSlug: 'john-smith',
    title: '경영전략 기초부터 실전까지',
    price: 65000,
    level: 'beginner',
    thumbnail: '/thumbs/p3.jpg',
    summary: '경영전략의 핵심 개념과 실무 적용법',
    createdAt: Date.now() - 20 * 24 * 60 * 60 * 1000
  },
  {
    id: 'p4',
    influencerSlug: 'amy-lee',
    title: 'MCAT 만점 전략',
    price: 89000,
    level: 'advanced',
    thumbnail: '/thumbs/p4.jpg',
    summary: 'MCAT 만점자의 노하우와 학습법',
    createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000
  },
  {
    id: 'p5',
    influencerSlug: 'sarah-park',
    title: '수학 올림피아드 정복',
    price: 55000,
    level: 'advanced',
    thumbnail: '/thumbs/p5.jpg',
    summary: '수학 올림피아드 금메달리스트의 문제해결법',
    createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000
  }
];

const mockPosts: Post[] = [
  {
    id: 'post1',
    authorId: 'user1',
    title: 'SKY 합격 후기 - 수시 전형 준비법',
    body: '안녕하세요! 올해 SKY 대학에 합격한 학생입니다. 수시 전형 준비 과정에서 도움이 되었던 경험들을 공유하고자 합니다...',
    tags: ['수시', '합격후기', 'SKY'],
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
    stats: { likes: 42, comments: 8 }
  },
  {
    id: 'post2',
    authorId: 'user2',
    title: '의대 입시 준비 - 생명과학 공부법',
    body: '의대 입시를 준비하는 학생들을 위한 생명과학 효율적 공부법을 소개합니다...',
    tags: ['의대', '생명과학', '입시'],
    createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
    stats: { likes: 28, comments: 12 }
  }
];

async function seedData() {
  try {
    console.log('🌱 Starting database seeding...');

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
        slug: influencer.slug,
        name: influencer.name,
        username: influencer.username,
        avatar: influencer.avatar,
        bio: influencer.bio,
        subjects: JSON.stringify(influencer.subjects),
        tags: JSON.stringify(influencer.tags),
        stats: JSON.stringify(influencer.stats),
        socials: JSON.stringify(influencer.socials),
        joinDate: String(influencer.joinDate),
        updatedAt: String(influencer.updatedAt),
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