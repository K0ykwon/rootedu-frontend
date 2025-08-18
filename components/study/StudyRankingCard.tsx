'use client';

import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { RankingEntry } from '@/types/study-proof';

interface StudyRankingCardProps {
  title: string;
  rankings: RankingEntry[];
  type: 'daily' | 'weekly' | 'monthly' | 'allTime';
}

export default function StudyRankingCard({ title, rankings, type }: StudyRankingCardProps) {
  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `${rank}`;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'from-yellow-500/20 to-yellow-400/10 border-yellow-400/50';
      case 2: return 'from-gray-400/20 to-gray-300/10 border-gray-400/50';
      case 3: return 'from-orange-600/20 to-orange-500/10 border-orange-500/50';
      default: return 'from-transparent to-transparent border-[var(--glass-border)]';
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}시간 ${mins > 0 ? `${mins}분` : ''}`;
    }
    return `${mins}분`;
  };

  return (
    <Card glass className="overflow-hidden">
      <div className="p-6 border-b border-[var(--glass-border)]">
        <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">
          {title}
        </h3>
      </div>

      <div className="divide-y divide-[var(--glass-border)]">
        {rankings.map((entry) => (
          <div
            key={entry.userId}
            className={`p-4 transition-all duration-200 hover:bg-[var(--glass-bg-heavy)] ${
              entry.rank <= 3 ? `bg-gradient-to-r ${getRankColor(entry.rank)} border-l-4` : ''
            }`}
          >
            <div className="flex items-center gap-4">
              {/* Rank */}
              <div className="text-2xl font-bold w-12 text-center">
                {getRankEmoji(entry.rank)}
              </div>

              {/* User Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-primary-500)]/20 to-[var(--color-primary-400)]/10 flex items-center justify-center">
                    <span className="text-lg">👤</span>
                  </div>
                  <div>
                    <p className="font-medium text-[var(--color-text-primary)]">
                      {entry.userName}
                    </p>
                    <p className="text-xs text-[var(--color-text-tertiary)]">
                      {entry.school && `${entry.school} `}
                      {entry.grade && entry.grade}
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <span>⏱️</span>
                    <span className="font-medium text-[var(--color-primary-400)]">
                      {formatTime(entry.totalMinutes)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>🔥</span>
                    <span className="text-[var(--color-text-secondary)]">
                      {entry.streakDays}일 연속
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>⭐</span>
                    <span className="text-[var(--color-text-secondary)]">
                      Lv.{entry.level}
                    </span>
                  </div>
                </div>
              </div>

              {/* Special Badges for Top 3 */}
              {entry.rank <= 3 && (
                <div className="flex items-center">
                  <div className="px-3 py-1 bg-gradient-to-r from-[var(--color-primary-500)]/20 to-[var(--color-primary-400)]/10 rounded-full">
                    <span className="text-xs font-semibold text-[var(--color-primary-400)]">
                      TOP {entry.rank}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* View More */}
      <div className="p-4 text-center border-t border-[var(--glass-border)]">
        <button className="text-sm text-[var(--color-primary-400)] hover:text-[var(--color-primary-500)] transition-colors">
          전체 랭킹 보기 →
        </button>
      </div>
    </Card>
  );
}