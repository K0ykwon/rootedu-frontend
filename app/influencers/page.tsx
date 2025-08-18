'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SearchBar from '../../components/ui/SearchBar';
import { CategoryFilter } from '../../components/ui/CategoryFilter';
import InfluencerGrid from '../../components/ui/InfluencerGrid';
import Skeleton from '../../components/ui/Skeleton';
import Button from '../../components/ui/Button';

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
        <div className="mb-20">
          {/* Premium Dark Background with Subtle Elements */}
          <div className="relative overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-black">
            {/* Subtle Grid Pattern */}
            <div className="absolute inset-0 opacity-[0.04]">
              <svg className="w-full h-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="subtle-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="url(#subtle-gradient)" strokeWidth="0.2"/>
                    <circle cx="0" cy="0" r="0.5" fill="url(#subtle-gradient)" opacity="0.3"/>
                  </pattern>
                  <linearGradient id="subtle-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="50%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#78716c" />
                  </linearGradient>
                </defs>
                <rect width="100" height="100" fill="url(#subtle-grid)" />
              </svg>
            </div>

            {/* Subtle Ambient Lighting */}
            <div className="absolute top-32 left-20 w-64 h-64 bg-gradient-to-br from-emerald-500/8 to-green-400/4 rounded-full blur-3xl"></div>
            <div className="absolute bottom-32 right-20 w-72 h-72 bg-gradient-to-br from-amber-500/6 to-yellow-400/3 rounded-full blur-3xl"></div>
            <div className="absolute top-64 right-32 w-48 h-48 bg-gradient-to-br from-stone-500/5 to-amber-400/3 rounded-full blur-2xl"></div>

            <div className="relative max-w-6xl mx-auto text-center py-28 px-8">
              {/* Elegant Icon */}
              <div className="mb-12">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-950/80 via-gray-900/90 to-stone-950/80 backdrop-blur-lg border border-emerald-500/20 shadow-[0_8px_32px_rgba(16,185,129,0.15)] group hover:shadow-[0_12px_40px_rgba(16,185,129,0.2)] transition-all duration-500">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-600/80 via-green-500/80 to-amber-600/80 flex items-center justify-center shadow-inner group-hover:scale-105 transition-all duration-300">
                    <svg className="w-8 h-8 text-black/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                </div>
              </div>
              
              {/* Professional Typography */}
              <div className="mb-18">
                <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-emerald-300 via-green-200 to-amber-300 mb-8 tracking-[-0.02em] leading-[0.9]">
                  <span className="block">PREMIUM</span>
                  <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-stone-200 bg-clip-text text-transparent font-bold">MENTORING</span>
                </h1>
                <div className="h-px w-32 mx-auto bg-gradient-to-r from-transparent via-emerald-300 to-transparent mb-8 opacity-60"></div>
                <p className="text-xl md:text-2xl text-emerald-100 font-semibold mb-5 max-w-4xl mx-auto leading-relaxed">
                  SKY 대학 출신 <span className="text-amber-200 font-bold">엘리트 멘토</span>들과 함께하는
                </p>
                <p className="text-lg md:text-xl text-stone-200 font-medium max-w-3xl mx-auto leading-relaxed">
                  최상위 1% 프리미엄 교육 솔루션
                </p>
              </div>

              {/* Professional Glass Cards */}
              <div className="grid md:grid-cols-3 gap-8 mb-18">
                <div className="group">
                  <div className="relative h-full p-10 rounded-2xl bg-gradient-to-br from-emerald-950/70 via-gray-900/80 to-green-950/70 backdrop-blur-xl border border-emerald-500/20 shadow-[0_12px_48px_rgba(16,185,129,0.1)] hover:shadow-[0_16px_56px_rgba(16,185,129,0.15)] transition-all duration-500 overflow-hidden group-hover:border-emerald-400/30">
                    {/* Subtle Accent Border */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400/60 via-green-400/60 to-amber-400/60 group-hover:h-1.5 transition-all duration-300"></div>
                    
                    <div className="relative z-10">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600/25 to-green-500/15 backdrop-blur-sm flex items-center justify-center mb-8 group-hover:scale-110 transition-all duration-400">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/80 to-green-600/80 flex items-center justify-center shadow-lg">
                          <svg className="w-6 h-6 text-black/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-emerald-200 mb-5 group-hover:text-emerald-100 transition-colors duration-300">엘리트 멘토</h3>
                      <p className="text-stone-200 font-medium leading-relaxed group-hover:text-stone-100 transition-colors duration-300">
                        서울대, 연세대, 고려대 최상위 1%<br />
                        재학생들의 실전 검증된 학습 전략
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="group">
                  <div className="relative h-full p-10 rounded-2xl bg-gradient-to-br from-amber-950/70 via-gray-900/80 to-yellow-950/70 backdrop-blur-xl border border-amber-500/20 shadow-[0_12px_48px_rgba(245,158,11,0.1)] hover:shadow-[0_16px_56px_rgba(245,158,11,0.15)] transition-all duration-500 overflow-hidden group-hover:border-amber-400/30">
                    {/* Subtle Accent Border */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400/60 via-yellow-400/60 to-orange-400/60 group-hover:h-1.5 transition-all duration-300"></div>
                    
                    <div className="relative z-10">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-600/25 to-yellow-500/15 backdrop-blur-sm flex items-center justify-center mb-8 group-hover:scale-110 transition-all duration-400">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/80 to-yellow-600/80 flex items-center justify-center shadow-lg">
                          <svg className="w-6 h-6 text-black/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-amber-200 mb-5 group-hover:text-amber-100 transition-colors duration-300">맞춤 커리큘럼</h3>
                      <p className="text-stone-200 font-medium leading-relaxed group-hover:text-stone-100 transition-colors duration-300">
                        개인별 학습 스타일과 목표에<br />
                        완벽하게 최적화된 전용 1:1 지도
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="group">
                  <div className="relative h-full p-10 rounded-2xl bg-gradient-to-br from-stone-950/70 via-gray-900/80 to-amber-950/70 backdrop-blur-xl border border-stone-500/20 shadow-[0_12px_48px_rgba(120,113,108,0.1)] hover:shadow-[0_16px_56px_rgba(120,113,108,0.15)] transition-all duration-500 overflow-hidden group-hover:border-stone-400/30">
                    {/* Subtle Accent Border */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-stone-400/60 via-amber-400/60 to-yellow-400/60 group-hover:h-1.5 transition-all duration-300"></div>
                    
                    <div className="relative z-10">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-stone-600/25 to-amber-500/15 backdrop-blur-sm flex items-center justify-center mb-8 group-hover:scale-110 transition-all duration-400">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-stone-500/80 to-amber-600/80 flex items-center justify-center shadow-lg">
                          <svg className="w-6 h-6 text-black/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-stone-200 mb-5 group-hover:text-stone-100 transition-colors duration-300">프리미엄 관리</h3>
                      <p className="text-stone-200 font-medium leading-relaxed group-hover:text-stone-100 transition-colors duration-300">
                        24/7 전담 학습 매니저와<br />
                        실시간 AI 성과 분석 시스템
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Professional CTA Section */}
              <div className="relative">
                {/* Subtle Background Glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/8 via-amber-500/4 to-stone-500/6 rounded-2xl blur-2xl"></div>
                
                <div className="relative p-12 rounded-2xl bg-gradient-to-br from-emerald-950/75 via-gray-900/85 to-stone-950/75 backdrop-blur-2xl border border-emerald-500/25 shadow-[0_16px_64px_rgba(16,185,129,0.12)] overflow-hidden">
                  {/* Subtle Top Border */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400/50 via-amber-400/50 to-stone-400/50"></div>
                  
                  {/* Minimal Accent Elements */}
                  <div className="absolute top-4 right-4 w-2 h-2 bg-gradient-to-br from-emerald-400/60 to-green-500/60 rounded-full"></div>
                  <div className="absolute bottom-4 left-4 w-1.5 h-1.5 bg-gradient-to-br from-amber-400/60 to-yellow-500/60 rounded-full"></div>
                  
                  <div className="relative z-10">
                    <h3 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-emerald-200 via-green-100 to-amber-200 mb-6 tracking-tight">
                      당신만의 <span className="bg-gradient-to-r from-amber-200 via-yellow-100 to-stone-100 bg-clip-text text-transparent">프리미엄 멘토</span>를 만나보세요
                    </h3>
                    <p className="text-lg text-stone-100 mb-10 max-w-4xl mx-auto leading-relaxed font-medium">
                      최상위 1% 성과를 달성한 <span className="text-emerald-200 font-semibold">엘리트 멘토</span>들과 함께<br />
                      여러분의 학습 목표를 확실한 현실로 만들어 드립니다
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                      <span className="px-6 py-3 rounded-full bg-emerald-950/60 backdrop-blur-sm border border-emerald-400/40 text-emerald-100 font-semibold shadow-lg hover:shadow-xl hover:border-emerald-300/60 transition-all duration-300">내신 1등급 보장</span>
                      <span className="px-6 py-3 rounded-full bg-amber-950/60 backdrop-blur-sm border border-amber-400/40 text-amber-100 font-semibold shadow-lg hover:shadow-xl hover:border-amber-300/60 transition-all duration-300">수능 최상위권</span>
                      <span className="px-6 py-3 rounded-full bg-stone-950/60 backdrop-blur-sm border border-stone-400/40 text-stone-100 font-semibold shadow-lg hover:shadow-xl hover:border-stone-300/60 transition-all duration-300">명문대 진학</span>
                      <span className="px-6 py-3 rounded-full bg-green-950/60 backdrop-blur-sm border border-green-400/40 text-green-100 font-semibold shadow-lg hover:shadow-xl hover:border-green-300/60 transition-all duration-300">완벽한 학습 습관</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-6 mb-8">
          {/* Search Bar */}
          <SearchBar 
            onSearch={handleSearch}
            placeholder="이름, 전공, 태그로 검색..."
            className="w-full"
          />

          {/* Category Filter */}
          <CategoryFilter
            categories={categories}
            activeCategory={filters.category}
            onCategoryChange={handleCategoryChange}
            showAll={true}
            allLabel="전체"
          />

          {/* Sort and View Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex gap-2">
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

            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--color-text-tertiary)] mr-2">
                보기:
              </span>
              <Button
                variant={viewMode === 'grid' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                그리드
              </Button>
              <Button
                variant={viewMode === 'list' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                리스트
              </Button>
              <Button
                variant={viewMode === 'compact' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('compact')}
              >
                컴팩트
              </Button>
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-80" />
            ))}
          </div>
        ) : (
          <>
            {/* Results Count */}
            <div className="mb-6">
              <p className="text-[var(--color-text-secondary)]">
                총 {pagination.total}명의 인플루언서가 있습니다
                {filters.q && ` ("${filters.q}" 검색 결과)`}
                {filters.category !== 'all' && ` (${filters.category} 카테고리)`}
              </p>
            </div>

            {/* Influencer Grid */}
            {influencers.length > 0 ? (
              <InfluencerGrid 
                influencers={influencers}
                viewMode={viewMode}
                onInfluencerClick={handleInfluencerClick}
              />
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-[var(--color-bg-tertiary)] rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-[var(--color-text-quaternary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
                  검색 결과가 없습니다
                </h3>
                <p className="text-[var(--color-text-tertiary)]">
                  다른 키워드나 카테고리로 검색해보세요
                </p>
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-12">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={filters.page <= 1}
                  onClick={() => handlePageChange(filters.page - 1)}
                >
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
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}