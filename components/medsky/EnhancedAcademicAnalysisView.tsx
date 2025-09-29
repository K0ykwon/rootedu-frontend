'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import { EnhancedAcademicAnalysis } from '@/types/medsky-enhanced';

interface EnhancedAcademicAnalysisViewProps {
  data: EnhancedAcademicAnalysis;
}

export function EnhancedAcademicAnalysisView({ data }: EnhancedAcademicAnalysisViewProps) {
  const getTrendColor = (trend: string) => {
    const colors: Record<string, string> = {
      '상승': 'text-green-600 bg-green-50 border-green-200',
      '하락': 'text-red-600 bg-red-50 border-red-200',
      '유지': 'text-blue-600 bg-blue-50 border-blue-200',
      '불안정': 'text-orange-600 bg-orange-50 border-orange-200',
    };
    return colors[trend] || 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getPositionColor = (position: string) => {
    const colors: Record<string, string> = {
      '상위권': 'text-green-600 bg-green-50',
      '중상위권': 'text-blue-600 bg-blue-50',
      '중위권': 'text-yellow-600 bg-yellow-50',
      '중하위권': 'text-orange-600 bg-orange-50',
      '하위권': 'text-red-600 bg-red-50',
    };
    return colors[position] || 'text-gray-600 bg-gray-50';
  };

  const getReadinessColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    if (score >= 20) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200" glass={false}>
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
            <span className="text-white text-lg">🎓</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">AI 향상된 학업 분석</h2>
            <p className="text-sm text-gray-600">석차등급과 성취도를 활용한 종합적 학업 성취 분석</p>
          </div>
        </div>
      </Card>

      {/* Overall Academic Trends */}
      <Card className="p-6" glass={false}>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <span className="mr-2">📈</span>
          전체 학업 추세
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 border rounded-lg">
            <div className={`text-lg font-semibold px-3 py-1 rounded-full ${getTrendColor(data.overall_academic_trends.gpa_trend)}`}>
              {data.overall_academic_trends.gpa_trend}
            </div>
            <div className="text-sm text-gray-600 mt-2">성적 추세</div>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <div className="text-lg font-semibold text-blue-600">
              {Math.round(data.overall_academic_trends.grade_consistency)}
            </div>
            <div className="text-sm text-gray-600 mt-2">성적 일관성</div>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <div className="text-lg font-semibold text-purple-600">
              {data.overall_academic_trends.improvement_rate > 0 ? '+' : ''}{data.overall_academic_trends.improvement_rate.toFixed(1)}
            </div>
            <div className="text-sm text-gray-600 mt-2">향상도</div>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <div className="text-lg font-semibold text-gray-700">
              {data.subject_analysis.length}
            </div>
            <div className="text-sm text-gray-600 mt-2">분석 과목 수</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-green-700 mb-2">강점 과목</h4>
            <div className="space-y-1">
              {data.overall_academic_trends.strong_subjects.map((subject, index) => (
                <span key={index} className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded text-sm mr-1 mb-1">
                  {subject}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-orange-700 mb-2">약점 과목</h4>
            <div className="space-y-1">
              {data.overall_academic_trends.weak_subjects.map((subject, index) => (
                <span key={index} className="inline-block px-2 py-1 bg-orange-100 text-orange-800 rounded text-sm mr-1 mb-1">
                  {subject}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* College Entrance Readiness */}
      <Card className="p-6" glass={false}>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <span className="mr-2">🎯</span>
          대학 진학 준비도
        </h3>
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">전체 준비도</span>
            <span className={`text-lg font-semibold ${getReadinessColor(data.college_entrance_readiness.overall_readiness)}`}>
              {data.college_entrance_readiness.overall_readiness}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${data.college_entrance_readiness.overall_readiness}%` }}
            ></div>
          </div>
        </div>

        <div className="mb-4">
          <h4 className="font-semibold text-gray-700 mb-2">과목별 준비도</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(data.college_entrance_readiness.subject_readiness).map(([subject, readiness]) => (
              <div key={subject} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{subject}</span>
                  <span className={`text-sm font-semibold ${getReadinessColor(readiness)}`}>
                    {readiness}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${readiness}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-blue-700 mb-2">경쟁력 위치</h4>
            <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded">
              {data.college_entrance_readiness.competitive_position}
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-purple-700 mb-2">개선 제안</h4>
            <ul className="space-y-1">
              {data.college_entrance_readiness.recommendations.map((recommendation, index) => (
                <li key={index} className="text-sm text-gray-700 flex items-start">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  {recommendation}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      {/* Subject Analysis */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center">
          <span className="mr-2">📚</span>
          과목별 상세 분석
        </h3>
        {data.subject_analysis.map((subject, index) => (
          <Card key={index} className="p-6" glass={false}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">{subject.subject}</h4>
                {subject.semester && (
                  <span className="text-sm text-gray-600">{subject.semester}</span>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTrendColor(subject.performance_trend)}`}>
                  {subject.performance_trend}
                </span>
                <span className={`px-3 py-1 rounded-lg text-sm font-medium ${getPositionColor(subject.grade_analysis.relative_position)}`}>
                  {subject.grade_analysis.relative_position}
                </span>
                <span className={`text-lg font-semibold ${getReadinessColor(subject.college_readiness)}`}>
                  {subject.college_readiness}%
                </span>
              </div>
            </div>

            {/* Grade Analysis */}
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h5 className="font-semibold text-gray-700 mb-2">성적 분석</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">원점수/평균: </span>
                  <span className="font-medium">{subject.grade_analysis.raw_score}</span>
                </div>
                <div>
                  <span className="text-gray-600">성취도: </span>
                  <span className="font-medium">{subject.grade_analysis.achievement_level}</span>
                </div>
                <div>
                  <span className="text-gray-600">석차등급: </span>
                  <span className="font-medium">{subject.grade_analysis.rank_grade}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h5 className="font-semibold text-green-700 mb-2 flex items-center">
                  <span className="mr-1">✅</span>
                  강점
                </h5>
                <ul className="space-y-1">
                  {subject.strengths.map((strength, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex items-start">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h5 className="font-semibold text-orange-700 mb-2 flex items-center">
                  <span className="mr-1">⚠️</span>
                  개선 필요
                </h5>
                <ul className="space-y-1">
                  {subject.improvements_needed.map((improvement, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex items-start">
                      <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                      {improvement}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}