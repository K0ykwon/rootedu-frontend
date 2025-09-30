'use client';

import React, { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { NextSemesterPlan } from '@/types/medsky-enhanced';
import { CollapsibleSection } from './CollapsibleSection';
import { ArrayEditor } from './ArrayEditor';

interface NextSemesterPlanViewProps {
  data: NextSemesterPlan;
  editable?: boolean;
  onSave?: (data: NextSemesterPlan) => Promise<void>;
}

export function NextSemesterPlanView({ data, editable = false, onSave }: NextSemesterPlanViewProps) {
  const [activeTab, setActiveTab] = useState<'academic' | 'character' | 'documentation'>('academic');
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(data);
  const [isSaving, setIsSaving] = useState(false);

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

  // Priority subject handlers
  const handlePrioritySubjectChange = (index: number, field: string, value: any) => {
    setEditedData(prev => ({
      ...prev,
      academic_plan: {
        ...prev.academic_plan,
        priority_subjects: prev.academic_plan.priority_subjects.map((subj, i) =>
          i === index ? { ...subj, [field]: value } : subj
        )
      }
    }));
  };

  const handleAddPrioritySubject = () => {
    setEditedData(prev => ({
      ...prev,
      academic_plan: {
        ...prev.academic_plan,
        priority_subjects: [
          ...prev.academic_plan.priority_subjects,
          {
            subject: '',
            current_level: '',
            target_improvement: '',
            specific_strategies: [''],
            time_allocation: ''
          }
        ]
      }
    }));
  };

  const handleRemovePrioritySubject = (index: number) => {
    setEditedData(prev => ({
      ...prev,
      academic_plan: {
        ...prev.academic_plan,
        priority_subjects: prev.academic_plan.priority_subjects.filter((_, i) => i !== index)
      }
    }));
  };

  // Extracurricular handlers
  const handleExtracurricularChange = (index: number, field: string, value: any) => {
    setEditedData(prev => ({
      ...prev,
      academic_plan: {
        ...prev.academic_plan,
        extracurricular_recommendations: prev.academic_plan.extracurricular_recommendations.map((activity, i) =>
          i === index ? { ...activity, [field]: value } : activity
        )
      }
    }));
  };

  const handleAddExtracurricular = () => {
    setEditedData(prev => ({
      ...prev,
      academic_plan: {
        ...prev.academic_plan,
        extracurricular_recommendations: [
          ...prev.academic_plan.extracurricular_recommendations,
          {
            activity_type: '',
            specific_activities: [''],
            purpose: '',
            documentation_tips: ['']
          }
        ]
      }
    }));
  };

  const handleRemoveExtracurricular = (index: number) => {
    setEditedData(prev => ({
      ...prev,
      academic_plan: {
        ...prev.academic_plan,
        extracurricular_recommendations: prev.academic_plan.extracurricular_recommendations.filter((_, i) => i !== index)
      }
    }));
  };

  // Timeline handlers
  const handleTimelineChange = (index: number, field: string, value: any) => {
    setEditedData(prev => ({
      ...prev,
      academic_plan: {
        ...prev.academic_plan,
        timeline: prev.academic_plan.timeline.map((period, i) =>
          i === index ? { ...period, [field]: value } : period
        )
      }
    }));
  };

  const handleAddTimeline = () => {
    setEditedData(prev => ({
      ...prev,
      academic_plan: {
        ...prev.academic_plan,
        timeline: [
          ...prev.academic_plan.timeline,
          {
            period: '',
            tasks: ['']
          }
        ]
      }
    }));
  };

  const handleRemoveTimeline = (index: number) => {
    setEditedData(prev => ({
      ...prev,
      academic_plan: {
        ...prev.academic_plan,
        timeline: prev.academic_plan.timeline.filter((_, i) => i !== index)
      }
    }));
  };

  const displayData = isEditing ? editedData : data;

  const getLevelColor = (level: string) => {
    if (level.includes('상위') || level.includes('우수')) return 'text-green-600 bg-green-50';
    if (level.includes('중위') || level.includes('보통')) return 'text-blue-600 bg-blue-50';
    if (level.includes('하위') || level.includes('부족')) return 'text-orange-600 bg-orange-50';
    return 'text-gray-600 bg-gray-50';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200" glass={false}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
              <span className="text-white text-lg">📋</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">AI 차학기 학습 계획</h2>
              <p className="text-sm text-gray-600">개인 맞춤형 학습 전략 및 역량 개발 로드맵</p>
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

      {/* Tab Navigation */}
      <Card className="p-1" glass={false}>
        <nav className="flex gap-2">
          {[
            { id: 'academic', name: '학업 계획', icon: '📚', description: '과목별 학습 전략' },
            { id: 'character', name: '역량 개발', icon: '💪', description: '인성 및 역량 강화' },
            { id: 'documentation', name: '기록 전략', icon: '📝', description: '생활기록부 작성 가이드' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                flex-1 px-4 py-3 text-sm font-medium rounded-md transition-colors flex items-center justify-center space-x-2
                ${activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-md'
                  : 'text-purple-600 hover:text-purple-800 hover:bg-purple-50 border border-purple-200'
                }
              `}
              title={tab.description}
            >
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </Card>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {activeTab === 'academic' && (
          <div className="space-y-6">
            {/* Semester Goals */}
            <Card className="p-6" glass={false}>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <span className="mr-2">🎯</span>
                차학기 목표
              </h3>
              {isEditing ? (
                <ArrayEditor
                  label=""
                  items={editedData.academic_plan.semester_goals}
                  onChange={(items) => setEditedData(prev => ({
                    ...prev,
                    academic_plan: { ...prev.academic_plan, semester_goals: items }
                  }))}
                  placeholder="목표 입력"
                  addButtonText="+ 목표 추가"
                />
              ) : (
                <ul className="space-y-2">
                  {displayData.academic_plan.semester_goals.map((goal, index) => (
                    <li key={index} className="flex items-start">
                      <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                        {index + 1}
                      </span>
                      <span className="text-gray-700">{goal}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* Priority Subjects */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                <span className="mr-2">📖</span>
                우선 개선 과목
              </h3>
              {isEditing ? (
                <div className="space-y-4">
                  {editedData.academic_plan.priority_subjects.map((subject, index) => (
                    <CollapsibleSection
                      key={index}
                      title={`과목 ${index + 1}: ${subject.subject || '과목명 미입력'}`}
                      defaultOpen={false}
                      headerActions={
                        <button
                          onClick={() => handleRemovePrioritySubject(index)}
                          className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                        >
                          삭제
                        </button>
                      }
                    >
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">과목명</label>
                            <input
                              type="text"
                              className="w-full text-sm border rounded px-3 py-2"
                              value={subject.subject}
                              onChange={(e) => handlePrioritySubjectChange(index, 'subject', e.target.value)}
                              placeholder="과목명 입력"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">현재 수준</label>
                            <input
                              type="text"
                              className="w-full text-sm border rounded px-3 py-2"
                              value={subject.current_level}
                              onChange={(e) => handlePrioritySubjectChange(index, 'current_level', e.target.value)}
                              placeholder="현재 수준 입력"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">목표 개선</label>
                            <input
                              type="text"
                              className="w-full text-sm border rounded px-3 py-2"
                              value={subject.target_improvement}
                              onChange={(e) => handlePrioritySubjectChange(index, 'target_improvement', e.target.value)}
                              placeholder="목표 개선 입력"
                            />
                          </div>
                        </div>

                        <ArrayEditor
                          label="학습 전략"
                          items={subject.specific_strategies}
                          onChange={(items) => handlePrioritySubjectChange(index, 'specific_strategies', items)}
                          placeholder="전략 입력"
                          multiline
                          addButtonText="+ 전략 추가"
                        />

                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-1 block">시간 배분</label>
                          <textarea
                            className="w-full text-sm border rounded px-3 py-2"
                            value={subject.time_allocation}
                            onChange={(e) => handlePrioritySubjectChange(index, 'time_allocation', e.target.value)}
                            placeholder="시간 배분 계획 입력"
                            rows={2}
                          />
                        </div>
                      </div>
                    </CollapsibleSection>
                  ))}
                  <button
                    onClick={handleAddPrioritySubject}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
                  >
                    + 우선 개선 과목 추가
                  </button>
                </div>
              ) : (
                displayData.academic_plan.priority_subjects.map((subject, index) => (
                  <Card key={index} className="p-6" glass={false}>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">{subject.subject}</h4>
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getLevelColor(subject.current_level)}`}>
                          현재: {subject.current_level}
                        </span>
                        <span className="text-gray-400">→</span>
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                          목표: {subject.target_improvement}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-semibold text-blue-700 mb-2 flex items-center">
                          <span className="mr-1">📋</span>
                          학습 전략
                        </h5>
                        <ul className="space-y-1">
                          {subject.specific_strategies.map((strategy, idx) => (
                            <li key={idx} className="text-sm text-gray-700 flex items-start">
                              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                              {strategy}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-semibold text-purple-700 mb-2 flex items-center">
                          <span className="mr-1">⏰</span>
                          시간 배분
                        </h5>
                        <p className="text-sm text-gray-700 bg-purple-50 p-3 rounded">
                          {subject.time_allocation}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>

            {/* Timeline */}
            <Card className="p-6" glass={false}>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <span className="mr-2">📅</span>
                학기 타임라인
              </h3>
              {isEditing ? (
                <div className="space-y-4">
                  {editedData.academic_plan.timeline.map((period, index) => (
                    <CollapsibleSection
                      key={index}
                      title={`${period.period || '기간 미입력'}`}
                      defaultOpen={false}
                      headerActions={
                        <button
                          onClick={() => handleRemoveTimeline(index)}
                          className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                        >
                          삭제
                        </button>
                      }
                    >
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-1 block">기간</label>
                          <input
                            type="text"
                            className="w-full text-sm border rounded px-3 py-2"
                            value={period.period}
                            onChange={(e) => handleTimelineChange(index, 'period', e.target.value)}
                            placeholder="기간 입력 (예: 1-2주차)"
                          />
                        </div>
                        <ArrayEditor
                          label="할 일"
                          items={period.tasks}
                          onChange={(items) => handleTimelineChange(index, 'tasks', items)}
                          placeholder="할 일 입력"
                          multiline
                          addButtonText="+ 할 일 추가"
                        />
                      </div>
                    </CollapsibleSection>
                  ))}
                  <button
                    onClick={handleAddTimeline}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
                  >
                    + 타임라인 추가
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {displayData.academic_plan.timeline.map((period, index) => (
                    <div key={index} className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-20 text-sm font-medium text-gray-600 pt-1">
                        {period.period}
                      </div>
                      <div className="flex-1">
                        <ul className="space-y-1">
                          {period.tasks.map((task, taskIndex) => (
                            <li key={taskIndex} className="text-sm text-gray-700 flex items-start">
                              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                              {task}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Extracurricular Recommendations */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                <span className="mr-2">🎨</span>
                비교과 활동 추천
              </h3>
              {isEditing ? (
                <div className="space-y-4">
                  {editedData.academic_plan.extracurricular_recommendations.map((activity, index) => (
                    <CollapsibleSection
                      key={index}
                      title={`활동 ${index + 1}: ${activity.activity_type || '활동명 미입력'}`}
                      defaultOpen={false}
                      headerActions={
                        <button
                          onClick={() => handleRemoveExtracurricular(index)}
                          className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                        >
                          삭제
                        </button>
                      }
                    >
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-1 block">활동 유형</label>
                          <input
                            type="text"
                            className="w-full text-sm border rounded px-3 py-2"
                            value={activity.activity_type}
                            onChange={(e) => handleExtracurricularChange(index, 'activity_type', e.target.value)}
                            placeholder="활동 유형 입력"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-1 block">목적</label>
                          <textarea
                            className="w-full text-sm border rounded px-3 py-2"
                            value={activity.purpose}
                            onChange={(e) => handleExtracurricularChange(index, 'purpose', e.target.value)}
                            placeholder="활동 목적 입력"
                            rows={2}
                          />
                        </div>
                        <ArrayEditor
                          label="구체적 활동"
                          items={activity.specific_activities}
                          onChange={(items) => handleExtracurricularChange(index, 'specific_activities', items)}
                          placeholder="구체적 활동 입력"
                          addButtonText="+ 활동 추가"
                        />
                        <ArrayEditor
                          label="기재 팁"
                          items={activity.documentation_tips}
                          onChange={(items) => handleExtracurricularChange(index, 'documentation_tips', items)}
                          placeholder="기재 팁 입력"
                          multiline
                          addButtonText="+ 팁 추가"
                        />
                      </div>
                    </CollapsibleSection>
                  ))}
                  <button
                    onClick={handleAddExtracurricular}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
                  >
                    + 비교과 활동 추가
                  </button>
                </div>
              ) : (
                displayData.academic_plan.extracurricular_recommendations.map((activity, index) => (
                  <Card key={index} className="p-6" glass={false}>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">{activity.activity_type}</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded mb-4">
                      {activity.purpose}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-semibold text-green-700 mb-2">구체적 활동</h5>
                        <div className="space-y-1">
                          {activity.specific_activities.map((specificActivity, idx) => (
                            <span key={idx} className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded text-xs mr-1 mb-1">
                              {specificActivity}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h5 className="font-semibold text-blue-700 mb-2">기재 팁</h5>
                        <ul className="space-y-1">
                          {activity.documentation_tips.map((tip, idx) => (
                            <li key={idx} className="text-xs text-gray-600 flex items-start">
                              <span className="w-1 h-1 bg-blue-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>

            {/* Success Metrics & Checklist */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6" glass={false}>
                <h3 className="text-lg font-semibold mb-4 flex items-center text-green-700">
                  <span className="mr-2">✅</span>
                  준비 체크리스트
                </h3>
                {isEditing ? (
                  <ArrayEditor
                    label=""
                    items={editedData.academic_plan.preparation_checklist}
                    onChange={(items) => setEditedData(prev => ({
                      ...prev,
                      academic_plan: { ...prev.academic_plan, preparation_checklist: items }
                    }))}
                    placeholder="체크리스트 항목 입력"
                    multiline
                    addButtonText="+ 항목 추가"
                  />
                ) : (
                  <ul className="space-y-2">
                    {displayData.academic_plan.preparation_checklist.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <input type="checkbox" className="mt-1.5 mr-3" />
                        <span className="text-sm text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              <Card className="p-6" glass={false}>
                <h3 className="text-lg font-semibold mb-4 flex items-center text-blue-700">
                  <span className="mr-2">📊</span>
                  성공 측정 지표
                </h3>
                {isEditing ? (
                  <ArrayEditor
                    label=""
                    items={editedData.academic_plan.success_metrics}
                    onChange={(items) => setEditedData(prev => ({
                      ...prev,
                      academic_plan: { ...prev.academic_plan, success_metrics: items }
                    }))}
                    placeholder="측정 지표 입력"
                    multiline
                    addButtonText="+ 지표 추가"
                  />
                ) : (
                  <ul className="space-y-2">
                    {displayData.academic_plan.success_metrics.map((metric, index) => (
                      <li key={index} className="flex items-start">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span className="text-sm text-gray-700">{metric}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'character' && (
          <div className="space-y-6">
            {/* Target Competencies */}
            <Card className="p-6" glass={false}>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <span className="mr-2">🎯</span>
                개발 목표 역량
              </h3>
              {isEditing ? (
                <ArrayEditor
                  label=""
                  items={editedData.character_development.target_competencies}
                  onChange={(items) => setEditedData(prev => ({
                    ...prev,
                    character_development: { ...prev.character_development, target_competencies: items }
                  }))}
                  placeholder="목표 역량 입력"
                  addButtonText="+ 역량 추가"
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {displayData.character_development.target_competencies.map((competency, index) => (
                    <div key={index} className="p-4 border rounded-lg text-center hover:shadow-md transition-shadow">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-purple-600 text-sm">💪</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{competency}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Development Activities */}
            <Card className="p-6" glass={false}>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <span className="mr-2">🚀</span>
                역량 개발 활동
              </h3>
              {isEditing ? (
                <ArrayEditor
                  label=""
                  items={editedData.character_development.development_activities}
                  onChange={(items) => setEditedData(prev => ({
                    ...prev,
                    character_development: { ...prev.character_development, development_activities: items }
                  }))}
                  placeholder="개발 활동 입력"
                  multiline
                  addButtonText="+ 활동 추가"
                />
              ) : (
                <ul className="space-y-3">
                  {displayData.character_development.development_activities.map((activity, index) => (
                    <li key={index} className="flex items-start p-3 bg-blue-50 rounded-lg">
                      <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                        {index + 1}
                      </span>
                      <span className="text-gray-700">{activity}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* Reflection Questions */}
            <Card className="p-6" glass={false}>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <span className="mr-2">🤔</span>
                성찰 질문
              </h3>
              {isEditing ? (
                <ArrayEditor
                  label=""
                  items={editedData.character_development.reflection_questions}
                  onChange={(items) => setEditedData(prev => ({
                    ...prev,
                    character_development: { ...prev.character_development, reflection_questions: items }
                  }))}
                  placeholder="성찰 질문 입력"
                  multiline
                  addButtonText="+ 질문 추가"
                />
              ) : (
                <div className="space-y-4">
                  {displayData.character_development.reflection_questions.map((question, index) => (
                    <div key={index} className="p-4 border-l-4 border-purple-400 bg-purple-50">
                      <p className="text-gray-700 font-medium">{question}</p>
                      <textarea
                        className="w-full mt-2 p-2 border rounded text-sm"
                        rows={3}
                        placeholder="여기에 답변을 작성해보세요..."
                      />
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {activeTab === 'documentation' && (
          <div className="space-y-6">
            {/* Monthly Goals */}
            <Card className="p-6" glass={false}>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <span className="mr-2">📅</span>
                월별 기록 목표
              </h3>
              {isEditing ? (
                <ArrayEditor
                  label=""
                  items={editedData.documentation_strategy.monthly_goals}
                  onChange={(items) => setEditedData(prev => ({
                    ...prev,
                    documentation_strategy: { ...prev.documentation_strategy, monthly_goals: items }
                  }))}
                  placeholder="월별 목표 입력"
                  multiline
                  addButtonText="+ 목표 추가"
                />
              ) : (
                <ul className="space-y-2">
                  {displayData.documentation_strategy.monthly_goals.map((goal, index) => (
                    <li key={index} className="flex items-start p-3 border rounded-lg">
                      <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                        {index + 1}
                      </span>
                      <span className="text-gray-700">{goal}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* Writing Tips */}
            <Card className="p-6" glass={false}>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <span className="mr-2">✍️</span>
                생활기록부 작성 팁
              </h3>
              {isEditing ? (
                <ArrayEditor
                  label=""
                  items={editedData.documentation_strategy.writing_tips}
                  onChange={(items) => setEditedData(prev => ({
                    ...prev,
                    documentation_strategy: { ...prev.documentation_strategy, writing_tips: items }
                  }))}
                  placeholder="작성 팁 입력"
                  multiline
                  addButtonText="+ 팁 추가"
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {displayData.documentation_strategy.writing_tips.map((tip, index) => (
                    <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-start">
                        <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                          💡
                        </span>
                        <span className="text-sm text-gray-700">{tip}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Evidence Collection */}
            <Card className="p-6" glass={false}>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <span className="mr-2">📎</span>
                근거 자료 수집 방법
              </h3>
              {isEditing ? (
                <ArrayEditor
                  label=""
                  items={editedData.documentation_strategy.evidence_collection}
                  onChange={(items) => setEditedData(prev => ({
                    ...prev,
                    documentation_strategy: { ...prev.documentation_strategy, evidence_collection: items }
                  }))}
                  placeholder="수집 방법 입력"
                  multiline
                  addButtonText="+ 방법 추가"
                />
              ) : (
                <div className="space-y-3">
                  {displayData.documentation_strategy.evidence_collection.map((method, index) => (
                    <div key={index} className="p-4 bg-orange-50 border-l-4 border-orange-400 rounded-r-lg">
                      <div className="flex items-start">
                        <span className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                          📋
                        </span>
                        <span className="text-gray-700">{method}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}