'use client';

import React from 'react';
import Badge from './Badge';
import Button from './Button';

export interface InstructorCardProps {
  id: string;
  name: string;
  avatar: string;
  title?: string;
  bio?: string;
  specialties: string[];
  rating?: number;
  reviewCount?: number;
  studentCount?: number;
  courseCount?: number;
  verified?: boolean;
  isFollowing?: boolean;
  followersCount?: number;
  className?: string;
  variant?: 'default' | 'compact' | 'minimal';
  onFollow?: (instructorId: string, isFollowing: boolean) => void;
  onClick?: (instructorId: string) => void;
}

export const InstructorCard: React.FC<InstructorCardProps> = ({
  id,
  name,
  avatar,
  title,
  bio,
  specialties,
  rating,
  reviewCount,
  studentCount,
  courseCount,
  verified = false,
  isFollowing = false,
  followersCount,
  className = '',
  variant = 'default',
  onFollow,
  onClick,
}) => {
  const handleFollowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFollow?.(id, !isFollowing);
  };

  const handleCardClick = () => {
    onClick?.(id);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Compact variant
  if (variant === 'compact') {
    return (
      <div 
        className={`flex items-center gap-4 p-4 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg hover:shadow-linear hover:border-[var(--color-primary-400)] transition-all duration-200 cursor-pointer ${className}`}
        onClick={handleCardClick}
      >
        <div className="relative flex-shrink-0">
          <img 
            src={avatar} 
            alt={name}
            className="w-12 h-12 rounded-full object-cover"
          />
          {verified && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-[var(--color-text-primary)] text-sm truncate">{name}</h3>
          </div>
          {title && (
            <p className="text-xs text-[var(--color-text-secondary)] mb-1 truncate">{title}</p>
          )}
          <div className="flex items-center gap-3 text-xs text-[var(--color-text-tertiary)]">
            {rating && (
              <span className="flex items-center gap-1">
                ⭐ {rating}
              </span>
            )}
            {studentCount && (
              <span>{formatNumber(studentCount)} students</span>
            )}
          </div>
        </div>

        <Button 
          size="sm" 
          variant={isFollowing ? "outline" : "primary"}
          onClick={handleFollowClick}
          className="relative overflow-hidden"
        >
          {isFollowing ? 'Following' : 'Follow'}
        </Button>
      </div>
    );
  }

  // Minimal variant
  if (variant === 'minimal') {
    return (
      <div 
        className={`text-center p-4 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg hover:shadow-linear hover:border-[var(--color-primary-400)] transition-all duration-200 cursor-pointer ${className}`}
        onClick={handleCardClick}
      >
        <div className="relative inline-block mb-3">
          <img 
            src={avatar} 
            alt={name}
            className="w-16 h-16 rounded-full object-cover mx-auto"
          />
          {verified && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          )}
        </div>
        
        <h3 className="font-semibold text-[var(--color-text-primary)] text-sm mb-1 truncate">{name}</h3>
        {specialties.length > 0 && (
          <p className="text-xs text-[var(--color-text-secondary)] mb-2 truncate">
            {specialties[0]}
          </p>
        )}
        
        <Button 
          size="sm" 
          variant={isFollowing ? "outline" : "primary"}
          onClick={handleFollowClick}
          className="w-full relative overflow-hidden"
        >
          {isFollowing ? 'Following' : 'Follow'}
        </Button>
      </div>
    );
  }

  // Default variant
  return (
    <div 
      className={`bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-xl hover:shadow-linear hover:border-[var(--color-primary-400)] transition-all duration-200 cursor-pointer overflow-hidden ${className}`}
      onClick={handleCardClick}
    >
      {/* Header */}
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className="relative flex-shrink-0">
            <img 
              src={avatar} 
              alt={name}
              className="w-16 h-16 rounded-full object-cover"
            />
            {verified && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-[var(--color-text-primary)] mb-1">{name}</h3>
            {title && (
              <p className="text-sm text-[var(--color-text-secondary)] mb-2">{title}</p>
            )}
            
            {/* Specialties */}
            <div className="flex flex-wrap gap-1 mb-3">
              {specialties.slice(0, 3).map((specialty, index) => (
                <Badge key={index} variant="info" className="text-xs">
                  {specialty}
                </Badge>
              ))}
              {specialties.length > 3 && (
                <Badge variant="default" className="text-xs">
                  +{specialties.length - 3} more
                </Badge>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-[var(--color-text-secondary)] mb-3">
              {rating && (
                <div className="flex items-center gap-1">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill={i < Math.floor(rating) ? "#fbbf24" : "#e5e7eb"}
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                  </div>
                  <span>{rating} {reviewCount && `(${reviewCount})`}</span>
                </div>
              )}
              
              {studentCount && (
                <span>{formatNumber(studentCount)} students</span>
              )}
              
              {courseCount && (
                <span>{courseCount} courses</span>
              )}
            </div>

            {/* Bio */}
            {bio && (
              <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2 mb-4">
                {bio}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-[var(--color-bg-secondary)] border-t border-[var(--color-border-primary)] flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-[var(--color-text-secondary)]">
          {followersCount && (
            <span>{formatNumber(followersCount)} followers</span>
          )}
        </div>
        
        <Button 
          variant={isFollowing ? "outline" : "primary"}
          onClick={handleFollowClick}
        >
          {isFollowing ? 'Following' : 'Follow'}
        </Button>
      </div>
    </div>
  );
};

export default InstructorCard;