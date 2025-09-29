'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Check,
  Clock,
  BookOpen,
  Edit3,
  MessageSquare,
  Save,
  X,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SubjectPlan, UpdateSubjectRequest } from '@/lib/types/study-plan';

interface EnhancedSubjectCardProps {
  subject: SubjectPlan;
  onToggleComplete: () => void;
  onAddReflection: (reflection: string) => void;
  onUpdateSubject: (updates: UpdateSubjectRequest) => Promise<boolean>;
  onDeleteSubject?: (subjectId: string) => Promise<boolean>;
}

export default function EnhancedSubjectCard({
  subject,
  onToggleComplete,
  onAddReflection,
  onUpdateSubject,
  onDeleteSubject,
}: EnhancedSubjectCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    subject: subject.subject,
    content: subject.content,
    startTime: subject.startTime,
    endTime: subject.endTime,
  });
  const [isSaving, setIsSaving] = useState(false);

  const subjectInputRef = useRef<HTMLInputElement>(null);

  // 편집 모드 시작
  const startEditing = () => {
    setIsEditing(true);
    setEditData({
      subject: subject.subject,
      content: subject.content,
      startTime: subject.startTime,
      endTime: subject.endTime,
    });
  };

  // 편집 취소
  const cancelEditing = () => {
    setIsEditing(false);
    setEditData({
      subject: subject.subject,
      content: subject.content,
      startTime: subject.startTime,
      endTime: subject.endTime,
    });
  };

  // 변경사항 저장
  const saveChanges = async () => {
    if (!editData.subject.trim() || !editData.content.trim()) {
      return;
    }

    setIsSaving(true);
    try {
      const success = await onUpdateSubject(editData);
      if (success) {
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating subject:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // 편집 모드에서 Enter 키 처리
  const handleKeyPress = (e: React.KeyboardEvent, field: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (field === 'content') {
        saveChanges();
      } else {
        // 다음 필드로 포커스 이동
        const form = e.currentTarget.closest('form');
        if (form) {
          const elements = Array.from(form.elements) as HTMLElement[];
          const currentIndex = elements.indexOf(e.currentTarget as HTMLElement);
          const nextElement = elements[currentIndex + 1] as HTMLInputElement;
          if (nextElement) {
            nextElement.focus();
          }
        }
      }
    }
    if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  // 포커스 관리
  useEffect(() => {
    if (isEditing && subjectInputRef.current) {
      subjectInputRef.current.focus();
      subjectInputRef.current.select();
    }
  }, [isEditing]);

  // 시간 계산
  const calculateDuration = (start: string, end: string) => {
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);

    const totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0 && minutes > 0) {
      return `${hours}시간 ${minutes}분`;
    } else if (hours > 0) {
      return `${hours}시간`;
    } else {
      return `${minutes}분`;
    }
  };

  // 시간 유효성 검증
  const isValidTimeRange = (start: string, end: string) => {
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    return startMinutes < endMinutes;
  };

  const isValidData = editData.subject.trim() &&
                     editData.content.trim() &&
                     isValidTimeRange(editData.startTime, editData.endTime);

  return (
    <motion.div
        whileHover={{ scale: isEditing ? 1 : 1.01 }}
        className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all ${
          subject.completed ? 'opacity-75' : ''
        } ${isEditing ? 'ring-2 ring-blue-500' : ''}`}
      >
        <div className="p-6">
          {isEditing ? (
            // 편집 모드
            <form onSubmit={(e) => { e.preventDefault(); saveChanges(); }}>
              <div className="space-y-4">
                {/* 과목명 편집 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    과목명
                  </label>
                  <input
                    ref={subjectInputRef}
                    type="text"
                    value={editData.subject}
                    onChange={(e) => setEditData({ ...editData, subject: e.target.value })}
                    onKeyDown={(e) => handleKeyPress(e, 'subject')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="과목명을 입력하세요"
                  />
                </div>

                {/* 학습 내용 편집 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    학습 내용
                  </label>
                  <input
                    type="text"
                    value={editData.content}
                    onChange={(e) => setEditData({ ...editData, content: e.target.value })}
                    onKeyDown={(e) => handleKeyPress(e, 'content')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="학습 내용을 입력하세요"
                  />
                </div>

                {/* 시간 편집 */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      시작 시간
                    </label>
                    <input
                      type="time"
                      value={editData.startTime}
                      onChange={(e) => setEditData({ ...editData, startTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      종료 시간
                    </label>
                    <input
                      type="time"
                      value={editData.endTime}
                      onChange={(e) => setEditData({ ...editData, endTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* 시간 유효성 오류 표시 */}
                {!isValidTimeRange(editData.startTime, editData.endTime) && (
                  <p className="text-sm text-red-600">
                    시작 시간은 종료 시간보다 이전이어야 합니다.
                  </p>
                )}

                {/* 편집 버튼 */}
                <div className="flex gap-2 pt-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={!isValidData || isSaving}
                    className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>저장 중...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>저장</span>
                      </>
                    )}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={cancelEditing}
                    disabled={isSaving}
                    className="py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    <span>취소</span>
                  </motion.button>
                </div>
              </div>
            </form>
          ) : (
            // 일반 보기 모드
            <>
              <div className="flex items-start justify-between mb-4">
                {/* Subject Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className={`text-xl font-bold ${
                      subject.completed ? 'text-gray-500 line-through' : 'text-gray-800'
                    }`}>
                      {subject.subject}
                    </h3>
                    {subject.completed && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-semibold">
                        완료
                      </span>
                    )}
                  </div>

                  <p className="text-gray-600 mb-3 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    {subject.content}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {subject.startTime} - {subject.endTime}
                    </span>
                    <span className="text-blue-600 font-medium">
                      {calculateDuration(subject.startTime, subject.endTime)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {/* Edit Button */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={startEditing}
                    className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    title="편집"
                  >
                    <Edit3 className="w-4 h-4 text-gray-600" />
                  </motion.button>


                  {/* Complete Button */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onToggleComplete}
                    className={`p-2 rounded-lg transition-colors ${
                      subject.completed
                        ? 'bg-green-100 hover:bg-green-200'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                    title={subject.completed ? '완료 취소' : '완료로 표시'}
                  >
                    <Check className={`w-5 h-5 ${
                      subject.completed ? 'text-green-600' : 'text-gray-400'
                    }`} />
                  </motion.button>
                </div>
              </div>

              {/* Reflection Section */}
              {subject.reflection && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 p-4 bg-blue-50 rounded-lg"
                >
                  <div className="flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-600 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-blue-700 mb-1">회고</p>
                      <p className="text-sm text-gray-700">{subject.reflection}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </div>
      </motion.div>
    );
  }