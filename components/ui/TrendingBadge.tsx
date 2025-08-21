'use client';

import React from 'react';

export interface TrendingBadgeProps {
  rank?: number;
  label?: string;
  variant?: 'rank' | 'hot' | 'new' | 'popular' | 'bestseller' | 'trending';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
}

export const TrendingBadge: React.FC<TrendingBadgeProps> = ({
  rank,
  label,
  variant = 'trending',
  size = 'md',
  animated = true,
  className = '',
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'rank':
        return 'bg-orange-500 text-white';
      case 'hot':
        return 'bg-red-500 text-white';
      case 'new':
        return 'bg-green-500 text-white';
      case 'popular':
        return 'bg-purple-500 text-white';
      case 'bestseller':
        return 'bg-yellow-500 text-white';
      case 'trending':
      default:
        return 'bg-orange-500 text-white';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs';
      case 'lg':
        return 'px-4 py-2 text-base';
      case 'md':
      default:
        return 'px-3 py-1.5 text-sm';
    }
  };

  const getIcon = () => {
    switch (variant) {
      case 'hot':
        return '🔥';
      case 'new':
        return '✨';
      case 'popular':
        return '❤️';
      case 'bestseller':
        return '👑';
      case 'trending':
        return '📈';
      case 'rank':
        return '#';
      default:
        return '🔥';
    }
  };

  const getLabel = () => {
    if (label) return label;
    if (rank && variant === 'rank') return `${rank}`;
    
    switch (variant) {
      case 'hot': return 'HOT';
      case 'new': return 'NEW';
      case 'popular': return 'POPULAR';
      case 'bestseller': return 'BESTSELLER';
      case 'trending': return 'TRENDING';
      case 'rank': return `#${rank || 1}`;
      default: return 'TRENDING';
    }
  };

  return (
    <div className={`
      inline-flex items-center gap-1 rounded-full font-bold
      ${getVariantStyles()}
      ${getSizeStyles()}
      ${animated ? 'animate-pulse hover:animate-none' : ''}
      hover:scale-105 transition-all duration-200
      ${className}
    `}>
      <span className="flex-shrink-0">{getIcon()}</span>
      <span className="uppercase tracking-wide leading-none">
        {getLabel()}
      </span>
    </div>
  );
};

export default TrendingBadge;