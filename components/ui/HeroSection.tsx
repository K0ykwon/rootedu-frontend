'use client';

import React from 'react';
import Button from './Button';
import Link from 'next/link';

export interface HeroSectionProps {
  title: string;
  subtitle?: string;
  description?: string;
  backgroundImage?: string;
  backgroundVideo?: string;
  overlay?: boolean;
  overlayOpacity?: number;
  ctaButtons?: {
    primary?: {
      text: string;
      onClick?: () => void;
      href?: string;
    };
    secondary?: {
      text: string;
      onClick?: () => void;
      href?: string;
    };
  };
  features?: string[];
  stats?: {
    label: string;
    value: string | number;
    icon?: string;
  }[];
  className?: string;
  textAlign?: 'left' | 'center' | 'right';
  height?: 'small' | 'medium' | 'large' | 'full';
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  title,
  subtitle,
  description,
  backgroundImage,
  backgroundVideo,
  overlay = true,
  overlayOpacity = 0.5,
  ctaButtons,
  features,
  stats,
  className = '',
  textAlign = 'center',
  height = 'large',
}) => {
  const getHeightClass = () => {
    switch (height) {
      case 'small': return 'min-h-[400px]';
      case 'medium': return 'min-h-[500px]';
      case 'large': return 'min-h-[600px]';
      case 'full': return 'min-h-screen';
      default: return 'min-h-[600px]';
    }
  };

  const getTextAlignClass = () => {
    switch (textAlign) {
      case 'left': return 'text-left items-start';
      case 'right': return 'text-right items-end';
      case 'center': 
      default: return 'text-center items-center';
    }
  };

  const formatStatValue = (value: string | number) => {
    if (typeof value === 'number') {
      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
      return value.toLocaleString();
    }
    return value;
  };

  return (
    <section className={`relative ${getHeightClass()} flex items-center justify-center overflow-hidden ${className}`}>
      {/* Background Media */}
      {backgroundVideo && (
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          poster={backgroundImage}
        >
          <source src={backgroundVideo} type="video/mp4" />
        </video>
      )}
      
      {backgroundImage && !backgroundVideo && (
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
      )}

      {/* Overlay */}
      {overlay && (backgroundImage || backgroundVideo) && (
        <div 
          className="absolute inset-0 bg-black"
          style={{ opacity: overlayOpacity }}
        />
      )}

      {/* Enhanced Background Pattern (if no image/video) */}
      {!backgroundImage && !backgroundVideo && (
        <div className="absolute inset-0">
          {/* Premium Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a0b0c] via-[var(--color-bg-primary)] to-[#0f1012]" />
          
          {/* Metallic Shimmer Layer */}
          <div className="absolute inset-0 bg-[var(--metallic-gradient)] opacity-30" />
          
          {/* Animated Glass Orbs */}
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-[var(--color-primary-400)]/10 to-[var(--color-primary-300)]/10 rounded-full blur-3xl animate-pulse backdrop-blur-sm" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-[var(--color-primary-500)]/8 to-[var(--color-primary-400)]/8 rounded-full blur-3xl animate-pulse backdrop-blur-sm" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-gradient-to-r from-[var(--color-primary-400)]/5 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s', transform: 'translate(-50%, -50%)' }} />
          
          {/* Noise Texture */}
          <div className="absolute inset-0 noise-texture opacity-30" />
          
          {/* Pattern Overlay */}
          <div className="absolute inset-0 opacity-5">
            <svg width="100%" height="100%" viewBox="0 0 100 100">
              <defs>
                <pattern id="hero-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="10" cy="10" r="0.5" fill="currentColor" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#hero-pattern)" />
            </svg>
          </div>
        </div>
      )}

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8">
        <div className={`flex flex-col ${getTextAlignClass()} py-12`}>
          {/* Subtitle */}
          {subtitle && (
            <p className="text-sm md:text-base font-medium text-orange-600 mb-4 uppercase tracking-wide">
              {subtitle}
            </p>
          )}

          {/* Title */}
          <h1 className={`
            font-bold mb-6 leading-tight
            ${backgroundImage || backgroundVideo ? 'text-white' : 'text-[var(--color-text-primary)]'}
            text-3xl md:text-5xl lg:text-6xl
          `}>
            {title}
          </h1>

          {/* Description */}
          {description && (
            <p className={`
              text-lg md:text-xl mb-8 max-w-3xl leading-relaxed
              ${backgroundImage || backgroundVideo ? 'text-gray-200' : 'text-[var(--color-text-secondary)]'}
            `}>
              {description}
            </p>
          )}

          {/* Features List */}
          {features && features.length > 0 && (
            <div className="mb-8">
              <ul className={`
                inline-flex flex-wrap gap-4 text-sm md:text-base
                ${backgroundImage || backgroundVideo ? 'text-gray-200' : 'text-[var(--color-text-secondary)]'}
              `}>
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-green-500 flex-shrink-0">
                      <path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* CTA Buttons */}
          {ctaButtons && (
            <div className={`flex flex-col sm:flex-row gap-4 mb-12 ${textAlign === 'center' ? 'justify-center' : textAlign === 'right' ? 'justify-end' : 'justify-start'}`}>
              {ctaButtons.primary && (
                ctaButtons.primary.href ? (
                  <Link href={ctaButtons.primary.href}>
                    <Button
                      size="lg"
                      variant="primary"
                      className="px-8 py-4 text-lg font-semibold"
                    >
                      {ctaButtons.primary.text}
                    </Button>
                  </Link>
                ) : (
                  <Button
                    size="lg"
                    variant="primary"
                    onClick={ctaButtons.primary.onClick}
                    className="px-8 py-4 text-lg font-semibold"
                  >
                    {ctaButtons.primary.text}
                  </Button>
                )
              )}
              {ctaButtons.secondary && (
                ctaButtons.secondary.href ? (
                  <Link href={ctaButtons.secondary.href}>
                    <Button
                      size="lg"
                      variant={backgroundImage || backgroundVideo ? "outline" : "secondary"}
                      className={`
                        px-8 py-4 text-lg font-semibold
                        ${backgroundImage || backgroundVideo 
                          ? 'border-white text-white hover:bg-white hover:text-gray-900' 
                          : ''
                        }
                      `}
                    >
                      {ctaButtons.secondary.text}
                    </Button>
                  </Link>
                ) : (
                  <Button
                    size="lg"
                    variant={backgroundImage || backgroundVideo ? "outline" : "secondary"}
                    onClick={ctaButtons.secondary.onClick}
                    className={`
                      px-8 py-4 text-lg font-semibold
                      ${backgroundImage || backgroundVideo 
                        ? 'border-white text-white hover:bg-white hover:text-gray-900' 
                        : ''
                      }
                    `}
                  >
                    {ctaButtons.secondary.text}
                  </Button>
                )
              )}
            </div>
          )}

          {/* Stats */}
          {stats && stats.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  {stat.icon && (
                    <div className="text-3xl mb-2">{stat.icon}</div>
                  )}
                  <div className={`
                    text-2xl md:text-3xl font-bold mb-1
                    ${backgroundImage || backgroundVideo ? 'text-white' : 'text-[var(--color-text-primary)]'}
                  `}>
                    {formatStatValue(stat.value)}
                  </div>
                  <div className={`
                    text-sm md:text-base
                    ${backgroundImage || backgroundVideo ? 'text-gray-200' : 'text-[var(--color-text-secondary)]'}
                  `}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={backgroundImage || backgroundVideo ? 'text-white' : 'text-[var(--color-text-secondary)]'}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;