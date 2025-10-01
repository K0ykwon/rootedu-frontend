/**
 * Text Highlighter Utility
 *
 * Shared utility for highlighting text with validation feedback
 */

import React from 'react';
import { ValidationType } from '@/types/medsky';
import { findSimilarTextPositions } from './textMatcher';
import { FeedbackPopover } from '@/components/medsky/FeedbackPopover';

export const VALIDATION_CONFIG = {
  blue_highlight: {
    name: '진로 역량 강조',
    description: '진로와 직접 연결된 구체적 활동과 탐구',
    textClass: 'bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100',
    borderClass: 'border-l-4 border-blue-500 dark:border-blue-400',
    icon: '🎯',
    priority: 1
  },
  red_line: {
    name: '구체적 노력·깊이',
    description: '과정과 방법이 구체적으로 드러난 노력',
    textClass: 'border-b-2 border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-100',
    borderClass: 'border-l-4 border-red-500 dark:border-red-400',
    icon: '🔥',
    priority: 2
  },
  blue_line: {
    name: '연계·후속 탐구',
    description: '활동 간 연결성과 지속적 탐구',
    textClass: 'border-b-2 border-indigo-500 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-900 dark:text-indigo-100',
    borderClass: 'border-l-4 border-indigo-500 dark:border-indigo-400',
    icon: '🔗',
    priority: 3
  },
  black_line: {
    name: '구체성 부족',
    description: '활동 내용이나 과정이 불분명한 서술',
    textClass: 'border-b-2 border-gray-700 dark:border-gray-300 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100',
    borderClass: 'border-l-4 border-gray-700 dark:border-gray-300',
    icon: '⚠️',
    priority: 4
  },
  red_check: {
    name: '평가 불가',
    description: '정보 부족으로 평가가 어려운 내용',
    textClass: 'bg-orange-200 text-orange-900 dark:bg-orange-800 dark:text-orange-100',
    borderClass: 'border-l-4 border-orange-500 dark:border-orange-400',
    icon: '❌',
    priority: 5
  }
} as const;

export interface FeedbackItem {
  type: ValidationType;
  feedback: string;
}

export type FeedbackMap = Map<string, FeedbackItem[]>;

/**
 * Render text with highlighted validation feedback
 */
