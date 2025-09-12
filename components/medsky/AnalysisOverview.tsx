'use client';

/**
 * Analysis Overview Component
 * 
 * Executive summary dashboard showing key statistics, scores, and insights
 * from the structured analysis data. Provides a high-level view of the
 * student's performance across different areas.
 */

import React, { useMemo } from 'react';
import { ExtractedData, ValidationAnalysis } from '@/types/medsky';
import { calculateAnalysisStatistics, AnalysisStatistics } from '@/lib/medsky/analysisUtils';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

interface AnalysisOverviewProps {
  extractedData: ExtractedData;
  validationAnalysis: ValidationAnalysis;
  className?: string;
}

export function AnalysisOverview({ 
  extractedData, 
  validationAnalysis, 
  className 
}: AnalysisOverviewProps) {
  // Calculate comprehensive statistics
  const stats = useMemo(() => 
    calculateAnalysisStatistics(extractedData, validationAnalysis),
    [extractedData, validationAnalysis]
  );

  return (
    <div className={`analysis-overview space-y-6 ${className || ''}`}>
      {/* Overall Score Card */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20" glass={false}>
        <div className="text-center space-y-4">
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-[var(--color-text-primary)]">
              종합 분석 점수
            </h3>
            <div className="flex items-center justify-center">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">
                    {stats.validationScore}
                  </span>
                </div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                  <Badge variant="default" size="sm" className="bg-white/90 text-blue-700">
                    /100
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-6">
            <ScoreGrade score={stats.validationScore} />
            <OverallAssessment stats={stats} />
          </div>
        </div>
      </Card>

      {/* Quick Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon="🎨"
          title="창의적 체험활동"
          value={stats.totalActivities}
          unit="개"
          subtitle={`총 ${stats.totalActivityHours}시간`}
        />
        
        <StatCard
          icon="📚"
          title="교과목 수"
          value={stats.totalSubjects}
          unit="과목"
          subtitle={`${stats.subjectCount}개 세특`}
        />
        
        <StatCard
          icon="🏆"
          title="활동 영역"
          value={stats.activityDomains.length}
          unit="개"
          subtitle={stats.activityDomains.join(', ')}
        />
        
        <StatCard
          icon="📊"
          title="검증 피드백"
          value={Object.values(stats.categoryScores).reduce((sum, score, index) => {
            // Count positive feedback (high scores in positive categories)
            const categories = ['blue_highlight', 'red_line', 'blue_line', 'black_line', 'red_check'];
            const category = categories[index];
            if (['blue_highlight', 'red_line', 'blue_line'].includes(category) && score > 20) {
              return sum + 1;
            }
            return sum;
          }, 0)}
          unit="개"
          subtitle="강점 영역"
        />
      </div>

      {/* Category Performance */}
      <Card className="p-6" glass={false}>
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
          영역별 평가
        </h3>
        
        <div className="space-y-4">
          <CategoryScore
            name="진로 역량 강조"
            description="진로와 연결된 구체적 활동과 탐구"
            score={stats.categoryScores.blue_highlight || 0}
            color="blue"
            icon="🎯"
          />
          
          <CategoryScore
            name="구체적 노력·깊이"
            description="과정과 방법이 구체적으로 드러난 노력"
            score={stats.categoryScores.red_line || 0}
            color="red"
            icon="🔥"
          />
          
          <CategoryScore
            name="연계·후속 탐구"
            description="활동 간 연결성과 지속적 탐구"
            score={stats.categoryScores.blue_line || 0}
            color="indigo"
            icon="🔗"
          />
        </div>
      </Card>

      {/* Strengths and Improvements */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6 bg-green-50 dark:bg-green-900/20" glass={false}>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">💪</span>
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
                주요 강점 영역
              </h3>
            </div>
            
            <div className="space-y-2">
              {stats.strengthAreas.length > 0 ? (
                stats.strengthAreas.map((area, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-green-700 dark:text-green-300 text-sm">
                      {area}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-green-600 dark:text-green-400 text-sm">
                  추가 분석이 필요합니다.
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-yellow-50 dark:bg-yellow-900/20" glass={false}>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🎯</span>
              <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">
                개선 포인트
              </h3>
            </div>
            
            <div className="space-y-2">
              {stats.improvementAreas.length > 0 ? (
                stats.improvementAreas.map((area, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    <span className="text-yellow-700 dark:text-yellow-300 text-sm">
                      {area}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-yellow-600 dark:text-yellow-400 text-sm">
                  현재 수준에서 잘 관리되고 있습니다.
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Activity Domain Distribution */}
      {stats.activityDomains.length > 0 && (
        <Card className="p-6" glass={false}>
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
            창의적 체험활동 영역 분포
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.activityDomains.map((domain, index) => {
              const colors = ['bg-blue-100 text-blue-800', 'bg-green-100 text-green-800', 'bg-purple-100 text-purple-800', 'bg-orange-100 text-orange-800'];
              return (
                <div key={domain} className={`p-3 rounded-lg ${colors[index % colors.length]}`}>
                  <div className="text-center">
                    <div className="text-sm font-medium">{domain}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

// ===========================
// Sub-Components
// ===========================

interface StatCardProps {
  icon: string;
  title: string;
  value: number;
  unit: string;
  subtitle: string;
}

function StatCard({ icon, title, value, unit, subtitle }: StatCardProps) {
  return (
    <Card className="p-4 text-center" glass={false}>
      <div className="space-y-2">
        <div className="text-2xl">{icon}</div>
        <div className="space-y-1">
          <div className="text-2xl font-bold text-[var(--color-text-primary)]">
            {value}<span className="text-sm text-[var(--color-text-secondary)] ml-1">{unit}</span>
          </div>
          <div className="text-xs text-[var(--color-text-secondary)]">{title}</div>
          <div className="text-xs text-[var(--color-text-tertiary)] truncate" title={subtitle}>
            {subtitle}
          </div>
        </div>
      </div>
    </Card>
  );
}

interface CategoryScoreProps {
  name: string;
  description: string;
  score: number;
  color: 'blue' | 'red' | 'indigo';
  icon: string;
}

function CategoryScore({ name, description, score, color, icon }: CategoryScoreProps) {
  const colorClasses = {
    blue: 'bg-blue-500',
    red: 'bg-red-500', 
    indigo: 'bg-indigo-500'
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-lg">{icon}</span>
          <div>
            <div className="font-medium text-[var(--color-text-primary)]">{name}</div>
            <div className="text-sm text-[var(--color-text-secondary)]">{description}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-semibold text-[var(--color-text-primary)]">{score}%</div>
        </div>
      </div>
      <div className="w-full bg-[var(--color-bg-tertiary)] rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${colorClasses[color]} transition-all duration-500`}
          style={{ width: `${score}%` }}
        ></div>
      </div>
    </div>
  );
}

function ScoreGrade({ score }: { score: number }) {
  const getGrade = (score: number): { grade: string; color: string; description: string } => {
    if (score >= 90) return { grade: 'A', color: 'text-green-600', description: '우수' };
    if (score >= 80) return { grade: 'B', color: 'text-blue-600', description: '양호' };
    if (score >= 70) return { grade: 'C', color: 'text-yellow-600', description: '보통' };
    if (score >= 60) return { grade: 'D', color: 'text-orange-600', description: '미흡' };
    return { grade: 'F', color: 'text-red-600', description: '부족' };
  };

  const { grade, color, description } = getGrade(score);

  return (
    <div className="text-center">
      <div className={`text-2xl font-bold ${color}`}>{grade}</div>
      <div className="text-sm text-[var(--color-text-secondary)]">{description}</div>
    </div>
  );
}

function OverallAssessment({ stats }: { stats: AnalysisStatistics }) {
  const getAssessment = (stats: AnalysisStatistics): string => {
    if (stats.validationScore >= 85 && stats.strengthAreas.length >= 3) {
      return '매우 잘 준비됨';
    }
    if (stats.validationScore >= 75 && stats.strengthAreas.length >= 2) {
      return '잘 준비됨';  
    }
    if (stats.validationScore >= 65) {
      return '보완 필요';
    }
    return '추가 준비 필요';
  };

  return (
    <div className="text-center">
      <div className="text-sm font-medium text-[var(--color-text-primary)]">
        {getAssessment(stats)}
      </div>
      <div className="text-xs text-[var(--color-text-secondary)]">종합 평가</div>
    </div>
  );
}