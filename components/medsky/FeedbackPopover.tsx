'use client';

/**
 * Feedback Popover Component
 *
 * Displays validation feedback in a portal positioned below the highlighted text
 */

import React, { useState, useRef, useEffect } from 'react';
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

export function FeedbackPopover({ feedbacks, children, highlightedText }: FeedbackPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: Math.max(rect.width, 300)
      });
    }
  }, [isOpen]);

  const handleMouseEnter = () => {
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    setIsOpen(false);
  };

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer inline-block relative"
      >
        {children}
      </span>

      {/* Portal for feedback display */}
      {typeof window !== 'undefined' && isOpen && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed z-[9999]"
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
              minWidth: '300px',
              maxWidth: '600px',
              width: `${position.width}px`
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border-2 border-gray-200 dark:border-gray-700">
              {/* Arrow */}
              <div className="absolute -top-2 left-4 w-4 h-4 bg-white dark:bg-gray-800 border-l-2 border-t-2 border-gray-200 dark:border-gray-700 rotate-45" />

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
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
