import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  width,
  height,
  animation = 'pulse'
}) => {
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-lg'
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: ''
  };

  const defaultSizes = {
    text: { width: '100%', height: '1em' },
    circular: { width: '40px', height: '40px' },
    rectangular: { width: '100%', height: '100px' },
    rounded: { width: '100%', height: '100px' }
  };

  const styles: React.CSSProperties = {
    width: width || defaultSizes[variant].width,
    height: height || defaultSizes[variant].height
  };

  return (
    <div
      className={`bg-[var(--color-bg-quaternary)] ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={styles}
    />
  );
};

export default Skeleton;

// Card Skeleton
export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-xl p-6">
      <div className="mb-4">
        <Skeleton variant="text" width="60%" height="24px" className="mb-2" />
        <Skeleton variant="text" width="40%" height="16px" />
      </div>
      <div className="space-y-2">
        <Skeleton variant="text" />
        <Skeleton variant="text" />
        <Skeleton variant="text" width="80%" />
      </div>
      <div className="mt-4 pt-4 border-t border-[var(--color-border-secondary)]">
        <Skeleton variant="rounded" height="32px" width="100px" />
      </div>
    </div>
  );
};

// List Item Skeleton
export const ListItemSkeleton: React.FC = () => {
  return (
    <div className="flex items-center gap-4 p-4">
      <Skeleton variant="circular" width="48px" height="48px" />
      <div className="flex-1">
        <Skeleton variant="text" width="70%" height="18px" className="mb-2" />
        <Skeleton variant="text" width="50%" height="14px" />
      </div>
    </div>
  );
};

// Course Card Skeleton
export const CourseCardSkeleton: React.FC = () => {
  return (
    <div className="bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-xl overflow-hidden">
      <Skeleton variant="rectangular" height="160px" />
      <div className="p-4">
        <Skeleton variant="text" width="80%" height="20px" className="mb-2" />
        <Skeleton variant="text" width="60%" height="14px" className="mb-4" />
        <div className="flex items-center justify-between">
          <Skeleton variant="text" width="30%" height="14px" />
          <Skeleton variant="rounded" width="80px" height="32px" />
        </div>
      </div>
    </div>
  );
};

// Chat Message Skeleton
export const ChatMessageSkeleton: React.FC<{ isUser?: boolean }> = ({ isUser = false }) => {
  return (
    <div className={`flex gap-3 items-start ${isUser ? 'flex-row-reverse' : ''}`}>
      <Skeleton variant="circular" width="32px" height="32px" />
      <div className={`max-w-[70%] ${isUser ? 'ml-auto' : ''}`}>
        <Skeleton variant="rounded" width="200px" height="60px" />
      </div>
    </div>
  );
};