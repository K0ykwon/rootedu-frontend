'use client';

/**
 * Activity Card Component
 *
 * Displays individual creative activity with validation highlights
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { ValidationType } from '@/types/medsky';
import { getActivityConfig } from '@/lib/medsky/subjectConfig';
import { renderHighlightedText, FeedbackMap } from '@/lib/medsky/textHighlighter';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

interface ActivityCardProps {
  domain: string;
  hours: number;
  content: string;
  feedbackMap: FeedbackMap;
  activeFilters: ValidationType[];
  defaultExpanded?: boolean;
}

export function ActivityCard({
  domain,
  hours,
  content,
  feedbackMap,
  activeFilters,
  defaultExpanded = false
}: ActivityCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const config = getActivityConfig(domain);

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
        <div className="flex items-center space-x-3 flex-1">
          <span className="text-2xl">{config.icon}</span>
          <div className="flex-1">
            <h3 className={`text-lg font-bold ${config.textColor}`}>
              {domain}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              <Clock className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-600">{hours}시간</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Badge variant="default" className="bg-white bg-opacity-80">
            {hours}h
          </Badge>
          <button className="p-2 hover:bg-white/50 rounded-lg transition-colors">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>
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
