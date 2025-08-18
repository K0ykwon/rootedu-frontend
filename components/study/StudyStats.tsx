'use client';

import Card from '../ui/Card';

interface StudyStatsProps {
  todayMinutes: number;
  weeklyAverage: number;
  monthlyTotal: number;
}

export default function StudyStats({
  todayMinutes,
  weeklyAverage,
  monthlyTotal
}: StudyStatsProps) {
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}시간 ${mins > 0 ? `${mins}분` : ''}`;
    }
    return `${mins}분`;
  };

  const getTodayProgress = () => {
    const targetMinutes = 240; // 4 hours target
    return Math.min((todayMinutes / targetMinutes) * 100, 100);
  };

  const getMotivationalMessage = () => {
    const progress = getTodayProgress();
    if (progress >= 100) return '목표 달성! 훌륭해요! 🎉';
    if (progress >= 75) return '거의 다 왔어요! 조금만 더! 💪';
    if (progress >= 50) return '절반 이상 완료! 화이팅! 🔥';
    if (progress >= 25) return '좋은 시작이에요! 계속해봐요! ⭐';
    return '오늘도 함께 공부해요! 📚';
  };

  return (
    <Card glass className="p-6 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-50" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
            📊 학습 통계
          </h3>
          <div className="px-2 py-1 bg-[var(--color-primary-500)]/10 rounded-full">
            <span className="text-xs font-semibold text-[var(--color-primary-400)]">
              TODAY
            </span>
          </div>
        </div>

        {/* Today's Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[var(--color-text-secondary)]">오늘</span>
            <span className="text-2xl font-bold text-[var(--color-text-primary)]">
              {formatTime(todayMinutes)}
            </span>
          </div>
          
          {/* Progress Ring */}
          <div className="relative w-24 h-24 mx-auto mb-3">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="var(--glass-border)"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="url(#gradient)"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - getTodayProgress() / 100)}`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--color-primary-500)" />
                  <stop offset="100%" stopColor="var(--color-primary-400)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold text-[var(--color-primary-400)]">
                {Math.round(getTodayProgress())}%
              </span>
            </div>
          </div>

          <p className="text-center text-sm text-[var(--color-text-secondary)]">
            {getMotivationalMessage()}
          </p>
        </div>

        {/* Weekly & Monthly Stats */}
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[var(--glass-border)]">
          <div className="text-center">
            <p className="text-xs text-[var(--color-text-tertiary)] mb-1">주간 평균</p>
            <p className="text-lg font-semibold text-[var(--color-text-primary)]">
              {formatTime(weeklyAverage)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-[var(--color-text-tertiary)] mb-1">월간 누적</p>
            <p className="text-lg font-semibold text-[var(--color-text-primary)]">
              {formatTime(monthlyTotal)}
            </p>
          </div>
        </div>

        {/* Level Progress */}
        <div className="mt-4 pt-4 border-t border-[var(--glass-border)]">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-[var(--color-text-tertiary)]">Level 12</span>
            <span className="text-[var(--color-text-tertiary)]">Level 13</span>
          </div>
          <div className="w-full h-1.5 bg-[var(--glass-bg)] rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-500"
              style={{ width: '65%' }}
            />
          </div>
          <p className="text-center text-xs text-[var(--color-text-tertiary)] mt-1">
            350 / 500 EXP
          </p>
        </div>
      </div>
    </Card>
  );
}