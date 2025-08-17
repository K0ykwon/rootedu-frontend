import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '../../../lib/redis';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const sort = searchParams.get('sort') || 'popular';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '12'), 24);

    // Redis 연결 보장 후 조회
    const redis = await getRedisClient();
    const influencerSlugs = await redis.sMembers('influencers');
    let influencers = [];

    for (const slug of influencerSlugs) {
      const data = await redis.hGetAll(`influencer:${slug}`);
      if (data && data.name) {
        // Redis hash에서 가져온 데이터를 파싱
        const influencer = {
          slug: data.slug,
          name: data.name,
          username: data.username,
          avatar: data.avatar,
          bio: data.bio,
          subjects: data.subjects ? JSON.parse(data.subjects) : [],
          tags: data.tags ? JSON.parse(data.tags) : [],
          stats: data.stats ? JSON.parse(data.stats) : {},
          socials: data.socials ? JSON.parse(data.socials) : {},
          joinDate: parseInt(data.joinDate || '0'),
          updatedAt: parseInt(data.updatedAt || '0')
        };
        influencers.push(influencer);
      }
    }

    // 검색 필터링
    if (q) {
      const searchLower = q.toLowerCase();
      influencers = influencers.filter(inf => 
        inf.name.toLowerCase().includes(searchLower) ||
        inf.username.toLowerCase().includes(searchLower) ||
        inf.bio.toLowerCase().includes(searchLower) ||
        inf.tags.some((tag: string) => tag.toLowerCase().includes(searchLower)) ||
        inf.subjects.some((subject: string) => subject.toLowerCase().includes(searchLower))
      );
    }

    // 카테고리 필터링
    if (category) {
      influencers = influencers.filter(inf => 
        inf.subjects.includes(category) || inf.tags.includes(category)
      );
    }

    // 정렬
    switch (sort) {
      case 'popular':
        influencers.sort((a, b) => (b.stats.followers || 0) - (a.stats.followers || 0));
        break;
      case 'rating':
        influencers.sort((a, b) => (b.stats.rating || 0) - (a.stats.rating || 0));
        break;
      case 'students':
        influencers.sort((a, b) => (b.stats.students || 0) - (a.stats.students || 0));
        break;
      case 'recent':
        influencers.sort((a, b) => b.updatedAt - a.updatedAt);
        break;
      default:
        break;
    }

    // 페이지네이션
    const total = influencers.length;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedInfluencers = influencers.slice(startIndex, endIndex);

    return NextResponse.json({
      items: paginatedInfluencers,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    });

  } catch (error) {
    console.error('Error fetching influencers:', error);
    return NextResponse.json({ error: 'Failed to fetch influencers' }, { status: 500 });
  }
}