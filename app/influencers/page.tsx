'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import SearchBar from '../../components/ui/SearchBar';
import { CategoryFilter } from '../../components/ui/CategoryFilter';
import InfluencerGrid from '../../components/ui/InfluencerGrid';
import Button from '../../components/ui/Button';
import MyInfluencers from '../../components/ui/MyInfluencers';

interface InfluencerFilters {
  q: string; 
  category: string;
  sort: string;
  page: number;
}

const sortOptions = [
  { value: 'popular', label: '인기순' },
  { value: 'rating', label: '평점순' },
  { value: 'students', label: '수강생순' },
  { value: 'recent', label: '최신순' }
];

const categories = [
  { id: '국어', name: '국어', icon: '📚', count: 15 },
  { id: '수학', name: '수학', icon: '🔢', count: 23 },
  { id: '영어', name: '영어', icon: '🌍', count: 18 },
  { id: '논술', name: '논술', icon: '✍️', count: 12 },
  { id: '생활기록부', name: '생활기록부', icon: '📋', count: 8 }
];

export default function InfluencersPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [influencers, setInfluencers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compact'>('grid');
  const [filters, setFilters] = useState<InfluencerFilters>({
    q: '',
    category: 'all',
    sort: 'popular',
    page: 1
  });
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    pageSize: 12
  });

  const handleInfluencerClick = (slug: string) => {
    router.push(`/influencers/${slug}`);
  };

  const fetchInfluencers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: filters.q,
        category: filters.category === 'all' ? '' : filters.category,
        sort: filters.sort,
        page: filters.page.toString(),
        pageSize: pagination.pageSize.toString()
      });

      const response = await fetch(`/api/influencers?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setInfluencers(data.items);
        setPagination({
          total: data.total,
          totalPages: data.totalPages,
          pageSize: data.pageSize
        });
      } else {
        console.error('Failed to fetch influencers:', data.error);
      }
    } catch (error) {
      console.error('Error fetching influencers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInfluencers();
  }, [filters]);

  const handleSearch = (query: string) => {
    setFilters(prev => ({ ...prev, q: query, page: 1 }));
  };

  const handleCategoryChange = (category: string) => {
    setFilters(prev => ({ ...prev, category, page: 1 }));
  };

  const handleSortChange = (sort: string) => {
    setFilters(prev => ({ ...prev, sort, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-16">
          {/* Friendly Welcome Section */}
          <div className="relative glass-card rounded-2xl overflow-hidden">
            {/* Premium Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-bg-secondary)] via-[var(--color-bg-tertiary)] to-[var(--color-bg-quaternary)]" />
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-[var(--color-primary-400)]/20 to-transparent rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-[var(--color-primary-500)]/20 to-transparent rounded-full blur-3xl" />
            </div>
            {/* Subtle Pattern Background */}
            <div className="absolute inset-0 opacity-5">
              <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" className="fill-blue-600">
                <g fillRule="evenodd">
                  <g fill="#3B82F6" fillOpacity="0.4">
                    <circle cx="30" cy="30" r="1"/>
                    <circle cx="30" cy="0" r="1"/>
                    <circle cx="0" cy="30" r="1"/>
                    <circle cx="60" cy="30" r="1"/>
                    <circle cx="30" cy="60" r="1"/>
                  </g>
                </g>
              </svg>
            </div>

            <div className="relative max-w-6xl mx-auto text-center py-20 px-6">
              {/* Friendly Icon */}
              <div className="mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-green-500 shadow-lg mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              </div>
              
              {/* Welcoming Typography */}
              <div className="mb-12">
                <h1 className="text-[clamp(2rem,5vw,3.75rem)] font-bold text-[var(--color-text-primary)] mb-6 leading-tight">
                  학습 파트너들과 함께
                  <span className="block text-[clamp(1.875rem,4vw,3rem)] text-[var(--color-primary-500)]">성장해보세요</span>
                </h1>
                <p className="text-[clamp(1.25rem,2.5vw,1.5rem)] text-[var(--color-text-secondary)] font-medium mb-4 max-w-4xl mx-auto">
                  검증된 <span className="text-[var(--color-primary-500)] font-semibold">대학생 멘토</span>들과 함께하는 맞춤형 학습 경험
                </p>
                <p className="text-lg text-[var(--color-text-tertiary)] max-w-3xl mx-auto">
                  당신의 목표와 학습 스타일에 맞는 완벽한 파트너를 찾아보세요
                </p>
              </div>

              {/* Benefits Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-12">
                <div className="group glass-card rounded-2xl p-6 sm:p-8 hover-lift hover:shadow-[var(--glow-green-subtle)] transition-all duration-300">
                  <div className="w-12 h-12 rounded-full bg-[var(--color-primary-500)]/10 flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-[var(--color-primary-500)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-3">검증된 멘토</h3>
                  <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
                    실제 성과를 입증한<br />
                    대학생 멘토들의 경험과 노하우
                  </p>
                </div>

                <div className="group glass-card rounded-2xl p-6 sm:p-8 hover-lift hover:shadow-[var(--glow-green-subtle)] transition-all duration-300">
                  <div className="w-12 h-12 rounded-full bg-[var(--color-primary-500)]/10 flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-[var(--color-primary-500)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-3">맞춤형 학습</h3>
                  <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
                    개인의 학습 목표와 스타일에<br />
                    완벽하게 맞춤화된 1:1 지도
                  </p>
                </div>

                <div className="group glass-card rounded-2xl p-6 sm:p-8 hover-lift hover:shadow-[var(--glow-green-subtle)] transition-all duration-300">
                  <div className="w-12 h-12 rounded-full bg-[var(--color-primary-500)]/10 flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-[var(--color-primary-500)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-3">지속적 지원</h3>
                  <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
                    학습 과정 전반에 걸친<br />
                    꾸준한 피드백과 동기부여
                  </p>
                </div>
              </div>

              {/* Call to Action */}
              <div className="glass-card rounded-2xl p-6 sm:p-8 max-w-4xl mx-auto">
                <h3 className="text-[clamp(1.5rem,3vw,1.875rem)] font-bold text-[var(--color-text-primary)] mb-4">
                  나에게 맞는 <span className="text-[var(--color-primary-500)]">학습 파트너</span>를 찾아보세요
                </h3>
                <p className="text-[var(--color-text-secondary)] mb-6 max-w-3xl mx-auto">
                  다양한 전공과 경험을 가진 멘토들이 여러분의 학습 목표 달성을 도와드립니다
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <span className="premium-badge px-4 py-2 rounded-full text-[var(--color-text-primary)] text-sm font-medium">성적 향상</span>
                  <span className="premium-badge px-4 py-2 rounded-full text-[var(--color-text-primary)] text-sm font-medium">학습 습관 개선</span>
                  <span className="premium-badge px-4 py-2 rounded-full text-[var(--color-text-primary)] text-sm font-medium">진로 상담</span>
                  <span className="premium-badge px-4 py-2 rounded-full text-[var(--color-text-primary)] text-sm font-medium">동기 부여</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* My Influencers Section */}
        {session && (
          <MyInfluencers className="mb-12" />
        )}

        {/* Search and Filters */}
        <div className="glass-card rounded-2xl p-4 sm:p-6 mb-8">
          <div className="space-y-6">
            {/* Search Header */}
            <div className="text-center">
              <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
                완벽한 학습 파트너 찾기
              </h2>
              <p className="text-[var(--color-text-secondary)] text-sm">
                이름, 전공, 관심 분야로 검색하고 필터를 활용해보세요
              </p>
            </div>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <SearchBar 
                onSearch={handleSearch}
                placeholder="멘토 이름, 전공, 태그로 검색..."
                className="w-full"
              />
            </div>

            {/* Category Filter */}
            <div>
              <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-3">
                전공 분야
              </h3>
              <CategoryFilter
                categories={categories}
                activeCategory={filters.category}
                onCategoryChange={handleCategoryChange}
                showAll={true}
                allLabel="모든 분야"
              />
            </div>

            {/* Sort and View Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pt-4 border-t border-[var(--color-border-primary)]">
              <div>
                <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  정렬 기준
                </h3>
                <div className="flex flex-wrap gap-2">
                  {sortOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant={filters.sort === option.value ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => handleSortChange(option.value)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  보기 방식
                </h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    그리드
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    리스트
                  </Button>
                  <Button
                    variant={viewMode === 'compact' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('compact')}
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    컴팩트
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="space-y-6">
            <div className="glass-card rounded-2xl p-4 sm:p-6">
              <div className="animate-pulse flex items-center justify-between mb-6">
                <div className="h-4 bg-[var(--color-bg-tertiary)] rounded w-64"></div>
                <div className="h-4 bg-[var(--color-bg-tertiary)] rounded w-32"></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-[var(--color-bg-tertiary)] rounded-2xl h-80"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Results Count */}
            <div className="glass-card rounded-2xl p-4 sm:p-6 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold text-[var(--color-text-primary)]">
                    총 <span className="text-[var(--color-primary-500)]">{pagination.total}명</span>의 학습 파트너가 있습니다
                  </p>
                  {filters.q && (
                    <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
                      "<span className="font-medium text-[var(--color-primary-500)]">{filters.q}</span>" 검색 결과
                    </p>
                  )}
                  {filters.category !== 'all' && (
                    <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
                      <span className="font-medium text-[var(--color-primary-500)]">{filters.category}</span> 전공 분야
                    </p>
                  )}
                </div>

                {influencers.length > 0 && (
                  <div className="text-right">
                    <p className="text-sm text-[var(--color-text-tertiary)]">
                      {((filters.page - 1) * pagination.pageSize) + 1} - {Math.min(filters.page * pagination.pageSize, pagination.total)} 표시 중
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Influencer Grid */}
            {influencers.length > 0 ? (
              <div className="glass-card rounded-2xl p-4 sm:p-6 mb-8">
                <InfluencerGrid 
                  influencers={influencers}
                  viewMode={viewMode}
                  onInfluencerClick={handleInfluencerClick}
                />
              </div>
            ) : (
              <div className="glass-card rounded-2xl p-8 sm:p-12 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-20 h-20 bg-[var(--color-primary-500)]/10 rounded-full mx-auto mb-6 flex items-center justify-center">
                    <svg className="w-10 h-10 text-[var(--color-primary-500)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">
                    찾으시는 학습 파트너가 없습니다
                  </h3>
                  <p className="text-[var(--color-text-secondary)] mb-6">
                    다른 검색어나 다른 전공 분야를 시도해보세요.<br />
                    또는 모든 필터를 초기화하여 전체 멘토를 확인해보세요.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFilters(prev => ({ ...prev, q: '', category: 'all', page: 1 }));
                      }}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      필터 초기화
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => setFilters(prev => ({ ...prev, category: 'all', page: 1 }))}
                    >
                      모든 멘토 보기
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="glass-card rounded-2xl p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="text-sm text-[var(--color-text-secondary)]">
                    페이지 {filters.page} / {pagination.totalPages}
                  </div>
                  
                  <div className="flex justify-center items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={filters.page <= 1}
                      onClick={() => handlePageChange(filters.page - 1)}
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      이전
                    </Button>

                    {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                      const pageNum = i + Math.max(1, filters.page - 2);
                      if (pageNum > pagination.totalPages) return null;

                      return (
                        <Button
                          key={pageNum}
                          variant={filters.page === pageNum ? 'primary' : 'outline'}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className="min-w-[2.5rem]"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={filters.page >= pagination.totalPages}
                      onClick={() => handlePageChange(filters.page + 1)}
                    >
                      다음
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Button>
                  </div>

                  <div className="text-sm text-[var(--color-text-tertiary)]">
                    총 {pagination.total}명
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}