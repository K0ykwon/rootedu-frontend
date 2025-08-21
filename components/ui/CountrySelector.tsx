'use client';

import React, { useState, useRef, useEffect } from 'react';

export interface Country {
  code: string;
  name: string;
  flag: string;
  currency?: string;
  language?: string;
}

export interface CountrySelectorProps {
  countries: Country[];
  selectedCountry: string;
  onCountryChange: (countryCode: string) => void;
  className?: string;
  showFlag?: boolean;
  showName?: boolean;
  compact?: boolean;
}

const DEFAULT_COUNTRIES: Country[] = [
  { code: 'KR', name: 'South Korea', flag: '🇰🇷', currency: 'KRW', language: 'ko' },
  { code: 'US', name: 'United States', flag: '🇺🇸', currency: 'USD', language: 'en' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', currency: 'JPY', language: 'ja' },
  { code: 'CN', name: 'China', flag: '🇨🇳', currency: 'CNY', language: 'zh' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', currency: 'GBP', language: 'en' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', currency: 'EUR', language: 'de' },
  { code: 'FR', name: 'France', flag: '🇫🇷', currency: 'EUR', language: 'fr' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', currency: 'CAD', language: 'en' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', currency: 'AUD', language: 'en' },
  { code: 'IN', name: 'India', flag: '🇮🇳', currency: 'INR', language: 'en' },
];

export const CountrySelector: React.FC<CountrySelectorProps> = ({
  countries = DEFAULT_COUNTRIES,
  selectedCountry,
  onCountryChange,
  className = '',
  showFlag = true,
  showName = true,
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedCountryData = countries.find(country => country.code === selectedCountry);
  
  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleCountrySelect = (countryCode: string) => {
    onCountryChange(countryCode);
    setIsOpen(false);
    setSearchTerm('');
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    setSearchTerm('');
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={toggleDropdown}
        className={`
          flex items-center gap-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg
          hover:border-[var(--color-primary-400)] hover:shadow-linear
          focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-400)]/50 focus:ring-offset-2 focus:ring-offset-[var(--color-bg-primary)]
          transition-all duration-200
          ${compact 
            ? 'px-2 py-1 text-sm' 
            : 'px-3 py-2'
          }
        `}
        aria-label={`Select country, currently ${selectedCountryData?.name || 'Unknown'}`}
      >
        {showFlag && selectedCountryData && (
          <span className={compact ? 'text-base' : 'text-lg'}>
            {selectedCountryData.flag}
          </span>
        )}
        
        {showName && selectedCountryData && !compact && (
          <span className="font-medium text-[var(--color-text-primary)]">
            {selectedCountryData.name}
          </span>
        )}
        
        {compact && selectedCountryData && (
          <span className="font-medium text-[var(--color-text-primary)] text-xs">
            {selectedCountryData.code}
          </span>
        )}

        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`text-[var(--color-text-tertiary)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--color-bg-tertiary)]/95 backdrop-blur-xl border border-[var(--color-border-primary)]/50 rounded-lg shadow-[0_20px_40px_rgba(0,0,0,0.15)] z-50 min-w-max">
          {/* Search Input */}
          <div className="p-3 border-b border-[var(--color-border-primary)]">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search countries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-400)] focus:border-[var(--color-primary-400)]"
            />
          </div>

          {/* Countries List */}
          <div className="max-h-64 overflow-y-auto">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => (
                <button
                  key={country.code}
                  onClick={() => handleCountrySelect(country.code)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--color-bg-secondary)] transition-colors duration-200
                    ${selectedCountry === country.code 
                      ? 'bg-[var(--color-primary-50)] text-[var(--color-primary-600)]' 
                      : 'text-[var(--color-text-primary)]'
                    }
                  `}
                >
                  <span className="text-lg flex-shrink-0">{country.flag}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{country.name}</div>
                    <div className="text-sm text-[var(--color-text-tertiary)]">
                      {country.code} 
                      {country.currency && ` • ${country.currency}`}
                    </div>
                  </div>
                  
                  {selectedCountry === country.code && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z" />
                    </svg>
                  )}
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-[var(--color-text-tertiary)]">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto mb-2 opacity-50">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <p className="text-sm">No countries found</p>
                <p className="text-xs opacity-70 mt-1">Try a different search term</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CountrySelector;