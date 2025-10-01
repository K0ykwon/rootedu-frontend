'use client';

/**
 * Analysis Overview Component - Enhanced One-Pager Summary
 *
 * Comprehensive dashboard showing AI-powered analysis results including
 * scores, competency balance, keywords, academic trends, major recommendations,
 * and actionable insights.
 */

import React from 'react';
import { ExtractedData, ValidationAnalysis } from '@/types/medsky';
import {
  AIKeywordExtraction,
  AIScoreAnalysis,
  EnhancedAcademicAnalysis,
  AIMajorRecommendations,
  NextSemesterPlan
} from '@/types/medsky-enhanced';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

interface AnalysisOverviewProps {
  // Legacy data (keep for backward compatibility)
  extractedData: ExtractedData;
  validationAnalysis: ValidationAnalysis;

  // New AI analysis data (optional)
  aiKeywordAnalysis?: AIKeywordExtraction;
  aiSectionScoring?: AIScoreAnalysis;
  enhancedAcademicAnalysis?: EnhancedAcademicAnalysis;
  aiMajorRecommendations?: AIMajorRecommendations;
  nextSemesterPlan?: NextSemesterPlan;

  className?: string;
}

export function AnalysisOverview({
  extractedData,
  validationAnalysis,
  aiKeywordAnalysis,
  aiSectionScoring,
  enhancedAcademicAnalysis,
  aiMajorRecommendations,
  nextSemesterPlan,
  className
}: AnalysisOverviewProps) {

  // If no AI scoring data, show message to generate AI analysis first
  if (!aiSectionScoring) {
    return (
      <Card className="p-8 text-center bg-yellow-50 border-yellow-200" glass={false}>
        <div className="text-yellow-800">
          <h3 className="text-xl font-bold mb-4">📊 전문 분석 진행 중</h3>
          <p className="text-sm mb-2">종합 평가가 진행 중입니다.</p>
          <p className="text-xs text-yellow-600">
            세부 점수, 키워드 분석, 학업 분석 탭에서 분석 결과를 확인하실 수 있습니다.
          </p>
        </div>
      </Card>
    );
  }

  const { overall_score, grade_equivalent, percentile_rank, competency_balance, overall_feedback } = aiSectionScoring;

  return (
    <div className={`analysis-overview space-y-6 ${className || ''}`}>
      {/* Section 1: Hero Score Display */}
      <Card className="p-8 bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20" glass={false}>
        <div className="text-center space-y-6">
          <div className="space-y-3">
            <h3 className="text-2xl font-bold text-[var(--color-text-primary)]">
              종합 평가 결과
            </h3>

            <div className="flex items-center justify-center space-x-8">
              {/* Score Circle */}
              <div className="relative">
                <div className={`w-32 h-32 rounded-full bg-gradient-to-r ${getGradeGradient(grade_equivalent)} flex items-center justify-center shadow-lg`}>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-white">
                      {overall_score}
                    </div>
                    <div className="text-xs text-white/80">/100</div>
                  </div>
                </div>
                <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
                  <Badge variant="default" className={`${getGradeBgColor(grade_equivalent)} text-white font-bold shadow-md px-4 py-2 text-lg`}>
                    {grade_equivalent}
                  </Badge>
                </div>
              </div>

              {/* Grade Description */}
              <div className="text-left space-y-2">
                <div className="text-lg font-semibold text-[var(--color-text-primary)]">
                  {getGradeDescription(grade_equivalent)}
                </div>
                <div className="text-sm text-[var(--color-text-secondary)]">
                  상위 <span className="font-bold text-blue-600">{percentile_rank}%</span> 수준
                </div>
                <div className="text-xs text-[var(--color-text-tertiary)]">
                  종합 평가 점수
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Section 2: Competency Balance */}
      <Card className="p-6" glass={false}>
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4 flex items-center">
          <span className="mr-2">📊</span>
          역량별 균형 분석
        </h3>
        <div className="grid grid-cols-5 gap-4">
          <CompetencyCard
            name="학업역량"
            score={competency_balance.academic}
            icon="📚"
            color="blue"
          />
          <CompetencyCard
            name="진로역량"
            score={competency_balance.career}
            icon="🎯"
            color="purple"
          />
          <CompetencyCard
            name="공동체역량"
            score={competency_balance.community}
            icon="🤝"
            color="green"
          />
          <CompetencyCard
            name="창의역량"
            score={competency_balance.creativity}
            icon="💡"
            color="orange"
          />
          <CompetencyCard
            name="인성역량"
            score={competency_balance.character}
            icon="💪"
            color="pink"
          />
        </div>
      </Card>

      {/* Section 3: Quick Insights Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <InsightCard
          icon="🔑"
          title="핵심 키워드"
          value={aiKeywordAnalysis?.overall_keywords.length || 0}
          unit="개"
          subtitle="추출된 역량 키워드"
          color="blue"
        />

        <InsightCard
          icon="📖"
          title="교과목 분석"
          value={enhancedAcademicAnalysis?.subject_analysis.length || 0}
          unit="과목"
          subtitle={`평균 준비도 ${getAverageCollegeReadiness(enhancedAcademicAnalysis)}%`}
          color="green"
        />

        <InsightCard
          icon="🎓"
          title="전공 적합도"
          value={aiMajorRecommendations?.top_recommendations[0]?.match_score || 0}
          unit="%"
          subtitle={aiMajorRecommendations?.top_recommendations[0]?.major_name || '분석 대기중'}
          color="purple"
        />

        <InsightCard
          icon="🏆"
          title="종합 평가"
          value={overall_score}
          unit="점"
          subtitle={getOverallAssessment(overall_score, grade_equivalent)}
          color="indigo"
        />
      </div>

      {/* Section 4: Top Keywords */}
      {aiKeywordAnalysis && aiKeywordAnalysis.overall_keywords.length > 0 && (
        <Card className="p-6" glass={false}>
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4 flex items-center">
            <span className="mr-2">🔑</span>
            핵심 역량 키워드 (Top {Math.min(10, aiKeywordAnalysis.overall_keywords.length)})
          </h3>
          <div className="flex flex-wrap gap-3">
            {aiKeywordAnalysis.overall_keywords.slice(0, 10).map((keyword, index) => (
              <KeywordBadge key={index} keyword={keyword} />
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-[var(--color-text-tertiary)]">
              💡 키워드 위에 마우스를 올리면 상세 정보를 확인할 수 있습니다
            </p>
          </div>
        </Card>
      )}

      {/* Section 5: Academic Performance Summary */}
      {enhancedAcademicAnalysis && enhancedAcademicAnalysis.subject_analysis.length > 0 && (
        <Card className="p-6" glass={false}>
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4 flex items-center">
            <span className="mr-2">📈</span>
            학업 성취 요약
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Performance Trends */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">성취 추세</h4>
              <div className="space-y-2">
                {getPerformanceTrends(enhancedAcademicAnalysis).map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getTrendIcon(item.trend)}</span>
                      <span className="text-sm font-medium text-gray-700">{item.trend}</span>
                    </div>
                    <span className="text-sm text-gray-600">{item.count}과목</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Performing Subjects */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">우수 성취 과목</h4>
              <div className="space-y-2">
                {getTopSubjects(enhancedAcademicAnalysis).map((subject, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded">
                    <span className="text-sm font-medium text-green-700">{subject.subject}</span>
                    <div className="flex items-center space-x-2">
                      <Badge variant="default" size="sm" className="bg-green-600 text-white">
                        {subject.grade_analysis.relative_position}
                      </Badge>
                      <span className="text-xs text-green-600">{subject.college_readiness}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Section 6: Major Recommendations */}
      {aiMajorRecommendations && aiMajorRecommendations.top_recommendations.length > 0 && (
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50" glass={false}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] flex items-center">
              <span className="mr-2">🎓</span>
              추천 전공 (Top 3)
            </h3>
            <span className="text-xs text-purple-600">전공 추천 탭에서 더 보기 →</span>
          </div>

          <div className="space-y-3">
            {aiMajorRecommendations.top_recommendations.map((major, index) => (
              <MajorMatchCard key={index} major={major} rank={index + 1} />
            ))}
          </div>
        </Card>
      )}

      {/* Section 7: Strengths & Priority Areas */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Strengths */}
        <Card className="p-6 bg-green-50 dark:bg-green-900/20" glass={false}>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">✨</span>
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
                주요 강점 영역
              </h3>
            </div>

            <div className="space-y-2">
              {aiKeywordAnalysis?.student_strengths && aiKeywordAnalysis.student_strengths.length > 0 ? (
                aiKeywordAnalysis.student_strengths.slice(0, 5).map((strength, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-sm text-green-700 dark:text-green-300">
                      {strength}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-green-600 dark:text-green-400 text-sm">
                  다양한 활동에서 균형잡힌 역량을 보여주고 있습니다.
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Priority Areas */}
        <Card className="p-6 bg-orange-50 dark:bg-orange-900/20" glass={false}>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🎯</span>
              <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200">
                중점 개선 영역
              </h3>
            </div>

            <div className="space-y-2">
              {aiKeywordAnalysis?.improvement_areas && aiKeywordAnalysis.improvement_areas.length > 0 ? (
                aiKeywordAnalysis.improvement_areas.slice(0, 5).map((area, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <span className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-sm text-orange-700 dark:text-orange-300">
                      {area}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-orange-600 dark:text-orange-400 text-sm">
                  현재 수준에서 잘 관리되고 있습니다.
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Section 8: AI Overall Feedback */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200" glass={false}>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">📝</span>
            <h3 className="text-lg font-semibold text-blue-900">
              전문가 종합 의견
            </h3>
          </div>

          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {overall_feedback}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ===========================
// Helper Functions
// ===========================

function getGradeGradient(grade: string): string {
  const gradients: Record<string, string> = {
    'A+': 'from-green-500 to-emerald-600',
    'A': 'from-green-500 to-emerald-600',
    'B+': 'from-blue-500 to-cyan-600',
    'B': 'from-blue-500 to-cyan-600',
    'C+': 'from-yellow-500 to-amber-600',
    'C': 'from-yellow-500 to-amber-600',
    'D+': 'from-orange-500 to-red-600',
    'D': 'from-orange-500 to-red-600',
    'F': 'from-red-500 to-rose-600',
  };
  return gradients[grade] || 'from-gray-500 to-gray-600';
}

function getGradeBgColor(grade: string): string {
  const colors: Record<string, string> = {
    'A+': 'bg-green-600',
    'A': 'bg-green-600',
    'B+': 'bg-blue-600',
    'B': 'bg-blue-600',
    'C+': 'bg-yellow-600',
    'C': 'bg-yellow-600',
    'D+': 'bg-orange-600',
    'D': 'bg-orange-600',
    'F': 'bg-red-600',
  };
  return colors[grade] || 'bg-gray-600';
}

function getGradeDescription(grade: string): string {
  const descriptions: Record<string, string> = {
    'A+': '매우 우수한 준비 상태',
    'A': '우수한 준비 상태',
    'B+': '양호한 수준',
    'B': '양호한 수준',
    'C+': '보통 수준',
    'C': '보통 수준',
    'D+': '보완이 필요한 수준',
    'D': '보완이 필요한 수준',
    'F': '상당한 개선이 필요',
  };
  return descriptions[grade] || '평가 중';
}

function getOverallAssessment(score: number, grade: string): string {
  if (score >= 90) return '매우 잘 준비됨';
  if (score >= 80) return '잘 준비됨';
  if (score >= 70) return '적정 수준';
  if (score >= 60) return '보완 필요';
  return '추가 준비 필요';
}

function getAverageCollegeReadiness(analysis?: EnhancedAcademicAnalysis): number {
  if (!analysis || analysis.subject_analysis.length === 0) return 0;
  const total = analysis.subject_analysis.reduce((sum, subj) => sum + subj.college_readiness, 0);
  return Math.round(total / analysis.subject_analysis.length);
}

function getTrendIcon(trend: string): string {
  const icons: Record<string, string> = {
    '상승': '📈',
    '하락': '📉',
    '유지': '➡️',
    '불안정': '📊'
  };
  return icons[trend] || '➡️';
}

function getPerformanceTrends(analysis: EnhancedAcademicAnalysis) {
  const trendCounts: Record<string, number> = {};
  analysis.subject_analysis.forEach(subj => {
    trendCounts[subj.performance_trend] = (trendCounts[subj.performance_trend] || 0) + 1;
  });

  return Object.entries(trendCounts)
    .map(([trend, count]) => ({ trend, count }))
    .sort((a, b) => b.count - a.count);
}

function getTopSubjects(analysis: EnhancedAcademicAnalysis) {
  return analysis.subject_analysis
    .filter(subj => subj.grade_analysis.relative_position === '상위권' || subj.grade_analysis.relative_position === '중상위권')
    .sort((a, b) => b.college_readiness - a.college_readiness)
    .slice(0, 3);
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    '학업역량': 'bg-blue-100 text-blue-800 border-blue-300',
    '진로역량': 'bg-purple-100 text-purple-800 border-purple-300',
    '공동체역량': 'bg-green-100 text-green-800 border-green-300',
    '창의성': 'bg-orange-100 text-orange-800 border-orange-300',
    '리더십': 'bg-red-100 text-red-800 border-red-300',
    '협력': 'bg-teal-100 text-teal-800 border-teal-300',
    '문제해결': 'bg-indigo-100 text-indigo-800 border-indigo-300',
    '의사소통': 'bg-pink-100 text-pink-800 border-pink-300',
  };
  return colors[category] || 'bg-gray-100 text-gray-800 border-gray-300';
}

// ===========================
// Sub-Components
// ===========================

interface CompetencyCardProps {
  name: string;
  score: number;
  icon: string;
  color: 'blue' | 'purple' | 'green' | 'orange' | 'pink';
}

function CompetencyCard({ name, score, icon, color }: CompetencyCardProps) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
    pink: 'from-pink-500 to-pink-600'
  };

  return (
    <div className="text-center space-y-3">
      <div className="text-2xl">{icon}</div>
      <div>
        <div className={`text-2xl font-bold bg-gradient-to-r ${colorClasses[color]} bg-clip-text text-transparent`}>
          {score}
        </div>
        <div className="text-xs text-[var(--color-text-secondary)] mt-1">{name}</div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full bg-gradient-to-r ${colorClasses[color]} transition-all duration-500`}
          style={{ width: `${score}%` }}
        ></div>
      </div>
    </div>
  );
}

interface InsightCardProps {
  icon: string;
  title: string;
  value: number;
  unit: string;
  subtitle: string;
  color: 'blue' | 'green' | 'purple' | 'indigo';
}

function InsightCard({ icon, title, value, unit, subtitle, color }: InsightCardProps) {
  const colorClasses = {
    blue: 'border-blue-200 bg-blue-50',
    green: 'border-green-200 bg-green-50',
    purple: 'border-purple-200 bg-purple-50',
    indigo: 'border-indigo-200 bg-indigo-50'
  };

  return (
    <Card className={`p-4 text-center border-2 ${colorClasses[color]}`} glass={false}>
      <div className="space-y-2">
        <div className="text-3xl">{icon}</div>
        <div className="space-y-1">
          <div className="text-2xl font-bold text-[var(--color-text-primary)]">
            {value}<span className="text-sm text-[var(--color-text-secondary)] ml-1">{unit}</span>
          </div>
          <div className="text-xs font-medium text-[var(--color-text-secondary)]">{title}</div>
          <div className="text-xs text-[var(--color-text-tertiary)] truncate" title={subtitle}>
            {subtitle}
          </div>
        </div>
      </div>
    </Card>
  );
}

interface KeywordBadgeProps {
  keyword: {
    keyword: string;
    relevance_score: number;
    category: string;
    competency_indicator: string;
  };
}

function KeywordBadge({ keyword }: KeywordBadgeProps) {
  return (
    <div
      className={`px-3 py-2 rounded-lg border-2 ${getCategoryColor(keyword.category)} cursor-help transition-transform hover:scale-105`}
      title={`${keyword.competency_indicator}\n관련성: ${Math.round(keyword.relevance_score * 100)}%`}
    >
      <div className="flex items-center space-x-2">
        <span className="font-medium text-sm">{keyword.keyword}</span>
        <span className="text-xs opacity-75">
          {Math.round(keyword.relevance_score * 100)}%
        </span>
      </div>
    </div>
  );
}

interface MajorMatchCardProps {
  major: {
    major_name: string;
    match_score: number;
    university_examples: string[];
    current_preparation_level: number;
  };
  rank: number;
}

function MajorMatchCard({ major, rank }: MajorMatchCardProps) {
  return (
    <div className="p-4 bg-white rounded-lg border-2 border-purple-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
            {rank}
          </div>
          <div>
            <div className="font-semibold text-gray-900">{major.major_name}</div>
            <div className="text-xs text-gray-500">
              {major.university_examples.slice(0, 2).join(', ')}
              {major.university_examples.length > 2 && ` 외 ${major.university_examples.length - 2}곳`}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-purple-600">{major.match_score}%</div>
          <div className="text-xs text-gray-500">적합도</div>
        </div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
          style={{ width: `${major.match_score}%` }}
        ></div>
      </div>
    </div>
  );
}