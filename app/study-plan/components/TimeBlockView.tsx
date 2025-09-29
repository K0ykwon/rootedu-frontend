'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { format, parse, differenceInMinutes, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { DailyStudyPlan, SubjectPlan } from '@/lib/types/study-plan';
import EditableTimeBlock from './EditableTimeBlock';
import DraggableTimeBlock from './DraggableTimeBlock';
import ReflectionButton from './reflection/ReflectionButton';
import ReflectionChat from './reflection/ReflectionChat';
import { Check, Clock, Calendar, Target, ChevronDown, ChevronUp } from 'lucide-react';
import {
  calculateNewTimes,
  calculateResizedTimes,
  findTimeConflicts,
  PIXELS_PER_HOUR,
  PIXELS_PER_MINUTE,
  timeToPixels,
  pixelsToTime,
} from '@/lib/utils/timeUtils';

interface TimeBlockViewProps {
  plan: DailyStudyPlan;
  onUpdateSubject: (subjectId: string, updates: Partial<SubjectPlan>) => Promise<boolean>;
  onAddReflection: (subjectId: string, reflection: string) => Promise<boolean>;
  readOnly?: boolean; // Add read-only mode for history view
}

// Enhanced color palette with gradients
const SUBJECT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  '수학': {
    bg: 'bg-gradient-to-br from-rose-400 to-pink-500',
    border: 'border-rose-300',
    text: 'text-rose-50'
  },
  '영어': {
    bg: 'bg-gradient-to-br from-blue-400 to-indigo-500',
    border: 'border-blue-300',
    text: 'text-blue-50'
  },
  '국어': {
    bg: 'bg-gradient-to-br from-purple-400 to-violet-500',
    border: 'border-purple-300',
    text: 'text-purple-50'
  },
  '과학': {
    bg: 'bg-gradient-to-br from-teal-400 to-cyan-500',
    border: 'border-teal-300',
    text: 'text-teal-50'
  },
  '사회': {
    bg: 'bg-gradient-to-br from-amber-400 to-orange-500',
    border: 'border-amber-300',
    text: 'text-amber-50'
  },
  '역사': {
    bg: 'bg-gradient-to-br from-emerald-400 to-green-500',
    border: 'border-emerald-300',
    text: 'text-emerald-50'
  },
  '물리': {
    bg: 'bg-gradient-to-br from-sky-400 to-blue-500',
    border: 'border-sky-300',
    text: 'text-sky-50'
  },
  '화학': {
    bg: 'bg-gradient-to-br from-violet-400 to-purple-500',
    border: 'border-violet-300',
    text: 'text-violet-50'
  },
  '생물': {
    bg: 'bg-gradient-to-br from-lime-400 to-green-500',
    border: 'border-lime-300',
    text: 'text-lime-50'
  },
  default: {
    bg: 'bg-gradient-to-br from-gray-400 to-slate-500',
    border: 'border-gray-300',
    text: 'text-gray-50'
  }
};

