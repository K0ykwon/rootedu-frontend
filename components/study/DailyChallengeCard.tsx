'use client';

import { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';

interface Challenge {
  id: string;
  title: string;
  description: string;
  goal: number;
  current: number;
  unit: string;
  reward: string;
  icon: string;
}

export default function DailyChallengeCard() {
  const [challenge, setChallenge] = useState<Challenge>({
    id: '1',
    title: '오늘의 도전',
    description: '4시간 이상 공부하기',
    goal: 240,
    current: 180,
    unit: '분',
    reward: '100 EXP + 불꽃 배지',
    icon: '🎯'
  });

  const progress = (challenge.current / challenge.goal) * 100;
  const isCompleted = challenge.current >= challenge.goal;

  const dailyChallenges = [
    {
      title: '얼리버드 챌린지',
      description: '오전 6시 이전에 공부 시작하기',
      icon: '🌅',
      reward: '150 EXP + 얼리버드 타이틀'
    },
    {
      title: '집중의 달인',
      description: '휴식 없이 2시간 연속 공부',
      icon: '🎯',
      reward: '200 EXP + 집중력 배지'
    },
    {
      title: '과목 정복자',
      description: '3개 이상 과목 공부하기',
      icon: '📚',
      reward: '120 EXP + 다재다능 배지'
    }
  ];

  return (
    <Card glass className="p-6 relative overflow-hidden">
      {/* Background Animation */}
      {isCompleted && (
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-green-500/10 animate-pulse" />
      )}
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
            {challenge.icon} {challenge.title}
          </h3>
          {isCompleted && (
            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full">
              완료!
            </span>
          )}
        </div>

        {/* Current Challenge */}
        <div className="mb-4">
          <p className="text-sm text-[var(--color-text-secondary)] mb-3">
            {challenge.description}
          </p>
          
          {/* Progress Bar */}
          <div className="mb-2">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-[var(--color-text-tertiary)]">진행도</span>
              <span className="font-semibold text-[var(--color-primary-400)]">
                {challenge.current}/{challenge.goal} {challenge.unit}
              </span>
            </div>
            <div className="w-full h-3 bg-[var(--glass-bg)] rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  isCompleted
                    ? 'bg-gradient-to-r from-green-500 to-green-400'
                    : 'bg-gradient-to-r from-[var(--color-primary-500)] to-[var(--color-primary-400)]'
                }`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>

          {/* Reward */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[var(--color-text-tertiary)]">보상:</span>
            <span className="font-medium text-yellow-400">
              {challenge.reward}
            </span>
          </div>
        </div>

        {/* Additional Challenges Preview */}
        <div className="pt-4 border-t border-[var(--glass-border)]">
          <p className="text-xs text-[var(--color-text-tertiary)] mb-2">
            추가 도전 과제
          </p>
          <div className="flex gap-3">
            {dailyChallenges.slice(0, 3).map((ch, idx) => (
              <div
                key={idx}
                className="flex-1 text-center p-2 bg-[var(--glass-bg)] rounded-lg"
                title={ch.description}
              >
                <div className="text-xl mb-1">{ch.icon}</div>
                <p className="text-xs text-[var(--color-text-secondary)] truncate">
                  {ch.title}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Time Remaining */}
        <div className="mt-4 text-center">
          <p className="text-xs text-[var(--color-text-tertiary)]">
            남은 시간: <span className="font-semibold text-[var(--color-text-primary)]">14시간 32분</span>
          </p>
        </div>
      </div>
    </Card>
  );
}