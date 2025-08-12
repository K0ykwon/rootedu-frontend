'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './Button';

// Confetti Animation Component
interface ConfettiProps {
  active: boolean;
  onComplete?: () => void;
  duration?: number;
  className?: string;
}

export const Confetti: React.FC<ConfettiProps> = ({
  active,
  onComplete,
  duration = 3000,
  className = ''
}) => {
  const [pieces, setPieces] = useState<Array<{id: number, x: number, y: number, rotation: number, color: string, delay: number}>>([]);

  useEffect(() => {
    if (active) {
      const confettiPieces = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        rotation: Math.random() * 360,
        color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'][Math.floor(Math.random() * 6)],
        delay: Math.random() * 2
      }));
      setPieces(confettiPieces);

      const timer = setTimeout(() => {
        setPieces([]);
        onComplete?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [active, duration, onComplete]);

  if (!active) return null;

  return (
    <div className={`fixed inset-0 pointer-events-none z-50 overflow-hidden ${className}`}>
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute w-3 h-3 animate-confetti-fall"
          style={{
            left: `${piece.x}%`,
            top: '-10%',
            backgroundColor: piece.color,
            transform: `rotate(${piece.rotation}deg)`,
            animationDelay: `${piece.delay}s`,
            animationDuration: '3s'
          }}
        />
      ))}
    </div>
  );
};

// Level Up Animation Component
interface LevelUpAnimationProps {
  level: number;
  active: boolean;
  onComplete?: () => void;
  className?: string;
}

