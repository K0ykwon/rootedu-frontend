'use client';

/**
 * Validation Results Component
 * 
 * Displays the 3 extracted text sections with highlighted feedback
 * based on validation analysis results. Each sentence is highlighted
 * according to its validation category (blue highlight, red line, etc.)
 */

import React, { useState, useMemo } from 'react';
import { ValidationType, ValidationResultsProps, TextSections, ValidationAnalysis } from '@/types/medsky';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

const VALIDATION_CONFIG = {
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

const SECTION_CONFIG = {
  creativeActivities: {
    title: '창의적 체험활동상황',
    icon: '🎨',
    description: '창의적 체험활동 관련 내용'
  },
  academicDevelopment: {
    title: '교과학습발달상황',
    icon: '📚',
    description: '교과학습 발달 관련 내용'
  },
  detailedAbilities: {
    title: '세부능력 및 특기사항',
    icon: '💡',
    description: '세부능력과 특기사항 관련 내용'
  }
} as const;

export function ValidationResults({ 
  textSections,
  extractedData, 
  validationAnalysis, 
  activeFilters, 
  onFilterChange,
  className 
}: ValidationResultsProps) {
  const [currentFilters, setCurrentFilters] = useState<ValidationType[]>(activeFilters);
  const [selectedSection, setSelectedSection] = useState<keyof typeof SECTION_CONFIG>('creativeActivities');

  /**
   * Handle filter toggle
   */
  const handleFilterToggle = (type: ValidationType) => {
    const newFilters = currentFilters.includes(type)
      ? currentFilters.filter(f => f !== type)
      : [...currentFilters, type];
    
    setCurrentFilters(newFilters);
    onFilterChange(newFilters);
  };

  /**
   * Get summary statistics
   */
  const summary = useMemo(() => {
    const stats = {
      totalFeedbacks: 0,
      byCategory: {} as Record<ValidationType, number>
    };

    Object.entries(validationAnalysis).forEach(([type, result]) => {
      const count = result.Feedbacks.length;
      stats.byCategory[type as ValidationType] = count;
      stats.totalFeedbacks += count;
    });

    return stats;
  }, [validationAnalysis]);

  /**
   * Create sentence-level feedback mapping
   */
  const feedbackMap = useMemo(() => {
    const map = new Map<string, { type: ValidationType; feedback: string }[]>();
    
    Object.entries(validationAnalysis).forEach(([type, result]) => {
      result.Feedbacks.forEach((fb: { sentence: string; feedback: string }) => {
        const sentence = fb.sentence.trim();
        if (!map.has(sentence)) {
          map.set(sentence, []);
        }
        map.get(sentence)!.push({
          type: type as ValidationType,
          feedback: fb.feedback
        });
      });
    });
    
    return map;
  }, [validationAnalysis]);

  /**
   * Render text with highlighted feedback
   */
  const renderHighlightedText = (text: string, sectionKey: keyof typeof SECTION_CONFIG) => {
    if (!text.trim()) {
      return (
        <div className="text-center py-8 text-[var(--color-text-tertiary)]">
          <p>이 섹션에 추출된 텍스트가 없습니다.</p>
        </div>
      );
    }

    // Render the text as a continuous block with inline highlighting
    const renderTextWithHighlights = (text: string) => {
      // Get all feedback sentences that should be highlighted
      const feedbackSentences = Array.from(feedbackMap.keys())
        .filter(sentence => {
          const matchingFeedbacks = feedbackMap.get(sentence) || [];
          return matchingFeedbacks.some(fb => currentFilters.includes(fb.type));
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
      let highlightedText = text;
      const highlights: Array<{
        start: number;
        end: number;
        sentence: string;
        config: any;
        feedbacks: any[];
      }> = [];

      // Find all positions of sentences that need highlighting
      feedbackSentences.forEach(sentence => {
        let searchStart = 0;
        let pos;
        while ((pos = highlightedText.indexOf(sentence, searchStart)) !== -1) {
          const matchingFeedbacks = feedbackMap.get(sentence) || [];
          const activeFeedbacks = matchingFeedbacks.filter(fb => 
            currentFilters.includes(fb.type)
          );
          
          if (activeFeedbacks.length > 0) {
            const primaryFeedback = activeFeedbacks.sort((a, b) => 
              VALIDATION_CONFIG[a.type].priority - VALIDATION_CONFIG[b.type].priority
            )[0];
            const config = VALIDATION_CONFIG[primaryFeedback.type];

            highlights.push({
              start: pos,
              end: pos + sentence.length,
              sentence,
              config,
              feedbacks: activeFeedbacks
            });
          }
          searchStart = pos + 1;
        }
      });

      // Sort highlights by start position and merge overlapping ones
      highlights.sort((a, b) => a.start - b.start);
      
      // Render text with highlights
      if (highlights.length === 0) {
        return (
          <div className="text-[var(--color-text-primary)] leading-relaxed whitespace-pre-wrap">
            {text}
          </div>
        );
      }

      const parts = [];
      let lastEnd = 0;

      highlights.forEach((highlight, index) => {
        // Add text before highlight
        if (highlight.start > lastEnd) {
          parts.push(
            <span key={`text-${index}`}>
              {text.slice(lastEnd, highlight.start)}
            </span>
          );
        }

        // Add highlighted text
        parts.push(
          <span
            key={`highlight-${index}`}
            className={`
              ${highlight.config.textClass} px-1 rounded cursor-help
              transition-all duration-200 hover:shadow-sm relative group
            `}
            title={highlight.feedbacks.map(fb => `${VALIDATION_CONFIG[fb.type as keyof typeof VALIDATION_CONFIG]?.name || fb.type}: ${fb.feedback}`).join('\n')}
          >
            {highlight.sentence}
            
            {/* Tooltip */}
            <div className="
              absolute z-10 invisible group-hover:visible opacity-0 group-hover:opacity-100
              bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg p-3 shadow-lg
              top-full left-0 mt-2 w-80 transition-all duration-200
            ">
              <div className="space-y-2">
                {highlight.feedbacks.map((fb, fbIndex) => {
                  const fbConfig = VALIDATION_CONFIG[fb.type as keyof typeof VALIDATION_CONFIG];
                  return (
                    <div key={fbIndex} className="flex items-start space-x-2">
                      <span className="text-lg">{fbConfig.icon}</span>
                      <div className="flex-1">
                        <div className="font-medium text-xs text-gray-300">
                          {fbConfig.name}
                        </div>
                        <div className="text-sm">{fb.feedback}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </span>
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
    };

    return (
      <div className="space-y-0">
        {renderTextWithHighlights(text)}
      </div>
    );
  };

  return (
    <div className={`validation-results space-y-6 ${className || ''}`}>
      {/* Summary Header */}
      <Card className="p-6" glass={false}>
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">
                분석 결과
              </h3>
              <p className="text-[var(--color-text-secondary)] mt-1">
                총 {summary.totalFeedbacks}개의 피드백이 발견되었습니다
              </p>
            </div>
            
            {/* Export Button */}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const data = JSON.stringify({ textSections, extractedData, validationAnalysis }, null, 2);
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'medsky_analysis_result.json';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
            >
              결과 다운로드
            </Button>
          </div>

          {/* Category Filters */}
          <div className="space-y-3">
            <h4 className="font-medium text-[var(--color-text-primary)]">검증 카테고리</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(VALIDATION_CONFIG).map(([type, config]) => {
                const isActive = currentFilters.includes(type as ValidationType);
                const count = summary.byCategory[type as ValidationType] || 0;
                
                return (
                  <button
                    key={type}
                    onClick={() => handleFilterToggle(type as ValidationType)}
                    className={`
                      flex items-center space-x-2 px-3 py-2 rounded-lg border-2 transition-all
                      ${isActive 
                        ? `${config.textClass} ${config.borderClass.replace('border-l-4', 'border-2')}` 
                        : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)] border-[var(--color-border-primary)] hover:bg-[var(--color-bg-quaternary)]'
                      }
                    `}
                  >
                    <span>{config.icon}</span>
                    <span className="text-sm font-medium">{config.name}</span>
                    <Badge variant="default" size="sm">
                      {count}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* Section Navigation */}
      <div className="flex space-x-1 bg-[var(--color-bg-tertiary)] p-1 rounded-lg">
        {Object.entries(SECTION_CONFIG).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setSelectedSection(key as keyof typeof SECTION_CONFIG)}
            className={`
              flex-1 px-4 py-3 text-sm font-medium rounded-md transition-colors flex items-center justify-center space-x-2
              ${selectedSection === key 
                ? 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] shadow-sm' 
                : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'
              }
            `}
          >
            <span>{config.icon}</span>
            <span>{config.title}</span>
          </button>
        ))}
      </div>

      {/* Section Content */}
      <Card className="p-6" glass={false}>
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{SECTION_CONFIG[selectedSection].icon}</span>
            <div>
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                {SECTION_CONFIG[selectedSection].title}
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {SECTION_CONFIG[selectedSection].description}
              </p>
            </div>
          </div>
          
          <div className="border-t border-[var(--color-border-primary)] pt-4">
            {renderHighlightedText(textSections[selectedSection], selectedSection)}
          </div>
        </div>
      </Card>

      {/* Legend */}
      <Card className="p-4 bg-[var(--color-bg-tertiary)]" glass={false}>
        <div className="space-y-3">
          <h4 className="font-medium text-[var(--color-text-primary)] text-sm">표시 범례</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
            {Object.entries(VALIDATION_CONFIG).map(([type, config]) => (
              <div key={type} className="flex items-center space-x-2">
                <div className={`w-4 h-4 rounded ${config.textClass.split(' ')[0]} flex items-center justify-center`}>
                  <span className="text-xs">{config.icon}</span>
                </div>
                <span className="text-[var(--color-text-secondary)]">{config.name}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-2">
            문장에 마우스를 올리면 상세한 분석 피드백을 볼 수 있습니다.
          </p>
        </div>
      </Card>
    </div>
  );
}