import HeroSection from '../components/ui/HeroSection';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import InfluencerGrid from '../components/ui/InfluencerGrid';
import TrendingBadge from '../components/ui/TrendingBadge';
import Link from 'next/link';

// Mock data for preview sections
const mockInfluencers = [
  {
    id: '1',
    slug: 'jane-doe',
    name: 'Jane Doe',
    username: 'janedoe',
    avatar: '/avatars/jane.jpg',
    bio: 'CS @ SKY, 알고리즘 멘토',
    tags: ['알고리즘', '면접'],
    stats: { followers: 15200, rating: 4.8, reviews: 123, students: 1200, courses: 4 }
  },
  {
    id: '2',
    slug: 'john-smith',
    name: 'John Smith',
    username: 'johnsmith',
    avatar: '/avatars/john.jpg',
    bio: '경영학 @ SKY, 경영전략 전문가',
    tags: ['경영전략', 'MBA'],
    stats: { followers: 8900, rating: 4.6, reviews: 87, students: 650, courses: 3 }
  },
  {
    id: '3',
    slug: 'amy-lee',
    name: 'Amy Lee',
    username: 'amylee',
    avatar: '/avatars/amy.jpg',
    bio: '의대생 @ SKY, MCAT 만점자',
    tags: ['의대입시', 'MCAT'],
    stats: { followers: 12800, rating: 4.9, reviews: 156, students: 890, courses: 5 }
  },
  {
    id: '4',
    slug: 'david-kim',
    name: 'David Kim',
    username: 'davidkim',
    avatar: '/avatars/david.jpg',
    bio: '법학 @ SKY, 로스쿨 진학 전문가',
    tags: ['로스쿨', 'LEET'],
    stats: { followers: 7200, rating: 4.5, reviews: 92, students: 420, courses: 2 }
  },
  {
    id: '5',
    slug: 'sarah-park',
    name: 'Sarah Park',
    username: 'sarahpark',
    avatar: '/avatars/sarah.jpg',
    bio: '수학교육 @ SKY, 수학 올림피아드 금메달',
    tags: ['수학', '올림피아드'],
    stats: { followers: 18500, rating: 4.7, reviews: 203, students: 1800, courses: 6 }
  },
  {
    id: '6',
    slug: 'michael-cho',
    name: 'Michael Cho',
    username: 'michaelcho',
    avatar: '/avatars/michael.jpg',
    bio: '물리학 @ SKY, 이론물리학 연구자',
    tags: ['물리', '과학'],
    stats: { followers: 6800, rating: 4.8, reviews: 74, students: 380, courses: 3 }
  }
];

const mockCourses = [
  {
    id: 'p1',
    title: 'PS 초격차 패키지',
    instructor: 'Jane Doe',
    price: 49000,
    level: 'intermediate',
    thumbnail: '/thumbs/p1.jpg',
    summary: '알고리즘 문제해결 능력을 한 단계 업그레이드'
  },
  {
    id: 'p2',
    title: '경영전략 기초부터 실전까지',
    instructor: 'John Smith',
    price: 65000,
    level: 'beginner',
    thumbnail: '/thumbs/p3.jpg',
    summary: '경영전략의 핵심 개념과 실무 적용법'
  },
  {
    id: 'p3',
    title: 'MCAT 만점 전략',
    instructor: 'Amy Lee',
    price: 89000,
    level: 'advanced',
    thumbnail: '/thumbs/p4.jpg',
    summary: 'MCAT 만점자의 노하우와 학습법'
  },
  {
    id: 'p4',
    title: '수학 올림피아드 정복',
    instructor: 'Sarah Park',
    price: 55000,
    level: 'advanced',
    thumbnail: '/thumbs/p5.jpg',
    summary: '수학 올림피아드 금메달리스트의 문제해결법'
  }
];

export default function Home() {
  return (
    <div className="space-y-16 pb-16">
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
          <Card className="text-center p-8 hover-lift">
            <div className="w-12 h-12 bg-[var(--color-primary-500)] rounded-lg mx-auto mb-4 flex items-center justify-center">
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

          <Card className="text-center p-8 hover-lift">
            <div className="w-12 h-12 bg-[var(--color-primary-500)] rounded-lg mx-auto mb-4 flex items-center justify-center">
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

          <Card className="text-center p-8 hover-lift">
            <div className="w-12 h-12 bg-[var(--color-primary-500)] rounded-lg mx-auto mb-4 flex items-center justify-center">
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-2">
              인기 인플루언서
            </h2>
            <p className="text-[var(--color-text-secondary)]">
              검증된 SKY 학생 멘토들을 만나보세요
            </p>
          </div>
          <TrendingBadge label="HOT" variant="hot" />
        </div>
        
        <InfluencerGrid 
          influencers={mockInfluencers}
          viewMode="grid"
        />
        
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
          {mockCourses.map((course) => (
            <Card key={course.id} className="hover-lift">
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
      <section className="bg-[var(--color-bg-secondary)] py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
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
