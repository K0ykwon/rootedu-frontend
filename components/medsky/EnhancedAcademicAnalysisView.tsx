'use client';

import React, { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { EnhancedAcademicAnalysis } from '@/types/medsky-enhanced';
import { ArrayEditor } from './ArrayEditor';
import { CollapsibleSection } from './CollapsibleSection';

interface EnhancedAcademicAnalysisViewProps {
  data: EnhancedAcademicAnalysis;
  editable?: boolean;
  onSave?: (data: EnhancedAcademicAnalysis) => Promise<void>;
}

const TREND_OPTIONS = ['상승', '하락', '유지', '불안정'] as const;
const POSITION_OPTIONS = ['상위권', '중상위권', '중위권', '중하위권', '하위권'] as const;

export function EnhancedAcademicAnalysisView({ data, editable = false, onSave }: EnhancedAcademicAnalysisViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(data);
  const [isSaving, setIsSaving] = useState(false);

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

  // Subject handlers
  const handleSubjectChange = (index: number, field: string, value: any) => {
    setEditedData(prev => ({
      ...prev,
      subject_analysis: prev.subject_analysis.map((subject, i) =>
        i === index ? { ...subject, [field]: value } : subject
      )
    }));
  };

  const handleGradeAnalysisChange = (subjectIdx: number, field: string, value: string) => {
    setEditedData(prev => ({
      ...prev,
      subject_analysis: prev.subject_analysis.map((subject, i) =>
        i === subjectIdx
          ? {
              ...subject,
              grade_analysis: {
                ...subject.grade_analysis,
                [field]: value
              }
            }
          : subject
      )
    }));
  };

  const handleAddSubject = () => {
    setEditedData(prev => ({
      ...prev,
      subject_analysis: [
        ...prev.subject_analysis,
        {
          subject: '',
          semester: null,
          performance_trend: '유지',
          grade_analysis: {
            raw_score: '',
            achievement_level: '',
            rank_grade: '',
            relative_position: '중위권'
          },
          strengths: [''],
          improvements_needed: [''],
          college_readiness: 50
        }
      ]
    }));
  };

  const handleRemoveSubject = (index: number) => {
    if (editedData.subject_analysis.length === 1) return;
    setEditedData(prev => ({
      ...prev,
      subject_analysis: prev.subject_analysis.filter((_, i) => i !== index)
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
              <span className="text-white text-lg">🎓</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">AI 향상된 학업 분석</h2>
              <p className="text-sm text-gray-600">석차등급과 성취도를 활용한 종합적 학업 성취 분석</p>
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

      {/* Overall Academic Trends - Read-only for now, can be made editable if needed */}
      <Card className="p-6" glass={false}>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <span className="mr-2">📈</span>
          전체 학업 추세
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 border rounded-lg">
            <div className={`text-lg font-semibold px-3 py-1 rounded-full ${getTrendColor(displayData.overall_academic_trends.gpa_trend)}`}>
              {displayData.overall_academic_trends.gpa_trend}
            </div>
            <div className="text-sm text-gray-600 mt-2">성적 추세</div>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <div className="text-lg font-semibold text-blue-600">
              {Math.round(displayData.overall_academic_trends.grade_consistency)}
            </div>
            <div className="text-sm text-gray-600 mt-2">성적 일관성</div>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <div className="text-lg font-semibold text-purple-600">
              {displayData.overall_academic_trends.improvement_rate > 0 ? '+' : ''}{displayData.overall_academic_trends.improvement_rate.toFixed(1)}
            </div>
            <div className="text-sm text-gray-600 mt-2">향상도</div>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <div className="text-lg font-semibold text-gray-700">
              {displayData.subject_analysis.length}
            </div>
            <div className="text-sm text-gray-600 mt-2">분석 과목 수</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-green-700 mb-2">강점 과목</h4>
            <div className="space-y-1">
              {displayData.overall_academic_trends.strong_subjects.map((subject, index) => (
                <span key={index} className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded text-sm mr-1 mb-1">
                  {subject}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-orange-700 mb-2">약점 과목</h4>
            <div className="space-y-1">
              {displayData.overall_academic_trends.weak_subjects.map((subject, index) => (
                <span key={index} className="inline-block px-2 py-1 bg-orange-100 text-orange-800 rounded text-sm mr-1 mb-1">
                  {subject}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* College Entrance Readiness - Read-only for now */}
      <Card className="p-6" glass={false}>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <span className="mr-2">🎯</span>
          대학 진학 준비도
        </h3>
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">전체 준비도</span>
            <span className={`text-lg font-semibold ${getReadinessColor(displayData.college_entrance_readiness.overall_readiness)}`}>
              {displayData.college_entrance_readiness.overall_readiness}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${displayData.college_entrance_readiness.overall_readiness}%` }}
            ></div>
          </div>
        </div>

        <div className="mb-4">
          <h4 className="font-semibold text-gray-700 mb-2">과목별 준비도</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(displayData.college_entrance_readiness.subject_readiness).map(([subject, readiness]) => (
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
            {isEditing ? (
              <textarea
                className="w-full text-sm text-gray-700 bg-blue-50 p-3 rounded border"
                value={editedData.college_entrance_readiness.competitive_position}
                onChange={(e) => setEditedData(prev => ({
                  ...prev,
                  college_entrance_readiness: {
                    ...prev.college_entrance_readiness,
                    competitive_position: e.target.value
                  }
                }))}
                rows={3}
              />
            ) : (
              <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded">
                {displayData.college_entrance_readiness.competitive_position}
              </p>
            )}
          </div>
          <div>
            <h4 className="font-semibold text-purple-700 mb-2">개선 제안</h4>
            {isEditing ? (
              <ArrayEditor
                label=""
                items={editedData.college_entrance_readiness.recommendations}
                onChange={(items) => setEditedData(prev => ({
                  ...prev,
                  college_entrance_readiness: {
                    ...prev.college_entrance_readiness,
                    recommendations: items
                  }
                }))}
                multiline
                placeholder="제안 입력"
                addButtonText="+ 제안 추가"
              />
            ) : (
              <ul className="space-y-1">
                {displayData.college_entrance_readiness.recommendations.map((recommendation, index) => (
                  <li key={index} className="text-sm text-gray-700 flex items-start">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    {recommendation}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Card>

      {/* Subject Analysis */}
      <Card className="p-6" glass={false}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <span className="mr-2">📚</span>
            과목별 상세 분석
          </h3>
        </div>

        <div className="space-y-4">
          {displayData.subject_analysis.map((subject, index) => (
            <CollapsibleSection
              key={index}
              title={isEditing ? `과목 ${index + 1}` : subject.subject}
              defaultOpen={isEditing}
              headerActions={
                isEditing && (
                  <button
                    onClick={() => handleRemoveSubject(index)}
                    className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                    disabled={editedData.subject_analysis.length === 1}
                  >
                    삭제
                  </button>
                )
              }
            >
              {isEditing ? (
                <div className="space-y-4">
                  {/* Subject Name and Semester */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">과목명</label>
                      <input
                        type="text"
                        className="w-full text-sm border rounded px-3 py-2"
                        value={editedData.subject_analysis[index].subject}
                        onChange={(e) => handleSubjectChange(index, 'subject', e.target.value)}
                        placeholder="과목명 입력"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">학기</label>
                      <input
                        type="text"
                        className="w-full text-sm border rounded px-3 py-2"
                        value={editedData.subject_analysis[index].semester || ''}
                        onChange={(e) => handleSubjectChange(index, 'semester', e.target.value || null)}
                        placeholder="학기 입력 (예: 1학년 1학기)"
                      />
                    </div>
                  </div>

                  {/* Performance Trend and College Readiness */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">성취 추세</label>
                      <select
                        className="w-full text-sm border rounded px-3 py-2"
                        value={editedData.subject_analysis[index].performance_trend}
                        onChange={(e) => handleSubjectChange(index, 'performance_trend', e.target.value)}
                      >
                        {TREND_OPTIONS.map(trend => (
                          <option key={trend} value={trend}>{trend}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        대학 진학 준비도: {editedData.subject_analysis[index].college_readiness}%
                      </label>
                      <input
                        type="number"
                        className="w-full text-sm border rounded px-3 py-2"
                        min={0}
                        max={100}
                        value={editedData.subject_analysis[index].college_readiness}
                        onChange={(e) => handleSubjectChange(index, 'college_readiness', Number(e.target.value))}
                      />
                    </div>
                  </div>

                  {/* Grade Analysis */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">성적 분석</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div>
                        <label className="text-xs text-gray-600 mb-1 block">원점수/평균</label>
                        <input
                          type="text"
                          className="w-full text-sm border rounded px-2 py-1"
                          value={editedData.subject_analysis[index].grade_analysis.raw_score}
                          onChange={(e) => handleGradeAnalysisChange(index, 'raw_score', e.target.value)}
                          placeholder="예: 85/75"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 mb-1 block">성취도</label>
                        <input
                          type="text"
                          className="w-full text-sm border rounded px-2 py-1"
                          value={editedData.subject_analysis[index].grade_analysis.achievement_level}
                          onChange={(e) => handleGradeAnalysisChange(index, 'achievement_level', e.target.value)}
                          placeholder="예: A"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 mb-1 block">석차등급</label>
                        <input
                          type="text"
                          className="w-full text-sm border rounded px-2 py-1"
                          value={editedData.subject_analysis[index].grade_analysis.rank_grade}
                          onChange={(e) => handleGradeAnalysisChange(index, 'rank_grade', e.target.value)}
                          placeholder="예: 2등급"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 mb-1 block">상대적 위치</label>
                        <select
                          className="w-full text-sm border rounded px-2 py-1"
                          value={editedData.subject_analysis[index].grade_analysis.relative_position}
                          onChange={(e) => handleGradeAnalysisChange(index, 'relative_position', e.target.value)}
                        >
                          {POSITION_OPTIONS.map(pos => (
                            <option key={pos} value={pos}>{pos}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Strengths */}
                  <ArrayEditor
                    label="강점"
                    items={editedData.subject_analysis[index].strengths}
                    onChange={(items) => handleSubjectChange(index, 'strengths', items)}
                    multiline
                    placeholder="강점 입력"
                    addButtonText="+ 강점 추가"
                  />

                  {/* Improvements Needed */}
                  <ArrayEditor
                    label="개선 필요"
                    items={editedData.subject_analysis[index].improvements_needed}
                    onChange={(items) => handleSubjectChange(index, 'improvements_needed', items)}
                    multiline
                    placeholder="개선점 입력"
                    addButtonText="+ 개선점 추가"
                  />
                </div>
              ) : (
                <div>
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
                </div>
              )}
            </CollapsibleSection>
          ))}

          {isEditing && (
            <button
              onClick={handleAddSubject}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
            >
              + 과목 추가
            </button>
          )}
        </div>
      </Card>
    </div>
  );
}