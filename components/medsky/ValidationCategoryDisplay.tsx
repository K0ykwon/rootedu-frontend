'use client';

/**
 * Validation Category Display Component
 * 
 * Displays validation results for a specific category with expandable feedback items.
 */

import React, { useState } from 'react';
import { ValidationType, ValidationResult } from '@/types/medsky';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

interface ValidationCategoryDisplayProps {
  type: ValidationType;
  result: ValidationResult;
  isActive: boolean;
  onToggle: (type: ValidationType) => void;
  config: {
    name: string;
    description: string;
    color: string;
    borderColor: string;
    icon: string;
    priority: number;
  };
  className?: string;
}

export function ValidationCategoryDisplay({
  type,
  result,
  isActive,
  onToggle,
  config,
  className
}: ValidationCategoryDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAllFeedbacks, setShowAllFeedbacks] = useState(false);

  const feedbackCount = result.Feedbacks.length;
  const displayedFeedbacks = showAllFeedbacks 
    ? result.Feedbacks 
    : result.Feedbacks.slice(0, 3);

  if (feedbackCount === 0) {
    return (
      <Card className={`p-4 opacity-60 ${className || ''}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-xl opacity-50">{config.icon}</span>
            <div>
              <h4 className="font-medium text-gray-600">{config.name}</h4>
              <p className="text-sm text-gray-500">{config.description}</p>
            </div>
          </div>
          <Badge variant="default">0개</Badge>
        </div>
        <div className="mt-3 text-sm text-gray-500 text-center py-2">
          이 카테고리에 해당하는 피드백이 없습니다.
        </div>
      </Card>
    );
  }

  return (
    <Card className={`${className || ''} overflow-hidden`}>
      {/* Header */}
      <div 
        className={`p-4 cursor-pointer ${config.color} border-b`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-xl">{config.icon}</span>
            <div>
              <h4 className="font-semibold">{config.name}</h4>
              <p className="text-sm opacity-80">{config.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge 
              variant="default" 
              className="bg-white bg-opacity-80"
            >
              {feedbackCount}개
            </Badge>
            <div className={`
              transform transition-transform duration-200
              ${isExpanded ? 'rotate-180' : ''}
            `}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {displayedFeedbacks.map((feedback, index) => (
            <div key={index} className="space-y-2">
              {/* Original Sentence */}
              <div className={`p-3 rounded-lg border-l-4 ${config.borderColor} bg-gray-50`}>
                <blockquote className="text-gray-900 font-medium text-sm leading-relaxed">
                  "{feedback.sentence}"
                </blockquote>
              </div>

              {/* Feedback Analysis */}
              <div className="pl-4 space-y-1">
                <div className="flex items-start space-x-2">
                  <div className={`
                    w-2 h-2 rounded-full mt-2 flex-shrink-0
                    ${config.color.includes('blue') ? 'bg-blue-500' :
                      config.color.includes('red') ? 'bg-red-500' :
                      config.color.includes('indigo') ? 'bg-indigo-500' :
                      config.color.includes('gray') ? 'bg-gray-500' :
                      'bg-orange-500'
                    }
                  `} />
                  <p className="text-sm text-gray-700 leading-relaxed">
                    <span className="font-medium">AI 분석:</span> {feedback.feedback}
                  </p>
                </div>
              </div>

              {/* Divider */}
              {index < displayedFeedbacks.length - 1 && (
                <hr className="border-gray-200 my-3" />
              )}
            </div>
          ))}

          {/* Show More Button */}
          {feedbackCount > 3 && (
            <div className="text-center pt-2 border-t border-gray-200">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowAllFeedbacks(!showAllFeedbacks)}
              >
                {showAllFeedbacks 
                  ? '간략히 보기' 
                  : `${feedbackCount - 3}개 더 보기`
                }
              </Button>
            </div>
          )}

          {/* Category Insights */}
          {feedbackCount > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <h5 className="font-medium text-blue-900 text-sm mb-1">
                💡 개선 제안
              </h5>
              <p className="text-sm text-blue-800 leading-relaxed">
                {getCategoryInsight(type, feedbackCount)}
              </p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

/**
 * Get category-specific insights and recommendations
 */
function getCategoryInsight(type: ValidationType, count: number): string {
  const insights = {
    blue_highlight: count > 5 
      ? `${count}개의 진로 관련 활동이 발견되었습니다. 이는 매우 우수한 진로 탐색 역량을 보여줍니다. 활동들 간의 연계성을 더욱 강화하면 좋겠습니다.`
      : count > 2
      ? `${count}개의 진로 관련 활동이 있습니다. 더 다양한 진로 탐색 활동을 추가하고, 각 활동의 구체적 성과를 기술하면 좋겠습니다.`
      : `진로 관련 활동이 적습니다. 희망 진로와 직접 연결되는 구체적인 탐구나 체험 활동을 추가해보세요.`,

    red_line: count > 5
      ? `${count}개의 구체적인 노력이 드러났습니다. 과정 중심의 서술이 잘 되어있어 활동의 깊이를 알 수 있습니다.`
      : count > 2
      ? `${count}개의 구체적 노력이 보입니다. 더 많은 활동에서 '어떻게', '왜' 했는지 과정을 상세히 기술하면 좋겠습니다.`
      : `구체적인 노력 과정이 부족합니다. 활동의 방법, 시도한 것들, 개선 과정 등을 자세히 서술해보세요.`,

    blue_line: count > 3
      ? `${count}개의 연계성 있는 활동이 발견되었습니다. 활동들이 유기적으로 연결되어 지속적 탐구 역량을 보여줍니다.`
      : count > 1
      ? `${count}개의 연계 활동이 있습니다. 더 많은 활동에서 이전 경험이 다음 탐구로 이어지는 과정을 보여주세요.`
      : `활동 간 연계성이 부족합니다. 한 활동에서 얻은 관심이나 의문이 다음 활동으로 어떻게 이어졌는지 설명해보세요.`,

    black_line: count > 5
      ? `${count}개의 활동에서 구체성이 부족합니다. 5W1H(언제, 어디서, 누구와, 무엇을, 왜, 어떻게)를 활용해 더 상세히 기술해야 합니다.`
      : count > 2
      ? `${count}개 활동의 구체성을 높여야 합니다. 활동 내용, 방법, 결과를 더 자세히 서술해보세요.`
      : `일부 활동이 추상적입니다. 구체적인 예시와 세부 내용을 추가하면 좋겠습니다.`,

    red_check: count > 3
      ? `${count}개의 활동이 평가하기 어려울 정도로 정보가 부족합니다. 각 활동의 목적, 과정, 성과를 반드시 추가해야 합니다.`
      : count > 1
      ? `${count}개 활동의 정보가 매우 부족합니다. 최소한의 활동 내용이라도 구체적으로 기술해주세요.`
      : `일부 활동이 너무 간단합니다. 어떤 활동을 했는지 최소한의 설명을 추가해보세요.`
  };

  return insights[type] || '추가적인 분석이 필요합니다.';
}