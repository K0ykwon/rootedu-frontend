import React, { useState, useRef, useEffect } from 'react';

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  suggestions?: string[];
  showClearButton?: boolean;
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search...',
  value: controlledValue,
  onChange,
  onSearch,
  onFocus,
  onBlur,
  suggestions = [],
  showClearButton = true,
  className = ''
}) => {
  const [internalValue, setInternalValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
    setShowSuggestions(true);
  };

  const handleClear = () => {
    if (controlledValue === undefined) {
      setInternalValue('');
    }
    onChange?.('');
    inputRef.current?.focus();
  };

  const handleSearch = () => {
    onSearch?.(value);
    setShowSuggestions(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (controlledValue === undefined) {
      setInternalValue(suggestion);
    }
    onChange?.(suggestion);
    onSearch?.(suggestion);
    setShowSuggestions(false);
  };

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
    // Delay to allow suggestion click
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const filteredSuggestions = suggestions.filter(s => 
    s.toLowerCase().includes(value.toLowerCase())
  );

  return (
    <div className={`relative ${className}`}>
      <div className={`relative flex items-center bg-[var(--color-bg-tertiary)] rounded-xl border transition-all duration-200 ${
        isFocused 
          ? 'border-[var(--color-primary-400)] shadow-[0_0_0_3px_rgba(86,186,125,0.1)]' 
          : 'border-[var(--color-border-primary)]'
      }`}>
        {/* Search Icon */}
        <div className="pl-4 pr-2">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            className="text-[var(--color-text-tertiary)]"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 14A6 6 0 108 2a6 6 0 000 12zm6.32-1.094l3.387 3.387"
            />
          </svg>
        </div>
        
        {/* Input */}
        <input
          ref={inputRef}
          type="search"
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="flex-1 h-12 bg-transparent text-base text-[var(--color-text-primary)] placeholder:text-[var(--color-text-quaternary)] focus:outline-none"
        />
        
        {/* Clear Button */}
        {showClearButton && value && (
          <button
            onClick={handleClear}
            className="p-2 mr-2 rounded-lg hover:bg-[var(--color-bg-quaternary)] transition-colors tap-scale"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              className="text-[var(--color-text-tertiary)]"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        )}
      </div>
      
      {/* Suggestions Dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl shadow-lg z-20 max-h-64 overflow-y-auto">
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-4 py-3 text-left text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] transition-colors first:rounded-t-xl last:rounded-b-xl"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Sticky Search Header for mobile
interface StickySearchHeaderProps {
  title?: string;
  onBack?: () => void;
  searchProps?: Omit<SearchBarProps, 'className'>;
  className?: string;
}

export const StickySearchHeader: React.FC<StickySearchHeaderProps> = ({
  title,
  onBack,
  searchProps,
  className = ''
}) => {
  const [showSearch, setShowSearch] = useState(false);

  return (
    <header className={`sticky top-0 bg-[var(--color-bg-primary)] border-b border-[var(--color-border-primary)] z-30 safe-top ${className}`}>
      <div className="px-4 py-3">
        {showSearch ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSearch(false)}
              className="p-2 -ml-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors tap-scale"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                className="text-[var(--color-text-secondary)]"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10H5m0 0l5-5m-5 5l5 5" />
              </svg>
            </button>
            <SearchBar {...searchProps} className="flex-1" />
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2 -ml-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors tap-scale"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    className="text-[var(--color-text-secondary)]"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10H5m0 0l5-5m-5 5l5 5" />
                  </svg>
                </button>
              )}
              {title && (
                <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">{title}</h1>
              )}
            </div>
            
            {searchProps && (
              <button
                onClick={() => setShowSearch(true)}
                className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors tap-scale"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  className="text-[var(--color-text-secondary)]"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 14A6 6 0 108 2a6 6 0 000 12zm6.32-1.094l3.387 3.387"
                  />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default SearchBar;