export function renderHighlightedText(
  text: string,
  feedbackMap: FeedbackMap,
  activeFilters: ValidationType[]
): React.JSX.Element {
  if (!text.trim()) {
    return (
      <div className="text-center py-8 text-[var(--color-text-tertiary)]">
        <p>내용이 없습니다.</p>
      </div>
    );
  }

  // Get all feedback sentences that should be highlighted
  const feedbackSentences = Array.from(feedbackMap.keys())
    .filter(sentence => {
      const matchingFeedbacks = feedbackMap.get(sentence) || [];
      return matchingFeedbacks.some(fb => activeFilters.includes(fb.type));
    })
    .sort((a, b) => b.length - a.length); // Sort by length desc to match longer sentences first

  if (feedbackSentences.length === 0) {
    // No highlights needed, render as plain text
    return (
      <div className="text-[var(--color-text-primary)] leading-relaxed whitespace-pre-wrap">
        {text}
      </div>
    );
  }

  // Build highlighted text
  const highlights: Array<{
    start: number;
    end: number;
    sentence: string;
    config: any;
    feedbacks: any[];
  }> = [];

  // Find all positions of sentences that need highlighting using fuzzy matching
  feedbackSentences.forEach(sentence => {
    // Use fuzzy matching to find similar text (threshold: 0.45 = 45% similarity)
    const matches = findSimilarTextPositions(text, sentence, 0.45);

    matches.forEach(match => {
      const matchingFeedbacks = feedbackMap.get(sentence) || [];
      const activeFeedbacks = matchingFeedbacks.filter(fb =>
        activeFilters.includes(fb.type)
      );

      if (activeFeedbacks.length > 0) {
        const primaryFeedback = activeFeedbacks.sort((a, b) =>
          VALIDATION_CONFIG[a.type].priority - VALIDATION_CONFIG[b.type].priority
        )[0];
        const config = VALIDATION_CONFIG[primaryFeedback.type];

        highlights.push({
          start: match.start,
          end: match.end,
          sentence: match.matchedText,
          config,
          feedbacks: activeFeedbacks
        });
      }
    });
  });

  // Sort highlights by start position
  highlights.sort((a, b) => a.start - b.start);

  // Remove overlapping highlights and deduplicate by feedback content
  const nonOverlappingHighlights = [];
  let lastEndPos = -1;
  const usedFeedbackContent = new Set<string>(); // Track used feedback to avoid duplicates

  for (const highlight of highlights) {
    // Check if this highlight's feedbacks are already used
    const feedbackKey = highlight.feedbacks.map(f => `${f.type}:${f.feedback}`).join('|');

    // Skip if exact same feedbacks were already shown recently (within 100 characters)
    const isNearDuplicate = highlight.start - lastEndPos < 100 && usedFeedbackContent.has(feedbackKey);

    if (isNearDuplicate) {
      continue; // Skip this duplicate feedback
    }

    // Skip if this highlight overlaps with the previous one
    if (highlight.start >= lastEndPos) {
      nonOverlappingHighlights.push(highlight);
      lastEndPos = highlight.end;
      usedFeedbackContent.add(feedbackKey);
    } else {
      // Overlapping - merge feedbacks if they overlap significantly
      const overlap = lastEndPos - highlight.start;
      const overlapRatio = overlap / (highlight.end - highlight.start);

      if (overlapRatio < 0.5) {
        // Less than 50% overlap, add it anyway if not duplicate feedback
        nonOverlappingHighlights.push(highlight);
        lastEndPos = Math.max(lastEndPos, highlight.end);
        usedFeedbackContent.add(feedbackKey);
      } else {
        // Significant overlap - merge feedbacks into the previous highlight
        const prevHighlight = nonOverlappingHighlights[nonOverlappingHighlights.length - 1];
        if (prevHighlight) {
          // Add unique feedbacks to the previous highlight
          const existingFeedbackTypes = new Set(prevHighlight.feedbacks.map(f => f.type));
          for (const feedback of highlight.feedbacks) {
            if (!existingFeedbackTypes.has(feedback.type)) {
              prevHighlight.feedbacks.push(feedback);
            }
          }
        }
      }
    }
  }

  // Render text with highlights
  if (nonOverlappingHighlights.length === 0) {
    return (
      <div className="text-[var(--color-text-primary)] leading-relaxed whitespace-pre-wrap">
        {text}
      </div>
    );
  }

  const parts = [];
  let lastEnd = 0;

  nonOverlappingHighlights.forEach((highlight, index) => {
    // Add text before highlight
    if (highlight.start > lastEnd) {
      parts.push(
        <span key={`text-${index}`}>
          {text.slice(lastEnd, highlight.start)}
        </span>
      );
    }

    // Add highlighted text with popover
    parts.push(
      <FeedbackPopover
        key={`highlight-${index}`}
        feedbacks={highlight.feedbacks}
        highlightedText={highlight.sentence}
      >
        <span
          className={`
            ${highlight.config.textClass} px-1.5 py-0.5 rounded cursor-pointer
            transition-all duration-200 hover:shadow-lg hover:brightness-95
            border-b-2 border-transparent hover:border-current
            relative inline-flex items-center gap-1
          `}
        >
          {highlight.sentence}
          {highlight.feedbacks.length > 0 && (
            <span className="inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold bg-white dark:bg-gray-900 rounded-full border border-current opacity-75 hover:opacity-100">
              {highlight.feedbacks.length}
            </span>
          )}
        </span>
      </FeedbackPopover>
    );

    lastEnd = highlight.end;
  });

  // Add remaining text
  if (lastEnd < text.length) {
    parts.push(
      <span key="text-end">
        {text.slice(lastEnd)}
      </span>
    );
  }

  return (
    <div className="text-[var(--color-text-primary)] leading-relaxed whitespace-pre-wrap">
      {parts}
    </div>
  );
}
