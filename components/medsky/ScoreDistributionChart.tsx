'use client';

import React, { useState } from 'react';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { AIScoreAnalysis } from '@/types/medsky-enhanced';

interface ScoreDistributionChartProps {
  data: AIScoreAnalysis;
  editable?: boolean;
  onSave?: (data: AIScoreAnalysis) => Promise<void>;
}

export function ScoreDistributionChart({ data, editable = false, onSave }: ScoreDistributionChartProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(data);
  const [isSaving, setIsSaving] = useState(false);

  // Prepare radar chart data for competency balance
  const competencyData = [
    { competency: '학업', value: editedData.competency_balance.academic, fullMark: 100 },
    { competency: '진로', value: editedData.competency_balance.career, fullMark: 100 },
    { competency: '공동체', value: editedData.competency_balance.community, fullMark: 100 },
    { competency: '창의', value: editedData.competency_balance.creativity, fullMark: 100 },
    { competency: '인성', value: editedData.competency_balance.character, fullMark: 100 },
  ];

  // Prepare bar chart data for section scores
  const sectionScoresData = editedData.section_scores.map(section => ({
    name: section.section_name,
    점수: section.score,
    깊이: section.criteria_scores.depth || 0,
    연관성: section.criteria_scores.relevance || 0,
    성장: section.criteria_scores.growth || 0,
    독창성: section.criteria_scores.uniqueness || 0,
    리더십: section.criteria_scores.leadership || 0,
  }));

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#10b981'; // green-500
    if (score >= 80) return '#3b82f6'; // blue-500
    if (score >= 70) return '#eab308'; // yellow-500
    if (score >= 60) return '#f97316'; // orange-500
    return '#ef4444'; // red-500
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

  const handleScoreChange = (field: keyof typeof editedData, value: number) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCompetencyChange = (competency: keyof typeof editedData.competency_balance, value: number) => {
    setEditedData(prev => ({
      ...prev,
      competency_balance: {
        ...prev.competency_balance,
        [competency]: value
      }
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header with Edit Controls */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200" glass={false}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center">
              <span className="text-white text-lg">📊</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">점수 분포 분석</h2>
              <p className="text-sm text-gray-600">대학 입학사정관 관점의 다기준 평가</p>
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

      {/* Overall Score Summary */}
      <Card className="p-4 md:p-6" glass={false}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6">
          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">종합 점수</div>
            {isEditing ? (
              <input
                type="number"
                className="w-24 text-3xl md:text-4xl font-bold text-center border rounded px-2 py-1"
                style={{ color: getScoreColor(editedData.overall_score) }}
                value={editedData.overall_score}
                min={0}
                max={100}
                onChange={(e) => handleScoreChange('overall_score', Number(e.target.value))}
              />
            ) : (
              <div className="text-3xl md:text-4xl font-bold" style={{ color: getScoreColor(editedData.overall_score) }}>
                {editedData.overall_score}
              </div>
            )}
          </div>

          <div className="text-center p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">등급</div>
            <div className="text-2xl md:text-3xl font-bold text-indigo-600">
              {editedData.grade_equivalent}
            </div>
          </div>

          <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">예상 위치</div>
            <div className="text-2xl md:text-3xl font-bold text-purple-600">
              상위 {100 - editedData.percentile_rank}%
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
          <p className="text-sm md:text-base text-gray-700 whitespace-pre-wrap">
            {editedData.overall_feedback}
          </p>
        </div>
      </Card>

      {/* Competency Balance Radar Chart */}
      <Card className="p-4 md:p-6" glass={false}>
        <h3 className="text-base md:text-lg font-semibold mb-4 flex items-center">
          <span className="mr-2">🎯</span>
          역량별 균형 분석
        </h3>

        <div className="h-64 md:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={competencyData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis
                dataKey="competency"
                tick={{ fill: '#6b7280', fontSize: 12 }}
              />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Radar
                name="역량 점수"
                dataKey="value"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.6}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem'
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Edit Mode: Competency Sliders */}
        {isEditing && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(editedData.competency_balance).map(([key, value]) => {
              const labels: Record<string, string> = {
                academic: '학업역량',
                career: '진로역량',
                community: '공동체역량',
                creativity: '창의역량',
                character: '인성역량'
              };
              return (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <label className="font-medium text-gray-700">{labels[key]}</label>
                    <span className="text-gray-600">{value}점</span>
                  </div>
                  <input
                    type="range"
                    className="w-full"
                    min={0}
                    max={100}
                    value={value}
                    onChange={(e) => handleCompetencyChange(key as keyof typeof editedData.competency_balance, Number(e.target.value))}
                  />
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Section Scores Bar Chart */}
      <Card className="p-4 md:p-6" glass={false}>
        <h3 className="text-base md:text-lg font-semibold mb-4 flex items-center">
          <span className="mr-2">📈</span>
          섹션별 점수 분포
        </h3>

        <div className="h-64 md:h-80 overflow-x-auto">
          <ResponsiveContainer width="100%" height="100%" minWidth={300}>
            <BarChart data={sectionScoresData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                tick={{ fill: '#6b7280', fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
              <Bar dataKey="점수" radius={[8, 8, 0, 0]}>
                {sectionScoresData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getScoreColor(entry.점수)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Score Legend */}
        <div className="mt-6 flex flex-wrap gap-3 justify-center text-xs md:text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-gray-600">90+ 우수</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-gray-600">80-89 양호</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-gray-600">70-79 보통</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-gray-600">60-69 미흡</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-gray-600">60미만 개선필요</span>
          </div>
        </div>
      </Card>
    </div>
  );
}