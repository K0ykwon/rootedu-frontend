'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import { AIScoreAnalysis } from '@/types/medsky-enhanced';

interface AISectionScoringViewProps {
  data: AIScoreAnalysis;
}

export function AISectionScoringView({ data }: AISectionScoringViewProps) {
  const getGradeColor = (grade: string) => {
    const colors: Record<string, string> = {
      'A+': 'text-green-600 bg-green-50 border-green-200',
      'A': 'text-green-600 bg-green-50 border-green-200',
      'B+': 'text-blue-600 bg-blue-50 border-blue-200',
      'B': 'text-blue-600 bg-blue-50 border-blue-200',
      'C+': 'text-yellow-600 bg-yellow-50 border-yellow-200',
      'C': 'text-yellow-600 bg-yellow-50 border-yellow-200',
      'D+': 'text-orange-600 bg-orange-50 border-orange-200',
      'D': 'text-orange-600 bg-orange-50 border-orange-200',
      'F': 'text-red-600 bg-red-50 border-red-200',
    };
    return colors[grade] || 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getCriteriaLabel = (criteria: string) => {
    const labels: Record<string, string> = {
      depth: '깊이',
      relevance: '연관성',
      growth: '성장',
      uniqueness: '독창성',
      leadership: '리더십'
    };
    return labels[criteria] || criteria;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200" glass={false}>
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
            <span className="text-white text-lg">⚡</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">AI 섹션 채점</h2>
            <p className="text-sm text-gray-600">대학 입학사정관 관점의 다기준 AI 채점 시스템</p>
          </div>
        </div>
      </Card>

      {/* Overall Score Summary */}
      <Card className="p-6" glass={false}>
        <div className="text-center mb-6">
          <div className="flex items-center justify-center space-x-6 mb-4">
            <div className="text-center">
              <div className={`text-4xl font-bold ${getScoreColor(data.overall_score)}`}>
                {data.overall_score}
              </div>
              <div className="text-sm text-gray-600">종합 점수</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold px-4 py-2 rounded-lg border ${getGradeColor(data.grade_equivalent)}`}>
                {data.grade_equivalent}
              </div>
              <div className="text-sm text-gray-600">등급</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                상위 {100 - data.percentile_rank}%
              </div>
              <div className="text-sm text-gray-600">예상 위치</div>
            </div>
          </div>
          <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
            {data.overall_feedback}
          </p>
        </div>

        {/* Competency Balance */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">역량별 균형 분석</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(data.competency_balance).map(([key, value]) => {
              const labels: Record<string, string> = {
                academic: '학업역량',
                career: '진로역량',
                community: '공동체역량',
                creativity: '창의역량',
                character: '인성역량'
              };
              return (
                <div key={key} className="text-center p-3 border rounded-lg">
                  <div className={`text-xl font-bold ${getScoreColor(value)}`}>
                    {value}
                  </div>
                  <div className="text-sm text-gray-600">{labels[key] || key}</div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Section Scores */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center">
          <span className="mr-2">📊</span>
          섹션별 상세 채점
        </h3>
        {data.section_scores.map((section, index) => (
          <Card key={index} className="p-6" glass={false}>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-lg font-semibold text-gray-900">{section.section_name}</h4>
                <div className={`text-2xl font-bold ${getScoreColor(section.score)}`}>
                  {section.score}점
                </div>
              </div>

              {/* Criteria Scores */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                {Object.entries(section.criteria_scores).map(([criteria, score]) => (
                  <div key={criteria} className="text-center p-2 border rounded">
                    <div className={`text-lg font-semibold ${getScoreColor(score)}`}>
                      {score}
                    </div>
                    <div className="text-xs text-gray-600">{getCriteriaLabel(criteria)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Strengths */}
              <div>
                <h5 className="font-semibold text-green-700 mb-2 flex items-center">
                  <span className="mr-1">✅</span>
                  강점
                </h5>
                <ul className="space-y-1">
                  {section.strengths.map((strength, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex items-start">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Weaknesses */}
              <div>
                <h5 className="font-semibold text-orange-700 mb-2 flex items-center">
                  <span className="mr-1">⚠️</span>
                  약점
                </h5>
                <ul className="space-y-1">
                  {section.weaknesses.map((weakness, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex items-start">
                      <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                      {weakness}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Improvement Suggestions */}
              <div className="md:col-span-2">
                <h5 className="font-semibold text-blue-700 mb-2 flex items-center">
                  <span className="mr-1">💡</span>
                  개선 제안
                </h5>
                <ul className="space-y-1">
                  {section.improvement_suggestions.map((suggestion, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex items-start">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Evidence Highlights */}
              {section.evidence_highlights.length > 0 && (
                <div className="md:col-span-2">
                  <h5 className="font-semibold text-purple-700 mb-2 flex items-center">
                    <span className="mr-1">⭐</span>
                    높은 평가 활동
                  </h5>
                  <ul className="space-y-1">
                    {section.evidence_highlights.map((highlight, idx) => (
                      <li key={idx} className="text-sm text-gray-700 flex items-start">
                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}