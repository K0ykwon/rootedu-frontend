'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface PurchasedProduct {
  productId: string;
  title: string;
  price: string;
  thumbnail: string;
  purchasedAt: string;
  status: string;
}

interface MyInfluencer {
  slug: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  followers: number;
  rating: number;
  verified: boolean;
  expertise: string[];
  totalPurchases: number;
  latestPurchase: string;
  purchasedProducts: PurchasedProduct[];
}

interface MyInfluencersProps {
  className?: string;
}

export default function MyInfluencers({ className = '' }: MyInfluencersProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [influencers, setInfluencers] = useState<MyInfluencer[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalPurchases, setTotalPurchases] = useState(0);

  useEffect(() => {
    if (session) {
      fetchMyInfluencers();
    }
  }, [session]);

  const fetchMyInfluencers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/user/my-influencers');
      if (response.ok) {
        const data = await response.json();
        
        // Parse expertise from JSON string if needed
        const parsedInfluencers = data.influencers.map((inf: any) => ({
          ...inf,
          expertise: typeof inf.expertise === 'string' 
            ? JSON.parse(inf.expertise || '[]') 
            : inf.expertise || []
        }));
        
        setInfluencers(parsedInfluencers);
        setTotalPurchases(data.totalPurchases || 0);
      } else {
        console.error('Failed to fetch my influencers');
      }
    } catch (error) {
      console.error('Error fetching my influencers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInfluencerClick = (slug: string) => {
    router.push(`/influencers/${slug}`);
  };

  const handleProductClick = (influencerSlug: string, productId: string) => {
    router.push(`/influencers/${influencerSlug}/product/${productId}`);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1일 전';
    if (diffDays < 7) return `${diffDays}일 전`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)}주 전`;
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)}개월 전`;
    return `${Math.ceil(diffDays / 365)}년 전`;
  };

  if (!session) {
    return null;
  }

  if (loading) {
    return (
      <div className={`mb-12 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded-lg w-48 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-300 dark:bg-gray-600 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (influencers.length === 0) {
    return null;
  }

  return (
    <div className={`mb-12 ${className}`}>
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-amber-500/20 backdrop-blur-sm border border-emerald-500/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">
                  내 인플루언서
                </h2>
                <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
                  구매한 강의가 있는 멘토들 • {totalPurchases}개 강의 수강 중
                </p>
              </div>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-50 to-amber-50 dark:from-emerald-900/20 dark:to-amber-900/20 border border-emerald-200 dark:border-emerald-700 rounded-full">
            <div className="w-2 h-2 bg-gradient-to-r from-emerald-500 to-amber-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
              활성 구독 중
            </span>
          </div>
        </div>
      </div>

      {/* Influencers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {influencers.map((influencer) => (
          <div
            key={influencer.slug}
            className="group relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg hover:shadow-emerald-500/10 dark:hover:shadow-emerald-500/5 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1"
          >
            {/* Premium Badge */}
            <div className="absolute top-4 right-4 z-10">
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-amber-400/90 to-yellow-400/90 rounded-full shadow-lg">
                <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-xs font-bold text-white">PREMIUM</span>
              </div>
            </div>

            {/* Click Handler */}
            <div 
              className="cursor-pointer"
              onClick={() => handleInfluencerClick(influencer.slug)}
            >
              {/* Influencer Header */}
              <div className="p-6 pb-4">
                <div className="flex items-start gap-4">
                  <div className="relative flex-shrink-0">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center text-2xl font-bold text-gray-600 dark:text-gray-300 group-hover:scale-110 transition-transform duration-300">
                      {influencer.avatar || influencer.name?.charAt(0) || '👤'}
                    </div>
                    {influencer.verified && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-[var(--color-text-primary)] truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300">
                      {influencer.name}
                    </h3>
                    <p className="text-sm text-[var(--color-text-tertiary)] mb-2">
                      @{influencer.username}
                    </p>
                    <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2">
                      {influencer.bio}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats Section */}
              <div className="px-6 pb-4">
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                    <span className="text-[var(--color-text-tertiary)]">
                      {formatNumber(influencer.followers || 0)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-[var(--color-text-tertiary)]">
                      {influencer.rating || '4.5'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      {influencer.totalPurchases}개 수강
                    </span>
                  </div>
                </div>
              </div>

              {/* Expertise Tags */}
              {influencer.expertise && influencer.expertise.length > 0 && (
                <div className="px-6 pb-4">
                  <div className="flex flex-wrap gap-1.5">
                    {influencer.expertise.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full border border-emerald-200 dark:border-emerald-700"
                      >
                        {tag}
                      </span>
                    ))}
                    {influencer.expertise.length > 3 && (
                      <span className="px-2 py-1 text-xs bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full border border-gray-200 dark:border-gray-600">
                        +{influencer.expertise.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Purchase Info */}
            <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-emerald-50/50 dark:from-gray-800/50 dark:to-emerald-900/10 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-[var(--color-text-tertiary)]">
                    최근 구매: {formatDate(influencer.latestPurchase)}
                  </span>
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleInfluencerClick(influencer.slug);
                  }}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium flex items-center gap-1 group/btn"
                >
                  수강 중인 강의 보기
                  <svg className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          </div>
        ))}
      </div>

      {/* View All Link */}
      {influencers.length > 3 && (
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-amber-600 hover:from-emerald-700 hover:to-amber-700 text-white font-medium rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/25"
          >
            <span>내 학습 대시보드에서 더 보기</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}