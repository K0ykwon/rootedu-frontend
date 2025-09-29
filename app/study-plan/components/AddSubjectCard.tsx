'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Save, X, Clock, BookOpen } from 'lucide-react';
import type { CreateSubjectRequest } from '@/lib/types/study-plan';

interface AddSubjectCardProps {
  onCreateSubject: (subjectData: CreateSubjectRequest) => Promise<boolean>;
}

export default function AddSubjectCard({ onCreateSubject }: AddSubjectCardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    content: '',
    startTime: '',
    endTime: '',
  });

  // 폼 리셋
  const resetForm = () => {
    setFormData({
      subject: '',
      content: '',
      startTime: '',
      endTime: '',
    });
  };

  // 추가 모드 시작
  const startAdding = () => {
    setIsAdding(true);
    resetForm();

    // 기본값 설정 (현재 시간 기준)
    const now = new Date();
    const currentHour = now.getHours().toString().padStart(2, '0');
    const nextHour = (now.getHours() + 1).toString().padStart(2, '0');

    setFormData({
      subject: '',
      content: '',
      startTime: `${currentHour}:00`,
      endTime: `${nextHour}:00`,
    });
  };

  // 추가 취소
  const cancelAdding = () => {
    setIsAdding(false);
    resetForm();
  };

  // 새 과목 생성
  const createSubject = async () => {
    if (!isValidData) return;

    setIsCreating(true);
    try {
      const success = await onCreateSubject(formData);
      if (success) {
        setIsAdding(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error creating subject:', error);
    } finally {
      setIsCreating(false);
    }
  };

  // 키보드 이벤트 처리
  const handleKeyPress = (e: React.KeyboardEvent, field: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (field === 'content' && isValidData) {
        createSubject();
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
      cancelAdding();
    }
  };

  // 시간 유효성 검증
  const isValidTimeRange = (start: string, end: string) => {
    if (!start || !end) return false;
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    return startMinutes < endMinutes;
  };

  // 시간 계산
  const calculateDuration = (start: string, end: string) => {
    if (!isValidTimeRange(start, end)) return '';

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

  const isValidData = formData.subject.trim() &&
                     formData.content.trim() &&
                     isValidTimeRange(formData.startTime, formData.endTime);

  return (
    <AnimatePresence>
      {isAdding ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-md border-2 border-blue-500"
        >
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Plus className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-bold text-gray-800">새 학습 계획 추가</h3>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); createSubject(); }}>
              <div className="space-y-4">
                {/* 과목명 입력 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    과목명 *
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    onKeyDown={(e) => handleKeyPress(e, 'subject')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="예: 수학, 영어, 국어"
                    autoFocus
                  />
                </div>

                {/* 학습 내용 입력 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    학습 내용 *
                  </label>
                  <input
                    type="text"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    onKeyDown={(e) => handleKeyPress(e, 'content')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="예: 미적분 복습, 영문법 학습"
                  />
                </div>

                {/* 시간 입력 */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      시작 시간 *
                    </label>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      종료 시간 *
                    </label>
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* 계산된 시간 표시 */}
                {isValidTimeRange(formData.startTime, formData.endTime) && (
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <Clock className="w-4 h-4" />
                    <span>학습 시간: {calculateDuration(formData.startTime, formData.endTime)}</span>
                  </div>
                )}

                {/* 시간 유효성 오류 표시 */}
                {formData.startTime && formData.endTime && !isValidTimeRange(formData.startTime, formData.endTime) && (
                  <p className="text-sm text-red-600 flex items-center gap-2">
                    <X className="w-4 h-4" />
                    시작 시간은 종료 시간보다 이전이어야 합니다.
                  </p>
                )}

                {/* 버튼 */}
                <div className="flex gap-2 pt-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={!isValidData || isCreating}
                    className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium"
                  >
                    {isCreating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>추가 중...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>추가하기</span>
                      </>
                    )}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={cancelAdding}
                    disabled={isCreating}
                    className="py-3 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    <span>취소</span>
                  </motion.button>
                </div>
              </div>
            </form>
          </div>
        </motion.div>
      ) : (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={startAdding}
          className="w-full bg-white border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-xl p-8 transition-colors group"
        >
          <div className="flex flex-col items-center gap-3 text-gray-500 group-hover:text-blue-600">
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="p-3 bg-gray-100 group-hover:bg-blue-100 rounded-full transition-colors"
            >
              <Plus className="w-6 h-6" />
            </motion.div>
            <div className="text-center">
              <p className="font-medium">새 학습 계획 추가</p>
              <p className="text-sm text-gray-400">과목과 학습 내용을 추가해보세요</p>
            </div>
          </div>
        </motion.button>
      )}
    </AnimatePresence>
  );
}