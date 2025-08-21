import React from 'react';
import Button from './Button';
import Badge from './Badge';
import Tabs from './Tabs';

interface InfluencerProfileHeaderProps {
  name: string;
  username: string;
  avatar: string;
  coverImage?: string;
  bio: string;
  location?: string;
  website?: string;
  joinDate?: string;
  followers: number;
  following: number;
  students: number;
  courses: number;
  rating: number;
  reviews: number;
  verified?: boolean;
  expertise: string[];
  achievements?: string[];
  isFollowing?: boolean;
  onFollow?: () => void;
  onMessage?: () => void;
  className?: string;
}

export const InfluencerProfileHeader: React.FC<InfluencerProfileHeaderProps> = ({
  name,
  username,
  avatar,
  coverImage,
  bio,
  location,
  website,
  joinDate,
  followers,
  following,
  students,
  courses,
  rating,
  reviews,
  verified = false,
  expertise = [],
  achievements = [],
  isFollowing = false,
  onFollow,
  onMessage,
  className = ''
}) => {
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className={`bg-[var(--color-bg-secondary)] rounded-2xl overflow-hidden border border-[var(--color-border-primary)] ${className}`}>
      {/* Cover Image */}
      <div className="relative h-32 md:h-48 bg-gradient-to-br from-[var(--color-primary-400)] to-[var(--color-primary-600)]">
        {coverImage && (
          <img 
            src={coverImage} 
            alt={`${name} cover`}
            className="w-full h-full object-cover"
          />
        )}
        
        {/* Edit Cover Button (for own profile) */}
        <button className="absolute bottom-3 right-3 p-2 bg-black/50 backdrop-blur-sm rounded-lg hover:bg-black/60 transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
            <path d="M12 7L10 5L3 12V14H5L12 7ZM13.5 5.5L14.5 4.5C15 4 15 3 14.5 2.5L13.5 1.5C13 1 12 1 11.5 1.5L10.5 2.5L12.5 4.5L13.5 5.5Z"/>
          </svg>
        </button>
      </div>

      {/* Profile Content */}
      <div className="px-4 md:px-6 pb-6">
        {/* Avatar and Actions Row */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between -mt-16 md:-mt-20 mb-4">
          {/* Avatar */}
          <div className="relative mb-4 md:mb-0">
            <img
              src={avatar}
              alt={name}
              className="w-32 h-32 rounded-2xl border-4 border-[var(--color-bg-secondary)] object-cover"
            />
            {verified && (
              <div className="absolute bottom-2 right-2 w-8 h-8 bg-[var(--color-primary-400)] rounded-full flex items-center justify-center border-2 border-[var(--color-bg-secondary)]">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
                  <path d="M6 8L4 6l1-1l1 1l3-3l1 1z"/>
                </svg>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {onMessage && (
              <Button variant="outline" size="sm" onClick={onMessage}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M14 2H2C1 2 0 3 0 4V10C0 11 1 12 2 12H4L6 14V12H14C15 12 16 11 16 10V4C16 3 15 2 14 2Z"/>
                </svg>
                Message
              </Button>
            )}
            <Button
              variant={isFollowing ? "secondary" : "primary"}
              onClick={onFollow}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </Button>
          </div>
        </div>

        {/* Name and Username */}
        <div className="mb-3">
          <h1 className="text-2xl md:text-3xl font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
            {name}
            {verified && (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="var(--color-primary-400)">
                <path d="M10 0L12 2L14.5 1.5L15 4L17.5 4.5L17 7L19 9L17 11L17.5 13.5L15 14L14.5 16.5L12 16L10 18L8 16L5.5 16.5L5 14L2.5 13.5L3 11L1 9L3 7L2.5 4.5L5 4L5.5 1.5L8 2L10 0ZM9 12L14 7L13 6L9 10L6 7L5 8L9 12Z"/>
              </svg>
            )}
          </h1>
          <p className="text-[var(--color-text-tertiary)]">@{username}</p>
        </div>

        {/* Bio */}
        <p className="text-[var(--color-text-secondary)] mb-4">
          {bio}
        </p>

        {/* Meta Info */}
        <div className="flex flex-wrap gap-4 text-sm text-[var(--color-text-tertiary)] mb-4">
          {location && (
            <div className="flex items-center gap-1">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1C5 1 2 3.5 2 7C2 11 8 15 8 15S14 11 14 7C14 3.5 11 1 8 1ZM8 9C7 9 6 8 6 7S7 5 8 5S10 6 10 7S9 9 8 9Z"/>
              </svg>
              {location}
            </div>
          )}
          {website && (
            <a href={website} className="flex items-center gap-1 hover:text-[var(--color-primary-400)]">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M9 2L15 8L9 14L8 13L12.5 8.5H1V7H12.5L8 2.5L9 2Z"/>
              </svg>
              {website}
            </a>
          )}
          {joinDate && (
            <div className="flex items-center gap-1">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M13 2H12V1H11V2H5V1H4V2H3C2 2 1 3 1 4V14C1 15 2 16 3 16H13C14 16 15 15 15 14V4C15 3 14 2 13 2ZM13 14H3V6H13V14Z"/>
              </svg>
              Joined {joinDate}
            </div>
          )}
        </div>

        {/* Expertise Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          {expertise.map((skill, index) => (
            <Badge key={index} variant="primary" size="sm">
              {skill}
            </Badge>
          ))}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-[var(--color-bg-tertiary)] rounded-xl">
          <div>
            <div className="text-2xl font-semibold text-[var(--color-text-primary)]">
              {formatNumber(followers)}
            </div>
            <div className="text-sm text-[var(--color-text-tertiary)]">Followers</div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-[var(--color-text-primary)]">
              {formatNumber(students)}
            </div>
            <div className="text-sm text-[var(--color-text-tertiary)]">Students</div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-[var(--color-text-primary)]">
              {courses}
            </div>
            <div className="text-sm text-[var(--color-text-tertiary)]">Courses</div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-[var(--color-text-primary)] flex items-center gap-1">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="var(--color-warning)">
                <path d="M9 0L11.3 5.6L17.5 6.4L13.3 10.5L14.2 16.7L9 13.8L3.8 16.7L4.7 10.5L0.5 6.4L6.7 5.6L9 0Z"/>
              </svg>
              {rating.toFixed(1)}
            </div>
            <div className="text-sm text-[var(--color-text-tertiary)]">{reviews} Reviews</div>
          </div>
        </div>

        {/* Achievements */}
        {achievements && achievements.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-[var(--color-text-tertiary)] mb-3">Achievements</h3>
            <div className="flex flex-wrap gap-2">
              {achievements.map((achievement, index) => (
                <div key={index} className="flex items-center gap-2 px-3 py-2 bg-[var(--color-bg-tertiary)] rounded-lg">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="var(--color-primary-400)">
                    <path d="M8 1L10 3L13 3.5L13.5 6.5L15.5 8L13.5 9.5L13 12.5L10 13L8 15L6 13L3 12.5L2.5 9.5L0.5 8L2.5 6.5L3 3.5L6 3L8 1Z"/>
                  </svg>
                  <span className="text-sm text-[var(--color-text-primary)]">{achievement}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Influencer Stats Widget
interface InfluencerStatsProps {
  totalEarnings?: number;
  monthlyStudents?: number;
  completionRate?: number;
  responseTime?: string;
  className?: string;
}

export const InfluencerStats: React.FC<InfluencerStatsProps> = ({
  totalEarnings = 0,
  monthlyStudents = 0,
  completionRate = 0,
  responseTime = '< 1 hour',
  className = ''
}) => {
  return (
    <div className={`grid grid-cols-2 gap-4 ${className}`}>
      <div className="bg-[var(--color-bg-tertiary)] p-4 rounded-xl border border-[var(--color-border-primary)]">
        <div className="flex items-center gap-2 mb-2">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="var(--color-success)">
            <path d="M10 0C4.5 0 0 4.5 0 10S4.5 20 10 20S20 15.5 20 10S15.5 0 10 0ZM10 15C9.5 15 9 14.5 9 14V12C8.5 12 8 11.5 8 11S8.5 10 9 10H11V9H9C9 8.5 9.5 8 10 8S11 8.5 11 9V11C11.5 11 12 11.5 12 12S11.5 13 11 13H9V14H11C11 14.5 10.5 15 10 15ZM10 6C9.5 6 9 5.5 9 5S9.5 4 10 4S11 4.5 11 5S10.5 6 10 6Z"/>
          </svg>
          <span className="text-sm text-[var(--color-text-tertiary)]">Total Earnings</span>
        </div>
        <div className="text-2xl font-semibold text-[var(--color-text-primary)]">
          ${totalEarnings.toLocaleString()}
        </div>
      </div>

      <div className="bg-[var(--color-bg-tertiary)] p-4 rounded-xl border border-[var(--color-border-primary)]">
        <div className="flex items-center gap-2 mb-2">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="var(--color-primary-400)">
            <path d="M10 10C12 10 14 8 14 6S12 2 10 2S6 4 6 6S8 10 10 10ZM10 12C7 12 2 13.5 2 16V18H18V16C18 13.5 13 12 10 12Z"/>
          </svg>
          <span className="text-sm text-[var(--color-text-tertiary)]">Monthly Students</span>
        </div>
        <div className="text-2xl font-semibold text-[var(--color-text-primary)]">
          {monthlyStudents}
        </div>
      </div>

      <div className="bg-[var(--color-bg-tertiary)] p-4 rounded-xl border border-[var(--color-border-primary)]">
        <div className="flex items-center gap-2 mb-2">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="var(--color-info)">
            <path d="M10 0C4.5 0 0 4.5 0 10S4.5 20 10 20S20 15.5 20 10S15.5 0 10 0ZM8 14L4 10L5.5 8.5L8 11L14.5 4.5L16 6L8 14Z"/>
          </svg>
          <span className="text-sm text-[var(--color-text-tertiary)]">Completion Rate</span>
        </div>
        <div className="text-2xl font-semibold text-[var(--color-text-primary)]">
          {completionRate}%
        </div>
      </div>

      <div className="bg-[var(--color-bg-tertiary)] p-4 rounded-xl border border-[var(--color-border-primary)]">
        <div className="flex items-center gap-2 mb-2">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="var(--color-warning)">
            <path d="M10 0C4.5 0 0 4.5 0 10S4.5 20 10 20S20 15.5 20 10S15.5 0 10 0ZM10 18C5.6 18 2 14.4 2 10S5.6 2 10 2S18 5.6 18 10S14.4 18 10 18ZM10.5 5H9V11L14.5 14L15.5 12.5L10.5 10V5Z"/>
          </svg>
          <span className="text-sm text-[var(--color-text-tertiary)]">Response Time</span>
        </div>
        <div className="text-2xl font-semibold text-[var(--color-text-primary)]">
          {responseTime}
        </div>
      </div>
    </div>
  );
};

// Influencer Social Links
interface SocialLink {
  platform: 'youtube' | 'instagram' | 'twitter' | 'linkedin' | 'tiktok' | 'website';
  url: string;
  followers?: number;
}

interface InfluencerSocialLinksProps {
  links: SocialLink[];
  className?: string;
}

export const InfluencerSocialLinks: React.FC<InfluencerSocialLinksProps> = ({
  links,
  className = ''
}) => {
  const platformIcons = {
    youtube: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
        <path d="M19.6 5.2C19.4 4.5 18.8 3.9 18.1 3.7C16.5 3.3 10 3.3 10 3.3S3.5 3.3 1.9 3.7C1.2 3.9 0.6 4.5 0.4 5.2C0 6.8 0 10 0 10S0 13.2 0.4 14.8C0.6 15.5 1.2 16.1 1.9 16.3C3.5 16.7 10 16.7 10 16.7S16.5 16.7 18.1 16.3C18.8 16.1 19.4 15.5 19.6 14.8C20 13.2 20 10 20 10S20 6.8 19.6 5.2ZM8 13V7L13 10L8 13Z"/>
      </svg>
    ),
    instagram: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 1.8C12.7 1.8 13 1.8 14.1 1.9C16.6 2 18 3.4 18.1 5.9C18.2 7 18.2 7.3 18.2 10S18.2 13 18.1 14.1C18 16.6 16.6 18 14.1 18.1C13 18.2 12.7 18.2 10 18.2S7 18.2 5.9 18.1C3.4 18 2 16.6 1.9 14.1C1.8 13 1.8 12.7 1.8 10S1.8 7 1.9 5.9C2 3.4 3.4 2 5.9 1.9C7 1.8 7.3 1.8 10 1.8ZM10 0C7.3 0 7 0 5.9 0.1C2.8 0.2 0.2 2.8 0.1 5.9C0 7 0 7.3 0 10S0 13 0.1 14.1C0.2 17.2 2.8 19.8 5.9 19.9C7 20 7.3 20 10 20S13 20 14.1 19.9C17.2 19.8 19.8 17.2 19.9 14.1C20 13 20 12.7 20 10S20 7 19.9 5.9C19.8 2.8 17.2 0.2 14.1 0.1C13 0 12.7 0 10 0ZM10 4.9C7.2 4.9 4.9 7.2 4.9 10S7.2 15.1 10 15.1S15.1 12.8 15.1 10S12.8 4.9 10 4.9ZM10 13.3C8.2 13.3 6.7 11.8 6.7 10S8.2 6.7 10 6.7S13.3 8.2 13.3 10S11.8 13.3 10 13.3ZM15.3 3.5C14.6 3.5 14.1 4 14.1 4.7S14.6 5.9 15.3 5.9S16.5 5.4 16.5 4.7S16 3.5 15.3 3.5Z"/>
      </svg>
    ),
    twitter: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
        <path d="M15.8 2L18.7 2L12 10.2L19.7 18H13.7L9 12.2L3.6 18H0.7L7.8 9.3L0.3 2H6.5L10.7 7.3L15.8 2ZM14.5 16.2H15.9L5.6 3.7H4.1L14.5 16.2Z"/>
      </svg>
    ),
    linkedin: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
        <path d="M18.5 0H1.5C0.7 0 0 0.6 0 1.4V18.6C0 19.4 0.7 20 1.5 20H18.5C19.3 20 20 19.4 20 18.6V1.4C20 0.6 19.3 0 18.5 0ZM6 17H3V7.5H6V17ZM4.5 6.2C3.5 6.2 2.7 5.4 2.7 4.4S3.5 2.5 4.5 2.5S6.3 3.3 6.3 4.3S5.5 6.2 4.5 6.2ZM17 17H14V12.3C14 11.2 14 9.8 12.5 9.8S10.7 11 10.7 12.2V17H7.7V7.5H10.6V8.8C11 8 12 7.3 13.5 7.3C16.5 7.3 17 9.2 17 11.8V17Z"/>
      </svg>
    ),
    tiktok: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
        <path d="M18 8.5C16.3 8.5 14.7 7.9 13.5 6.9V13.5C13.5 16.8 10.8 19.5 7.5 19.5S1.5 16.8 1.5 13.5S4.2 7.5 7.5 7.5C7.7 7.5 7.9 7.5 8 7.5V10.5C7.8 10.5 7.6 10.5 7.5 10.5C5.8 10.5 4.5 11.8 4.5 13.5S5.8 16.5 7.5 16.5S10.5 15.2 10.5 13.5V0.5H13.5C13.5 3 15.5 5.5 18 5.5V8.5Z"/>
      </svg>
    ),
    website: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 0C4.5 0 0 4.5 0 10S4.5 20 10 20S20 15.5 20 10S15.5 0 10 0ZM1.5 10C1.5 9.3 1.6 8.7 1.7 8H4.5C4.5 8.7 4.5 9.3 4.5 10S4.5 11.3 4.5 12H1.7C1.6 11.3 1.5 10.7 1.5 10ZM2.4 13.5H4.7C4.9 14.7 5.2 15.8 5.6 16.7C4.1 16.1 2.9 15 2.4 13.5ZM2.4 6.5C2.9 5 4.1 3.9 5.6 3.3C5.2 4.2 4.9 5.3 4.7 6.5H2.4ZM10 18.5C9 18.5 8.1 17.3 7.5 15.5C7.3 14.8 7.1 14.2 7 13.5H13C12.9 14.2 12.7 14.8 12.5 15.5C11.9 17.3 11 18.5 10 18.5ZM13.2 12H6.8C6.7 11.3 6.7 10.7 6.7 10S6.7 8.7 6.8 8H13.2C13.3 8.7 13.3 9.3 13.3 10S13.3 11.3 13.2 12ZM10 1.5C11 1.5 11.9 2.7 12.5 4.5C12.7 5.2 12.9 5.8 13 6.5H7C7.1 5.8 7.3 5.2 7.5 4.5C8.1 2.7 9 1.5 10 1.5ZM14.4 3.3C15.9 3.9 17.1 5 17.6 6.5H15.3C15.1 5.3 14.8 4.2 14.4 3.3ZM14.4 16.7C14.8 15.8 15.1 14.7 15.3 13.5H17.6C17.1 15 15.9 16.1 14.4 16.7ZM18.3 12H15.5C15.5 11.3 15.5 10.7 15.5 10S15.5 8.7 15.5 8H18.3C18.4 8.7 18.5 9.3 18.5 10S18.4 11.3 18.3 12Z"/>
      </svg>
    )
  };

  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      {links.map((link, index) => (
        <a
          key={index}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2 bg-[var(--color-bg-tertiary)] rounded-lg border border-[var(--color-border-primary)] hover:border-[var(--color-primary-400)] transition-all duration-200"
        >
          <div className="text-[var(--color-text-secondary)]">
            {platformIcons[link.platform]}
          </div>
          {link.followers && (
            <span className="text-sm text-[var(--color-text-primary)] font-medium">
              {link.followers >= 1000000 
                ? `${(link.followers / 1000000).toFixed(1)}M` 
                : link.followers >= 1000 
                ? `${(link.followers / 1000).toFixed(1)}K`
                : link.followers}
            </span>
          )}
        </a>
      ))}
    </div>
  );
};