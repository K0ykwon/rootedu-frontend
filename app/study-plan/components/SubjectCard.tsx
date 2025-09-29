'use client';

import { Check, Clock, BookOpen, Edit3, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import type { SubjectPlan } from '@/lib/types/study-plan';

interface SubjectCardProps {
  subject: SubjectPlan;
  onToggleComplete: () => void;
  onAddReflection: () => void;
}

export default function SubjectCard({
  subject,
  onToggleComplete,
  onAddReflection,
}: SubjectCardProps) {
  // Calculate duration
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

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all ${
        subject.completed ? 'opacity-75' : ''
      }`}
    >
      <div className="p-6">
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

          {/* Complete Button */}
          <button
            onClick={onToggleComplete}
            className={`p-3 rounded-xl transition-all ${
              subject.completed
                ? 'bg-green-100 hover:bg-green-200'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
            title={subject.completed ? '완료 취소' : '완료로 표시'}
          >
            <Check className={`w-5 h-5 ${
              subject.completed ? 'text-green-600' : 'text-gray-400'
            }`} />
          </button>
        </div>

        {/* Reflection Section */}
        {subject.reflection ? (
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
        ) : (
          subject.completed && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={onAddReflection}
              className="mt-4 w-full py-2 px-4 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Edit3 className="w-4 h-4" />
              <span className="text-sm font-medium">회고 작성하기</span>
            </motion.button>
          )
        )}
      </div>
    </motion.div>
  );
}