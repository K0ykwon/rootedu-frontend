import HeroSection from '../components/ui/HeroSection';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import PopularInfluencers from '../components/home/PopularInfluencers';
import Link from 'next/link';
import { getRedisClient } from '../lib/redis';

// Fetch real influencer data from Redis
async function getPopularInfluencers() {
  try {
    const redis = await getRedisClient();
    
    // Get top 6 influencers by follower count
    const topInfluencerSlugs = await redis.zRange('influencers:trending', 0, 5, { REV: true });
    
    const influencers = [];
    for (const slug of topInfluencerSlugs) {
      const data = await redis.hGetAll(`influencer:${slug}`);
      if (data && data.name) {
        const influencer = {
          id: data.id,
          slug: data.slug,
          name: data.name,
          username: data.username,
          instagram: data.instagram,
          avatar: data.avatar,
          bio: data.bio,
          description: data.description,
          tags: data.tags ? JSON.parse(data.tags) : [],
          stats: data.stats ? JSON.parse(data.stats) : {}
        };
        influencers.push(influencer);
      }
    }
    
    await redis.quit();
    return influencers;
  } catch (error) {
    console.error('Error fetching influencers:', error);
    return [];
  }
}

// Fetch real products from Redis
async function getPopularProducts() {
  try {
    const redis = await getRedisClient();
    
    // Get all product keys
    const productKeys = await redis.keys('product:*');
    const products = [];
    
    for (const key of productKeys.slice(0, 4)) { // Get first 4 products
      const data = await redis.hGetAll(key);
      if (data && data.title) {
        // Get instructor name from influencer data
        const influencerData = await redis.hGetAll(`influencer:${data.influencerSlug}`);
        
        const product = {
          id: data.id,
          title: data.title,
          instructor: influencerData.name || 'Unknown',
          price: parseInt(data.price),
          level: data.level,
          thumbnail: data.thumbnail,
          summary: data.summary,
          createdAt: parseInt(data.createdAt) || Date.now()
        };
        products.push(product);
      }
    }
    
    // Sort by creation date (newest first) and take top 4
    products.sort((a, b) => b.createdAt - a.createdAt);
    
    await redis.quit();
    return products.slice(0, 4);
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export default async function Home() {
  const popularInfluencers = await getPopularInfluencers();
  const popularCourses = await getPopularProducts();
  
  return (
    <div className="space-y-16 pb-16 premium-gradient noise-texture relative">
      {/* Hero Section */}
      <HeroSection
        title="SKY 학생들이 만드는 학습·진로 인사이트"
        subtitle="전문적이고 양심적인 교육 플랫폼에서 당신의 성장을 함께하세요"
        ctaButtons={{
          primary: {
            text: "지금 시작하기",
            href: "/auth/register",
          }
        }}
      />

      {/* Study Proof Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 backdrop-blur-sm border border-[var(--glass-border)] p-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-500/20 to-red-500/10 rounded-full blur-3xl" />
          <div className="relative z-10 text-center">
            <span className="text-5xl mb-4 block">🔥</span>
            <h2 className="text-3xl font-bold text-[var(--color-text-primary)] mb-3">
              매일 공부 인증하고 보상 받자!
            </h2>
            <p className="text-lg text-[var(--color-text-secondary)] mb-6">
              타이머로 공부 시간을 측정하고, 친구들과 함께 성장하세요
            </p>
            <div className="flex items-center justify-center gap-8 mb-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-[var(--color-primary-400)]">1,234</p>
                <p className="text-sm text-[var(--color-text-secondary)]">지금 공부 중</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-orange-400">567</p>
                <p className="text-sm text-[var(--color-text-secondary)]">오늘 인증 완료</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-red-400">89</p>
                <p className="text-sm text-[var(--color-text-secondary)]">연속 30일+</p>
              </div>
            </div>
            <Link href="/study-proof">
              <Button variant="primary" size="lg" className="metallic-button-green shadow-[0_0_30px_rgba(86,186,125,0.3)]">
                🎯 공부 인증 시작하기
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-semibold text-[var(--color-text-primary)] mb-4">
            핵심 서비스
          </h2>
          <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto">
            RootEdu의 다양한 서비스로 당신의 학습 목표를 달성하세요
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card glass className="text-center p-8 hover-lift hover:shadow-[0_8px_32px_rgba(86,186,125,0.15)] transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-[var(--color-primary-500)] to-[var(--color-primary-400)] rounded-lg mx-auto mb-4 flex items-center justify-center shadow-[0_2px_8px_rgba(86,186,125,0.3)]">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-[var(--color-text-primary)] mb-2">
              인플루언서 탐색
            </h3>
            <p className="text-[var(--color-text-tertiary)] mb-4">
              검증된 SKY 학생 멘토들의 전문 강의와 1:1 멘토링을 만나보세요
            </p>
            <Link href="/influencers">
              <Button variant="outline" className="w-full">
                탐색하기
              </Button>
            </Link>
          </Card>

          <Card glass className="text-center p-8 hover-lift hover:shadow-[0_8px_32px_rgba(86,186,125,0.15)] transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-[var(--color-primary-500)] to-[var(--color-primary-400)] rounded-lg mx-auto mb-4 flex items-center justify-center shadow-[0_2px_8px_rgba(86,186,125,0.3)]">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-[var(--color-text-primary)] mb-2">
              커뮤니티
            </h3>
            <p className="text-[var(--color-text-tertiary)] mb-4">
              동료 학습자들과 경험을 공유하고 함께 성장하는 커뮤니티에 참여하세요
            </p>
            <Link href="/community">
              <Button variant="outline" className="w-full">
                참여하기
              </Button>
            </Link>
          </Card>

          <Card glass className="text-center p-8 hover-lift hover:shadow-[0_8px_32px_rgba(86,186,125,0.15)] transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-[var(--color-primary-500)] to-[var(--color-primary-400)] rounded-lg mx-auto mb-4 flex items-center justify-center shadow-[0_2px_8px_rgba(86,186,125,0.3)]">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-[var(--color-text-primary)] mb-2">
              AI 학습 도구
            </h3>
            <p className="text-[var(--color-text-tertiary)] mb-4">
              AI 기반 학습 도구로 효율적인 학습 계획을 세우고 목표를 달성하세요
            </p>
            <Link href="/tools">
              <Button variant="outline" className="w-full">
                체험하기
              </Button>
            </Link>
          </Card>
        </div>
      </section>

      {/* Popular Influencers Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <PopularInfluencers influencers={popularInfluencers} />
        
        <div className="text-center mt-8">
          <Link href="/influencers">
            <Button variant="primary" size="lg">
              모든 인플루언서 보기
            </Button>
          </Link>
        </div>
      </section>

      {/* Popular Courses Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-2">
            인기 강좌
          </h2>
          <p className="text-[var(--color-text-secondary)]">
            전문가들의 검증된 강의로 실력을 향상시키세요
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {popularCourses.map((course) => (
            <Card key={course.id} glass className="hover-lift hover:shadow-[0_8px_24px_rgba(86,186,125,0.1)] transition-all duration-300">
              <div className="aspect-video bg-[var(--color-bg-tertiary)] rounded-lg mb-4">
                <div className="w-full h-full flex items-center justify-center text-[var(--color-text-quaternary)]">
                  강의 썸네일
                </div>
              </div>
              <h3 className="font-medium text-[var(--color-text-primary)] mb-2">
                {course.title}
              </h3>
              <p className="text-sm text-[var(--color-text-tertiary)] mb-2">
                {course.instructor}
              </p>
              <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                {course.summary}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-[var(--color-primary-500)]">
                  ₩{course.price.toLocaleString()}
                </span>
                <Button variant="outline" size="sm">
                  자세히 보기
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-16 overflow-hidden">
        {/* Glass Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-bg-secondary)] to-[var(--color-bg-primary)] opacity-95" />
        <div className="absolute inset-0 bg-[var(--metallic-gradient)] opacity-20" />
        <div className="absolute inset-0 noise-texture opacity-20" />
        <div className="relative z-10 max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-semibold text-[var(--color-text-primary)] mb-4">
            당신의 학습 여정을 시작하세요
          </h2>
          <p className="text-lg text-[var(--color-text-secondary)] mb-8 max-w-2xl mx-auto">
            SKY 학생들의 검증된 노하우와 전문적인 인사이트로 
            목표를 달성하고 꿈을 이루어보세요
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button variant="primary" size="lg" className="w-full sm:w-auto">
                무료 회원가입
              </Button>
            </Link>
            <Link href="/influencers">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                인플루언서 둘러보기
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
