'use client';

import React, { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { AIScoreAnalysis } from '@/types/medsky-enhanced';
import { ScoreDistributionChart } from './ScoreDistributionChart';
import { ArrayEditor } from './ArrayEditor';
import { CollapsibleSection } from './CollapsibleSection';

interface AISectionScoringViewProps {
  data: AIScoreAnalysis;
  editable?: boolean;
  onSave?: (data: AIScoreAnalysis) => Promise<void>;
}

export function AISectionScoringView({ data, editable = false, onSave }: AISectionScoringViewProps) {
  const [isEditingSections, setIsEditingSections] = useState(false);
  const [editedData, setEditedData] = useState(data);
  const [isSaving, setIsSaving] = useState(false);

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

  const handleSave = async () => {
    if (!onSave) return;
    setIsSaving(true);
    try {
      await onSave(editedData);
      setIsEditingSections(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedData(data);
    setIsEditingSections(false);
  };

  // Section handlers
  const handleSectionChange = (index: number, field: string, value: any) => {
    setEditedData(prev => ({
      ...prev,
      section_scores: prev.section_scores.map((section, i) =>
        i === index ? { ...section, [field]: value } : section
      )
    }));
  };

  const handleCriteriaScoreChange = (sectionIdx: number, criteria: string, value: number) => {
    setEditedData(prev => ({
      ...prev,
      section_scores: prev.section_scores.map((section, i) =>
        i === sectionIdx
          ? {
              ...section,
              criteria_scores: {
                ...section.criteria_scores,
                [criteria]: value
              }
            }
          : section
      )
    }));
  };

  const handleAddSection = () => {
    setEditedData(prev => ({
      ...prev,
      section_scores: [
        ...prev.section_scores,
        {
          section_name: '',
          score: 0,
          criteria_scores: {
            depth: 0,
            relevance: 0,
            growth: 0,
            uniqueness: 0,
            leadership: 0
          },
          strengths: [''],
          weaknesses: [''],
          improvement_suggestions: [''],
          evidence_highlights: ['']
        }
      ]
    }));
  };

  const handleRemoveSection = (index: number) => {
    if (editedData.section_scores.length === 1) return;
    setEditedData(prev => ({
      ...prev,
      section_scores: prev.section_scores.filter((_, i) => i !== index)
    }));
  };

  const displayData = isEditingSections ? editedData : data;

  return (
    <div className="space-y-6">
      {/* Score Distribution Chart - handles overall scores editing */}
      <ScoreDistributionChart data={displayData} editable={editable} onSave={onSave} />

      {/* Section Scores */}
      <Card className="p-6" glass={false}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <span className="mr-2">📊</span>
            섹션별 상세 채점
          </h3>

          {editable && !isEditingSections && (
            <Button variant="outline" onClick={() => setIsEditingSections(true)}>
              섹션 수정하기
            </Button>
          )}

          {isEditingSections && (
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

        <div className="space-y-4">
          {displayData.section_scores.map((section, index) => (
            <CollapsibleSection
              key={index}
              title={isEditingSections ? `섹션 ${index + 1}` : section.section_name}
              defaultOpen={isEditingSections}
              headerActions={
                isEditingSections && (
                  <button
                    onClick={() => handleRemoveSection(index)}
                    className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                    disabled={editedData.section_scores.length === 1}
                  >
                    삭제
                  </button>
                )
              }
            >
              {isEditingSections ? (
                <div className="space-y-4">
                  {/* Section Name and Score */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">섹션명</label>
                      <input
                        type="text"
                        className="w-full text-sm border rounded px-3 py-2"
                        value={editedData.section_scores[index].section_name}
                        onChange={(e) => handleSectionChange(index, 'section_name', e.target.value)}
                        placeholder="섹션명 입력"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        총점: {editedData.section_scores[index].score}점
                      </label>
                      <input
                        type="number"
                        className="w-full text-sm border rounded px-3 py-2"
                        min={0}
                        max={100}
                        value={editedData.section_scores[index].score}
                        onChange={(e) => handleSectionChange(index, 'score', Number(e.target.value))}
                      />
                    </div>
                  </div>

                  {/* Criteria Scores */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">세부 기준 점수</label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {Object.entries(editedData.section_scores[index].criteria_scores).map(([criteria, score]) => (
                        <div key={criteria}>
                          <label className="text-xs text-gray-600 mb-1 block">{getCriteriaLabel(criteria)}</label>
                          <input
                            type="number"
                            className="w-full text-sm border rounded px-2 py-1 text-center"
                            min={0}
                            max={100}
                            value={score}
                            onChange={(e) => handleCriteriaScoreChange(index, criteria, Number(e.target.value))}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Strengths */}
                  <ArrayEditor
                    label="강점"
                    items={editedData.section_scores[index].strengths}
                    onChange={(items) => handleSectionChange(index, 'strengths', items)}
                    multiline
                    placeholder="강점 입력"
                    addButtonText="+ 강점 추가"
                  />

                  {/* Weaknesses */}
                  <ArrayEditor
                    label="약점"
                    items={editedData.section_scores[index].weaknesses}
                    onChange={(items) => handleSectionChange(index, 'weaknesses', items)}
                    multiline
                    placeholder="약점 입력"
                    addButtonText="+ 약점 추가"
                  />

                  {/* Improvement Suggestions */}
                  <ArrayEditor
                    label="개선 제안"
                    items={editedData.section_scores[index].improvement_suggestions}
                    onChange={(items) => handleSectionChange(index, 'improvement_suggestions', items)}
                    multiline
                    placeholder="개선 제안 입력"
                    addButtonText="+ 제안 추가"
                  />

                  {/* Evidence Highlights */}
                  <ArrayEditor
                    label="높은 평가 활동"
                    items={editedData.section_scores[index].evidence_highlights}
                    onChange={(items) => handleSectionChange(index, 'evidence_highlights', items)}
                    multiline
                    placeholder="활동 입력"
                    addButtonText="+ 활동 추가"
                  />
                </div>
              ) : (
                <div>
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
                    {section.evidence_highlights.length > 0 && section.evidence_highlights[0] !== '' && (
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
                </div>
              )}
            </CollapsibleSection>
          ))}

          {isEditingSections && (
            <button
              onClick={handleAddSection}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
            >
              + 섹션 추가
            </button>
          )}
        </div>
      </Card>
    </div>
  );
}