'use client';

import Card from '../ui/Card';

interface StudyStreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
  freezeTokens: number;
}

export default function StudyStreakDisplay({
  currentStreak,
  longestStreak,
  freezeTokens
}: StudyStreakDisplayProps) {
  const getStreakEmoji = (days: number) => {
    if (days >= 30) return '🏆';
    if (days >= 14) return '🔥';
    if (days >= 7) return '⭐';
    if (days >= 3) return '✨';
    return '🌱';
  };

  const getStreakMessage = (days: number) => {
    if (days >= 30) return '불타는 열정!';
    if (days >= 14) return '대단해요!';
    if (days >= 7) return '일주일 달성!';
    if (days >= 3) return '좋은 시작!';
    if (days === 0) return '오늘 시작해보세요!';
    return '화이팅!';
  };

  return (
    <Card glass className="p-6 relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10 opacity-50" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
            🔥 연속 학습
          </h3>
          {freezeTokens > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/10 rounded-full">
              <span className="text-sm">🛡️</span>
              <span className="text-xs font-medium text-blue-400">
                {freezeTokens}
              </span>
            </div>
          )}
        </div>

        {/* Current Streak */}
        <div className="text-center mb-4">
          <div className="text-5xl mb-2">{getStreakEmoji(currentStreak)}</div>
          <div className="text-3xl font-bold text-[var(--color-text-primary)] mb-1">
            {currentStreak}일
          </div>
          <p className="text-sm text-[var(--color-primary-400)]">
            {getStreakMessage(currentStreak)}
          </p>
        </div>

        {/* Streak Calendar Preview */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {[...Array(7)].map((_, i) => {
            const isActive = i < currentStreak && currentStreak <= 7;
            const isPast = i < currentStreak - 7;
            return (
              <div
                key={i}
                className={`aspect-square rounded ${
                  isActive || isPast
                    ? 'bg-gradient-to-br from-orange-500 to-red-500'
                    : 'bg-[var(--glass-bg)]'
                }`}
              />
            );
          })}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm">
          <div>
            <span className="text-[var(--color-text-tertiary)]">최고 기록</span>
            <span className="ml-2 font-semibold text-[var(--color-text-primary)]">
              {longestStreak}일
            </span>
          </div>
          <div>
            <span className="text-[var(--color-text-tertiary)]">다음 목표</span>
            <span className="ml-2 font-semibold text-[var(--color-primary-400)]">
              {Math.ceil((currentStreak + 1) / 7) * 7}일
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}