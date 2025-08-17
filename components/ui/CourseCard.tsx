'use client';

import React, { useState } from 'react';
import Badge from './Badge';
import Avatar from './Avatar';

export interface CourseCardProps {
  id: string;
  title: string;
  instructor: {
    name: string;
    avatar?: string;
    verified?: boolean;
  };
  thumbnail: string;
  category: string;
  rating?: number;
  reviewCount?: number;
  price?: number;
  originalPrice?: number;
  duration?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  trending?: boolean;
  trendingRank?: number;
  isWishlisted?: boolean;
  studentCount?: number;
  className?: string;
  onWishlistToggle?: (courseId: string, isWishlisted: boolean) => void;
  onClick?: (courseId: string) => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  id,
  title,
  instructor,
  thumbnail,
  category,
  rating,
  reviewCount,
  price,
  originalPrice,
  duration,
  difficulty,
  trending,
  trendingRank,
  isWishlisted = false,
  studentCount,
  className = '',
  onWishlistToggle,
  onClick,
}) => {
  const [wishlistState, setWishlistState] = useState(isWishlisted);

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newState = !wishlistState;
    setWishlistState(newState);
    onWishlistToggle?.(id, newState);
  };

  const handleCardClick = () => {
    onClick?.(id);
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getDifficultyColor = (level?: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-500';
      case 'intermediate': return 'bg-orange-500';
      case 'advanced': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div 
      className={`relative bg-[var(--color-bg-tertiary)] rounded-lg overflow-hidden border border-[var(--color-border-primary)] shadow-linear hover:shadow-[0_8px_24px_rgba(86,186,125,0.12)] hover:border-[var(--color-primary-400)] transition-all duration-200 hover:scale-[1.02] cursor-pointer group ${className}`}
      onClick={handleCardClick}
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img 
          src={thumbnail} 
          alt={title}
          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />
        
        {/* Trending Badge */}
        {trending && trendingRank && (
          <div className="absolute top-3 left-3">
            <Badge 
              variant="primary" 
              className="bg-orange-500 text-white font-bold px-2 py-1 text-sm"
            >
              #{trendingRank}
            </Badge>
          </div>
        )}

        {/* Difficulty Badge */}
        {difficulty && (
          <div className="absolute top-3 right-3">
            <div className={`${getDifficultyColor(difficulty)} text-white text-xs px-2 py-1 rounded-full font-medium capitalize`}>
              {difficulty}
            </div>
          </div>
        )}

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistClick}
          className="absolute bottom-3 right-3 p-2 rounded-full bg-black/20 backdrop-blur-sm hover:bg-black/30 transition-colors duration-200"
          aria-label={wishlistState ? "Remove from wishlist" : "Add to wishlist"}
        >
          <svg 
            width="18" 
            height="18" 
            viewBox="0 0 24 24" 
            fill={wishlistState ? "#ff6b6b" : "none"} 
            stroke={wishlistState ? "#ff6b6b" : "white"}
            strokeWidth="2"
            className="transition-colors duration-200"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>

        {/* Duration Overlay */}
        {duration && (
          <div className="absolute bottom-3 left-3 bg-black/50 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm">
            {duration}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Category */}
        <div className="text-xs text-[var(--color-text-tertiary)] mb-1 font-medium uppercase tracking-wide">
          {category}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-[var(--color-text-primary)] text-sm leading-tight mb-2 line-clamp-2 group-hover:text-[var(--color-primary-400)] transition-colors duration-200">
          {title}
        </h3>

        {/* Instructor */}
        <div className="flex items-center gap-2 mb-3">
          <Avatar 
            name={instructor.name} 
            src={instructor.avatar} 
            size="sm" 
          />
          <div className="flex items-center gap-1">
            <span className="text-xs text-[var(--color-text-secondary)] font-medium">
              {instructor.name}
            </span>
            {instructor.verified && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--color-primary-400)">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
        </div>

        {/* Rating and Student Count */}
        {(rating || studentCount) && (
          <div className="flex items-center justify-between mb-3 text-xs">
            {rating && (
              <div className="flex items-center gap-1">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill={i < Math.floor(rating) ? "#fbbf24" : "#e5e7eb"}
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
                <span className="text-[var(--color-text-secondary)] ml-1">
                  {rating} {reviewCount && `(${reviewCount})`}
                </span>
              </div>
            )}
            
            {studentCount && (
              <span className="text-[var(--color-text-tertiary)]">
                {studentCount.toLocaleString()} students
              </span>
            )}
          </div>
        )}

        {/* Price */}
        {price && (
          <div className="flex items-center gap-2">
            <span className="font-bold text-[var(--color-text-primary)]">
              {formatPrice(price)}
            </span>
            {originalPrice && originalPrice > price && (
              <span className="text-xs text-[var(--color-text-tertiary)] line-through">
                {formatPrice(originalPrice)}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseCard;