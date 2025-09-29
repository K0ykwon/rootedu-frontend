'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Clock } from 'lucide-react';
import type { TimeRange } from '@/lib/types/study-plan';

interface TimeRangeSelectorProps {
  value: TimeRange[];
  onChange: (ranges: TimeRange[]) => void;
  onConfirm?: () => void;
}

const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  value,
  onChange,
  onConfirm
}) => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null);
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);

  // Generate 24-hour timeline
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Convert time string (HH:mm) to hour number
  const timeToHour = (time: string): number => {
    const [hour] = time.split(':').map(Number);
    return hour;
  };

  // Convert hour number to time string (HH:mm)
  const hourToTime = (hour: number): string => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  // Check if an hour is within any selected range
  const isHourSelected = useCallback((hour: number): boolean => {
    return value.some(range => {
      const startHour = timeToHour(range.start);
      const endHour = timeToHour(range.end);
      return hour >= startHour && hour < endHour;
    });
  }, [value]);

  // Check if hour is in current selection
  const isInCurrentSelection = useCallback((hour: number): boolean => {
    if (selectionStart === null) return false;
    const end = selectionEnd ?? hoveredHour;
    if (end === null) return false;
    const min = Math.min(selectionStart, end);
    const max = Math.max(selectionStart, end);
    return hour >= min && hour <= max;
  }, [selectionStart, selectionEnd, hoveredHour]);

  // Handle mouse down on hour block
  const handleMouseDown = (hour: number) => {
    if (isHourSelected(hour)) {
      // Remove the range containing this hour
      const newRanges = value.filter(range => {
        const startHour = timeToHour(range.start);
        const endHour = timeToHour(range.end);
        return !(hour >= startHour && hour < endHour);
      });
      onChange(newRanges);
    } else {
      setIsSelecting(true);
      setSelectionStart(hour);
      setSelectionEnd(null);
    }
  };

  // Handle mouse enter on hour block
  const handleMouseEnter = (hour: number) => {
    setHoveredHour(hour);
    if (isSelecting && selectionStart !== null) {
      setSelectionEnd(hour);
    }
  };

  // Handle mouse up
  const handleMouseUp = () => {
    if (isSelecting && selectionStart !== null && selectionEnd !== null) {
      const min = Math.min(selectionStart, selectionEnd);
      const max = Math.max(selectionStart, selectionEnd);

      // Create new time range
      const newRange: TimeRange = {
        start: hourToTime(min),
        end: hourToTime(max + 1)  // +1 because end time is exclusive
      };

      // Check for overlaps and merge if necessary
      const nonOverlapping = value.filter(range => {
        const startHour = timeToHour(range.start);
        const endHour = timeToHour(range.end);
        return endHour <= min || startHour >= max + 1;
      });

      onChange([...nonOverlapping, newRange].sort((a, b) =>
        timeToHour(a.start) - timeToHour(b.start)
      ));
    }

    setIsSelecting(false);
    setSelectionStart(null);
    setSelectionEnd(null);
  };

  // Calculate total hours selected
  const totalHours = useMemo(() => {
    return value.reduce((total, range) => {
      const start = timeToHour(range.start);
      const end = timeToHour(range.end);
      return total + (end - start);
    }, 0);
  }, [value]);

  // Get display text for ranges
  const getRangeDisplay = () => {
    if (value.length === 0) return '시간을 선택해주세요';

    return value.map(range => {
      const startHour = timeToHour(range.start);
      const endHour = timeToHour(range.end);
      return `${startHour}시-${endHour}시`;
    }).join(', ');
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            학습 시간 선택
          </h3>
          <span className="text-sm text-gray-500">
            총 {totalHours}시간 선택됨
          </span>
        </div>
        <p className="text-sm text-gray-600">
          드래그하여 학습할 시간대를 선택하세요. 여러 시간대 선택 가능합니다.
        </p>
      </div>

      {/* Selected ranges display */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <div className="text-sm font-medium text-blue-900 mb-2">선택된 시간:</div>
        <div className="text-sm text-blue-700">{getRangeDisplay()}</div>
      </div>

      {/* Timeline */}
      <div className="relative space-y-4" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
        {/* AM Section (0-11) */}
        <div>
          <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <span className="text-blue-500">오전 (AM)</span>
            <span className="text-xs text-gray-400">0시 - 11시</span>
          </div>
          <div className="grid grid-cols-12 gap-1">
            {hours.slice(0, 12).map(hour => {
              const isSelected = isHourSelected(hour);
              const isCurrentlySelecting = isInCurrentSelection(hour);
              const isNightTime = hour < 6;

              return (
                <div key={hour} className="text-center">
                  <div className="text-xs text-gray-600 mb-1 font-medium">
                    {hour}시
                  </div>
                  <motion.div
                    className={`
                      relative h-12 w-full rounded-lg cursor-pointer transition-all
                      ${isSelected
                        ? 'bg-gradient-to-b from-blue-400 to-blue-500 shadow-md'
                        : isCurrentlySelecting
                        ? 'bg-gradient-to-b from-blue-200 to-blue-300'
                        : isNightTime
                        ? 'bg-slate-100 hover:bg-slate-200 border-2 border-slate-200'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-gray-200'
                      }
                    `}
                    onMouseDown={() => handleMouseDown(hour)}
                    onMouseEnter={() => handleMouseEnter(hour)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {/* Night time indicator */}
                    {isNightTime && !isSelected && !isCurrentlySelecting && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg">🌙</span>
                      </div>
                    )}
                    {/* Selected indicator */}
                    {isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white font-bold">✓</span>
                      </div>
                    )}
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PM Section (12-23) */}
        <div>
          <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <span className="text-orange-500">오후 (PM)</span>
            <span className="text-xs text-gray-400">12시 - 23시</span>
          </div>
          <div className="grid grid-cols-12 gap-1">
            {hours.slice(12, 24).map(hour => {
              const isSelected = isHourSelected(hour);
              const isCurrentlySelecting = isInCurrentSelection(hour);
              const isNightTime = hour >= 22;

              return (
                <div key={hour} className="text-center">
                  <div className="text-xs text-gray-600 mb-1 font-medium">
                    {hour}시
                  </div>
                  <motion.div
                    className={`
                      relative h-12 w-full rounded-lg cursor-pointer transition-all
                      ${isSelected
                        ? 'bg-gradient-to-b from-blue-400 to-blue-500 shadow-md'
                        : isCurrentlySelecting
                        ? 'bg-gradient-to-b from-blue-200 to-blue-300'
                        : isNightTime
                        ? 'bg-slate-100 hover:bg-slate-200 border-2 border-slate-200'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-gray-200'
                      }
                    `}
                    onMouseDown={() => handleMouseDown(hour)}
                    onMouseEnter={() => handleMouseEnter(hour)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {/* Night time indicator */}
                    {isNightTime && !isSelected && !isCurrentlySelecting && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg">🌙</span>
                      </div>
                    )}
                    {/* Selected indicator */}
                    {isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white font-bold">✓</span>
                      </div>
                    )}
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick select buttons */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => onChange([{ start: '09:00', end: '12:00' }])}
          className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
        >
          오전 (9-12시)
        </button>
        <button
          onClick={() => onChange([{ start: '13:00', end: '18:00' }])}
          className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
        >
          오후 (1-6시)
        </button>
        <button
          onClick={() => onChange([{ start: '19:00', end: '23:00' }])}
          className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
        >
          저녁 (7-11시)
        </button>
        <button
          onClick={() => onChange([
            { start: '09:00', end: '12:00' },
            { start: '14:00', end: '18:00' }
          ])}
          className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
        >
          오전+오후
        </button>
        <button
          onClick={() => onChange([])}
          className="px-3 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-600 rounded-full transition-colors"
        >
          초기화
        </button>
      </div>

      {/* Confirm button */}
      {onConfirm && value.length > 0 && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={onConfirm}
          className="mt-4 w-full py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md"
        >
          선택 완료
        </motion.button>
      )}
    </div>
  );
};

export default TimeRangeSelector;