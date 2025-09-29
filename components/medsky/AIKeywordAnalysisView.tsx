'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import { AIKeywordExtraction } from '@/types/medsky-enhanced';

interface AIKeywordAnalysisViewProps {
  data: AIKeywordExtraction;
}

export function AIKeywordAnalysisView({ data }: AIKeywordAnalysisViewProps) {
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      '학업역량': 'bg-blue-100 text-blue-800 border-blue-200',
      '진로역량': 'bg-green-100 text-green-800 border-green-200',
      '공동체역량': 'bg-purple-100 text-purple-800 border-purple-200',
      '창의성': 'bg-orange-100 text-orange-800 border-orange-200',
      '리더십': 'bg-red-100 text-red-800 border-red-200',
      '협력': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      '문제해결': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      '의사소통': 'bg-pink-100 text-pink-800 border-pink-200',
    };
    return colors[category] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200" glass={false}>
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
            <span className="text-white text-lg">🤖</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">AI 키워드 분석</h2>
            <p className="text-sm text-gray-600">문맥을 고려한 지능형 키워드 추출 및 역량 분석</p>
          </div>
        </div>
      </Card>

      {/* Overall Keywords */}
      <Card className="p-6" glass={false}>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <span className="mr-2">⭐</span>
          핵심 키워드 (전체)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.overall_keywords.map((keyword, index) => (
            <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(keyword.category)}`}>
                  {keyword.category}
                </span>
                <span className="text-sm font-medium text-gray-600">
                  {Math.round(keyword.relevance_score * 100)}%
                </span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">{keyword.keyword}</h4>
              <p className="text-xs text-gray-600 mb-2">{keyword.competency_indicator}</p>
              <p className="text-xs text-gray-500 line-clamp-2">{keyword.evidence_text}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Student Strengths */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6" glass={false}>
          <h3 className="text-lg font-semibold mb-4 flex items-center text-green-700">
            <span className="mr-2">💪</span>
            주요 강점
          </h3>
          <ul className="space-y-2">
            {data.student_strengths.map((strength, index) => (
              <li key={index} className="flex items-start">
                <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span className="text-gray-700">{strength}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6" glass={false}>
          <h3 className="text-lg font-semibold mb-4 flex items-center text-orange-700">
            <span className="mr-2">🎯</span>
            개선 영역
          </h3>
          <ul className="space-y-2">
            {data.improvement_areas.map((area, index) => (
              <li key={index} className="flex items-start">
                <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span className="text-gray-700">{area}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Section-wise Keywords */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center">
          <span className="mr-2">📋</span>
          섹션별 키워드 분석
        </h3>
        {data.sections.map((section, sectionIndex) => (
          <Card key={sectionIndex} className="p-6" glass={false}>
            <div className="mb-4">
              <h4 className="text-md font-semibold text-gray-900 mb-2">{section.section_name}</h4>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{section.section_summary}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {section.keywords.map((keyword, keywordIndex) => (
                <div key={keywordIndex} className="p-3 border rounded hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(keyword.category)}`}>
                      {keyword.category}
                    </span>
                    <span className="text-xs text-gray-500">
                      {Math.round(keyword.relevance_score * 100)}%
                    </span>
                  </div>
                  <h5 className="font-medium text-gray-900 text-sm mb-1">{keyword.keyword}</h5>
                  <p className="text-xs text-gray-600">{keyword.competency_indicator}</p>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}