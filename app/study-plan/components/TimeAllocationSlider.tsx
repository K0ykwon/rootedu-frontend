'use client';

import React, { useState, useEffect } from 'react';
import { Clock, BarChart3, Send, RotateCcw, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TimeRange } from '@/lib/types/study-plan';

interface TimeAllocationSliderProps {
  subjects: string[];
  timeRanges: TimeRange[];
  onSubmit: (allocations: { subject: string; duration: number }[]) => void;
  loading?: boolean;
}

// Helper function to calculate total minutes from time ranges
const calculateTotalMinutes = (timeRanges: TimeRange[]): number => {
  return timeRanges.reduce((total, range) => {
    const [startHour, startMin] = range.start.split(':').map(Number);
    const [endHour, endMin] = range.end.split(':').map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    return total + (endMinutes - startMinutes);
  }, 0);
};

// Helper function to format minutes to hours and minutes
const formatMinutes = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) return `${mins}분`;
  if (mins === 0) return `${hours}시간`;
  return `${hours}시간 ${mins}분`;
};

// Generate color for each subject
const getSubjectColor = (index: number): string => {
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500',
    'bg-red-500', 'bg-teal-500', 'bg-indigo-500', 'bg-pink-500'
  ];
  return colors[index % colors.length];
};

export default function TimeAllocationSlider({
  subjects,
  timeRanges,
  onSubmit,
  loading = false
}: TimeAllocationSliderProps) {
  const [allocations, setAllocations] = useState<Record<string, number>>({});

  const totalMinutes = calculateTotalMinutes(timeRanges);
  const allocatedMinutes = Object.values(allocations).reduce((sum, val) => sum + val, 0);
  const remainingMinutes = Math.max(0, totalMinutes - allocatedMinutes);

  // Initialize with equal distribution
  useEffect(() => {
    if (subjects.length > 0 && totalMinutes > 0) {
      const baseAllocation = Math.floor(totalMinutes / subjects.length);
      const remainder = totalMinutes % subjects.length;

      const initialAllocations: Record<string, number> = {};
      subjects.forEach((subject, index) => {
        // Give extra minutes to first few subjects to handle remainder
        initialAllocations[subject] = baseAllocation + (index < remainder ? 1 : 0);
      });

      setAllocations(initialAllocations);
    }
  }, [subjects, totalMinutes]);

  const handleAllocationChange = (subject: string, value: number) => {
    const newValue = Math.max(0, Math.min(value, totalMinutes));
    setAllocations(prev => ({
      ...prev,
      [subject]: newValue
    }));
  };

  const handleSliderChange = (subject: string, value: number) => {
    // Ensure the total doesn't exceed available time
    const otherAllocations = Object.entries(allocations)
      .filter(([s]) => s !== subject)
      .reduce((sum, [, val]) => sum + val, 0);

    const maxValue = totalMinutes - otherAllocations;
    const clampedValue = Math.max(0, Math.min(value, maxValue));

    handleAllocationChange(subject, clampedValue);
  };

  const autoDistribute = () => {
    if (subjects.length === 0) return;

    const baseAllocation = Math.floor(totalMinutes / subjects.length);
    const remainder = totalMinutes % subjects.length;

    const newAllocations: Record<string, number> = {};
    subjects.forEach((subject, index) => {
      newAllocations[subject] = baseAllocation + (index < remainder ? 1 : 0);
    });

    setAllocations(newAllocations);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (allocatedMinutes === 0) return;

    const result = subjects
      .map(subject => ({
        subject,
        duration: allocations[subject] || 0
      }))
      .filter(item => item.duration > 0);

    onSubmit(result);
  };

  const getTimeRangesDisplay = () => {
    return timeRanges
      .map(range => `${range.start} ~ ${range.end}`)
      .join(', ');
  };

  const canSubmit = allocatedMinutes > 0 && !loading;
  const isOverAllocated = allocatedMinutes > totalMinutes;

  return (
    <div className="space-y-6">
      {/* Header Information */}
      <div className="bg-blue-50 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-blue-900">시간 배분 설정</h3>
        </div>
        <div className="text-sm space-y-1">
          <p className="text-blue-700">선택한 시간대: {getTimeRangesDisplay()}</p>
          <p className="text-blue-800 font-medium">
            총 학습 가능 시간: {formatMinutes(totalMinutes)}
          </p>
        </div>
      </div>

      {/* Remaining Time Indicator */}
      <div className={`p-4 rounded-xl border-2 ${
        isOverAllocated ? 'bg-red-50 border-red-200' :
        remainingMinutes === 0 ? 'bg-green-50 border-green-200' :
        'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className={`w-5 h-5 ${
              isOverAllocated ? 'text-red-600' :
              remainingMinutes === 0 ? 'text-green-600' :
              'text-gray-600'
            }`} />
            <span className="font-medium">
              {isOverAllocated ? `${allocatedMinutes - totalMinutes}분 초과` :
               remainingMinutes === 0 ? '완벽한 배분!' :
               `${remainingMinutes}분 남음`}
            </span>
          </div>

          <button
            type="button"
            onClick={autoDistribute}
            disabled={loading}
            className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50 flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            균등 배분
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className={`h-2 rounded-full ${
              isOverAllocated ? 'bg-red-500' :
              remainingMinutes === 0 ? 'bg-green-500' :
              'bg-blue-500'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (allocatedMinutes / totalMinutes) * 100)}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Subject Allocation Controls */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-3">
          <AnimatePresence>
            {subjects.map((subject, index) => {
              const allocation = allocations[subject] || 0;
              const percentage = totalMinutes > 0 ? (allocation / totalMinutes) * 100 : 0;

              return (
                <motion.div
                  key={subject}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white border border-gray-200 rounded-xl p-4"
                >
                  {/* Subject header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getSubjectColor(index)}`} />
                      <h4 className="font-medium text-gray-800">{subject}</h4>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-800">
                        {formatMinutes(allocation)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {/* Slider and input */}
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0"
                      max={totalMinutes}
                      step="5"
                      value={allocation}
                      onChange={(e) => handleSliderChange(subject, parseInt(e.target.value))}
                      disabled={loading}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      style={{
                        background: `linear-gradient(to right, ${getSubjectColor(index).replace('bg-', '')} 0%, ${getSubjectColor(index).replace('bg-', '')} ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`
                      }}
                    />

                    <div className="flex items-center gap-1 min-w-0">
                      <input
                        type="number"
                        value={allocation}
                        onChange={(e) => handleAllocationChange(subject, parseInt(e.target.value) || 0)}
                        disabled={loading}
                        className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-center disabled:opacity-50"
                        min="0"
                        max={totalMinutes}
                        step="5"
                      />
                      <span className="text-xs text-gray-500">분</span>
                    </div>
                  </div>

                  {/* Allocation bar */}
                  <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      className={getSubjectColor(index)}
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Warning if over-allocated */}
        {isOverAllocated && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700"
          >
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">
              시간 배분이 {formatMinutes(allocatedMinutes - totalMinutes)} 초과되었습니다.
              조정해주세요.
            </span>
          </motion.div>
        )}

        {/* Submit button */}
        <motion.button
          type="submit"
          disabled={!canSubmit || isOverAllocated}
          className="w-full px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 font-medium"
          whileHover={canSubmit && !isOverAllocated ? { scale: 1.01 } : {}}
          whileTap={canSubmit && !isOverAllocated ? { scale: 0.99 } : {}}
        >
          <Send className="w-5 h-5" />
          <span>
            {allocatedMinutes === 0 ? '시간을 배분해주세요' :
             isOverAllocated ? '시간 초과 - 조정 필요' :
             '시간 배분 완료'}
          </span>
        </motion.button>

        {/* Help text */}
        <div className="text-xs text-gray-400 text-center space-y-1">
          <p>💡 슬라이더나 숫자 입력으로 조정 가능</p>
          <p>균등 배분 버튼으로 자동 분배</p>
        </div>
      </form>
    </div>
  );
}