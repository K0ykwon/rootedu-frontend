'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Plus, X, BookOpen, Send, GripVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SubjectListInputProps {
  onSubmit: (subjects: string[]) => void;
  loading?: boolean;
  minSubjects?: number;
  maxSubjects?: number;
}

export default function SubjectListInput({
  onSubmit,
  loading = false,
  minSubjects = 1,
  maxSubjects = 8
}: SubjectListInputProps) {
  const [subjects, setSubjects] = useState<string[]>(['']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus on the last input when a new subject is added
  useEffect(() => {
    const lastIndex = subjects.length - 1;
    if (inputRefs.current[lastIndex] && subjects[lastIndex] === '') {
      inputRefs.current[lastIndex]?.focus();
    }
  }, [subjects.length]);

  const handleSubjectChange = (index: number, value: string) => {
    const newSubjects = [...subjects];
    newSubjects[index] = value;
    setSubjects(newSubjects);
  };

  const addSubject = () => {
    if (subjects.length < maxSubjects) {
      setSubjects([...subjects, '']);
    }
  };

  const removeSubject = (index: number) => {
    if (subjects.length > minSubjects) {
      const newSubjects = subjects.filter((_, i) => i !== index);
      setSubjects(newSubjects);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Filter out empty subjects and trim whitespace
    const validSubjects = subjects
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (validSubjects.length >= minSubjects) {
      onSubmit(validSubjects);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();

      // If current input has content and we're not at max, add new subject
      if (subjects[index].trim() && subjects.length < maxSubjects) {
        addSubject();
      } else if (validSubjectsCount >= minSubjects) {
        // If we have enough subjects, submit
        handleSubmit(e as any);
      }
    } else if (e.key === 'Backspace' && subjects[index] === '' && index > 0) {
      // If backspace on empty input and not first, remove this input and focus previous
      removeSubject(index);
      setTimeout(() => {
        inputRefs.current[index - 1]?.focus();
      }, 0);
    }
  };

  const validSubjectsCount = subjects.filter(s => s.trim().length > 0).length;
  const canSubmit = validSubjectsCount >= minSubjects && !loading;
  const canAddMore = subjects.length < maxSubjects;

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-3">
        학습할 과목들을 입력해주세요 (최소 {minSubjects}개):
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <AnimatePresence initial={false}>
          {subjects.map((subject, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2 group"
            >
              {/* Drag handle (visual only for now) */}
              <div className="opacity-0 group-hover:opacity-50 transition-opacity">
                <GripVertical className="w-4 h-4 text-gray-400" />
              </div>

              {/* Subject icon */}
              <div className="flex-shrink-0">
                <BookOpen className="w-4 h-4 text-blue-500" />
              </div>

              {/* Input field */}
              <div className="flex-1 relative">
                <input
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  value={subject}
                  onChange={(e) => handleSubjectChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  placeholder={`과목 ${index + 1} (예: 수학, 영어, 과학 등)`}
                  disabled={loading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 transition-all"
                />

                {/* Subject number indicator */}
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 bg-white px-1">
                  {index + 1}
                </div>
              </div>

              {/* Remove button */}
              {subjects.length > minSubjects && (
                <motion.button
                  type="button"
                  onClick={() => removeSubject(index)}
                  disabled={loading}
                  className="flex-shrink-0 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-4 h-4" />
                </motion.button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add subject button */}
        {canAddMore && (
          <motion.button
            type="button"
            onClick={addSubject}
            disabled={loading}
            className="w-full py-3 border-2 border-dashed border-gray-300 text-gray-500 rounded-xl hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <Plus className="w-4 h-4" />
            <span>과목 추가 (최대 {maxSubjects}개)</span>
          </motion.button>
        )}

        {/* Subject count indicator */}
        <div className="text-sm text-gray-500 text-center">
          {validSubjectsCount}개 과목 입력됨
          {validSubjectsCount < minSubjects && (
            <span className="text-orange-600 ml-1">
              (최소 {minSubjects - validSubjectsCount}개 더 필요)
            </span>
          )}
        </div>

        {/* Submit button */}
        <motion.button
          type="submit"
          disabled={!canSubmit}
          className="w-full px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 font-medium"
          whileHover={canSubmit ? { scale: 1.01 } : {}}
          whileTap={canSubmit ? { scale: 0.99 } : {}}
        >
          <Send className="w-5 h-5" />
          <span>
            {validSubjectsCount === 0 ? '과목을 입력하세요' :
             validSubjectsCount < minSubjects ? `${minSubjects - validSubjectsCount}개 더 입력하세요` :
             `${validSubjectsCount}개 과목으로 계속하기`}
          </span>
        </motion.button>

        {/* Help text */}
        <div className="text-xs text-gray-400 text-center space-y-1">
          <p>💡 Enter키로 새 과목 추가, 빈 칸에서 Backspace로 삭제</p>
          <p>드래그로 순서 변경 가능 (곧 지원 예정)</p>
        </div>
      </form>
    </div>
  );
}