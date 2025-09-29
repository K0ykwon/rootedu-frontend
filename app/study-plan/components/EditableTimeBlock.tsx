'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { SubjectPlan } from '@/lib/types/study-plan';
import { X, Check, Clock, BookOpen, MessageSquare } from 'lucide-react';

interface EditableTimeBlockProps {
  subject: SubjectPlan;
  style: React.CSSProperties;
  onSave: (updates: Partial<SubjectPlan>) => void;
  onCancel: () => void;
  gradientColor: string; // This is the Tailwind class string like 'bg-gradient-to-br from-rose-400 to-pink-500'
}

const EditableTimeBlock: React.FC<EditableTimeBlockProps> = ({
  subject,
  style,
  onSave,
  onCancel,
  gradientColor
}) => {
  const [editedSubject, setEditedSubject] = useState(subject.subject);
  const [editedContent, setEditedContent] = useState(subject.content);
  const [editedStartTime, setEditedStartTime] = useState(subject.startTime);
  const [editedEndTime, setEditedEndTime] = useState(subject.endTime);
  const [reflection, setReflection] = useState(subject.reflection || '');
  const [showReflection, setShowReflection] = useState(!!subject.reflection);

  const handleSave = () => {
    const updates: Partial<SubjectPlan> = {};

    if (editedSubject !== subject.subject) updates.subject = editedSubject;
    if (editedContent !== subject.content) updates.content = editedContent;
    if (editedStartTime !== subject.startTime) updates.startTime = editedStartTime;
    if (editedEndTime !== subject.endTime) updates.endTime = editedEndTime;
    if (reflection && reflection !== subject.reflection) updates.reflection = reflection;

    if (Object.keys(updates).length > 0) {
      onSave(updates);
    } else {
      onCancel();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && e.target instanceof HTMLInputElement) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <>
      {/* Dark overlay backdrop */}
      <motion.div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
      />

      {/* Edit form */}
      <motion.div
        className="fixed inset-0 flex items-center justify-center p-4 z-50"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="w-full max-w-2xl">
          <div className="min-h-[500px] rounded-2xl bg-white shadow-2xl ring-2 ring-gray-200 overflow-hidden">
            {/* Gradient header bar */}
            <div className={`h-3 ${gradientColor}`} />

            <div className="p-6 bg-white">
            {/* Subject and time inputs */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-lg ${gradientColor} flex items-center justify-center`}>
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <input
                  type="text"
                  value={editedSubject}
                  onChange={(e) => setEditedSubject(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="flex-1 text-xl font-bold text-gray-800 border-b-2 border-gray-200
                           focus:border-blue-500 focus:outline-none transition-colors px-3 py-2
                           placeholder-gray-400"
                  placeholder="과목명"
                  autoFocus
                />
              </div>

              <div className="flex items-center gap-3 text-base">
                <Clock className="w-5 h-5 text-gray-500" />
                <input
                  type="time"
                  value={editedStartTime}
                  onChange={(e) => setEditedStartTime(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-gray-700
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           text-base"
                />
                <span className="text-gray-500 font-medium text-lg">-</span>
                <input
                  type="time"
                  value={editedEndTime}
                  onChange={(e) => setEditedEndTime(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-gray-700
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           text-base"
                />
              </div>
            </div>

            {/* Content textarea */}
            <div className="mb-6">
              <label className="text-sm font-medium text-gray-600 mb-2 block">학습 내용</label>
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    onCancel();
                  }
                }}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-700
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         placeholder-gray-400 resize-none text-base leading-relaxed"
                placeholder="무엇을 공부할 예정인가요?"
                rows={4}
              />
            </div>

            {/* Reflection section */}
            {showReflection ? (
              <div className="mb-6">
                <label className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  회고 및 메모
                </label>
                <textarea
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      onCancel();
                    }
                  }}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-700
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           placeholder-gray-400 resize-none text-base leading-relaxed"
                  placeholder="학습 후 느낀점이나 메모를 작성해주세요..."
                  rows={3}
                />
              </div>
            ) : (
              <button
                onClick={() => setShowReflection(true)}
                className="mb-6 text-gray-600 text-base hover:text-gray-700 transition-colors
                         flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50
                         border border-gray-200 w-full justify-center"
              >
                <MessageSquare className="w-5 h-5" />
                <span>회고 추가</span>
              </button>
            )}

            {/* Action buttons */}
            <div className="flex justify-end gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onCancel}
                className="px-6 py-3 text-gray-600 font-medium text-base
                         rounded-lg transition-all flex items-center gap-2
                         border border-gray-200 hover:bg-gray-50 bg-white"
              >
                <X className="w-5 h-5" />
                취소
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                className={`px-6 py-3 text-white font-bold text-base
                         rounded-lg transition-all flex items-center gap-2
                         ${gradientColor} shadow-md hover:shadow-lg`}
              >
                <Check className="w-5 h-5" />
                저장
              </motion.button>
            </div>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default EditableTimeBlock;