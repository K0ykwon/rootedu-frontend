'use client';

/**
 * Subject Card Component
 *
 * Displays individual subject from DetailedAbility with validation highlights
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ValidationType } from '@/types/medsky';
import { getSubjectConfig } from '@/lib/medsky/subjectConfig';
import { renderHighlightedText, FeedbackMap } from '@/lib/medsky/textHighlighter';
import Card from '@/components/ui/Card';

interface SubjectCardProps {
  subject: string;
  content: string;
  feedbackMap: FeedbackMap;
  activeFilters: ValidationType[];
  defaultExpanded?: boolean;
}

export function SubjectCard({
  subject,
  content,
  feedbackMap,
  activeFilters,
  defaultExpanded = false
}: SubjectCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const config = getSubjectConfig(subject);

  return (
    <Card className="overflow-hidden border-2 hover:shadow-md transition-all duration-200" glass={false}>
      {/* Header */}
      <div
        className={`
          ${config.color} ${config.borderColor} border-b-2
          p-4 cursor-pointer flex items-center justify-between
          hover:opacity-90 transition-opacity
        `}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{config.icon}</span>
          <div>
            <h3 className={`text-lg font-bold ${config.textColor}`}>
              {subject}
            </h3>
            <p className="text-sm text-gray-600">
              세부능력 및 특기사항
            </p>
          </div>
        </div>

        <button className="p-2 hover:bg-white/50 rounded-lg transition-colors">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          )}
        </button>
      </div>

      {/* Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-6 bg-white">
              {renderHighlightedText(content, feedbackMap, activeFilters)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
