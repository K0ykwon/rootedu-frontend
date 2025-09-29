'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Send } from 'lucide-react';
import { motion } from 'framer-motion';

interface SubjectDetailsInputProps {
  subjects: string[];
  onSubmit: (details: Record<string, string>) => void;
  loading?: boolean;
}

export default function SubjectDetailsInput({
  subjects,
  onSubmit,
  loading = false
}: SubjectDetailsInputProps) {
  const [subjectDetails, setSubjectDetails] = useState<Record<string, string>>({});

  useEffect(() => {
    // Initialize with empty strings for each subject
    const initialDetails: Record<string, string> = {};
    subjects.forEach(subject => {
      initialDetails[subject] = '';
    });
    setSubjectDetails(initialDetails);
  }, [subjects]);

  const handleDetailChange = (subject: string, value: string) => {
    setSubjectDetails(prev => ({
      ...prev,
      [subject]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check if all subjects have details
    const allFilled = subjects.every(subject => subjectDetails[subject]?.trim());
    if (!allFilled) return;

    onSubmit(subjectDetails);
  };

  const allSubjectsFilled = subjects.every(subject => subjectDetails[subject]?.trim());

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-3">
        각 과목별로 학습할 내용을 입력해주세요:
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {subjects.map((subject, index) => (
          <motion.div
            key={subject}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="space-y-2"
          >
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <BookOpen className="w-4 h-4 text-blue-500" />
              {subject}
            </label>
            <textarea
              value={subjectDetails[subject] || ''}
              onChange={(e) => handleDetailChange(subject, e.target.value)}
              placeholder={`${subject} 학습 내용을 입력하세요... (예: 2차 방정식 풀이, 문법 복습 등)`}
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 resize-none"
              rows={3}
            />
          </motion.div>
        ))}

        <button
          type="submit"
          disabled={loading || !allSubjectsFilled}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          <Send className="w-5 h-5" />
          <span>모든 과목 입력 완료</span>
        </button>
      </form>
    </div>
  );
}