import React from 'react';
import { Badge } from './Badge';
import { Button } from './Button';

interface InfluencerCardProps {
  name: string;
  username: string;
  avatar: string;
  coverImage?: string;
  bio: string;
  followers: number;
  students: number;
  courses: number;
  rating: number;
  verified?: boolean;
  expertise: string[];
  isFollowing?: boolean;
  onFollow?: () => void;
  onClick?: () => void;
  className?: string;
}

export const InfluencerCard: React.FC<InfluencerCardProps> = ({
  name,
  username,
  avatar,
  coverImage,
  bio,
  followers,
  students,
  courses,
  rating,
  verified = false,
  expertise = [],
  isFollowing = false,
  onFollow,
  onClick,
  className = ''
}) => {
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div 
      className={`bg-[var(--color-bg-secondary)] rounded-2xl overflow-hidden border border-[var(--color-border-primary)] transition-all duration-200 hover:border-[var(--color-primary-400)] hover:shadow-[0_8px_24px_rgba(86,186,125,0.12)] ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {/* Cover Image */}
      <div className="relative h-24 bg-gradient-to-br from-[var(--color-primary-400)] to-[var(--color-primary-600)]">
        {coverImage && (
          <img 
            src={coverImage} 
            alt={`${name} cover`}
            className="w-full h-full object-cover"
          />
        )}
        
        {/* Follow Button - Top Right */}
        <div className="absolute top-3 right-3">
          <Button
            size="sm"
            variant={isFollowing ? "secondary" : "primary"}
            onClick={(e) => {
              e.stopPropagation();
              onFollow?.();
            }}
            className="!min-h-[32px] !text-[13px] backdrop-blur-sm bg-opacity-90"
          >
            {isFollowing ? 'Following' : 'Follow'}
          </Button>
        </div>
      </div>

      {/* Profile Section */}
      <div className="px-4 pb-4">
        {/* Avatar */}
        <div className="relative -mt-10 mb-3">
          <div className="relative inline-block">
            <img
              src={avatar}
              alt={name}
              className="w-20 h-20 rounded-full border-4 border-[var(--color-bg-secondary)] object-cover"
            />
            {verified && (
              <div className="absolute bottom-0 right-0 w-6 h-6 bg-[var(--color-primary-400)] rounded-full flex items-center justify-center border-2 border-[var(--color-bg-secondary)]">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="white">
                  <path d="M4.5 7.5L2 5l0.7-0.7L4.5 6.1l4.8-4.8L10 2z"/>
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Name and Username */}
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
            {name}
            {verified && (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="var(--color-primary-400)">
                <path d="M8 0L9.5 1.5L11.5 1L12 3L14 3.5L13.5 5.5L15 7L13.5 8.5L14 10.5L12 11L11.5 13L9.5 12.5L8 14L6.5 12.5L4.5 13L4 11L2 10.5L2.5 8.5L1 7L2.5 5.5L2 3.5L4 3L4.5 1L6.5 1.5L8 0ZM7 9L11 5L10 4L7 7L5 5L4 6L7 9Z"/>
              </svg>
            )}
          </h3>
          <p className="text-sm text-[var(--color-text-tertiary)]">@{username}</p>
        </div>

        {/* Bio */}
        <p className="text-sm text-[var(--color-text-secondary)] mb-4 line-clamp-2">
          {bio}
        </p>

        {/* Expertise Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {expertise.slice(0, 3).map((skill, index) => (
            <Badge key={index} variant="primary" size="sm">
              {skill}
            </Badge>
          ))}
          {expertise.length > 3 && (
            <Badge variant="default" size="sm">
              +{expertise.length - 3}
            </Badge>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[var(--color-border-secondary)]">
          <div className="text-center">
            <div className="text-lg font-semibold text-[var(--color-text-primary)]">
              {formatNumber(followers)}
            </div>
            <div className="text-xs text-[var(--color-text-tertiary)]">Followers</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-[var(--color-text-primary)]">
              {formatNumber(students)}
            </div>
            <div className="text-xs text-[var(--color-text-tertiary)]">Students</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-[var(--color-text-primary)] flex items-center justify-center gap-1">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="var(--color-warning)">
                <path d="M7 0L9.1 4.3L14 5L10.5 8.4L11.3 13.3L7 11.1L2.7 13.3L3.5 8.4L0 5L4.9 4.3L7 0Z"/>
              </svg>
              {rating.toFixed(1)}
            </div>
            <div className="text-xs text-[var(--color-text-tertiary)]">{courses} Courses</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Compact Influencer Card for lists
interface InfluencerCardCompactProps {
  name: string;
  username: string;
  avatar: string;
  followers: number;
  rating: number;
  verified?: boolean;
  isFollowing?: boolean;
  onFollow?: () => void;
  onClick?: () => void;
  className?: string;
}

export const InfluencerCardCompact: React.FC<InfluencerCardCompactProps> = ({
  name,
  username,
  avatar,
  followers,
  rating,
  verified = false,
  isFollowing = false,
  onFollow,
  onClick,
  className = ''
}) => {
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div 
      className={`flex items-center gap-3 p-4 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border-primary)] transition-all duration-200 hover:bg-[var(--color-bg-tertiary)] tap-scale ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <img
          src={avatar}
          alt={name}
          className="w-12 h-12 rounded-full object-cover"
        />
        {verified && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[var(--color-primary-400)] rounded-full flex items-center justify-center border-2 border-[var(--color-bg-secondary)]">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="white">
              <path d="M3.5 6L1.5 4l0.5-0.5L3.5 5l4-4L8 1.5z"/>
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <h4 className="font-medium text-[var(--color-text-primary)] truncate">
            {name}
          </h4>
          {verified && (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="var(--color-primary-400)" className="flex-shrink-0">
              <path d="M7 0L8.5 1.5L10.5 1L11 3L13 3.5L12.5 5.5L14 7L12.5 8.5L13 10.5L11 11L10.5 13L8.5 12.5L7 14L5.5 12.5L3.5 13L3 11L1 10.5L1.5 8.5L0 7L1.5 5.5L1 3.5L3 3L3.5 1L5.5 1.5L7 0ZM6 8L10 4L9 3L6 6L4 4L3 5L6 8Z"/>
            </svg>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-sm text-[var(--color-text-tertiary)]">
            {formatNumber(followers)} followers
          </span>
          <div className="flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="var(--color-warning)">
              <path d="M6 0L7.8 3.7L12 4.3L9 7.2L9.6 11.4L6 9.5L2.4 11.4L3 7.2L0 4.3L4.2 3.7L6 0Z"/>
            </svg>
            <span className="text-sm text-[var(--color-text-secondary)]">{rating.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* Follow Button */}
      <Button
        size="sm"
        variant={isFollowing ? "outline" : "primary"}
        onClick={(e) => {
          e.stopPropagation();
          onFollow?.();
        }}
        className="!min-h-[36px]"
      >
        {isFollowing ? 'Following' : 'Follow'}
      </Button>
    </div>
  );
};

// Mini Influencer Card for suggestions
interface InfluencerCardMiniProps {
  name: string;
  avatar: string;
  expertise: string;
  verified?: boolean;
  onClick?: () => void;
  className?: string;
}

export const InfluencerCardMini: React.FC<InfluencerCardMiniProps> = ({
  name,
  avatar,
  expertise,
  verified = false,
  onClick,
  className = ''
}) => {
  return (
    <div 
      className={`flex flex-col items-center p-4 bg-[var(--color-bg-tertiary)] rounded-xl border border-[var(--color-border-primary)] transition-all duration-200 hover:border-[var(--color-primary-400)] tap-scale ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      <div className="relative mb-3">
        <img
          src={avatar}
          alt={name}
          className="w-16 h-16 rounded-full object-cover"
        />
        {verified && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[var(--color-primary-400)] rounded-full flex items-center justify-center border-2 border-[var(--color-bg-tertiary)]">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="white">
              <path d="M3.5 6L1.5 4l0.5-0.5L3.5 5l4-4L8 1.5z"/>
            </svg>
          </div>
        )}
      </div>
      <h5 className="font-medium text-sm text-[var(--color-text-primary)] text-center mb-1">
        {name}
      </h5>
      <p className="text-xs text-[var(--color-text-tertiary)] text-center">
        {expertise}
      </p>
    </div>
  );
};