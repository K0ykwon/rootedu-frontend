'use client';

import React, { useState, useRef, useEffect } from 'react';

export interface Category {
  id: string;
  name: string;
  icon?: string;
  count?: number;
}

export interface CategoryFilterProps {
  categories: Category[];
  activeCategory?: string;
  onCategoryChange: (categoryId: string) => void;
  variant?: 'tabs' | 'dropdown';
  showAll?: boolean;
  allLabel?: string;
  className?: string;
  scrollable?: boolean;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  activeCategory = 'all',
  onCategoryChange,
  variant = 'tabs',
  showAll = true,
  allLabel = 'All Categories',
  className = '',
  scrollable = true,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const allCategories = showAll 
    ? [{ id: 'all', name: allLabel, count: categories.reduce((sum, cat) => sum + (cat.count || 0), 0) }, ...categories]
    : categories;

  const activeItem = allCategories.find(cat => cat.id === activeCategory);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCategoryClick = (categoryId: string) => {
    onCategoryChange(categoryId);
    if (variant === 'dropdown') {
      setIsDropdownOpen(false);
    }
  };

  // Scroll active tab into view
  useEffect(() => {
    if (variant === 'tabs' && scrollable && scrollRef.current) {
      const activeElement = scrollRef.current.querySelector(`[data-category-id="${activeCategory}"]`);
      if (activeElement) {
        activeElement.scrollIntoView({
          behavior: 'smooth',
          inline: 'center',
          block: 'nearest',
        });
      }
    }
  }, [activeCategory, variant, scrollable]);

  if (variant === 'dropdown') {
    return (
      <div className={`relative ${className}`} ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center justify-between w-full px-4 py-3 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg hover:border-[var(--color-primary-400)] hover:shadow-linear focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-400)]/50 transition-all duration-200"
        >
          <div className="flex items-center gap-2">
            {activeItem?.icon && (
              <span className="text-lg">{activeItem.icon}</span>
            )}
            <span className="font-medium text-[var(--color-text-primary)]">
              {activeItem?.name || allLabel}
            </span>
            {activeItem?.count !== undefined && (
              <span className="text-sm text-[var(--color-text-tertiary)]">
                ({activeItem.count})
              </span>
            )}
          </div>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        {isDropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.15)] z-50 max-h-80 overflow-y-auto">
            {allCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--color-bg-secondary)] transition-colors duration-200
                  ${activeCategory === category.id ? 'bg-[var(--color-primary-50)] text-[var(--color-primary-600)]' : 'text-[var(--color-text-secondary)]'}
                `}
              >
                {category.icon && (
                  <span className="text-lg">{category.icon}</span>
                )}
                <span className="font-medium">{category.name}</span>
                {category.count !== undefined && (
                  <span className="text-sm text-[var(--color-text-tertiary)] ml-auto">
                    ({category.count})
                  </span>
                )}
                {activeCategory === category.id && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="ml-2">
                    <path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Tabs variant
  return (
    <div className={`${className}`}>
      <div
        ref={scrollRef}
        className={`
          flex gap-1 p-1 bg-[var(--color-bg-tertiary)] rounded-lg border border-[var(--color-border-primary)]
          ${scrollable ? 'overflow-x-auto scrollbar-hide' : 'flex-wrap'}
        `}
      >
        {allCategories.map((category) => (
          <button
            key={category.id}
            data-category-id={category.id}
            onClick={() => handleCategoryClick(category.id)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap
              transition-all duration-200 flex-shrink-0
              ${activeCategory === category.id
                ? 'bg-[var(--color-primary-400)] text-white shadow-linear'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]'
              }
            `}
          >
            {category.icon && (
              <span className="text-base">{category.icon}</span>
            )}
            <span>{category.name}</span>
            {category.count !== undefined && (
              <span className={`
                text-xs px-2 py-0.5 rounded-full
                ${activeCategory === category.id
                  ? 'bg-white/20 text-white'
                  : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-tertiary)]'
                }
              `}>
                {category.count}
              </span>
            )}
          </button>
        ))}
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
    </div>
  );
};

export default CategoryFilter;