export const LevelUpAnimation: React.FC<LevelUpAnimationProps> = ({
  level,
  active,
  onComplete,
  className = ''
}) => {
  useEffect(() => {
    if (active) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [active, onComplete]);

  if (!active) return null;

  return (
    <div className={`fixed inset-0 flex items-center justify-center z-50 pointer-events-none ${className}`}>
      <div className="text-center animate-level-up">
        <div className="text-8xl mb-4 animate-bounce">🎉</div>
        <h2 className="text-4xl font-bold text-[var(--color-primary-400)] mb-2 animate-pulse">
          LEVEL UP!
        </h2>
        <p className="text-2xl text-[var(--color-text-primary)] animate-fade-in-up">
          Welcome to Level {level}
        </p>
        <div className="mt-4 flex justify-center gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="w-3 h-3 bg-[var(--color-primary-400)] rounded-full animate-star-burst"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Achievement Unlock Animation
interface AchievementUnlockProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  active: boolean;
  onComplete?: () => void;
  className?: string;
}

export const AchievementUnlock: React.FC<AchievementUnlockProps> = ({
  title,
  description,
  icon,
  rarity,
  active,
  onComplete,
  className = ''
}) => {
  const rarityColors = {
    common: 'from-gray-400 to-gray-600',
    rare: 'from-blue-400 to-blue-600',
    epic: 'from-purple-400 to-purple-600',
    legendary: 'from-yellow-400 to-yellow-600'
  };

  const rarityGlow = {
    common: 'shadow-[0_0_30px_rgba(156,163,175,0.5)]',
    rare: 'shadow-[0_0_30px_rgba(59,130,246,0.5)]',
    epic: 'shadow-[0_0_30px_rgba(147,51,234,0.5)]',
    legendary: 'shadow-[0_0_30px_rgba(234,179,8,0.6)]'
  };

  useEffect(() => {
    if (active) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [active, onComplete]);

  if (!active) return null;

  return (
    <div className={`fixed inset-0 flex items-center justify-center z-50 bg-black/50 ${className}`}>
      <div className={`bg-gradient-to-br ${rarityColors[rarity]} ${rarityGlow[rarity]} p-8 rounded-3xl text-white text-center max-w-sm mx-4 animate-achievement-unlock`}>
        <div className="text-6xl mb-4 animate-bounce">{icon}</div>
        <h2 className="text-2xl font-bold mb-2">Achievement Unlocked!</h2>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-sm opacity-90 mb-4">{description}</p>
        <div className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
          {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
        </div>
      </div>
    </div>
  );
};

// Reward Popup Component
interface RewardPopupProps {
  rewards: {
    xp?: number;
    coins?: number;
    items?: string[];
  };
  active: boolean;
  onComplete?: () => void;
  className?: string;
}

export const RewardPopup: React.FC<RewardPopupProps> = ({
  rewards,
  active,
  onComplete,
  className = ''
}) => {
  useEffect(() => {
    if (active) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [active, onComplete]);

  if (!active) return null;

  return (
    <div className={`fixed inset-0 flex items-center justify-center z-50 ${className}`}>
      <div className="bg-[var(--color-bg-secondary)] border-2 border-[var(--color-primary-400)] rounded-2xl p-6 text-center max-w-xs mx-4 animate-reward-popup">
        <div className="text-4xl mb-3">🎁</div>
        <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">Rewards Earned!</h3>
        
        <div className="space-y-2">
          {rewards.xp && (
            <div className="flex items-center justify-center gap-2 bg-[var(--color-bg-tertiary)] rounded-lg p-2">
              <span className="text-xl">⭐</span>
              <span className="font-medium text-[var(--color-text-primary)]">+{rewards.xp} XP</span>
            </div>
          )}
          
          {rewards.coins && (
            <div className="flex items-center justify-center gap-2 bg-[var(--color-bg-tertiary)] rounded-lg p-2">
              <span className="text-xl">🪙</span>
              <span className="font-medium text-[var(--color-text-primary)]">+{rewards.coins} Coins</span>
            </div>
          )}
          
          {rewards.items?.map((item, index) => (
            <div key={index} className="flex items-center justify-center gap-2 bg-[var(--color-bg-tertiary)] rounded-lg p-2">
              <span className="text-xl">🏆</span>
              <span className="font-medium text-[var(--color-text-primary)]">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Celebration Button Component
interface CelebrationButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  celebrationType?: 'confetti' | 'levelup' | 'achievement' | 'reward';
  disabled?: boolean;
  className?: string;
}

export const CelebrationButton: React.FC<CelebrationButtonProps> = ({
  children,
  onClick,
  celebrationType = 'confetti',
  disabled = false,
  className = ''
}) => {
  const [showCelebration, setShowCelebration] = useState(false);

  const handleClick = () => {
    if (!disabled) {
      setShowCelebration(true);
      onClick?.();
    }
  };

  return (
    <>
      <Button
        onClick={handleClick}
        disabled={disabled}
        className={`transition-all duration-200 hover:scale-105 ${className}`}
      >
        {children}
      </Button>

      {celebrationType === 'confetti' && (
        <Confetti 
          active={showCelebration} 
          onComplete={() => setShowCelebration(false)}
        />
      )}
      
      {celebrationType === 'levelup' && (
        <LevelUpAnimation
          level={5}
          active={showCelebration}
          onComplete={() => setShowCelebration(false)}
        />
      )}
      
      {celebrationType === 'reward' && (
        <RewardPopup
          rewards={{ xp: 100, coins: 50 }}
          active={showCelebration}
          onComplete={() => setShowCelebration(false)}
        />
      )}
    </>
  );
};

// Floating Hearts Animation
interface FloatingHeartsProps {
  active: boolean;
  count?: number;
  duration?: number;
  onComplete?: () => void;
  className?: string;
}

export const FloatingHearts: React.FC<FloatingHeartsProps> = ({
  active,
  count = 10,
  duration = 3000,
  onComplete,
  className = ''
}) => {
  const [hearts, setHearts] = useState<Array<{id: number, x: number, delay: number}>>([]);

  useEffect(() => {
    if (active) {
      const heartElements = Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 80 + 10, // 10% to 90% from left
        delay: Math.random() * 1
      }));
      setHearts(heartElements);

      const timer = setTimeout(() => {
        setHearts([]);
        onComplete?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [active, count, duration, onComplete]);

  if (!active) return null;

  return (
    <div className={`fixed inset-0 pointer-events-none z-40 overflow-hidden ${className}`}>
      {hearts.map((heart) => (
        <div
          key={heart.id}
          className="absolute text-2xl animate-float-up"
          style={{
            left: `${heart.x}%`,
            bottom: '-50px',
            animationDelay: `${heart.delay}s`,
            animationDuration: '3s'
          }}
        >
          ❤️
        </div>
      ))}
    </div>
  );
};