import React, { useState } from 'react';
import VideoCard from './VideoCard';
import { BookOpen, Grid, List } from 'lucide-react';

interface ProductVideo {
  id: string;
  url: string;
  type: 'youtube';
  title: string;
  description?: string;
  order: number;
  duration?: string;
  chapter?: string;
  thumbnail?: string;
}

interface VideoListProps {
  videos: ProductVideo[];
  onVideoSelect: (video: ProductVideo) => void;
  groupByChapter?: boolean;
  showProgress?: boolean;
  videoProgress?: Record<string, number>; // videoId -> progress percentage
  layout?: 'grid' | 'list';
  className?: string;
}

export default function VideoList({
  videos,
  onVideoSelect,
  groupByChapter = false,
  showProgress = false,
  videoProgress = {},
  layout: initialLayout = 'grid',
  className = ''
}: VideoListProps) {
  const [layout, setLayout] = useState<'grid' | 'list'>(initialLayout);

  // Sort videos by order
  const sortedVideos = [...videos].sort((a, b) => a.order - b.order);

  // Group videos by chapter if enabled
  const groupedVideos = groupByChapter
    ? sortedVideos.reduce((acc, video) => {
        const chapter = video.chapter || '기타';
        if (!acc[chapter]) {
          acc[chapter] = [];
        }
        acc[chapter].push(video);
        return acc;
      }, {} as Record<string, ProductVideo[]>)
    : { '전체': sortedVideos };

  const gridClass = layout === 'grid'
    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
    : 'flex flex-col gap-3';

  return (
    <div className={className}>
      {/* Layout Toggle */}
      {videos.length > 0 && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[var(--color-primary-500)]" />
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
              강의 영상 {videos.length}개
            </h3>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setLayout('grid')}
              className={`p-2 rounded-lg transition-colors ${
                layout === 'grid'
                  ? 'bg-[var(--color-primary-500)] text-white'
                  : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-quaternary)]'
              }`}
              aria-label="Grid view"
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setLayout('list')}
              className={`p-2 rounded-lg transition-colors ${
                layout === 'list'
                  ? 'bg-[var(--color-primary-500)] text-white'
                  : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-quaternary)]'
              }`}
              aria-label="List view"
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Video Groups */}
      {Object.entries(groupedVideos).map(([chapterName, chapterVideos]) => (
        <div key={chapterName} className="mb-8 last:mb-0">
          {groupByChapter && chapterVideos.length > 0 && (
            <h4 className="text-base font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
              <div className="w-1 h-5 bg-[var(--color-primary-500)] rounded-full" />
              {chapterName}
              <span className="text-sm text-[var(--color-text-tertiary)] font-normal">
                ({chapterVideos.length}개)
              </span>
            </h4>
          )}

          <div className={gridClass}>
            {chapterVideos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                onClick={() => onVideoSelect(video)}
                showProgress={showProgress}
                progress={videoProgress[video.id] || 0}
                className={layout === 'list' ? 'flex-row' : ''}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Empty State */}
      {videos.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-[var(--color-text-tertiary)] mx-auto mb-4 opacity-50" />
          <p className="text-[var(--color-text-secondary)] text-lg">
            등록된 영상이 없습니다
          </p>
        </div>
      )}
    </div>
  );
}
