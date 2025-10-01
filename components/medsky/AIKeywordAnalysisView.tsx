'use client';

import React, { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { AIKeywordExtraction } from '@/types/medsky-enhanced';
import { ArrayEditor } from './ArrayEditor';
import { CollapsibleSection } from './CollapsibleSection';
import { z } from 'zod';

interface AIKeywordAnalysisViewProps {
  data: AIKeywordExtraction;
  editable?: boolean;
  onSave?: (data: AIKeywordExtraction) => Promise<void>;
}

const CATEGORY_OPTIONS = [
  '학업역량',
  '진로역량',
  '공동체역량',
  '창의성',
  '리더십',
  '협력',
  '문제해결',
  '의사소통'
] as const;

export function AIKeywordAnalysisView({ data, editable = false, onSave }: AIKeywordAnalysisViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(data);
  const [isSaving, setIsSaving] = useState(false);

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

  const handleSave = async () => {
    if (!onSave) return;
    setIsSaving(true);
    try {
      await onSave(editedData);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedData(data);
    setIsEditing(false);
  };

  // Handlers for overall keywords
  const handleOverallKeywordChange = (index: number, field: string, value: any) => {
    setEditedData(prev => ({
      ...prev,
      overall_keywords: prev.overall_keywords.map((kw, i) =>
        i === index ? { ...kw, [field]: value } : kw
      )
    }));
  };

  const handleAddOverallKeyword = () => {
    setEditedData(prev => ({
      ...prev,
      overall_keywords: [
        ...prev.overall_keywords,
        {
          keyword: '',
          relevance_score: 0.5,
          category: '학업역량',
          evidence_text: '',
          competency_indicator: ''
        }
      ]
    }));
  };

  const handleRemoveOverallKeyword = (index: number) => {
    if (editedData.overall_keywords.length === 1) return;
    setEditedData(prev => ({
      ...prev,
      overall_keywords: prev.overall_keywords.filter((_, i) => i !== index)
    }));
  };

  // Handlers for section keywords
  const handleSectionKeywordChange = (sectionIdx: number, keywordIdx: number, field: string, value: any) => {
    setEditedData(prev => ({
      ...prev,
      sections: prev.sections.map((section, si) =>
        si === sectionIdx
          ? {
              ...section,
              keywords: section.keywords.map((kw, ki) =>
                ki === keywordIdx ? { ...kw, [field]: value } : kw
              )
            }
          : section
      )
    }));
  };

  const handleSectionSummaryChange = (sectionIdx: number, value: string) => {
    setEditedData(prev => ({
      ...prev,
      sections: prev.sections.map((section, si) =>
        si === sectionIdx ? { ...section, section_summary: value } : section
      )
    }));
  };

  const handleAddSectionKeyword = (sectionIdx: number) => {
    setEditedData(prev => ({
      ...prev,
      sections: prev.sections.map((section, si) =>
        si === sectionIdx
          ? {
              ...section,
              keywords: [
                ...section.keywords,
                {
                  keyword: '',
                  relevance_score: 0.5,
                  category: '학업역량',
                  evidence_text: '',
                  competency_indicator: ''
                }
              ]
            }
          : section
      )
    }));
  };

  const handleRemoveSectionKeyword = (sectionIdx: number, keywordIdx: number) => {
    setEditedData(prev => ({
      ...prev,
      sections: prev.sections.map((section, si) =>
        si === sectionIdx && section.keywords.length > 1
          ? {
              ...section,
              keywords: section.keywords.filter((_, ki) => ki !== keywordIdx)
            }
          : section
      )
    }));
  };

  const displayData = isEditing ? editedData : data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200" glass={false}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
              <span className="text-white text-lg">🔑</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">키워드 분석</h2>
              <p className="text-sm text-gray-600">문맥을 고려한 지능형 키워드 추출 및 역량 분석</p>
            </div>
          </div>

          {editable && !isEditing && (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              수정하기
            </Button>
          )}

          {isEditing && (
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
              >
                취소
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? '저장 중...' : '저장'}
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Overall Keywords */}
      <Card className="p-6" glass={false}>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <span className="mr-2">⭐</span>
          핵심 키워드 (전체)
        </h3>
        {isEditing ? (
          <div className="space-y-4">
            {editedData.overall_keywords.map((keyword, index) => (
              <div key={index} className="p-4 border rounded-lg bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">키워드</label>
                    <input
                      type="text"
                      className="w-full text-sm border rounded px-3 py-2"
                      value={keyword.keyword}
                      onChange={(e) => handleOverallKeywordChange(index, 'keyword', e.target.value)}
                      placeholder="키워드 입력"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">카테고리</label>
                    <select
                      className="w-full text-sm border rounded px-3 py-2"
                      value={keyword.category}
                      onChange={(e) => handleOverallKeywordChange(index, 'category', e.target.value)}
                    >
                      {CATEGORY_OPTIONS.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    관련성 점수: {Math.round(keyword.relevance_score * 100)}%
                  </label>
                  <input
                    type="range"
                    className="w-full"
                    min="0"
                    max="100"
                    value={keyword.relevance_score * 100}
                    onChange={(e) => handleOverallKeywordChange(index, 'relevance_score', Number(e.target.value) / 100)}
                  />
                </div>

                <div className="mb-3">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">역량 지표</label>
                  <textarea
                    className="w-full text-sm border rounded px-3 py-2"
                    value={keyword.competency_indicator}
                    onChange={(e) => handleOverallKeywordChange(index, 'competency_indicator', e.target.value)}
                    placeholder="역량 지표 입력"
                    rows={2}
                  />
                </div>

                <div className="mb-3">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">근거 텍스트</label>
                  <textarea
                    className="w-full text-sm border rounded px-3 py-2"
                    value={keyword.evidence_text}
                    onChange={(e) => handleOverallKeywordChange(index, 'evidence_text', e.target.value)}
                    placeholder="근거 텍스트 입력"
                    rows={3}
                  />
                </div>

                <button
                  onClick={() => handleRemoveOverallKeyword(index)}
                  className="text-sm text-red-600 hover:text-red-800 hover:underline"
                  disabled={editedData.overall_keywords.length === 1}
                >
                  키워드 삭제
                </button>
              </div>
            ))}
            <button
              onClick={handleAddOverallKeyword}
              className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
            >
              + 키워드 추가
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayData.overall_keywords.map((keyword, index) => (
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
        )}
      </Card>

      {/* Student Strengths and Improvement Areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6" glass={false}>
          <h3 className="text-lg font-semibold mb-4 flex items-center text-green-700">
            <span className="mr-2">💪</span>
            주요 강점
          </h3>
          {isEditing ? (
            <ArrayEditor
              label=""
              items={editedData.student_strengths}
              onChange={(items) => setEditedData(prev => ({ ...prev, student_strengths: items }))}
              multiline
              placeholder="강점 입력"
              addButtonText="+ 강점 추가"
            />
          ) : (
            <ul className="space-y-2">
              {displayData.student_strengths.map((strength, index) => (
                <li key={index} className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">{strength}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-6" glass={false}>
          <h3 className="text-lg font-semibold mb-4 flex items-center text-orange-700">
            <span className="mr-2">🎯</span>
            개선 영역
          </h3>
          {isEditing ? (
            <ArrayEditor
              label=""
              items={editedData.improvement_areas}
              onChange={(items) => setEditedData(prev => ({ ...prev, improvement_areas: items }))}
              multiline
              placeholder="개선 영역 입력"
              addButtonText="+ 개선 영역 추가"
            />
          ) : (
            <ul className="space-y-2">
              {displayData.improvement_areas.map((area, index) => (
                <li key={index} className="flex items-start">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">{area}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Section-wise Keywords */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center">
          <span className="mr-2">📋</span>
          섹션별 키워드 분석
        </h3>
        {displayData.sections.map((section, sectionIndex) => (
          <CollapsibleSection key={sectionIndex} title={section.section_name} defaultOpen={false}>
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">섹션 요약</label>
                  <textarea
                    className="w-full text-sm border rounded px-3 py-2"
                    value={editedData.sections[sectionIndex].section_summary}
                    onChange={(e) => handleSectionSummaryChange(sectionIndex, e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-700">키워드 목록</h4>
                  {editedData.sections[sectionIndex].keywords.map((keyword, keywordIndex) => (
                    <div key={keywordIndex} className="p-3 border rounded bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                        <div>
                          <label className="text-xs font-medium text-gray-600 mb-1 block">키워드</label>
                          <input
                            type="text"
                            className="w-full text-sm border rounded px-2 py-1"
                            value={keyword.keyword}
                            onChange={(e) => handleSectionKeywordChange(sectionIndex, keywordIndex, 'keyword', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600 mb-1 block">카테고리</label>
                          <select
                            className="w-full text-sm border rounded px-2 py-1"
                            value={keyword.category}
                            onChange={(e) => handleSectionKeywordChange(sectionIndex, keywordIndex, 'category', e.target.value)}
                          >
                            {CATEGORY_OPTIONS.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="mb-2">
                        <label className="text-xs font-medium text-gray-600 mb-1 block">
                          관련성: {Math.round(keyword.relevance_score * 100)}%
                        </label>
                        <input
                          type="range"
                          className="w-full"
                          min="0"
                          max="100"
                          value={keyword.relevance_score * 100}
                          onChange={(e) => handleSectionKeywordChange(sectionIndex, keywordIndex, 'relevance_score', Number(e.target.value) / 100)}
                        />
                      </div>

                      <div className="mb-2">
                        <label className="text-xs font-medium text-gray-600 mb-1 block">역량 지표</label>
                        <textarea
                          className="w-full text-sm border rounded px-2 py-1"
                          value={keyword.competency_indicator}
                          onChange={(e) => handleSectionKeywordChange(sectionIndex, keywordIndex, 'competency_indicator', e.target.value)}
                          rows={2}
                        />
                      </div>

                      <button
                        onClick={() => handleRemoveSectionKeyword(sectionIndex, keywordIndex)}
                        className="text-xs text-red-600 hover:text-red-800"
                        disabled={editedData.sections[sectionIndex].keywords.length === 1}
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => handleAddSectionKeyword(sectionIndex)}
                    className="w-full py-2 border border-dashed border-gray-300 rounded text-sm text-gray-600 hover:border-blue-500 hover:text-blue-600"
                  >
                    + 키워드 추가
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-4">
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
              </>
            )}
          </CollapsibleSection>
        ))}
      </div>
    </div>
  );
}