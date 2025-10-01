'use client';

/**
 * Validation Results Component
 *
 * Displays the extracted sections with highlighted feedback
 * based on validation analysis results. Uses structured data
 * to render individual subject and activity cards.
 */

import React, { useState, useMemo } from 'react';
import { ValidationType, ValidationResultsProps, TextSections, ValidationAnalysis } from '@/types/medsky';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { SubjectCard } from './SubjectCard';
import { ActivityCard } from './ActivityCard';
import { VALIDATION_CONFIG } from '@/lib/medsky/textHighlighter';

const SECTION_CONFIG = {
  creativeActivities: {
    title: '창의적 체험활동상황',
    icon: '🎨',
    description: '창의적 체험활동 관련 내용'
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
      <div className="space-y-4">
        <div className="flex items-center space-x-3 px-2">
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

        <div className="space-y-3">
          {selectedSection === 'detailedAbilities' && (
            <>
              {extractedData?.detailedAbilities?.세부특기사항 && extractedData.detailedAbilities.세부특기사항.length > 0 ? (
                extractedData.detailedAbilities.세부특기사항.map((item, index) => (
                  <SubjectCard
                    key={index}
                    subject={item.과목}
                    content={item.특기사항}
                    feedbackMap={feedbackMap}
                    activeFilters={currentFilters}
                    defaultExpanded={index === 0}
                  />
                ))
              ) : (
                <Card className="p-8 text-center border-gray-200 bg-gray-50" glass={false}>
                  <div className="text-gray-600">
                    <h4 className="font-medium mb-2">세부능력 및 특기사항 데이터가 없습니다</h4>
                    <p className="text-sm">추출된 데이터를 찾을 수 없습니다.</p>
                  </div>
                </Card>
              )}
            </>
          )}

          {selectedSection === 'creativeActivities' && (
            <>
              {extractedData?.creativeActivities?.창의적체험활동상황 && extractedData.creativeActivities.창의적체험활동상황.length > 0 ? (
                extractedData.creativeActivities.창의적체험활동상황.map((item, index) => (
                  <ActivityCard
                    key={index}
                    domain={item.영역}
                    hours={item.시간}
                    content={item.특기사항}
                    feedbackMap={feedbackMap}
                    activeFilters={currentFilters}
                    defaultExpanded={index === 0}
                  />
                ))
              ) : (
                <Card className="p-8 text-center border-gray-200 bg-gray-50" glass={false}>
                  <div className="text-gray-600">
                    <h4 className="font-medium mb-2">창의적 체험활동 데이터가 없습니다</h4>
                    <p className="text-sm">추출된 데이터를 찾을 수 없습니다.</p>
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      </div>

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