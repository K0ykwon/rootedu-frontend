import React, { useState, useEffect } from 'react';
import { Badge } from './Badge';
import { Button } from './Button';
import { ProgressBar } from './Progress';

// Achievement Badge Component
interface AchievementBadgeProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  unlocked?: boolean;
  unlockedDate?: Date;
  progress?: number;
  maxProgress?: number;
  onClick?: () => void;
  className?: string;
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  title,
  description,
  icon,
  rarity = 'common',
  unlocked = false,
  unlockedDate,
  progress = 0,
  maxProgress = 1,
  onClick,
  className = ''
}) => {
  const rarityStyles = {
    common: 'border-gray-400 bg-gradient-to-br from-gray-100 to-gray-200',
    rare: 'border-blue-400 bg-gradient-to-br from-blue-100 to-blue-200',
    epic: 'border-purple-400 bg-gradient-to-br from-purple-100 to-purple-200',
    legendary: 'border-yellow-400 bg-gradient-to-br from-yellow-100 to-yellow-200'
  };

  const rarityGlow = {
    common: '',
    rare: 'shadow-[0_0_20px_rgba(59,130,246,0.3)]',
    epic: 'shadow-[0_0_20px_rgba(147,51,234,0.3)]',
    legendary: 'shadow-[0_0_20px_rgba(234,179,8,0.4)]'
  };

  return (
    <div 
      className={`relative p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer hover:scale-105 ${
        unlocked 
          ? `${rarityStyles[rarity]} ${rarityGlow[rarity]}` 
          : 'border-[var(--color-border-primary)] bg-[var(--color-bg-tertiary)] opacity-60'
      } ${className}`}
      onClick={onClick}
    >
      {/* Rarity indicator */}
      <div className="absolute top-2 right-2">
        <Badge variant={unlocked ? 'primary' : 'default'} size="sm">
          {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
        </Badge>
      </div>

      {/* Icon */}
      <div className={`w-16 h-16 mx-auto mb-3 flex items-center justify-center rounded-full ${
        unlocked ? 'bg-white/50' : 'bg-[var(--color-bg-quaternary)]'
      }`}>
        <div className={`text-2xl ${unlocked ? 'text-gray-800' : 'text-[var(--color-text-quaternary)]'}`}>
          {icon}
        </div>
      </div>

      {/* Content */}
      <h3 className={`font-semibold text-center mb-2 ${
        unlocked ? 'text-gray-800' : 'text-[var(--color-text-primary)]'
      }`}>
        {title}
      </h3>
      
      <p className={`text-sm text-center mb-3 ${
        unlocked ? 'text-gray-600' : 'text-[var(--color-text-tertiary)]'
      }`}>
        {description}
      </p>

      {/* Progress for incomplete achievements */}
      {!unlocked && maxProgress > 1 && (
        <div className="mb-3">
          <ProgressBar value={progress} max={maxProgress} showPercentage />
          <p className="text-xs text-center mt-1 text-[var(--color-text-tertiary)]">
            {progress}/{maxProgress}
          </p>
        </div>
      )}

      {/* Unlock date */}
      {unlocked && unlockedDate && (
        <p className="text-xs text-center text-gray-500">
          Unlocked {unlockedDate.toLocaleDateString()}
        </p>
      )}

      {/* Lock icon for locked achievements */}
      {!unlocked && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-[var(--color-bg-primary)] rounded-full p-2">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" className="text-[var(--color-text-tertiary)]">
              <path d="M10 2C8.3 2 7 3.3 7 5V7H5C4.4 7 4 7.4 4 8V16C4 16.6 4.4 17 5 17H15C15.6 17 16 16.6 16 16V8C16 7.4 15.6 7 15 7H13V5C13 3.3 11.7 2 10 2ZM10 3C11.1 3 12 3.9 12 5V7H8V5C8 3.9 8.9 3 10 3ZM10 10C10.6 10 11 10.4 11 11V13C11 13.6 10.6 14 10 14S9 13.6 9 13V11C9 10.4 10.4 10 10 10Z"/>
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

// Streak Counter Component
interface StreakCounterProps {
  currentStreak: number;
  longestStreak: number;
  streakGoal?: number;
  lastActivity?: Date;
  className?: string;
}

export const StreakCounter: React.FC<StreakCounterProps> = ({
  currentStreak,
  longestStreak,
  streakGoal = 30,
  lastActivity,
  className = ''
}) => {
  const isStreakAlive = lastActivity && (Date.now() - lastActivity.getTime()) < 24 * 60 * 60 * 1000;
  const progress = (currentStreak / streakGoal) * 100;

  return (
    <div className={`bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-4 text-white ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">🔥 Study Streak</h3>
        <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
          {isStreakAlive ? 'Active' : 'Broken'}
        </Badge>
      </div>

      <div className="text-center mb-4">
        <div className="text-4xl font-bold mb-1">{currentStreak}</div>
        <div className="text-sm opacity-90">days in a row</div>
      </div>

      {/* Progress to goal */}
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span>Goal: {streakGoal} days</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-2">
          <div 
            className="bg-white rounded-full h-2 transition-all duration-500"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      <div className="flex justify-between text-sm opacity-90">
        <span>Longest: {longestStreak} days</span>
        {lastActivity && (
          <span>Last: {lastActivity.toLocaleDateString()}</span>
        )}
      </div>
    </div>
  );
};

// XP and Level Component
interface XPLevelProps {
  currentXP: number;
  level: number;
  xpToNextLevel: number;
  totalXPForNextLevel: number;
  recentXPGain?: number;
  className?: string;
}

export const XPLevel: React.FC<XPLevelProps> = ({
  currentXP,
  level,
  xpToNextLevel,
  totalXPForNextLevel,
  recentXPGain,
  className = ''
}) => {
  const progress = ((totalXPForNextLevel - xpToNextLevel) / totalXPForNextLevel) * 100;

  return (
    <div className={`bg-gradient-to-br from-[var(--color-primary-400)] to-[var(--color-primary-600)] rounded-2xl p-4 text-white ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg">Level {level}</h3>
          <p className="text-sm opacity-90">{currentXP.toLocaleString()} XP</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">⭐</div>
          {recentXPGain && recentXPGain > 0 && (
            <div className="text-xs bg-white/20 px-2 py-1 rounded-full">
              +{recentXPGain} XP
            </div>
          )}
        </div>
      </div>

      <div className="mb-2">
        <div className="flex justify-between text-sm mb-1">
          <span>Progress to Level {level + 1}</span>
          <span>{xpToNextLevel} XP needed</span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-3">
          <div 
            className="bg-white rounded-full h-3 transition-all duration-500 relative overflow-hidden"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </div>
        </div>
      </div>

      <div className="text-xs text-center opacity-75">
        {Math.round(progress)}% to next level
      </div>
    </div>
  );
};

// Motivational Quote Component
interface MotivationalQuoteProps {
  quotes?: string[];
  className?: string;
}

export const MotivationalQuote: React.FC<MotivationalQuoteProps> = ({
  quotes = [
    "Every expert was once a beginner! 🌱",
    "You're doing amazing! Keep it up! 🚀",
    "Learning is a journey, not a destination! 🛤️",
    "Mistakes are proof that you're trying! 💪",
    "Your brain is like a muscle - the more you use it, the stronger it gets! 🧠",
    "Small progress is still progress! 📈",
    "You're one step closer to your goals! 🎯",
    "Believe in yourself - you've got this! ✨"
  ],
  className = ''
}) => {
  const [currentQuote, setCurrentQuote] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote(prev => (prev + 1) % quotes.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [quotes.length]);

  return (
    <div className={`bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 rounded-2xl p-4 text-white text-center ${className}`}>
      <div className="text-2xl mb-2">💫</div>
      <p className="font-medium text-lg mb-2">{quotes[currentQuote]}</p>
      <div className="flex justify-center gap-1">
        {quotes.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentQuote ? 'bg-white' : 'bg-white/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

// Daily Challenge Component
interface DailyChallengeProps {
  title: string;
  description: string;
  progress: number;
  maxProgress: number;
  reward: {
    xp: number;
    coins?: number;
  };
  timeLeft?: number; // in hours
  completed?: boolean;
  onStart?: () => void;
  className?: string;
}

export const DailyChallenge: React.FC<DailyChallengeProps> = ({
  title,
  description,
  progress,
  maxProgress,
  reward,
  timeLeft = 24,
  completed = false,
  onStart,
  className = ''
}) => {
  const progressPercent = (progress / maxProgress) * 100;

  return (
    <div className={`bg-[var(--color-bg-secondary)] border-2 border-dashed border-[var(--color-primary-400)] rounded-2xl p-4 ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="text-2xl">🎯</div>
          <div>
            <h3 className="font-semibold text-[var(--color-text-primary)]">Daily Challenge</h3>
            <p className="text-xs text-[var(--color-text-tertiary)]">{timeLeft}h remaining</p>
          </div>
        </div>
        {completed && (
          <Badge variant="success">Completed!</Badge>
        )}
      </div>

      <h4 className="font-medium text-[var(--color-text-primary)] mb-2">{title}</h4>
      <p className="text-sm text-[var(--color-text-secondary)] mb-4">{description}</p>

      {/* Progress */}
      <div className="mb-4">
        <ProgressBar value={progress} max={maxProgress} color="primary" />
        <p className="text-xs text-center mt-1 text-[var(--color-text-tertiary)]">
          {progress}/{maxProgress} completed
        </p>
      </div>

      {/* Rewards */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm">
          <span className="flex items-center gap-1">
            <span className="text-yellow-500">⭐</span>
            {reward.xp} XP
          </span>
          {reward.coins && (
            <span className="flex items-center gap-1">
              <span className="text-yellow-400">🪙</span>
              {reward.coins}
            </span>
          )}
        </div>
        
        {!completed && (
          <Button size="sm" onClick={onStart}>
            {progress > 0 ? 'Continue' : 'Start'}
          </Button>
        )}
      </div>
    </div>
  );
};