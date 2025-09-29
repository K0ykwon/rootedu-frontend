'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Check, Clock, ChevronDown, ChevronUp, Edit2, GripVertical } from 'lucide-react';
import type { SubjectPlan } from '@/lib/types/study-plan';
import { differenceInMinutes, parse, addMinutes, format } from 'date-fns';

interface DraggableTimeBlockProps {
  subject: SubjectPlan;
  subjectStyle: { bg: string; border: string; text: string };
  blockPosition: {
    top: string;
    height: string;
    left: string;
    width: string;
    totalLanes: number;
  };
  isEditing: boolean;
  isExpanded: boolean;
  isHovered: boolean;
  isInHoveredGroup?: boolean;
  readOnly?: boolean;
  timelineStart?: string; // Timeline start time for accurate drag calculations
  onToggleComplete: (subjectId: string, currentStatus: boolean) => void;
  onToggleExpanded: (subjectId: string) => void;
  onEdit: (subjectId: string) => void;
  onHover: (subjectId: string | null) => void;
  onDragEnd?: (subjectId: string, newPosition: { top: number }) => void;
  onResizeEnd?: (subjectId: string, heightChange: number, topChange: number, resizeFromTop: boolean) => void;
}

const RESIZE_HANDLE_HEIGHT = 8; // Height of resize handle area
const MIN_BLOCK_HEIGHT = 40; // Minimum height for a block (reduced for better timeline overview)

