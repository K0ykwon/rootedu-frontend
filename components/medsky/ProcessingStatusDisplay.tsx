'use client';

/**
 * Processing Status Display Component
 * 
 * Shows real-time processing status with progress indicators and stage information.
 * Provides visual feedback for each step of the medsky analysis pipeline.
 */

import React from 'react';
import { ProcessingStatusProps } from '@/types/medsky';
import Card from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/Progress';

const STAGE_INFO = {
  uploading: {
    title: '파일 업로드',
    description: 'PDF 파일을 서버에 업로드하고 있습니다',
    icon: '📤',
    color: 'blue'
  },
  parsing: {
    title: 'PDF 분석',
    description: 'LlamaCloud를 사용하여 PDF에서 텍스트를 추출하고 있습니다',
    icon: '📄',
    color: 'blue'
  },
  extracting: {
    title: '섹션 추출',
    description: '생활기록부의 각 섹션을 분리하고 정리하고 있습니다',
    icon: '✂️',
    color: 'blue'
  },
  analyzing: {
    title: '데이터 분석',
    description: 'AI를 사용하여 구조화된 데이터로 변환하고 있습니다',
    icon: '🤖',
    color: 'purple'
  },
  validating: {
    title: '검증 분석',
    description: '진로역량, 구체성, 연계성 등을 종합 분석하고 있습니다',
    icon: '🔍',
    color: 'green'
  },
  completed: {
    title: '분석 완료',
    description: '모든 분석이 성공적으로 완료되었습니다',
    icon: '✅',
    color: 'green'
  },
  error: {
    title: '오류 발생',
    description: '처리 중 문제가 발생했습니다',
    icon: '❌',
    color: 'red'
  }
};

export function ProcessingStatusDisplay({ status, className }: ProcessingStatusProps) {
  const stageInfo = STAGE_INFO[status.stage];
  
  if (!stageInfo) {
    return null;
  }

  return (
    <Card className={`p-6 ${className || ''}`}>
      <div className="space-y-4">
        {/* Stage Header */}
        <div className="flex items-center space-x-3">
          <div className="text-2xl">{stageInfo.icon}</div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">
              {stageInfo.title}
            </h3>
            <p className="text-sm text-gray-600">
              {stageInfo.description}
            </p>
          </div>
          {status.stage !== 'completed' && status.stage !== 'error' && (
            <div className="animate-spin">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {status.stage !== 'error' && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">진행률</span>
              <span className="font-medium text-gray-900">{status.progress}%</span>
            </div>
            <ProgressBar 
              value={status.progress} 
              className="h-2"
            />
          </div>
        )}

        {/* Current Status Message */}
        <div className={`
          text-sm font-medium p-3 rounded-lg
          ${stageInfo.color === 'blue' ? 'bg-blue-50 text-blue-800' :
            stageInfo.color === 'purple' ? 'bg-purple-50 text-purple-800' :
            stageInfo.color === 'green' ? 'bg-green-50 text-green-800' :
            stageInfo.color === 'red' ? 'bg-red-50 text-red-800' :
            'bg-gray-50 text-gray-800'
          }
        `}>
          {status.message}
        </div>

        {/* Error Details */}
        {status.error && status.stage === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <h4 className="font-medium text-red-900 mb-1">오류 상세</h4>
            <p className="text-sm text-red-800">{status.error}</p>
          </div>
        )}

        {/* Processing Steps Overview */}
        {status.stage !== 'error' && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">처리 단계</h4>
            <div className="space-y-2">
              {Object.entries(STAGE_INFO).map(([stage, info]) => {
                if (stage === 'error') return null;
                
                const isCurrentStage = stage === status.stage;
                const isCompletedStage = getStageOrder(stage) < getStageOrder(status.stage);
                
                return (
                  <div
                    key={stage}
                    className={`
                      flex items-center space-x-3 p-2 rounded
                      ${isCurrentStage ? 'bg-blue-50 border border-blue-200' :
                        isCompletedStage ? 'bg-green-50' :
                        'bg-gray-50'
                      }
                    `}
                  >
                    <div className={`
                      w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
                      ${isCompletedStage ? 'bg-green-500 text-white' :
                        isCurrentStage ? 'bg-blue-500 text-white' :
                        'bg-gray-300 text-gray-600'
                      }
                    `}>
                      {isCompletedStage ? '✓' : getStageOrder(stage) + 1}
                    </div>
                    <div className="flex-1">
                      <span className={`
                        text-sm font-medium
                        ${isCurrentStage ? 'text-blue-900' :
                          isCompletedStage ? 'text-green-900' :
                          'text-gray-600'
                        }
                      `}>
                        {info.title}
                      </span>
                    </div>
                    {isCurrentStage && (
                      <div className="animate-spin">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                      </div>
                    )}
                    {isCompletedStage && (
                      <div className="text-green-500">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Estimated Time */}
        {status.stage !== 'completed' && status.stage !== 'error' && (
          <div className="text-xs text-gray-500 text-center">
            예상 소요 시간: {getEstimatedTime(status.stage)}
          </div>
        )}
      </div>
    </Card>
  );
}

/**
 * Get stage order for progress calculation
 */
function getStageOrder(stage: string): number {
  const order = {
    uploading: 0,
    parsing: 1,
    extracting: 2,
    analyzing: 3,
    validating: 4,
    completed: 5,
    error: -1
  };
  return order[stage as keyof typeof order] ?? -1;
}

/**
 * Get estimated remaining time for current stage
 */
function getEstimatedTime(stage: string): string {
  const estimates = {
    uploading: '10초',
    parsing: '30초 - 1분',
    extracting: '5초',
    analyzing: '1분 - 2분',
    validating: '2분 - 3분',
    completed: '완료',
    error: '중단됨'
  };
  return estimates[stage as keyof typeof estimates] ?? '알 수 없음';
}