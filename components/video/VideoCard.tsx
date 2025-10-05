import React from 'react';
import { Play, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

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

interface VideoCardProps {
  video: ProductVideo;
  onClick?: () => void;
  showProgress?: boolean;
  progress?: number; // 0-100
  className?: string;
}

export default function VideoCard({
  video,
  onClick,
  showProgress = false,
  progress = 0,
  className = ''
}: VideoCardProps) {
  // Extract YouTube video ID for thumbnail
  const getYouTubeThumbnail = (url: string): string => {
    try {
      const urlObj = new URL(url);
      let videoId = '';

      if (urlObj.hostname.includes('youtube.com')) {
        videoId = urlObj.searchParams.get('v') || '';
      } else if (urlObj.hostname.includes('youtu.be')) {
        videoId = urlObj.pathname.slice(1);
      }

      return videoId
        ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
        : '/placeholder-video.jpg';
    } catch {
      return '/placeholder-video.jpg';
    }
  };

  const thumbnailUrl = video.thumbnail || getYouTubeThumbnail(video.url);

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`glass-card rounded-xl overflow-hidden cursor-pointer hover:border-[var(--color-primary-400)] transition-all duration-200 ${className}`}
      onClick={onClick}
    >
      {/* Thumbnail Section */}
      <div className="relative aspect-video bg-[var(--color-bg-quaternary)]">
        <img
          src={thumbnailUrl}
          alt={video.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder-video.jpg';
          }}
        />

        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors duration-200">
          <div className="w-16 h-16 rounded-full bg-[var(--color-primary-500)] flex items-center justify-center shadow-lg">
            <Play className="w-8 h-8 text-white ml-1" fill="white" />
          </div>
        </div>

        {/* Duration Badge */}
        {video.duration && (
          <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/80 flex items-center gap-1">
            <Clock className="w-3 h-3 text-white" />
            <span className="text-xs text-white font-medium">{video.duration}</span>
          </div>
        )}

        {/* Chapter Badge */}
        {video.chapter && (
          <div className="absolute top-2 left-2 px-2 py-1 rounded bg-[var(--color-primary-500)]/90">
            <span className="text-xs text-white font-medium">{video.chapter}</span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4">
        <h4 className="text-base font-semibold text-[var(--color-text-primary)] mb-1 line-clamp-2">
          {video.title}
        </h4>

        {video.description && (
          <p className="text-sm text-[var(--color-text-tertiary)] line-clamp-2 mb-2">
            {video.description}
          </p>
        )}

        {/* Progress Bar */}
        {showProgress && (
          <div className="mt-3">
            <div className="w-full h-1.5 bg-[var(--color-bg-quaternary)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--color-primary-500)] rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
              {progress}% 완료
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
