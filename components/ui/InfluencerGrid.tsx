'use client';
import React, { useState } from 'react';
import InfluencerCard, { InfluencerCardCompact, InfluencerCardMini } from './InfluencerCard';
import SearchBar from './SearchBar';
import { Select } from './Form';
import Badge from './Badge';
import Skeleton from './Skeleton';

interface Influencer {
  slug: string;
  id: string;
  name: string;
  username: string;
  instagram: string;
  avatar: string;
  coverImage?: string;
  bio: string;
  description: string;
  tags: string[];
  stats: {
    followers: number;
    free_courses: number;
    paid_courses: number;
  };
  verified?: boolean;
  isFollowing?: boolean;
}

interface InfluencerGridProps {
  influencers: Influencer[];
  loading?: boolean;
  viewMode?: 'grid' | 'list' | 'compact';
  onInfluencerClick?: (slug: string) => void;
  onFollowToggle?: (slug: string) => void;
  className?: string;
}

const InfluencerGrid: React.FC<InfluencerGridProps> = ({
  influencers,
  loading = false,
  viewMode = 'grid',
  onInfluencerClick,
  onFollowToggle,
  className = ''
}) => {
  if (loading) {
    return (
      <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'} ${className}`}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <InfluencerCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className={`space-y-3 ${className}`}>
        {influencers.map((influencer) => (
          <InfluencerCardCompact
            key={influencer.slug}
            name={influencer.name}
            username={influencer.username}
            avatar={influencer.avatar}
            followers={influencer.stats.followers}
            rating={4.5}
            verified={influencer.verified}
            isFollowing={influencer.isFollowing}
            onFollow={() => onFollowToggle?.(influencer.slug)}
            onClick={() => onInfluencerClick?.(influencer.slug)}
          />
        ))}
      </div>
    );
  }

  if (viewMode === 'compact') {
    return (
      <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 ${className}`}>
        {influencers.map((influencer) => (
          <InfluencerCardMini
            key={influencer.slug}
            name={influencer.name}
            avatar={influencer.avatar}
            expertise={influencer.tags[0] || 'Educator'}
            verified={influencer.verified}
            onClick={() => onInfluencerClick?.(influencer.slug)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {influencers.map((influencer) => (
        <InfluencerCard
          key={influencer.slug}
          name={influencer.name}
          username={influencer.username}
          avatar={influencer.avatar}
          bio={influencer.bio}
          followers={influencer.stats.followers}
          students={0}
          courses={influencer.stats.free_courses + influencer.stats.paid_courses}
          rating={4.5}
          expertise={influencer.tags}
          verified={influencer.verified}
          isFollowing={influencer.isFollowing}
          onFollow={() => onFollowToggle?.(influencer.slug)}
          onClick={() => onInfluencerClick?.(influencer.slug)}
        />
      ))}
    </div>
  );
};

// Influencer Card Skeleton
const InfluencerCardSkeleton: React.FC = () => {
  return (
    <div className="bg-[var(--color-bg-secondary)] rounded-2xl overflow-hidden border border-[var(--color-border-primary)]">
      <Skeleton variant="rectangular" height="96px" />
      <div className="px-4 pb-4">
        <div className="relative -mt-10 mb-3">
          <Skeleton variant="circular" width="80px" height="80px" />
        </div>
        <Skeleton variant="text" width="60%" height="24px" className="mb-2" />
        <Skeleton variant="text" width="40%" height="16px" className="mb-3" />
        <Skeleton variant="text" width="100%" height="16px" className="mb-2" />
        <Skeleton variant="text" width="80%" height="16px" className="mb-4" />
        <div className="flex gap-2 mb-4">
          <Skeleton variant="rounded" width="60px" height="24px" />
          <Skeleton variant="rounded" width="60px" height="24px" />
          <Skeleton variant="rounded" width="60px" height="24px" />
        </div>
        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[var(--color-border-secondary)]">
          <Skeleton variant="text" width="100%" height="20px" />
          <Skeleton variant="text" width="100%" height="20px" />
          <Skeleton variant="text" width="100%" height="20px" />
        </div>
      </div>
    </div>
  );
};

// Influencer Discovery Section with filters
interface InfluencerDiscoveryProps {
  className?: string;
}

export const InfluencerDiscovery: React.FC<InfluencerDiscoveryProps> = ({
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSort, setSelectedSort] = useState('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compact'>('grid');
  // TODO: Replace with real data source; placeholder to satisfy typing
  const demoInfluencers: Influencer[] = [];

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'programming', label: 'Programming' },
    { value: 'design', label: 'Design' },
    { value: 'business', label: 'Business' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'data-science', label: 'Data Science' },
    { value: 'languages', label: 'Languages' }
  ];

  const sortOptions = [
    { value: 'popular', label: 'Most Popular' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'students', label: 'Most Students' },
    { value: 'recent', label: 'Recently Active' }
  ];

  return (
    <div className={className}>
      {/* Header with Search */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-4">
          Discover Influencers
        </h2>
        <SearchBar
          placeholder="Search influencers, topics, or expertise..."
          value={searchQuery}
          onChange={setSearchQuery}
          suggestions={['JavaScript Expert', 'UI/UX Design', 'Machine Learning', 'Web Development']}
        />
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 flex flex-col md:flex-row gap-3">
          <Select
            label=""
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            options={categories}
            className="w-full md:w-48"
          />
          <Select
            label=""
            value={selectedSort}
            onChange={(e) => setSelectedSort(e.target.value)}
            options={sortOptions}
            className="w-full md:w-48"
          />
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex gap-1 p-1 bg-[var(--color-bg-tertiary)] rounded-lg">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-[var(--color-bg-quaternary)] text-[var(--color-text-primary)]' : 'text-[var(--color-text-tertiary)]'}`}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3 3H8V8H3V3ZM3 12H8V17H3V12ZM12 3H17V8H12V3ZM12 12H17V17H12V12Z"/>
            </svg>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded ${viewMode === 'list' ? 'bg-[var(--color-bg-quaternary)] text-[var(--color-text-primary)]' : 'text-[var(--color-text-tertiary)]'}`}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3 4H17V6H3V4ZM3 9H17V11H3V9ZM3 14H17V16H3V14Z"/>
            </svg>
          </button>
          <button
            onClick={() => setViewMode('compact')}
            className={`p-2 rounded ${viewMode === 'compact' ? 'bg-[var(--color-bg-quaternary)] text-[var(--color-text-primary)]' : 'text-[var(--color-text-tertiary)]'}`}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 2H6V6H2V2ZM8 2H12V6H8V2ZM14 2H18V6H14V2ZM2 8H6V12H2V8ZM8 8H12V12H8V8ZM14 8H18V12H14V8ZM2 14H6V18H2V14ZM8 14H12V18H8V14ZM14 14H18V18H14V14Z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Popular Tags */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-[var(--color-text-tertiary)] mb-3">Popular Topics</h3>
        <div className="flex flex-wrap gap-2">
          {['React', 'Python', 'Machine Learning', 'Web3', 'UI Design', 'Data Science', 'Marketing', 'SEO'].map((tag) => (
            <Badge
              key={tag}
              variant="default"
              className="cursor-pointer hover:bg-[var(--color-primary-400)] hover:text-white transition-colors"
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      {/* Influencers Grid */}
      <div className={`grid gap-6 ${
        viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
        viewMode === 'list' ? 'grid-cols-1' :
        'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
      }`}>
        {demoInfluencers.map((influencer) => (
          <InfluencerCard
            key={influencer.slug}
            name={influencer.name}
            username={influencer.username}
            avatar={influencer.avatar}
            bio={influencer.bio}
            followers={influencer.stats.followers}
            students={0}
            courses={influencer.stats.free_courses + influencer.stats.paid_courses}
            rating={4.5}
            expertise={influencer.tags}
          />
        ))}
      </div>
    </div>
  );
};

// Horizontal scrollable influencer list
interface InfluencerCarouselProps {
  title: string;
  influencers: Influencer[];
  onSeeAll?: () => void;
  onInfluencerClick?: (id: string) => void;
  className?: string;
}

export const InfluencerCarousel: React.FC<InfluencerCarouselProps> = ({
  title,
  influencers,
  onSeeAll,
  onInfluencerClick,
  className = ''
}) => {
  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">{title}</h3>
        {onSeeAll && (
          <button
            onClick={onSeeAll}
            className="text-sm text-[var(--color-primary-400)] hover:text-[var(--color-primary-500)] transition-colors"
          >
            See All →
          </button>
        )}
      </div>
      
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
        {influencers.map((influencer) => (
          <div key={influencer.slug} className="flex-shrink-0 w-72">
            <InfluencerCard
              name={influencer.name}
              username={influencer.username}
              avatar={influencer.avatar}
              bio={influencer.bio}
              followers={influencer.stats.followers}
              students={0}
              courses={influencer.stats.free_courses + influencer.stats.paid_courses}
              rating={4.5}
              expertise={influencer.tags}
              verified={influencer.verified}
              onClick={() => onInfluencerClick?.(influencer.slug)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default InfluencerGrid;