'use client';

import { useState } from 'react';
import type { CommunityType } from '@/lib/redis';

interface CommunityNavProps {
  selectedCommunity: CommunityType;
  onCommunityChange: (community: CommunityType) => void;
}

const communities = [
  { 
    id: 'elementary' as CommunityType, 
    label: '초등학생', 
    icon: '🎒',
    description: '초등학생들의 학습 공간',
    color: 'bg-blue-500/10 border-blue-400/30 hover:bg-blue-500/20',
    activeColor: 'bg-gradient-to-br from-blue-500/20 to-blue-400/10 border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.15)]'
  },
  { 
    id: 'middle' as CommunityType, 
    label: '중학생', 
    icon: '📚',
    description: '중학생들의 학습 공간',
    color: 'bg-green-500/10 border-green-400/30 hover:bg-green-500/20',
    activeColor: 'bg-gradient-to-br from-green-500/20 to-green-400/10 border-green-400 shadow-[0_0_20px_rgba(34,197,94,0.15)]'
  },
  { 
    id: 'high' as CommunityType, 
    label: '고등학생', 
    icon: '🎓',
    description: '고등학생들의 학습 공간',
    color: 'bg-purple-500/10 border-purple-400/30 hover:bg-purple-500/20',
    activeColor: 'bg-gradient-to-br from-purple-500/20 to-purple-400/10 border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.15)]'
  },
  { 
    id: 'elementary-parent' as CommunityType, 
    label: '초등 학부모', 
    icon: '👨‍👩‍👧',
    description: '초등학생 학부모님들의 소통 공간',
    color: 'bg-amber-500/10 border-amber-400/30 hover:bg-amber-500/20',
    activeColor: 'bg-gradient-to-br from-amber-500/20 to-amber-400/10 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.15)]'
  },
  { 
    id: 'middle-parent' as CommunityType, 
    label: '중등 학부모', 
    icon: '👨‍👩‍👦',
    description: '중학생 학부모님들의 소통 공간',
    color: 'bg-teal-500/10 border-teal-400/30 hover:bg-teal-500/20',
    activeColor: 'bg-gradient-to-br from-teal-500/20 to-teal-400/10 border-teal-400 shadow-[0_0_20px_rgba(20,184,166,0.15)]'
  },
  { 
    id: 'high-parent' as CommunityType, 
    label: '고등 학부모', 
    icon: '👨‍👩‍👧‍👦',
    description: '고등학생 학부모님들의 소통 공간',
    color: 'bg-rose-500/10 border-rose-400/30 hover:bg-rose-500/20',
    activeColor: 'bg-gradient-to-br from-rose-500/20 to-rose-400/10 border-rose-400 shadow-[0_0_20px_rgba(251,113,133,0.15)]'
  }
];

export default function CommunityNav({ selectedCommunity, onCommunityChange }: CommunityNavProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mb-8">
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="md:hidden w-full flex items-center justify-between px-4 py-3 glass-card rounded-lg mb-4"
      >
        <span className="text-sm font-medium text-[var(--color-text-primary)]">
          {communities.find(c => c.id === selectedCommunity)?.label}
        </span>
        <svg
          className={`w-5 h-5 text-[var(--color-text-tertiary)] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Community Grid */}
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${!isExpanded && 'hidden md:grid'}`}>

        {/* Individual Community Cards */}
        {communities.map((community) => (
          <button
            key={community.id}
            onClick={() => onCommunityChange(community.id)}
            className={`p-4 border-2 rounded-xl transition-all duration-300 text-left backdrop-blur-sm ${
              selectedCommunity === community.id 
                ? community.activeColor
                : `glass-card ${community.color} hover:shadow-lg`
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{community.icon}</span>
              <span className="font-semibold text-[var(--color-text-primary)]">{community.label}</span>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)]">{community.description}</p>
          </button>
        ))}
      </div>

      {/* Selected Community Info Bar */}
      <div className="mt-4 p-3 glass-card bg-gradient-to-r from-[var(--color-primary-500)]/5 to-transparent rounded-lg">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-[var(--color-primary-400)]" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <span className="text-sm text-[var(--color-text-primary)]">
            {communities.find(c => c.id === selectedCommunity)?.label} 커뮤니티에서 활동 중입니다
          </span>
        </div>
      </div>
    </div>
  );
}