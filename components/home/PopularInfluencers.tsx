'use client';

import { useRouter } from 'next/navigation';
import InfluencerGrid from '../ui/InfluencerGrid';
import TrendingBadge from '../ui/TrendingBadge';

interface Influencer {
  id: string;
  slug: string;
  name: string;
  username: string;
  instagram: string;
  avatar: string;
  bio: string;
  description: string;
  tags: string[];
  stats: {
    followers: number;
    free_courses: number;
    paid_courses: number;
  };
}

interface PopularInfluencersProps {
  influencers: Influencer[];
}

export default function PopularInfluencers({ influencers }: PopularInfluencersProps) {
  const router = useRouter();

  const handleInfluencerClick = (slug: string) => {
    router.push(`/influencers/${slug}`);
  };

  return (
    <>
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
        influencers={influencers}
        viewMode="grid"
        onInfluencerClick={handleInfluencerClick}
      />
    </>
  );
}