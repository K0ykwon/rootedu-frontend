import React, { useState } from 'react';
import { Avatar } from './Avatar';
import { Badge } from './Badge';
import { Button } from './Button';
import { Tabs } from './Tabs';

interface LeaderboardUser {
  id: string;
  name: string;
  avatar: string;
  score: number;
  rank: number;
  change?: number; // Position change (+1, -2, etc.)
  level?: number;
  streak?: number;
  badge?: string;
}

interface LeaderboardProps {
  users: LeaderboardUser[];
  currentUserId?: string;
  title?: string;
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'allTime';
  onTimeframeChange?: (timeframe: string) => void;
  className?: string;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  users,
  currentUserId,
  title = "🏆 Leaderboard",
  timeframe = 'weekly',
  onTimeframeChange,
  className = ''
}) => {
  const timeframeOptions = [
    { id: 'daily', label: 'Today', content: <div>Daily leaderboard</div> },
    { id: 'weekly', label: 'This Week', content: <div>Weekly leaderboard</div> },
    { id: 'monthly', label: 'This Month', content: <div>Monthly leaderboard</div> },
    { id: 'allTime', label: 'All Time', content: <div>All time leaderboard</div> }
  ];

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getChangeIcon = (change?: number) => {
    if (!change) return null;
    if (change > 0) return <span className="text-green-500">↗ +{change}</span>;
    if (change < 0) return <span className="text-red-500">↘ {change}</span>;
    return <span className="text-gray-500">→</span>;
  };

  // Top 3 podium
  const topThree = users.slice(0, 3);
  const restOfUsers = users.slice(3);
  
  // Find current user if not in top users
  const currentUser = users.find(user => user.id === currentUserId);
  const showCurrentUser = currentUser && !users.slice(0, 10).find(user => user.id === currentUserId);

  return (
    <div className={`bg-[var(--color-bg-secondary)] rounded-2xl border border-[var(--color-border-primary)] overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-[var(--color-border-primary)]">
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">{title}</h2>
        
        {/* Timeframe tabs */}
        <div className="flex gap-1 bg-[var(--color-bg-tertiary)] p-1 rounded-lg">
          {timeframeOptions.map(option => (
            <button
              key={option.id}
              onClick={() => onTimeframeChange?.(option.id)}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded transition-all duration-200 ${
                timeframe === option.id
                  ? 'bg-[var(--color-primary-400)] text-white'
                  : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Podium (Top 3) */}
      {topThree.length >= 3 && (
        <div className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 border-b border-[var(--color-border-primary)]">
          <div className="flex items-end justify-center gap-4">
            {/* 2nd Place */}
            <div className="text-center">
              <div className="relative mb-2">
                <Avatar size="lg" src={topThree[1]?.avatar} name={topThree[1]?.name} />
                <div className="absolute -top-2 -right-2 text-2xl">🥈</div>
              </div>
              <div className="bg-gray-200 rounded-t-lg p-3 h-20 flex flex-col justify-end">
                <p className="font-semibold text-sm text-gray-800">{topThree[1]?.name}</p>
                <p className="text-xs text-gray-600">{topThree[1]?.score.toLocaleString()} XP</p>
              </div>
            </div>

            {/* 1st Place */}
            <div className="text-center">
              <div className="relative mb-2">
                <Avatar size="xl" src={topThree[0]?.avatar} name={topThree[0]?.name} />
                <div className="absolute -top-3 -right-3 text-3xl">🥇</div>
              </div>
              <div className="bg-gradient-to-t from-yellow-300 to-yellow-200 rounded-t-lg p-3 h-24 flex flex-col justify-end">
                <p className="font-semibold text-gray-800">{topThree[0]?.name}</p>
                <p className="text-sm text-gray-700">{topThree[0]?.score.toLocaleString()} XP</p>
                {topThree[0]?.streak && (
                  <p className="text-xs text-gray-600">🔥 {topThree[0].streak} day streak</p>
                )}
              </div>
            </div>

            {/* 3rd Place */}
            <div className="text-center">
              <div className="relative mb-2">
                <Avatar size="lg" src={topThree[2]?.avatar} name={topThree[2]?.name} />
                <div className="absolute -top-2 -right-2 text-2xl">🥉</div>
              </div>
              <div className="bg-orange-200 rounded-t-lg p-3 h-16 flex flex-col justify-end">
                <p className="font-semibold text-sm text-gray-800">{topThree[2]?.name}</p>
                <p className="text-xs text-gray-600">{topThree[2]?.score.toLocaleString()} XP</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rest of leaderboard */}
      <div className="max-h-96 overflow-y-auto">
        {restOfUsers.map((user, index) => (
          <div
            key={user.id}
            className={`flex items-center gap-3 p-3 border-b border-[var(--color-border-secondary)] last:border-b-0 ${
              user.id === currentUserId 
                ? 'bg-[var(--color-primary-400)]/10 border-l-4 border-l-[var(--color-primary-400)]' 
                : 'hover:bg-[var(--color-bg-tertiary)]'
            }`}
          >
            {/* Rank */}
            <div className="w-10 text-center">
              <span className="text-lg font-bold text-[var(--color-text-primary)]">
                {getRankIcon(user.rank)}
              </span>
            </div>

            {/* Avatar */}
            <Avatar size="md" src={user.avatar} name={user.name} />

            {/* User info */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-[var(--color-text-primary)]">
                  {user.name}
                </span>
                {user.badge && (
                  <Badge variant="primary" size="sm">{user.badge}</Badge>
                )}
                {user.id === currentUserId && (
                  <Badge variant="success" size="sm">You</Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-[var(--color-text-tertiary)]">
                <span>{user.score.toLocaleString()} XP</span>
                {user.level && <span>Level {user.level}</span>}
                {user.streak && <span>🔥 {user.streak}</span>}
              </div>
            </div>

            {/* Rank change */}
            <div className="text-sm font-medium">
              {getChangeIcon(user.change)}
            </div>
          </div>
        ))}

        {/* Current user if not visible */}
        {showCurrentUser && currentUser && (
          <>
            <div className="p-2 text-center">
              <span className="text-xs text-[var(--color-text-tertiary)]">...</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-[var(--color-primary-400)]/10 border-l-4 border-l-[var(--color-primary-400)]">
              <div className="w-10 text-center">
                <span className="text-lg font-bold text-[var(--color-text-primary)]">
                  #{currentUser.rank}
                </span>
              </div>
              <Avatar size="md" src={currentUser.avatar} name={currentUser.name} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[var(--color-text-primary)]">
                    {currentUser.name}
                  </span>
                  <Badge variant="success" size="sm">You</Badge>
                </div>
                <div className="flex items-center gap-3 text-sm text-[var(--color-text-tertiary)]">
                  <span>{currentUser.score.toLocaleString()} XP</span>
                  {currentUser.level && <span>Level {currentUser.level}</span>}
                  {currentUser.streak && <span>🔥 {currentUser.streak}</span>}
                </div>
              </div>
              <div className="text-sm font-medium">
                {getChangeIcon(currentUser.change)}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Mini leaderboard for dashboard
interface MiniLeaderboardProps {
  users: LeaderboardUser[];
  currentUserId?: string;
  className?: string;
}

export const MiniLeaderboard: React.FC<MiniLeaderboardProps> = ({
  users,
  currentUserId,
  className = ''
}) => {
  const topUsers = users.slice(0, 5);

  return (
    <div className={`bg-[var(--color-bg-secondary)] rounded-xl p-4 border border-[var(--color-border-primary)] ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-[var(--color-text-primary)]">🏆 Top Students</h3>
        <Button size="sm" variant="ghost">View All</Button>
      </div>

      <div className="space-y-2">
        {topUsers.map((user, index) => (
          <div
            key={user.id}
            className={`flex items-center gap-3 p-2 rounded-lg ${
              user.id === currentUserId 
                ? 'bg-[var(--color-primary-400)]/10' 
                : 'hover:bg-[var(--color-bg-tertiary)]'
            }`}
          >
            <div className="w-6 text-center">
              <span className="text-sm font-bold">
                {index + 1 <= 3 ? ['🥇', '🥈', '🥉'][index] : `#${index + 1}`}
              </span>
            </div>
            <Avatar size="sm" src={user.avatar} name={user.name} />
            <div className="flex-1">
              <p className="font-medium text-sm text-[var(--color-text-primary)]">
                {user.name}
              </p>
              <p className="text-xs text-[var(--color-text-tertiary)]">
                {user.score.toLocaleString()} XP
              </p>
            </div>
            {user.id === currentUserId && (
              <Badge variant="primary" size="sm">You</Badge>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};