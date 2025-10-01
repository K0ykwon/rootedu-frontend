'use client';

import React, { useState, useMemo } from 'react';
import { DetailedAbilities, ValidationAnalysis, ValidationType } from '@/types/medsky';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface EnhancedDetailedAbilitiesProps {
  detailedAbilities: DetailedAbilities | undefined;
  validationAnalysis: ValidationAnalysis;
  activeFilters: ValidationType[];
  className?: string;
}

const SUBJECT_ICONS: Record<string, string> = {
  '국어': '📚',
  '수학': '🔢',
  '영어': '🌍',
  '한국사': '🏛️',
  '통합사회': '🌏',
  '통합과학': '🔬',
  '과학탐구실험': '🧪',
  '체육': '⚽',
  '음악': '🎵',
  '미술': '🎨',
  '기술': '⚙️',
  '정보': '💻',
  '스페인어': '🇪🇸',
  '중국어': '🇨🇳',
  '일본어': '🇯🇵',
  '프랑스어': '🇫🇷',
};

const SUBJECT_COLORS: Record<string, string> = {
  '국어': 'bg-blue-50 border-blue-200',
  '수학': 'bg-purple-50 border-purple-200',
  '영어': 'bg-green-50 border-green-200',
  '한국사': 'bg-amber-50 border-amber-200',
  '통합사회': 'bg-orange-50 border-orange-200',
  '통합과학': 'bg-cyan-50 border-cyan-200',
  '과학탐구실험': 'bg-teal-50 border-teal-200',
  '체육': 'bg-red-50 border-red-200',
  '음악': 'bg-pink-50 border-pink-200',
  '미술': 'bg-indigo-50 border-indigo-200',
  '기술': 'bg-gray-50 border-gray-200',
  '정보': 'bg-slate-50 border-slate-200',
};

const VALIDATION_CONFIG = {
  blue_highlight: {
    name: '진로 역량 강조',
    textClass: 'bg-blue-200 text-blue-900',
    icon: '🎯',
  },
  red_line: {
    name: '구체적 노력·깊이',
    textClass: 'border-b-2 border-red-500 bg-red-50 text-red-900',
    icon: '🔥',
  },
  blue_line: {
    name: '연계·후속 탐구',
    textClass: 'border-b-2 border-indigo-500 bg-indigo-50 text-indigo-900',
    icon: '🔗',
  },
  black_line: {
    name: '구체성 부족',
    textClass: 'border-b-2 border-gray-700 bg-gray-100 text-gray-900',
    icon: '⚠️',
  },
  red_check: {
    name: '평가 불가',
    textClass: 'bg-orange-200 text-orange-900',
    icon: '❌',
  },
};