const TimeBlockView: React.FC<TimeBlockViewProps> = ({
  plan,
  onUpdateSubject,
  onAddReflection,
  readOnly = false
}) => {
  const [editingBlock, setEditingBlock] = useState<string | null>(null);
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());
  const [hoveredBlock, setHoveredBlock] = useState<string | null>(null);
  const [hoveredGroup, setHoveredGroup] = useState<string[]>([]);
  const [localPlan, setLocalPlan] = useState(plan);

  // Debouncing refs for resize operations
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingResizeRef = useRef<Map<string, { heightChange: number; topChange: number; resizeFromTop: boolean }>>(new Map());
  const [dragConflicts, setDragConflicts] = useState<SubjectPlan[]>([]);
  const [showReflectionChat, setShowReflectionChat] = useState(false);

  // DnD Kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, []);

  // Calculate timeline range - always show full 24 hours
  const timelineData = useMemo(() => {
    const start = '00:00';
    const end = '24:00';

    // Generate hourly markers for 24 hours
    const hourMarkers = Array.from(
      { length: 25 }, // 0-24 inclusive
      (_, i) => `${String(i).padStart(2, '0')}:00`
    );

    const totalMinutes = 24 * 60; // 1440 minutes

    return { start, end, totalMinutes, hourMarkers };
  }, []); // No dependencies since it's always 24 hours

  // Use constants from timeUtils for consistency
  const pixelsPerMinute = PIXELS_PER_MINUTE;

  // Calculate block positions with overlap detection and lane assignment
  const calculateBlockPositions = useMemo(() => {
    const positions: { [key: string]: {
      top: string;
      height: string;
      hasGapBefore: boolean;
      lane: number;
      totalLanes: number;
      left: string;
      width: string;
    } } = {};

    // Sort plans by start time
    const sortedPlans = [...localPlan.plans].sort((a, b) => {
      const aStart = parse(a.startTime, 'HH:mm', new Date());
      const bStart = parse(b.startTime, 'HH:mm', new Date());
      return aStart.getTime() - bStart.getTime();
    });

    // Detect overlapping groups and assign lanes
    const groups: SubjectPlan[][] = [];
    let currentGroup: SubjectPlan[] = [];

    sortedPlans.forEach((subject, index) => {
      const startDate = parse(subject.startTime, 'HH:mm', new Date());
      const endDate = parse(subject.endTime, 'HH:mm', new Date());

      if (index === 0) {
        currentGroup = [subject];
      } else {
        const prevSubject = sortedPlans[index - 1];
        const prevEndDate = parse(prevSubject.endTime, 'HH:mm', new Date());

        // Check if current block starts before previous block ends (overlap)
        if (startDate < prevEndDate) {
          // Overlapping - add to current group
          currentGroup.push(subject);
        } else {
          // No overlap - start new group
          if (currentGroup.length > 0) {
            groups.push(currentGroup);
          }
          currentGroup = [subject];
        }
      }
    });

    // Add the last group
    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    // Assign lanes within each group
    groups.forEach(group => {
      const lanes: SubjectPlan[][] = [];

      group.forEach(subject => {
        const startDate = parse(subject.startTime, 'HH:mm', new Date());
        const endDate = parse(subject.endTime, 'HH:mm', new Date());

        // Find first available lane
        let assignedLane = -1;
        for (let laneIdx = 0; laneIdx < lanes.length; laneIdx++) {
          const lane = lanes[laneIdx];
          const lastInLane = lane[lane.length - 1];
          const lastEndDate = parse(lastInLane.endTime, 'HH:mm', new Date());

          if (startDate >= lastEndDate) {
            // Can fit in this lane
            lane.push(subject);
            assignedLane = laneIdx;
            break;
          }
        }

        // If no lane found, create new lane
        if (assignedLane === -1) {
          lanes.push([subject]);
          assignedLane = lanes.length - 1;
        }

        // Calculate position for this subject
        const timelineStartDate = parse(timelineData.start, 'HH:mm', new Date());
        const topOffset = differenceInMinutes(startDate, timelineStartDate);
        const duration = differenceInMinutes(endDate, startDate);

        // Check if there's a gap before this block
        let hasGapBefore = false;
        const subjectIndex = sortedPlans.indexOf(subject);
        if (subjectIndex > 0) {
          const prevSubject = sortedPlans[subjectIndex - 1];
          const prevEndTime = parse(prevSubject.endTime, 'HH:mm', new Date());
          const gapMinutes = differenceInMinutes(startDate, prevEndTime);
          hasGapBefore = gapMinutes > 10; // Only consider significant gaps
        }

        const totalLanes = lanes.length;

        // Smart width allocation based on content importance and duration
        let laneWidth: string;
        let laneLeft: string;

        if (totalLanes === 1) {
          laneWidth = '100%';
          laneLeft = '0';
        } else if (totalLanes === 2) {
          // For 2 lanes, use 60-40 split with longer block getting more space
          const thisBlockDuration = duration;
          const otherBlockDuration = group.find(s => s.id !== subject.id)?.endTime
            ? differenceInMinutes(
                parse(group.find(s => s.id !== subject.id)!.endTime, 'HH:mm', new Date()),
                parse(group.find(s => s.id !== subject.id)!.startTime, 'HH:mm', new Date())
              ) : duration;

          if (thisBlockDuration >= otherBlockDuration) {
            // This block is longer, give it more space
            laneWidth = assignedLane === 0 ? '65%' : '60%';
            laneLeft = assignedLane === 0 ? '0' : '65%';
          } else {
            // Other block is longer
            laneWidth = assignedLane === 0 ? '60%' : '35%';
            laneLeft = assignedLane === 0 ? '0' : '60%';
          }
        } else {
          // For 3+ lanes, use smart allocation
          const baseWidth = Math.max(30, 100 / totalLanes); // Minimum 30% width
          const remainingWidth = 100 - (baseWidth * totalLanes);
          const bonusWidth = remainingWidth / totalLanes;

          laneWidth = `${baseWidth + bonusWidth}%`;
          laneLeft = `${assignedLane * (baseWidth + bonusWidth)}%`;
        }

        positions[subject.id] = {
          top: `${topOffset * pixelsPerMinute}px`,
          height: `${Math.max(duration * pixelsPerMinute, 40)}px`,
          hasGapBefore,
          lane: assignedLane,
          totalLanes: totalLanes,
          left: laneLeft,
          width: laneWidth
        };
      });
    });

    return positions;
  }, [localPlan.plans, timelineData.start, pixelsPerMinute]);

  // Get current time position
  const currentTimePosition = useMemo(() => {
    const now = new Date();
    const currentTime = format(now, 'HH:mm');
    const currentDate = parse(currentTime, 'HH:mm', new Date());
    const timelineStartDate = parse(timelineData.start, 'HH:mm', new Date());

    const offset = differenceInMinutes(currentDate, timelineStartDate);
    if (offset < 0 || offset > timelineData.totalMinutes) return null;

    return `${offset * pixelsPerMinute}px`;
  }, [timelineData, pixelsPerMinute]);

  const getSubjectStyle = (subject: string) => {
    return SUBJECT_COLORS[subject] || SUBJECT_COLORS.default;
  };

  const handleUpdateBlock = async (subjectId: string, updates: Partial<SubjectPlan>) => {
    // Store original state for rollback
    const originalSubject = localPlan.plans.find(s => s.id === subjectId);
    if (!originalSubject) {
      console.error('❌ UPDATE: Original subject not found for rollback:', subjectId);
      return false;
    }

    console.log('🔄 UPDATE START: Optimistic update and API call', {
      subjectId,
      updates,
      originalSubject: {
        subject: originalSubject.subject,
        startTime: originalSubject.startTime,
        endTime: originalSubject.endTime
      }
    });

    // Optimistic update
    setLocalPlan(prev => ({
      ...prev,
      plans: prev.plans.map(s =>
        s.id === subjectId ? { ...s, ...updates } : s
      )
    }));

    try {
      console.log('🚀 UPDATE: Calling onUpdateSubject API...');
      const success = await onUpdateSubject(subjectId, updates);
      console.log('📡 UPDATE: API response received:', success);

      if (!success) {
        // Rollback on failure
        console.log('🔄 UPDATE: Rolling back due to API failure');
        setLocalPlan(prev => ({
          ...prev,
          plans: prev.plans.map(s =>
            s.id === subjectId ? originalSubject : s
          )
        }));
        console.error('❌ UPDATE: API returned false for subject:', subjectId, updates);
        return false;
      }

      setEditingBlock(null);
      console.log('✅ UPDATE: Complete success!');
      return true;
    } catch (error) {
      // Rollback on error
      console.log('🔄 UPDATE: Rolling back due to API error');
      setLocalPlan(prev => ({
        ...prev,
        plans: prev.plans.map(s =>
          s.id === subjectId ? originalSubject : s
        )
      }));
      console.error('❌ UPDATE: API threw error:', error);
      return false;
    }
  };

  // Handle drag end for time blocks
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, delta } = event;

    if (!delta.y || readOnly) return;

    const subjectId = active.id as string;
    const subject = localPlan.plans.find(p => p.id === subjectId);
    if (!subject) return;

    // Calculate new times based on pixel movement
    const newTimes = calculateNewTimes(subject, delta.y, timelineData.start);

    // Check for conflicts
    const conflicts = findTimeConflicts(subject, newTimes.startTime, newTimes.endTime, localPlan.plans);

    if (conflicts.length > 0) {
      setDragConflicts(conflicts);
      // Could show a toast or modal here
      console.warn('Time conflict detected:', conflicts);
      return;
    }

    // Clear any existing conflicts
    setDragConflicts([]);

    // Update the block
    const success = await handleUpdateBlock(subjectId, {
      startTime: newTimes.startTime,
      endTime: newTimes.endTime
    });

    if (!success) {
      console.error('❌ DRAG UPDATE FAILED:', {
        subjectId,
        oldTimes: { startTime: subject.startTime, endTime: subject.endTime },
        newTimes: { startTime: newTimes.startTime, endTime: newTimes.endTime }
      });
      // Visual feedback could be added here (e.g., toast notification)
    } else {
      console.log('✅ DRAG UPDATE SUCCESS:', {
        subjectId,
        oldTimes: { startTime: subject.startTime, endTime: subject.endTime },
        newTimes: { startTime: newTimes.startTime, endTime: newTimes.endTime }
      });
    }
  }, [localPlan.plans, timelineData.start, readOnly, handleUpdateBlock]);

  // Debounced resize handler to prevent rapid API calls
  const debouncedResizeEnd = useCallback((subjectId: string, heightChange: number, topChange: number, resizeFromTop: boolean) => {
    if (readOnly) return;

    // Store the latest resize parameters for this subject
    pendingResizeRef.current.set(subjectId, { heightChange, topChange, resizeFromTop });

    // Clear any existing timeout
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }

    // Set new timeout for debounced execution
    resizeTimeoutRef.current = setTimeout(async () => {
      const pendingResize = pendingResizeRef.current.get(subjectId);
      if (!pendingResize) return;

      // Clear the pending resize
      pendingResizeRef.current.delete(subjectId);

      // Execute the actual resize
      await handleResizeEnd(subjectId, pendingResize.heightChange, pendingResize.topChange, pendingResize.resizeFromTop);
    }, 300); // 300ms debounce delay
  }, [readOnly]);

  // Handle resize end for time blocks
  const handleResizeEnd = useCallback(async (subjectId: string, heightChange: number, topChange: number, resizeFromTop: boolean) => {
    const subject = localPlan.plans.find(p => p.id === subjectId);
    if (!subject) {
      console.error('❌ RESIZE: Subject not found:', subjectId);
      return;
    }

    console.log('🔄 RESIZE START:', {
      subjectId,
      subject: subject.subject,
      originalTimes: { startTime: subject.startTime, endTime: subject.endTime },
      heightChange,
      topChange,
      resizeFromTop,
      timelineStart: timelineData.start
    });

    // Use the new calculateResizedTimes function with proper delta values
    const newTimes = calculateResizedTimes(subject, resizeFromTop, heightChange, topChange, timelineData.start);

    if (!newTimes) {
      console.warn('❌ RESIZE CALCULATION FAILED: Resize would make block too small or exceed time boundaries', {
        subject: subject.subject,
        originalTimes: { startTime: subject.startTime, endTime: subject.endTime },
        heightChange,
        topChange,
        resizeFromTop
      });
      toast.error(`크기 조정 실패: 시간 블록이 너무 작거나 시간 범위를 벗어났습니다.`);
      return;
    }

    console.log('🔍 RESIZE CALCULATION SUCCESS:', {
      subject: subject.subject,
      oldTimes: { startTime: subject.startTime, endTime: subject.endTime },
      newTimes: { startTime: newTimes.startTime, endTime: newTimes.endTime }
    });

    // Check for conflicts
    const conflicts = findTimeConflicts(subject, newTimes.startTime, newTimes.endTime, localPlan.plans);

    if (conflicts.length > 0) {
      setDragConflicts(conflicts);
      console.warn('❌ RESIZE CONFLICT DETECTED:', {
        subject: subject.subject,
        newTimes,
        conflicts: conflicts.map(c => ({ id: c.id, subject: c.subject, time: `${c.startTime}-${c.endTime}` }))
      });
      const conflictSubjects = conflicts.map(c => c.subject).join(', ');
      toast.error(`시간 충돌: ${conflictSubjects}와(과) 겹칩니다.`);
      return;
    }

    // Clear any existing conflicts
    setDragConflicts([]);

    console.log('🚀 RESIZE: Calling API update...', {
      subjectId,
      updates: { startTime: newTimes.startTime, endTime: newTimes.endTime }
    });

    // Update the block
    const success = await handleUpdateBlock(subjectId, {
      startTime: newTimes.startTime,
      endTime: newTimes.endTime
    });

    if (!success) {
      console.error('❌ RESIZE UPDATE FAILED:', {
        subjectId,
        subject: subject.subject,
        oldTimes: { startTime: subject.startTime, endTime: subject.endTime },
        newTimes: { startTime: newTimes.startTime, endTime: newTimes.endTime },
        heightChange,
        topChange,
        resizeFromTop
      });
      toast.error(`시간 변경 실패: ${subject.subject} 일정을 업데이트할 수 없습니다.`);
    } else {
      console.log('✅ RESIZE UPDATE SUCCESS:', {
        subjectId,
        subject: subject.subject,
        oldTimes: { startTime: subject.startTime, endTime: subject.endTime },
        newTimes: { startTime: newTimes.startTime, endTime: newTimes.endTime },
        heightChange,
        topChange,
        resizeFromTop
      });
      toast.success(`시간 변경 완료: ${subject.subject} (${newTimes.startTime} - ${newTimes.endTime})`);
    }
  }, [localPlan.plans, calculateBlockPositions, timelineData.start, handleUpdateBlock]);

  const handleToggleComplete = async (subjectId: string, currentStatus: boolean) => {
    if (readOnly) return;
    const success = await handleUpdateBlock(subjectId, { completed: !currentStatus });
    if (!success) {
      console.error('Failed to toggle completion status');
    }
  };

  const toggleExpanded = (subjectId: string) => {
    setExpandedBlocks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(subjectId)) {
        newSet.delete(subjectId);
      } else {
        newSet.add(subjectId);
      }
      return newSet;
    });
  };

  // Calculate progress
  const completedCount = localPlan.plans.filter(p => p.completed).length;
  const totalCount = localPlan.plans.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Calculate total study time
  const totalStudyMinutes = localPlan.plans.reduce((acc, subject) => {
    const duration = differenceInMinutes(
      parse(subject.endTime, 'HH:mm', new Date()),
      parse(subject.startTime, 'HH:mm', new Date())
    );
    return acc + duration;
  }, 0);

  const totalHours = Math.floor(totalStudyMinutes / 60);
  const totalMins = totalStudyMinutes % 60;

  // Calculate timeline height (24 hours)
  const timelineHeight = timelineData.hourMarkers.length * PIXELS_PER_HOUR;

  return (
    <div className="w-full max-w-7xl mx-auto p-4 lg:p-6">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 mb-6"
      >
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2 flex items-center gap-3">
              <Calendar className="w-8 h-8 text-[var(--color-primary-500)]" />
              {format(parseISO(localPlan.date), 'M월 d일 EEEE', { locale: ko })}
            </h2>
            {localPlan.motivationalQuote && (
              <p className="text-[var(--color-text-secondary)] italic text-lg">
                💭 "{localPlan.motivationalQuote}"
              </p>
            )}
          </div>

          {/* Quick Stats */}
          <div className="flex gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-[var(--color-primary-500)]">
                {progressPercentage.toFixed(0)}%
              </div>
              <div className="text-sm text-[var(--color-text-tertiary)]">완료율</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[var(--color-text-primary)]">
                {totalHours}h {totalMins}m
              </div>
              <div className="text-sm text-[var(--color-text-tertiary)]">총 학습시간</div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="w-full h-3 bg-[var(--glass-bg-secondary)] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[var(--color-primary-400)] to-[var(--color-primary-600)] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      </motion.div>

      {/* Timeline Container with Scroll */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6 overflow-hidden"
      >
        {/* Scrollable Area */}
        <div
          className="overflow-y-auto overflow-x-hidden"
          style={{ maxHeight: '800px' }}
        >
          <div className="flex gap-6 pb-4">
            {/* Time Labels */}
            <div className="w-20 relative flex-shrink-0" style={{ height: `${timelineHeight}px` }}>
              {timelineData.hourMarkers.map((hour, index) => (
                <div
                  key={hour}
                  className="absolute text-sm font-medium text-[var(--color-text-secondary)]"
                  style={{ top: `${index * PIXELS_PER_HOUR}px` }}
                >
                  {hour}
                </div>
              ))}
            </div>

            {/* Timeline Track */}
            <div className="flex-1 relative" style={{ height: `${timelineHeight}px` }}>
              {/* Hour Grid Lines */}
              {timelineData.hourMarkers.map((hour, index) => (
                <div
                  key={`line-${hour}`}
                  className="absolute w-full border-t border-[var(--glass-border)] opacity-30"
                  style={{ top: `${index * PIXELS_PER_HOUR}px` }}
                />
              ))}

              {/* 30-minute markers */}
              {timelineData.hourMarkers.slice(0, -1).map((hour, index) => (
                <div
                  key={`half-${hour}`}
                  className="absolute w-full border-t border-[var(--glass-border)] opacity-15"
                  style={{ top: `${index * PIXELS_PER_HOUR + PIXELS_PER_HOUR / 2}px` }}
                />
              ))}

              {/* Current Time Indicator */}
              {currentTimePosition && (
                <motion.div
                  className="absolute w-full flex items-center z-20 pointer-events-none"
                  style={{ top: currentTimePosition }}
                  animate={{ opacity: [1, 0.7, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="w-3 h-3 bg-red-500 rounded-full shadow-lg" />
                  <div className="flex-1 h-0.5 bg-red-500" />
                  <span className="text-xs text-red-500 font-medium ml-2 bg-white/80 px-2 py-1 rounded">
                    {format(new Date(), 'HH:mm')}
                  </span>
                </motion.div>
              )}

              {/* Time Blocks with Drag and Drop */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={localPlan.plans.map(p => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <AnimatePresence mode="popLayout">
                    {localPlan.plans.map((subject, index) => {
                      const blockPosition = calculateBlockPositions[subject.id];
                      if (!blockPosition) return null;

                      const subjectStyle = getSubjectStyle(subject.subject);
                      const isEditing = editingBlock === subject.id;
                      const isExpanded = expandedBlocks.has(subject.id);
                      const isHovered = hoveredBlock === subject.id;
                      const isInHoveredGroup = hoveredGroup.includes(subject.id);

                      // For editing, only pass position data (EditableTimeBlock handles its own sizing)
                      const editStyle = {
                        top: blockPosition.top
                      };

                      return isEditing ? (
                        <EditableTimeBlock
                          key={subject.id}
                          subject={subject}
                          style={editStyle}
                          onSave={(updates) => handleUpdateBlock(subject.id, updates)}
                          onCancel={() => setEditingBlock(null)}
                          gradientColor={subjectStyle.bg}
                        />
                      ) : (
                        <DraggableTimeBlock
                          key={subject.id}
                          subject={subject}
                          subjectStyle={subjectStyle}
                          blockPosition={blockPosition}
                          isEditing={isEditing}
                          isExpanded={isExpanded}
                          isHovered={isHovered}
                          isInHoveredGroup={isInHoveredGroup}
                          readOnly={readOnly}
                          timelineStart={timelineData.start}
                          onToggleComplete={handleToggleComplete}
                          onToggleExpanded={toggleExpanded}
                          onEdit={setEditingBlock}
                          onHover={(subjectId: string | null) => {
                            setHoveredBlock(subjectId);

                            if (subjectId) {
                              // Find all blocks in the same time group
                              const hoveredSubject = localPlan.plans.find(s => s.id === subjectId);
                              if (hoveredSubject) {
                                const hoveredStart = parse(hoveredSubject.startTime, 'HH:mm', new Date());
                                const hoveredEnd = parse(hoveredSubject.endTime, 'HH:mm', new Date());

                                const relatedBlocks = localPlan.plans.filter(subject => {
                                  if (subject.id === subjectId) return true;

                                  const subjectStart = parse(subject.startTime, 'HH:mm', new Date());
                                  const subjectEnd = parse(subject.endTime, 'HH:mm', new Date());

                                  // Check if blocks overlap or are adjacent (within 15 minutes)
                                  const isOverlapping = hoveredStart < subjectEnd && subjectStart < hoveredEnd;
                                  const gapBefore = Math.abs(differenceInMinutes(subjectStart, hoveredEnd));
                                  const gapAfter = Math.abs(differenceInMinutes(hoveredStart, subjectEnd));
                                  const isAdjacent = gapBefore <= 15 || gapAfter <= 15;

                                  return isOverlapping || isAdjacent;
                                }).map(s => s.id);

                                setHoveredGroup(relatedBlocks);
                              }
                            } else {
                              setHoveredGroup([]);
                            }
                          }}
                          onResizeEnd={debouncedResizeEnd}
                        />
                      );
                    })}
                  </AnimatePresence>
                </SortableContext>
              </DndContext>

              {/* Conflict Warning */}
              {dragConflicts.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-4 left-4 right-4 bg-red-500 text-white p-3 rounded-lg shadow-lg z-30"
                >
                  <p className="font-semibold">Time Conflict Detected!</p>
                  <p className="text-sm">
                    Conflicts with: {dragConflicts.map(c => c.subject).join(', ')}
                  </p>
                  <button
                    onClick={() => setDragConflicts([])}
                    className="mt-2 px-3 py-1 bg-white/20 rounded text-sm hover:bg-white/30"
                  >
                    Dismiss
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        {timelineHeight > 800 && (
          <div className="mt-4 text-center text-sm text-[var(--color-text-tertiary)]">
            <motion.div
              animate={{ y: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="inline-flex items-center gap-2"
            >
              <ChevronDown className="w-4 h-4" />
              <span>스크롤하여 더 보기</span>
            </motion.div>
          </div>
        )}
      </motion.div>

      {/* Bottom Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-6 glass-card p-6"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <Target className="w-6 h-6 mx-auto mb-2 text-[var(--color-primary-500)]" />
            <p className="text-2xl font-bold text-[var(--color-text-primary)]">
              {totalCount}
            </p>
            <p className="text-sm text-[var(--color-text-tertiary)]">총 과목</p>
          </div>
          <div className="text-center">
            <Check className="w-6 h-6 mx-auto mb-2 text-[var(--color-success)]" />
            <p className="text-2xl font-bold text-[var(--color-success)]">
              {completedCount}
            </p>
            <p className="text-sm text-[var(--color-text-tertiary)]">완료</p>
          </div>
          <div className="text-center">
            <Clock className="w-6 h-6 mx-auto mb-2 text-[var(--color-warning)]" />
            <p className="text-2xl font-bold text-[var(--color-warning)]">
              {totalCount - completedCount}
            </p>
            <p className="text-sm text-[var(--color-text-tertiary)]">진행 중</p>
          </div>
          <div className="text-center">
            <div className="w-6 h-6 mx-auto mb-2 flex items-center justify-center">
              <span className="text-lg">🎯</span>
            </div>
            <p className="text-2xl font-bold text-[var(--color-primary-500)]">
              {progressPercentage.toFixed(0)}%
            </p>
            <p className="text-sm text-[var(--color-text-tertiary)]">달성률</p>
          </div>
        </div>
      </motion.div>

      {/* Completion Celebration */}
      {completedCount === totalCount && totalCount > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", duration: 0.6 }}
          className="mt-6 glass-card p-8 text-center bg-gradient-to-r from-green-500/10 to-blue-500/10"
        >
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-6xl mb-4"
          >
            🎉
          </motion.div>
          <h2 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2">
            완벽한 하루였어요!
          </h2>
          <p className="text-lg text-[var(--color-text-secondary)]">
            오늘의 모든 학습 목표를 달성하셨습니다. 정말 대단해요!
          </p>
        </motion.div>
      )}

      {/* Reflection Section */}
      {!readOnly && (
        <ReflectionButton
          plan={localPlan}
          onStart={() => setShowReflectionChat(true)}
        />
      )}

      {/* Reflection Chat */}
      <ReflectionChat
        isOpen={showReflectionChat}
        onClose={() => setShowReflectionChat(false)}
        plan={localPlan}
      />
    </div>
  );
};

export default TimeBlockView;