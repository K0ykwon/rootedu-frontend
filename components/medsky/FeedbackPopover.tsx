'use client';

/**
 * Feedback Popover Component
 *
 * Displays validation feedback in a portal positioned below the highlighted text
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ValidationType } from '@/types/medsky';
import { VALIDATION_CONFIG } from '@/lib/medsky/textHighlighter';

interface FeedbackItem {
  type: ValidationType;
  feedback: string;
}

interface FeedbackPopoverProps {
  feedbacks: FeedbackItem[];
  children: React.ReactNode;
  highlightedText: string;
}

type PopoverPlacement = 'top' | 'bottom';

interface PopoverPosition {
  top: number;
  left: number;
  width: number;
  placement: PopoverPlacement;
}

export function FeedbackPopover({ feedbacks, children, highlightedText }: FeedbackPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<PopoverPosition>({
    top: 0,
    left: 0,
    width: 320,
    placement: 'bottom'
  });
  const triggerRef = useRef<HTMLSpanElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Debug: Log feedbacks to ensure they're being passed
  useEffect(() => {
    if (feedbacks && feedbacks.length > 0) {
      console.log('FeedbackPopover initialized with feedbacks:', feedbacks.length, 'for text:', highlightedText.substring(0, 30));
    }
  }, [feedbacks, highlightedText]);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const safeMargin = 16;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const maxWidth = Math.min(600, viewportWidth - safeMargin * 2);
    const nextWidth = Math.min(Math.max(rect.width, 300), maxWidth);

    let left = rect.left + rect.width / 2 - nextWidth / 2;
    if (left < safeMargin) {
      left = safeMargin;
    }
    if (left + nextWidth > viewportWidth - safeMargin) {
      left = viewportWidth - nextWidth - safeMargin;
    }

    let top = rect.bottom + 8;
    let placement: PopoverPlacement = 'bottom';

    const popoverHeight = popoverRef.current?.offsetHeight ?? 0;
    const wouldOverflowBottom = top + popoverHeight > viewportHeight - safeMargin;
    if (popoverHeight && wouldOverflowBottom) {
      const spaceAbove = rect.top - safeMargin;
      const desiredTopAbove = rect.top - popoverHeight - 8;
      if (desiredTopAbove >= safeMargin || spaceAbove > popoverHeight) {
        top = Math.max(desiredTopAbove, safeMargin);
        placement = 'top';
      } else {
        top = Math.max(safeMargin, viewportHeight - popoverHeight - safeMargin);
      }
    }

    setPosition(prev => {
      if (
        prev.top === top &&
        prev.left === left &&
        prev.width === nextWidth &&
        prev.placement === placement
      ) {
        return prev;
      }
      return { top, left, width: nextWidth, placement };
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    updatePosition();

    const handleReposition = () => updatePosition();
    window.addEventListener('scroll', handleReposition, true);
    window.addEventListener('resize', handleReposition);

    return () => {
      window.removeEventListener('scroll', handleReposition, true);
      window.removeEventListener('resize', handleReposition);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;

    const raf = requestAnimationFrame(() => {
      updatePosition();
    });

    return () => cancelAnimationFrame(raf);
  }, [isOpen, feedbacks.length, updatePosition]);

  const handleMouseEnter = () => {
    updatePosition();
    console.log('FeedbackPopover: Mouse entered, opening popover', { highlightedText: highlightedText.substring(0, 50) });
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    console.log('FeedbackPopover: Mouse left, closing popover');
    setIsOpen(false);
  };

  const handleClick = () => {
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen(prev => !prev);
  };

  const arrowPositionStyle =
    position.placement === 'top'
      ? { bottom: '-0.5rem' }
      : { top: '-0.5rem' };

  const arrowBorderClass =
    position.placement === 'top'
      ? 'border-r-2 border-b-2'
      : 'border-l-2 border-t-2';

  const animationOffset = position.placement === 'top' ? 5 : -5;

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className="cursor-pointer inline-block relative"
      >
        {children}
      </span>

      {/* Portal for feedback display */}
      {typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={popoverRef}
              initial={{ opacity: 0, scale: 0.95, y: animationOffset }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: animationOffset }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="fixed z-[99999] pointer-events-auto"
              style={{
                top: position.top,
                left: position.left,
                width: position.width
              }}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border-2 border-gray-200 dark:border-gray-700">
              {/* Arrow */}
              <div
                className={`absolute left-6 w-4 h-4 bg-white dark:bg-gray-800 ${arrowBorderClass} border-gray-200 dark:border-gray-700 rotate-45`}
                style={arrowPositionStyle}
              />

              {/* Header */}
              <div className="relative bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 px-3 py-2 border-b border-gray-200 dark:border-gray-600 rounded-t-lg">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">선택된 텍스트</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">{highlightedText}</p>
              </div>

              {/* Feedback List */}
              <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
                {feedbacks.map((fb, idx) => {
                  const config = VALIDATION_CONFIG[fb.type];
                  return (
                    <div
                      key={idx}
                      className="bg-gray-50 dark:bg-gray-700/50 rounded-md p-2.5 border-l-4"
                      style={{
                        borderLeftColor: config.textClass.includes('blue-') ? '#3B82F6' :
                                         config.textClass.includes('red-') ? '#EF4444' :
                                         config.textClass.includes('indigo-') ? '#6366F1' :
                                         config.textClass.includes('orange-') ? '#F97316' :
                                         '#6B7280'
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-lg flex-shrink-0">{config.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-1">
                            {config.name}
                          </div>
                          <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                            {fb.feedback}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="bg-gray-50 dark:bg-gray-700/50 px-3 py-1.5 border-t border-gray-200 dark:border-gray-600 rounded-b-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  총 {feedbacks.length}개의 피드백
                </p>
              </div>
            </div>
          </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