export function EnhancedDetailedAbilities({
  detailedAbilities,
  validationAnalysis,
  activeFilters,
  className,
}: EnhancedDetailedAbilitiesProps) {
  const [expandedSubjects, setExpandedSubjects] = useState<Set<number>>(new Set([0, 1, 2]));

  // Create feedback map for matching validation to subjects
  const feedbackMap = useMemo(() => {
    const map = new Map<string, Array<{ type: ValidationType; feedback: string; sentence: string }>>();

    Object.entries(validationAnalysis).forEach(([type, result]) => {
      result.Feedbacks.forEach((fb: { sentence: string; feedback: string }) => {
        const sentence = fb.sentence.trim();
        if (!map.has(sentence)) {
          map.set(sentence, []);
        }
        map.get(sentence)!.push({
          type: type as ValidationType,
          feedback: fb.feedback,
          sentence: sentence,
        });
      });
    });

    return map;
  }, [validationAnalysis]);

  // Match validation feedback to subjects
  const getSubjectValidations = (subjectContent: string) => {
    const validations: { [key in ValidationType]?: number } = {};

    feedbackMap.forEach((feedbacks) => {
      feedbacks.forEach((fb) => {
        if (subjectContent.includes(fb.sentence) && activeFilters.includes(fb.type)) {
          validations[fb.type] = (validations[fb.type] || 0) + 1;
        }
      });
    });

    return validations;
  };

  // Render text with highlights
  const renderHighlightedText = (text: string) => {
    const sentences = Array.from(feedbackMap.keys()).filter(sentence =>
      text.includes(sentence) &&
      feedbackMap.get(sentence)?.some(fb => activeFilters.includes(fb.type))
    );

    if (sentences.length === 0) {
      return <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">{text}</div>;
    }

    let highlightedText = text;
    const highlights: Array<{
      start: number;
      end: number;
      sentence: string;
      type: ValidationType;
      feedback: string;
    }> = [];

    sentences.forEach(sentence => {
      const pos = text.indexOf(sentence);
      if (pos !== -1) {
        const feedbacks = feedbackMap.get(sentence) || [];
        const activeFeedback = feedbacks.find(fb => activeFilters.includes(fb.type));
        if (activeFeedback) {
          highlights.push({
            start: pos,
            end: pos + sentence.length,
            sentence,
            type: activeFeedback.type,
            feedback: activeFeedback.feedback,
          });
        }
      }
    });

    highlights.sort((a, b) => a.start - b.start);

    const parts = [];
    let lastEnd = 0;

    highlights.forEach((highlight, index) => {
      if (highlight.start > lastEnd) {
        parts.push(
          <span key={`text-${index}`}>
            {text.slice(lastEnd, highlight.start)}
          </span>
        );
      }

      const config = VALIDATION_CONFIG[highlight.type];
      parts.push(
        <span
          key={`highlight-${index}`}
          className={`${config.textClass} px-1 rounded cursor-help transition-all duration-200 hover:shadow-sm relative group`}
          title={`${config.name}: ${highlight.feedback}`}
        >
          {highlight.sentence}

          {/* Tooltip */}
          <div className="absolute z-10 invisible group-hover:visible opacity-0 group-hover:opacity-100 bg-gray-900 text-white text-sm rounded-lg p-3 shadow-lg top-full left-0 mt-2 w-80 transition-all duration-200">
            <div className="flex items-start space-x-2">
              <span className="text-lg">{config.icon}</span>
              <div className="flex-1">
                <div className="font-medium text-xs text-gray-300">{config.name}</div>
                <div className="text-sm">{highlight.feedback}</div>
              </div>
            </div>
          </div>
        </span>
      );

      lastEnd = highlight.end;
    });

    if (lastEnd < text.length) {
      parts.push(<span key="text-end">{text.slice(lastEnd)}</span>);
    }

    return <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">{parts}</div>;
  };

  const toggleSubject = (index: number) => {
    const newExpanded = new Set(expandedSubjects);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSubjects(newExpanded);
  };

  const getSubjectIcon = (subject: string): string => {
    // Check for exact match first
    if (SUBJECT_ICONS[subject]) {
      return SUBJECT_ICONS[subject];
    }

    // Check for partial matches
    for (const [key, icon] of Object.entries(SUBJECT_ICONS)) {
      if (subject.includes(key)) {
        return icon;
      }
    }

    // Default icon
    return '📖';
  };

  const getSubjectColor = (subject: string): string => {
    // Check for exact match first
    if (SUBJECT_COLORS[subject]) {
      return SUBJECT_COLORS[subject];
    }

    // Check for partial matches
    for (const [key, color] of Object.entries(SUBJECT_COLORS)) {
      if (subject.includes(key)) {
        return color;
      }
    }

    // Default color
    return 'bg-gray-50 border-gray-200';
  };

  if (!detailedAbilities || !detailedAbilities.세부특기사항 || detailedAbilities.세부특기사항.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-500">세부능력 및 특기사항 데이터가 없습니다.</p>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className || ''}`}>
      {detailedAbilities.세부특기사항.map((item, index) => {
        const validations = getSubjectValidations(item.특기사항);
        const isExpanded = expandedSubjects.has(index);
        const subjectColor = getSubjectColor(item.과목);
        const subjectIcon = getSubjectIcon(item.과목);

        return (
          <Card key={index} className={`overflow-hidden border-2 ${subjectColor}`}>
            {/* Subject Header */}
            <div
              className="p-4 cursor-pointer hover:bg-opacity-70 transition-colors"
              onClick={() => toggleSubject(index)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{subjectIcon}</span>
                  <h3 className="text-lg font-semibold text-gray-900">{item.과목}</h3>
                </div>
                <div className="flex items-center space-x-3">
                  {/* Validation count badges */}
                  <div className="flex space-x-2">
                    {Object.entries(validations).map(([type, count]) => {
                      const config = VALIDATION_CONFIG[type as ValidationType];
                      return (
                        <div
                          key={type}
                          className="flex items-center space-x-1 px-2 py-1 rounded-full bg-white bg-opacity-80 shadow-sm"
                        >
                          <span className="text-sm">{config.icon}</span>
                          <span className="text-xs font-medium">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                  {/* Expand/Collapse icon */}
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  )}
                </div>
              </div>
            </div>

            {/* Subject Content */}
            {isExpanded && (
              <div className="px-4 pb-4 bg-white bg-opacity-50">
                <div className="p-4 bg-white rounded-lg shadow-sm">
                  {renderHighlightedText(item.특기사항)}
                </div>

                {/* Validation Summary */}
                {Object.keys(validations).length > 0 && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">평가 요약</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {Object.entries(validations).map(([type, count]) => {
                        const config = VALIDATION_CONFIG[type as ValidationType];
                        return (
                          <div key={type} className="flex items-center space-x-2 text-sm">
                            <span>{config.icon}</span>
                            <span className="text-gray-600">{config.name}:</span>
                            <span className="font-medium">{count}개</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}