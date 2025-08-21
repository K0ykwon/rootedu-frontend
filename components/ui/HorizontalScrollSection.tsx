'use client';

import React, { useRef, useState, useEffect } from 'react';

export interface HorizontalScrollSectionProps {
  title: string;
  subtitle?: string;
  showSeeAll?: boolean;
  onSeeAllClick?: () => void;
  children: React.ReactNode;
  className?: string;
  cardWidth?: number; // Width of each card in pixels
  gap?: number; // Gap between cards in pixels
  showArrows?: boolean;
  arrowPosition?: 'inside' | 'outside';
}

export const HorizontalScrollSection: React.FC<HorizontalScrollSectionProps> = ({
  title,
  subtitle,
  showSeeAll = true,
  onSeeAllClick,
  children,
  className = '',
  cardWidth = 280,
  gap = 16,
  showArrows = true,
  arrowPosition = 'inside',
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollButtons = () => {
    if (!scrollRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  };

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    updateScrollButtons();
    scrollContainer.addEventListener('scroll', updateScrollButtons);
    
    // Update on resize
    const handleResize = () => updateScrollButtons();
    window.addEventListener('resize', handleResize);

    return () => {
      scrollContainer.removeEventListener('scroll', updateScrollButtons);
      window.removeEventListener('resize', handleResize);
    };
  }, [children]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    
    const scrollAmount = cardWidth + gap;
    const newScrollLeft = direction === 'left' 
      ? scrollRef.current.scrollLeft - scrollAmount * 2
      : scrollRef.current.scrollLeft + scrollAmount * 2;

    scrollRef.current.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth',
    });
  };

  const ArrowButton = ({ 
    direction, 
    onClick, 
    disabled 
  }: { 
    direction: 'left' | 'right'; 
    onClick: () => void; 
    disabled: boolean;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        absolute top-1/2 -translate-y-1/2 z-10
        w-12 h-12 rounded-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] shadow-linear
        flex items-center justify-center
        transition-all duration-200 hover:scale-105
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
        focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-400)]/50 focus:ring-offset-2 focus:ring-offset-[var(--color-bg-primary)]
        ${direction === 'left' 
          ? arrowPosition === 'inside' ? 'left-4' : '-left-5'
          : arrowPosition === 'inside' ? 'right-4' : '-right-5'
        }
      `}
      aria-label={`Scroll ${direction}`}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`text-[var(--color-text-primary)] ${direction === 'left' ? 'rotate-180' : ''}`}
      >
        <path d="m9 18 6-6-6-6" />
      </svg>
    </button>
  );

  return (
    <section className={`relative ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-[var(--color-text-primary)] mb-1">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-[var(--color-text-secondary)]">
              {subtitle}
            </p>
          )}
        </div>
        
        {showSeeAll && (
          <button
            onClick={onSeeAllClick}
            className="text-sm font-medium text-[var(--color-primary-400)] hover:text-[var(--color-primary-500)] transition-all duration-200 flex items-center gap-1 px-3 py-1 rounded-lg hover:bg-[var(--color-bg-tertiary)]/50"
          >
            See All
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        )}
      </div>

      {/* Scroll Container */}
      <div className="relative group">
        {/* Navigation Arrows */}
        {showArrows && (
          <>
            <ArrowButton
              direction="left"
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
            />
            <ArrowButton
              direction="right"
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
            />
          </>
        )}

        {/* Scrollable Content */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-4"
          style={{
            scrollSnapType: 'x mandatory',
            scrollPadding: '0 16px',
          }}
        >
          {React.Children.map(children, (child, index) => (
            <div
              key={index}
              className="flex-shrink-0"
              style={{
                width: cardWidth,
                scrollSnapAlign: 'start',
              }}
            >
              {child}
            </div>
          ))}
        </div>

        {/* Enhanced Fade Gradients */}
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[var(--color-bg-primary)] via-[var(--color-bg-primary)]/60 to-transparent pointer-events-none z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[var(--color-bg-primary)] via-[var(--color-bg-primary)]/60 to-transparent pointer-events-none z-10" />
      </div>

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
};

export default HorizontalScrollSection;