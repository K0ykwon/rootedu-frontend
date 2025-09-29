'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import { AIMajorRecommendations, MajorRecommendationSchema } from '@/types/medsky-enhanced';
import { z } from 'zod';

interface AIMajorRecommendationsViewProps {
  data: AIMajorRecommendations;
}

export function AIMajorRecommendationsView({ data }: AIMajorRecommendationsViewProps) {
  const getMatchColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 80) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (score >= 60) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getPreparationColor = (level: number) => {
    if (level >= 80) return 'text-green-600';
    if (level >= 60) return 'text-blue-600';
    if (level >= 40) return 'text-yellow-600';
    if (level >= 20) return 'text-orange-600';
    return 'text-red-600';
  };

  const MajorCard = ({ major, rank, isTop = false }: {
    major: z.infer<typeof MajorRecommendationSchema>;
    rank: number;
    isTop?: boolean;
  }) => (
    <Card className={`p-6 ${isTop ? 'border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50' : ''}`} glass={false}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {isTop && (
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
              {rank}
            </div>
          )}
          <div>
            <h4 className={`text-lg font-bold ${isTop ? 'text-purple-900' : 'text-gray-900'}`}>
              {major.major_name}
            </h4>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getMatchColor(major.match_score)}`}>
                적합도 {major.match_score}%
              </span>
              <span className={`text-sm font-medium ${getPreparationColor(major.current_preparation_level)}`}>
                준비도 {major.current_preparation_level}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Universities */}
      <div className="mb-4">
        <h5 className="text-sm font-semibold text-gray-700 mb-2">추천 대학교</h5>
        <div className="flex flex-wrap gap-1">
          {major.university_examples.map((university, idx) => (
            <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
              {university}
            </span>
          ))}
        </div>
      </div>

      {/* Match Reasons */}
      <div className="mb-4">
        <h5 className="text-sm font-semibold text-green-700 mb-2 flex items-center">
          <span className="mr-1">✨</span>
          추천 이유
        </h5>
        <ul className="space-y-1">
          {major.match_reasons.map((reason, idx) => (
            <li key={idx} className="text-sm text-gray-700 flex items-start">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
              {reason}
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Required Subjects */}
        <div>
          <h5 className="text-sm font-semibold text-blue-700 mb-2 flex items-center">
            <span className="mr-1">📚</span>
            필수 과목
          </h5>
          <div className="space-y-1">
            {major.required_subjects.map((subject, idx) => (
              <span key={idx} className="inline-block px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs mr-1 mb-1">
                {subject}
              </span>
            ))}
          </div>
        </div>

        {/* Career Prospects */}
        <div>
          <h5 className="text-sm font-semibold text-purple-700 mb-2 flex items-center">
            <span className="mr-1">🚀</span>
            진로 전망
          </h5>
          <ul className="space-y-1">
            {major.career_prospects.map((career, idx) => (
              <li key={idx} className="text-xs text-gray-600 flex items-start">
                <span className="w-1 h-1 bg-purple-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                {career}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Related Activities */}
      <div className="mt-4">
        <h5 className="text-sm font-semibold text-orange-700 mb-2 flex items-center">
          <span className="mr-1">🎯</span>
          추천 활동
        </h5>
        <div className="space-y-1">
          {major.related_activities.map((activity, idx) => (
            <span key={idx} className="inline-block px-2 py-1 bg-orange-50 text-orange-700 border border-orange-200 rounded text-xs mr-1 mb-1">
              {activity}
            </span>
          ))}
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200" glass={false}>
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
            <span className="text-white text-lg">🚀</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">AI 전공 추천</h2>
            <p className="text-sm text-gray-600">학생 프로필 기반 맞춤형 전공 및 진로 추천</p>
          </div>
        </div>
      </Card>

      {/* Analysis Summary */}
      <Card className="p-6" glass={false}>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <span className="mr-2">📋</span>
          종합 분석 의견
        </h3>
        <p className="text-gray-700 bg-gray-50 p-4 rounded-lg leading-relaxed">
          {data.analysis_summary}
        </p>
      </Card>

      {/* Top 3 Recommendations */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center">
          <span className="mr-2">🏆</span>
          상위 3개 추천 전공
        </h3>
        {data.top_recommendations.map((major, index) => (
          <MajorCard key={index} major={major} rank={index + 1} isTop={true} />
        ))}
      </div>

      {/* Alternative Options */}
      {data.alternative_options.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center">
            <span className="mr-2">🎯</span>
            추가 고려 전공
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.alternative_options.map((major, index) => (
              <MajorCard key={index} major={major} rank={index + 4} isTop={false} />
            ))}
          </div>
        </div>
      )}

      {/* Interdisciplinary Suggestions */}
      {data.interdisciplinary_suggestions.length > 0 && (
        <Card className="p-6" glass={false}>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <span className="mr-2">🔀</span>
            융복합 전공 추천
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.interdisciplinary_suggestions.map((suggestion, index) => (
              <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center">
                    <span className="text-white text-xs">🔗</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{suggestion}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Legend */}
      <Card className="p-4 bg-gray-50" glass={false}>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">지표 설명</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-600">
          <div>
            <span className="font-medium">적합도:</span> 학생의 역량과 전공의 요구사항 일치 정도
          </div>
          <div>
            <span className="font-medium">준비도:</span> 현재 해당 전공 진학을 위한 준비 수준
          </div>
        </div>
      </Card>
    </div>
  );
}