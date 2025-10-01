'use client';

import React, { useState, useCallback, useMemo, useRef } from 'react';
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
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Get hour from touch/mouse event
  const getHourFromEvent = (clientX: number, clientY: number): number | null => {
    if (!containerRef.current) return null;

    const elements = document.elementsFromPoint(clientX, clientY);
    for (const element of elements) {
      const hourAttr = element.getAttribute('data-hour');
      if (hourAttr !== null) {
        return parseInt(hourAttr, 10);
      }
    }
    return null;
  };

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent, hour: number) => {
    e.preventDefault();
    setIsTouchDevice(true);

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
      setSelectionEnd(hour);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSelecting || selectionStart === null) return;
    e.preventDefault();

    const touch = e.touches[0];
    const hour = getHourFromEvent(touch.clientX, touch.clientY);

    if (hour !== null) {
      setSelectionEnd(hour);
      setHoveredHour(hour);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();

    if (isSelecting && selectionStart !== null && selectionEnd !== null) {
      const min = Math.min(selectionStart, selectionEnd);
      const max = Math.max(selectionStart, selectionEnd);

      // Create new time range
      const newRange: TimeRange = {
        start: hourToTime(min),
        end: hourToTime(max + 1)
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
    setHoveredHour(null);
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
    <div className="bg-white rounded-xl p-3 md:p-4 shadow-sm border border-gray-200 overflow-x-hidden">
      <div className="mb-3 md:mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base md:text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            학습 시간 선택
          </h3>
          <span className="text-sm md:text-sm text-gray-500 font-medium">
            총 {totalHours}시간
          </span>
        </div>
        <p className="text-sm md:text-sm text-gray-600">
          <span className="hidden md:inline">드래그하여 학습할 시간대를 선택하세요. 여러 시간대 선택 가능합니다.</span>
          <span className="md:hidden">시간을 드래그하거나 아래 버튼을 눌러 선택하세요</span>
        </p>
      </div>

      {/* Quick select buttons - Moved to top for mobile */}
      <div className="mb-3 md:mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => onChange([{ start: '09:00', end: '12:00' }])}
          className="flex-1 min-w-[120px] px-3 py-2.5 text-sm bg-blue-50 hover:bg-blue-100 active:bg-blue-200 text-blue-700 font-medium rounded-lg transition-colors border-2 border-blue-200 touch-target"
          style={{ touchAction: 'manipulation' }}
        >
          오전 (9-12시)
        </button>
        <button
          onClick={() => onChange([{ start: '13:00', end: '18:00' }])}
          className="flex-1 min-w-[120px] px-3 py-2.5 text-sm bg-orange-50 hover:bg-orange-100 active:bg-orange-200 text-orange-700 font-medium rounded-lg transition-colors border-2 border-orange-200 touch-target"
          style={{ touchAction: 'manipulation' }}
        >
          오후 (1-6시)
        </button>
        <button
          onClick={() => onChange([{ start: '19:00', end: '23:00' }])}
          className="flex-1 min-w-[120px] px-3 py-2.5 text-sm bg-purple-50 hover:bg-purple-100 active:bg-purple-200 text-purple-700 font-medium rounded-lg transition-colors border-2 border-purple-200 touch-target"
          style={{ touchAction: 'manipulation' }}
        >
          저녁 (7-11시)
        </button>
        <button
          onClick={() => onChange([
            { start: '09:00', end: '12:00' },
            { start: '14:00', end: '18:00' }
          ])}
          className="flex-1 min-w-[120px] px-3 py-2.5 text-sm bg-green-50 hover:bg-green-100 active:bg-green-200 text-green-700 font-medium rounded-lg transition-colors border-2 border-green-200 touch-target"
          style={{ touchAction: 'manipulation' }}
        >
          오전+오후
        </button>
        <button
          onClick={() => onChange([])}
          className="px-4 py-2.5 text-sm bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-600 font-medium rounded-lg transition-colors border-2 border-red-200 touch-target"
          style={{ touchAction: 'manipulation' }}
        >
          초기화
        </button>
      </div>

      {/* Selected ranges display */}
      <div className="mb-3 md:mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-100">
        <div className="text-sm font-semibold text-blue-900 mb-1">선택된 시간:</div>
        <div className="text-sm text-blue-700 font-medium">{getRangeDisplay()}</div>
      </div>

      {/* Timeline */}
      <div
        ref={containerRef}
        className="relative space-y-4"
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* AM Section (0-11) */}
        <div>
          <div className="text-sm md:text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <span className="text-blue-600">오전 (AM)</span>
            <span className="text-xs text-gray-400">0시 - 11시</span>
          </div>
          <div className="grid grid-cols-4 md:grid-cols-12 gap-2 md:gap-1">
            {hours.slice(0, 12).map(hour => {
              const isSelected = isHourSelected(hour);
              const isCurrentlySelecting = isInCurrentSelection(hour);
              const isNightTime = hour < 6;

              return (
                <div key={hour} className="text-center">
                  <div className="text-xs md:text-xs text-gray-600 mb-1 font-semibold">
                    {hour}시
                  </div>
                  <motion.div
                    data-hour={hour}
                    className={`
                      relative h-16 md:h-12 w-full min-h-[48px] rounded-lg cursor-pointer transition-all
                      ${isSelected
                        ? 'bg-gradient-to-b from-blue-500 to-blue-600 shadow-lg ring-2 ring-blue-300'
                        : isCurrentlySelecting
                        ? 'bg-gradient-to-b from-blue-300 to-blue-400 shadow-md ring-2 ring-blue-200'
                        : isNightTime
                        ? 'bg-slate-100 hover:bg-slate-200 border-2 border-slate-300 active:bg-slate-300'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-gray-300 active:bg-gray-200'
                      }
                    `}
                    onMouseDown={() => handleMouseDown(hour)}
                    onMouseEnter={() => handleMouseEnter(hour)}
                    onTouchStart={(e) => handleTouchStart(e, hour)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{ touchAction: 'none', userSelect: 'none' }}
                  >
                    {/* Night time indicator */}
                    {isNightTime && !isSelected && !isCurrentlySelecting && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-xl md:text-lg">🌙</span>
                      </div>
                    )}
                    {/* Selected indicator */}
                    {isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-white font-bold text-base md:text-base">✓</span>
                      </div>
                    )}
                    {/* Currently selecting indicator */}
                    {!isSelected && isCurrentlySelecting && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-blue-700 font-bold text-base">•</span>
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
          <div className="text-sm md:text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <span className="text-orange-600">오후 (PM)</span>
            <span className="text-xs text-gray-400">12시 - 23시</span>
          </div>
          <div className="grid grid-cols-4 md:grid-cols-12 gap-2 md:gap-1">
            {hours.slice(12, 24).map(hour => {
              const isSelected = isHourSelected(hour);
              const isCurrentlySelecting = isInCurrentSelection(hour);
              const isNightTime = hour >= 22;

              return (
                <div key={hour} className="text-center">
                  <div className="text-xs md:text-xs text-gray-600 mb-1 font-semibold">
                    {hour}시
                  </div>
                  <motion.div
                    data-hour={hour}
                    className={`
                      relative h-16 md:h-12 w-full min-h-[48px] rounded-lg cursor-pointer transition-all
                      ${isSelected
                        ? 'bg-gradient-to-b from-blue-500 to-blue-600 shadow-lg ring-2 ring-blue-300'
                        : isCurrentlySelecting
                        ? 'bg-gradient-to-b from-blue-300 to-blue-400 shadow-md ring-2 ring-blue-200'
                        : isNightTime
                        ? 'bg-slate-100 hover:bg-slate-200 border-2 border-slate-300 active:bg-slate-300'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-gray-300 active:bg-gray-200'
                      }
                    `}
                    onMouseDown={() => handleMouseDown(hour)}
                    onMouseEnter={() => handleMouseEnter(hour)}
                    onTouchStart={(e) => handleTouchStart(e, hour)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{ touchAction: 'none', userSelect: 'none' }}
                  >
                    {/* Night time indicator */}
                    {isNightTime && !isSelected && !isCurrentlySelecting && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-xl md:text-lg">🌙</span>
                      </div>
                    )}
                    {/* Selected indicator */}
                    {isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-white font-bold text-base md:text-base">✓</span>
                      </div>
                    )}
                    {/* Currently selecting indicator */}
                    {!isSelected && isCurrentlySelecting && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-blue-700 font-bold text-base">•</span>
                      </div>
                    )}
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Confirm button */}
      {onConfirm && value.length > 0 && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={onConfirm}
          className="mt-4 w-full py-3.5 md:py-3 min-h-[52px] bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl hover:from-blue-600 hover:to-blue-700 active:from-blue-700 active:to-blue-800 transition-all shadow-lg hover:shadow-xl text-base md:text-base touch-target"
          style={{ touchAction: 'manipulation' }}
        >
          ✓ 선택 완료 ({totalHours}시간)
        </motion.button>
      )}
    </div>
  );
};

export default TimeRangeSelector;