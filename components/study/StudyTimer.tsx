'use client';

import { useState, useEffect, useRef } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { StudySubject } from '@/types/study-proof';

interface StudyTimerProps {
  isActive: boolean;
  currentTime: number;
  onStart: () => void;
  onEnd: () => void;
  onTimeUpdate: (time: number) => void;
  selectedSubject: StudySubject;
  onSubjectChange: (subject: StudySubject) => void;
}

export default function StudyTimer({
  isActive,
  currentTime,
  onStart,
  onEnd,
  onTimeUpdate,
  selectedSubject,
  onSubjectChange
}: StudyTimerProps) {
  const [localTime, setLocalTime] = useState(currentTime);
  const [isPaused, setIsPaused] = useState(false);
  const [pauseCount, setPauseCount] = useState(0);
  const [focusScore, setFocusScore] = useState(100);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Pomodoro settings
  const [pomodoroMode, setPomodoroMode] = useState(false);
  const [pomodoroSession, setPomodoroSession] = useState(25 * 60); // 25 minutes
  const [breakTime, setBreakTime] = useState(5 * 60); // 5 minutes
  const [isBreak, setIsBreak] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);

  useEffect(() => {
    if (isActive && !isPaused) {
      intervalRef.current = setInterval(() => {
        setLocalTime(prev => {
          const newTime = prev + 1;
          onTimeUpdate(newTime);
          
          // Pomodoro logic
          if (pomodoroMode) {
            if (!isBreak && newTime % pomodoroSession === 0) {
              // Start break
              setIsBreak(true);
              playNotificationSound();
              showNotification('휴식 시간입니다! 5분간 쉬어주세요 🌟');
            } else if (isBreak && newTime % breakTime === 0) {
              // End break
              setIsBreak(false);
              setSessionCount(prev => prev + 1);
              playNotificationSound();
              showNotification('다시 집중할 시간입니다! 화이팅! 💪');
            }
          }
          
          return newTime;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, isPaused, pomodoroMode, pomodoroSession, breakTime, isBreak, onTimeUpdate]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
    if (!isPaused) {
      setPauseCount(prev => prev + 1);
      // Reduce focus score for each pause
      setFocusScore(prev => Math.max(0, prev - 5));
    }
  };

  const handleStop = () => {
    onEnd();
    // Reset timer
    setLocalTime(0);
    setIsPaused(false);
    setPauseCount(0);
    setFocusScore(100);
    setSessionCount(0);
    setIsBreak(false);
  };

  const playNotificationSound = () => {
    // Simple notification sound
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTcIGWi77eeeTRAMUKfj8LZjHAY4kdfyzHksBSR3x/DdkEAKFF607uupVRQKRp/g8r5sIQUrgs/y2Yg3');
    audio.play().catch(() => {});
  };

  const showNotification = (message: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('RootEdu 공부 타이머', {
        body: message,
        icon: '/logo.png'
      });
    }
  };

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const subjects = Object.values(StudySubject);

  return (
    <div className="space-y-6">
      {/* Timer Display */}
      <Card glass className="p-8 text-center relative overflow-hidden">
        {/* Background Animation */}
        {isActive && !isPaused && (
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-primary-500)]/5 to-[var(--color-primary-400)]/5 animate-pulse" />
        )}
        
        <div className="relative z-10">
          {/* Timer */}
          <div className="mb-6">
            <div className="text-6xl md:text-8xl font-bold font-mono text-[var(--color-text-primary)] mb-2">
              {formatTime(localTime)}
            </div>
            {isBreak && (
              <p className="text-lg text-[var(--color-primary-400)]">
                🌟 휴식 시간
              </p>
            )}
          </div>

          {/* Focus Score */}
          <div className="mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-sm text-[var(--color-text-secondary)]">집중도</span>
              <span className="text-lg font-semibold text-[var(--color-primary-400)]">
                {focusScore}%
              </span>
            </div>
            <div className="w-full max-w-xs mx-auto h-2 bg-[var(--glass-bg)] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[var(--color-primary-500)] to-[var(--color-primary-400)] transition-all duration-300"
                style={{ width: `${focusScore}%` }}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            {!isActive ? (
              <Button
                variant="primary"
                size="lg"
                onClick={onStart}
                className="px-8"
              >
                <span className="flex items-center gap-2">
                  ▶️ 공부 시작
                </span>
              </Button>
            ) : (
              <>
                <Button
                  variant={isPaused ? "primary" : "outline"}
                  onClick={handlePause}
                >
                  {isPaused ? '▶️ 재개' : '⏸️ 일시정지'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleStop}
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  ⏹️ 종료 & 인증
                </Button>
              </>
            )}
          </div>

          {/* Pause Count */}
          {pauseCount > 0 && (
            <p className="mt-4 text-sm text-[var(--color-text-tertiary)]">
              휴식 횟수: {pauseCount}회
            </p>
          )}
        </div>
      </Card>

      {/* Subject Selection */}
      <Card glass className="p-6">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
          📚 공부 과목 선택
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {subjects.map((subject) => (
            <button
              key={subject}
              onClick={() => onSubjectChange(subject)}
              className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                selectedSubject === subject
                  ? 'bg-gradient-to-br from-[var(--color-primary-500)]/20 to-[var(--color-primary-400)]/10 border-[var(--color-primary-400)] text-[var(--color-text-primary)]'
                  : 'glass-card border-[var(--glass-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary-400)]/50'
              }`}
            >
              {subject}
            </button>
          ))}
        </div>
      </Card>

      {/* Pomodoro Settings */}
      <Card glass className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
            🍅 뽀모도로 타이머
          </h3>
          <button
            onClick={() => setPomodoroMode(!pomodoroMode)}
            className={`px-4 py-2 rounded-lg transition-all duration-200 ${
              pomodoroMode
                ? 'bg-[var(--color-primary-500)]/20 text-[var(--color-primary-400)]'
                : 'glass-card text-[var(--color-text-secondary)]'
            }`}
          >
            {pomodoroMode ? 'ON' : 'OFF'}
          </button>
        </div>
        
        {pomodoroMode && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">완료한 세션</span>
              <span className="font-semibold text-[var(--color-primary-400)]">
                {sessionCount}회
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">집중 시간</span>
              <span className="text-[var(--color-text-primary)]">25분</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">휴식 시간</span>
              <span className="text-[var(--color-text-primary)]">5분</span>
            </div>
          </div>
        )}
      </Card>

      {/* Motivational Quote */}
      <Card glass className="p-6 text-center">
        <p className="text-lg text-[var(--color-text-primary)] mb-2">
          "오늘의 노력이 내일의 성공을 만든다"
        </p>
        <p className="text-sm text-[var(--color-text-secondary)]">
          - 당신의 꿈을 응원합니다 🌟
        </p>
      </Card>
    </div>
  );
}