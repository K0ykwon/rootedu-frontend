'use client';

import { useState } from 'react';

interface VideoPlayerProps {
  videoUrl: string;
  title?: string;
  className?: string;
}

/**
 * YouTube Video Player Component
 *
 * Displays YouTube videos in a responsive 16:9 container
 * Optimized for mobile and desktop playback
 */
export default function VideoPlayer({ videoUrl, title, className = '' }: VideoPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);

  // Extract YouTube video ID from URL
  const getYouTubeEmbedUrl = (url: string): string | null => {
    try {
      const urlObj = new URL(url);

      // Handle youtube.com/watch?v=VIDEO_ID
      if (urlObj.hostname.includes('youtube.com')) {
        const videoId = urlObj.searchParams.get('v');
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
      }

      // Handle youtu.be/VIDEO_ID
      if (urlObj.hostname.includes('youtu.be')) {
        const videoId = urlObj.pathname.slice(1);
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
      }

      return null;
    } catch (error) {
      console.error('Invalid video URL:', error);
      return null;
    }
  };

  const embedUrl = getYouTubeEmbedUrl(videoUrl);

  if (!embedUrl) {
    return (
      <div className={`glass-card rounded-2xl p-8 text-center ${className}`}>
        <p className="text-[var(--color-text-tertiary)]">
          Invalid video URL
        </p>
      </div>
    );
  }

  return (
    <div className={`glass-card rounded-2xl p-4 sm:p-6 ${className}`}>
      {title && (
        <h3 className="text-[clamp(1.25rem,3vw,1.5rem)] font-semibold text-[var(--color-text-primary)] mb-4">
          {title}
        </h3>
      )}

      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        {/* Loading state */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-bg-tertiary)] rounded-xl">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-[var(--color-primary-500)] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-[var(--color-text-tertiary)]">Loading video...</p>
            </div>
          </div>
        )}

        {/* YouTube iframe */}
        <iframe
          src={embedUrl}
          title={title || 'Video content'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          onLoad={() => setIsLoading(false)}
          className="absolute top-0 left-0 w-full h-full rounded-xl"
          style={{
            border: '1px solid var(--color-border-primary)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}
        />
      </div>

      {/* Video controls hint */}
      <div className="mt-4 flex items-center gap-2 text-xs text-[var(--color-text-quaternary)]">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Click the video to play • Use fullscreen for best experience</span>
      </div>
    </div>
  );
}