const DraggableTimeBlock: React.FC<DraggableTimeBlockProps> = ({
  subject,
  subjectStyle,
  blockPosition,
  isEditing,
  isExpanded,
  isHovered,
  isInHoveredGroup = false,
  readOnly = false,
  timelineStart = '00:00',
  onToggleComplete,
  onToggleExpanded,
  onEdit,
  onHover,
  onDragEnd,
  onResizeEnd
}) => {
  const [isResizing, setIsResizing] = useState<'top' | 'bottom' | null>(null);
  const [previewTimes, setPreviewTimes] = useState<{ startTime: string; endTime: string } | null>(null);
  const [dragPreviewTimes, setDragPreviewTimes] = useState<{ startTime: string; endTime: string } | null>(null);

  // Use refs to avoid stale closure issues
  const dragStartYRef = useRef(0);
  const originalHeightRef = useRef(0);
  const originalTopRef = useRef(0);
  const resizeRef = useRef<HTMLDivElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: subject.id,
    disabled: readOnly || isEditing || isResizing !== null,
  });

  // Calculate drag preview times when transform changes
  React.useEffect(() => {
    if (isDragging && transform?.y) {
      // Import time calculation functions dynamically
      import('@/lib/utils/timeUtils').then(({ calculateNewTimes }) => {
        try {
          const newTimes = calculateNewTimes(subject, transform.y, timelineStart);
          setDragPreviewTimes(newTimes);
        } catch (error) {
          console.warn('Error calculating drag preview times:', error);
          setDragPreviewTimes(null);
        }
      });
    } else if (!isDragging) {
      setDragPreviewTimes(null);
    }
  }, [isDragging, transform?.y, subject, timelineStart]);

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Calculate if block is compact (less than 60 minutes)
  const duration = differenceInMinutes(
    parse(subject.endTime, 'HH:mm', new Date()),
    parse(subject.startTime, 'HH:mm', new Date())
  );
  const isCompact = duration < 60;

  // Handle resize mouse events
  const handleResizeStart = useCallback((e: React.MouseEvent, from: 'top' | 'bottom') => {
    if (readOnly) return;

    e.preventDefault();
    e.stopPropagation();
    setIsResizing(from);

    // Store initial values in refs
    dragStartYRef.current = e.clientY;
    originalHeightRef.current = parseInt(blockPosition.height);
    originalTopRef.current = parseInt(blockPosition.top);

    const handleMouseMove = (e: MouseEvent) => {
      if (!resizeRef.current) return;

      const deltaY = e.clientY - dragStartYRef.current;
      let newHeight = originalHeightRef.current;
      let newTop = originalTopRef.current;

      if (from === 'bottom') {
        // Resizing from bottom - only change height
        newHeight = originalHeightRef.current + deltaY;
      } else {
        // Resizing from top - change both top position and height
        newHeight = originalHeightRef.current - deltaY;
        newTop = originalTopRef.current + deltaY;
      }

      // Enforce minimum height
      if (newHeight < MIN_BLOCK_HEIGHT) {
        if (from === 'bottom') {
          newHeight = MIN_BLOCK_HEIGHT;
        } else {
          newHeight = MIN_BLOCK_HEIGHT;
          newTop = originalTopRef.current + (originalHeightRef.current - MIN_BLOCK_HEIGHT);
        }
      }

      // Update visual preview
      resizeRef.current.style.height = `${newHeight}px`;
      if (from === 'top') {
        resizeRef.current.style.top = `${newTop}px`;
      }

      // Calculate and preview new times
      const heightDelta = newHeight - originalHeightRef.current;
      const topDelta = from === 'top' ? (newTop - originalTopRef.current) : 0;

      // Import time calculation functions
      import('@/lib/utils/timeUtils').then(({ calculateResizedTimes, PIXELS_PER_MINUTE, pixelsToTime, timeToPixels }) => {
        try {
          const minutesDelta = Math.round(heightDelta / PIXELS_PER_MINUTE);
          const startDelta = Math.round(topDelta / PIXELS_PER_MINUTE);

          let newStartTime = subject.startTime;
          let newEndTime = subject.endTime;

          if (from === 'top') {
            // Top resize: change start time
            const startDate = parse(subject.startTime, 'HH:mm', new Date());
            const newStartDate = addMinutes(startDate, startDelta);
            newStartTime = format(newStartDate, 'HH:mm');
          } else {
            // Bottom resize: change end time
            const endDate = parse(subject.endTime, 'HH:mm', new Date());
            const newEndDate = addMinutes(endDate, minutesDelta);
            newEndTime = format(newEndDate, 'HH:mm');
          }

          setPreviewTimes({ startTime: newStartTime, endTime: newEndTime });
        } catch (error) {
          console.warn('Error calculating preview times:', error);
        }
      });
    };

    const handleMouseUp = () => {
      if (!resizeRef.current) return;

      const finalHeight = parseInt(resizeRef.current.style.height);
      const finalTop = from === 'top' ? parseInt(resizeRef.current.style.top) : originalTopRef.current;

      // Calculate the actual pixel changes
      const heightChange = finalHeight - originalHeightRef.current;
      const topChange = finalTop - originalTopRef.current;

      onResizeEnd?.(subject.id, heightChange, topChange, from === 'top');

      // Reset states
      setIsResizing(null);
      setPreviewTimes(null);

      // Reset styles to let CSS handle positioning
      resizeRef.current.style.height = '';
      resizeRef.current.style.top = '';

      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [readOnly, blockPosition.height, blockPosition.top, subject.id, subject.startTime, subject.endTime, onResizeEnd]);

  const blockStyle = {
    top: blockPosition.top,
    height: blockPosition.height,
    left: blockPosition.left,
    width: blockPosition.width,
    minHeight: '50px',
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={{ ...blockStyle, ...style }}
      className={`absolute group ${readOnly || isEditing || isResizing ? 'cursor-default' : 'cursor-grab active:cursor-grabbing hover:scale-[1.02]'}
        ${blockPosition.totalLanes > 1 ? 'px-1' : 'px-2'}
        ${blockPosition.totalLanes > 1 ? 'multi-lane' : 'single-lane'}
        ${!readOnly && !isEditing && !isResizing ? 'transition-transform duration-200' : ''}
      `}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{
        opacity: subject.completed ? 0.7 : 1,
        scale: isHovered ? 1.02 : (isInHoveredGroup ? 1.01 : 1)
      }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      onMouseEnter={() => onHover(subject.id)}
      onMouseLeave={() => onHover(null)}
      whileHover={{ scale: 1.02 }}
      {...attributes}
      {...(!readOnly && !isEditing && !isResizing ? listeners : {})}
    >
      {/* Connection indicator for multi-lane blocks */}
      {blockPosition.totalLanes > 1 && (
        <div className="absolute -top-2 left-0 right-0 flex justify-center">
          <div className="w-8 h-1 bg-gray-300 rounded-full opacity-50" />
        </div>
      )}
      {/* Resize handle - Top */}
      {!readOnly && !isEditing && (
        <div
          className={`absolute -top-1 left-0 right-0 cursor-ns-resize z-20 group/resize-top
            opacity-0 hover:opacity-100 transition-all duration-200
            ${isResizing === 'top' ? 'opacity-100' : ''}`}
          onMouseDown={(e) => handleResizeStart(e, 'top')}
          style={{ height: RESIZE_HANDLE_HEIGHT }}
        >
          <div className="h-full bg-gradient-to-b from-blue-500/60 to-blue-400/30 rounded-t-lg border-t-2 border-blue-500/80 group-hover/resize-top:from-blue-600/80 group-hover/resize-top:to-blue-500/50 group-hover/resize-top:border-blue-600" />
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-blue-600 rounded-full opacity-0 group-hover/resize-top:opacity-100 transition-opacity" />
        </div>
      )}

      <div
        ref={resizeRef}
        className={`h-full rounded-xl ${subjectStyle.bg} shadow-lg
          hover:shadow-2xl transition-all duration-300 overflow-hidden
          ${subject.completed ? 'saturate-50' : ''}
          ${isDragging ? 'ring-4 ring-blue-400 ring-opacity-50' : ''}
          ${isResizing ? 'ring-2 ring-yellow-400' : ''}
          ${blockPosition.totalLanes > 1 ? 'border-2 border-white/20' : ''}
          ${blockPosition.totalLanes > 2 ? 'shadow-md' : 'shadow-lg'}
          ${isInHoveredGroup ? 'ring-2 ring-blue-300 ring-opacity-50' : ''}
        `}
      >
        {/* Drag indicator - show when draggable */}
        {!readOnly && !isEditing && !isResizing && (
          <motion.div
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-60 transition-opacity z-10 pointer-events-none"
            animate={{ opacity: isDragging ? 0 : undefined }}
          >
            <GripVertical className={`w-4 h-4 ${subjectStyle.text} drop-shadow-sm`} />
          </motion.div>
        )}

        <div className="h-full p-4 flex flex-col">
          {/* Header - Always visible */}
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2 flex-1">
              <motion.button
                whileHover={!readOnly ? { scale: 1.2 } : {}}
                whileTap={!readOnly ? { scale: 0.9 } : {}}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  if (!readOnly) {
                    onToggleComplete(subject.id, subject.completed);
                  }
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                }}
                disabled={readOnly}
                className={`w-6 h-6 rounded-lg border-2 flex-shrink-0 ${
                  subject.completed
                    ? 'bg-white/40 border-white'
                    : 'bg-white/20 border-white/60'
                } flex items-center justify-center transition-all ${
                  readOnly ? 'cursor-default opacity-75' : 'cursor-pointer'
                }`}
              >
                {subject.completed && (
                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                )}
              </motion.button>
              <h3 className={`font-bold ${subjectStyle.text} ${
                subject.completed ? 'line-through' : ''
              } ${blockPosition.totalLanes > 1 ? 'text-sm lg:text-base' : 'text-base lg:text-lg'}`}>
                {subject.subject}
              </h3>
            </div>
            <div className="flex items-center gap-1 ml-2">
              <div className={`flex items-center gap-1 ${subjectStyle.text} text-xs lg:text-sm font-medium`}>
                <Clock className="w-3 h-3" />
                <span className="whitespace-nowrap">{subject.startTime} - {subject.endTime}</span>
              </div>
              {/* Expand/Collapse button for compact blocks */}
              {isCompact && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onToggleExpanded(subject.id);
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                  }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                  }}
                  className={`${subjectStyle.text} hover:bg-white/20 rounded p-1 ml-1`}
                >
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </motion.button>
              )}
              {/* Edit button - only show if not read-only */}
              {!readOnly && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onEdit(subject.id);
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                  }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                  }}
                  className={`${subjectStyle.text} hover:bg-white/20 rounded p-1`}
                >
                  <Edit2 className="w-4 h-4" />
                </motion.button>
              )}
            </div>
          </div>

          {/* Content - Expandable */}
          <AnimatePresence>
            {(isExpanded || !isCompact) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="flex-1 overflow-hidden"
              >
                <p className={`${subjectStyle.text} text-xs lg:text-sm opacity-90 ${
                  subject.completed ? 'line-through' : ''
                }`}>
                  {subject.content}
                </p>

                {/* Reflection */}
                {subject.reflection && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 p-2 bg-white/25 backdrop-blur-sm rounded-lg"
                  >
                    <p className={`${subjectStyle.text} text-xs italic`}>
                      💭 {subject.reflection}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Resize handle - Bottom */}
      {!readOnly && !isEditing && (
        <div
          className={`absolute -bottom-1 left-0 right-0 cursor-ns-resize z-20 group/resize-bottom
            opacity-0 hover:opacity-100 transition-all duration-200
            ${isResizing === 'bottom' ? 'opacity-100' : ''}`}
          onMouseDown={(e) => handleResizeStart(e, 'bottom')}
          style={{ height: RESIZE_HANDLE_HEIGHT }}
        >
          <div className="h-full bg-gradient-to-t from-blue-500/60 to-blue-400/30 rounded-b-lg border-b-2 border-blue-500/80 group-hover/resize-bottom:from-blue-600/80 group-hover/resize-bottom:to-blue-500/50 group-hover/resize-bottom:border-blue-600" />
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-blue-600 rounded-full opacity-0 group-hover/resize-bottom:opacity-100 transition-opacity" />
        </div>
      )}

      {/* Drag preview overlay when dragging */}
      {isDragging && (
        <motion.div
          className="absolute inset-0 bg-blue-400/20 backdrop-blur-sm rounded-xl border-2 border-blue-400 border-dashed flex flex-col items-center justify-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="text-blue-600 font-semibold text-sm mb-2 flex items-center gap-2"
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Clock className="w-4 h-4" />
            시간 이동 중...
          </motion.div>
          {dragPreviewTimes && (
            <motion.div
              className="bg-blue-500/95 text-white px-4 py-2 rounded-lg text-sm font-mono shadow-lg border border-blue-300/30"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-2">
                <span className="text-blue-200">→</span>
                <span className="font-semibold">{dragPreviewTimes.startTime} - {dragPreviewTimes.endTime}</span>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Resize preview overlay when resizing */}
      {isResizing && (
        <div className="absolute inset-0 bg-yellow-400/20 backdrop-blur-sm rounded-xl border-2 border-yellow-400 border-dashed flex flex-col items-center justify-center">
          <div className="text-yellow-600 font-semibold text-sm mb-1">
            {isResizing === 'top' ? 'Resizing from top...' : 'Resizing from bottom...'}
          </div>
          {previewTimes && (
            <div className="bg-yellow-500/90 text-white px-2 py-1 rounded text-xs font-mono">
              {previewTimes.startTime} - {previewTimes.endTime}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default DraggableTimeBlock;