'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Sparkles, X, ArrowRight, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface StudyPlanPromptProps {
  userName?: string;
}

export default function StudyPlanPrompt({ userName = '학생' }: StudyPlanPromptProps) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);
  const [hasActivePlan, setHasActivePlan] = useState<boolean | null>(null);

  useEffect(() => {
    checkTodaysPlan();
  }, []);

  const checkTodaysPlan = async () => {
    try {
      const response = await fetch('/api/study-plan/today');
      const data = await response.json();

      if (data.success && data.data) {
        setHasActivePlan(true);
      } else {
        setHasActivePlan(false);
      }
    } catch (error) {
      console.error('Error checking plan:', error);
      setHasActivePlan(false);
    }
  };

  // Don't show if user has active plan or dismissed
  if (!isVisible || hasActivePlan === null || hasActivePlan === true) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="relative mb-8"
        >
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-1">
            <div className="bg-white rounded-xl p-6">
              {/* Close Button */}
              <button
                onClick={() => setIsVisible(false)}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="닫기"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>

              <div className="flex items-start gap-6">
                {/* Icon */}
                <div className="hidden sm:block">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center"
                  >
                    <Sparkles className="w-8 h-8 text-blue-600" />
                  </motion.div>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="mb-4">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                      {userName}님, 오늘의 학습 계획을 세워보세요! 🎯
                    </h2>
                    <p className="text-gray-600">
                      AI가 당신의 학습 스타일과 목표에 맞춘 완벽한 일일 계획을 만들어드립니다.
                      단 5분의 대화로 하루를 효율적으로 관리해보세요.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => router.push('/study-plan/new')}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all flex items-center gap-2 group"
                    >
                      <Calendar className="w-5 h-5" />
                      <span>AI 학습 계획 만들기</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </motion.button>

                    <button
                      onClick={() => router.push('/study-plan')}
                      className="px-6 py-3 text-gray-700 hover:text-gray-900 font-medium transition-colors flex items-center gap-2"
                    >
                      <Clock className="w-5 h-5" />
                      <span>내 계획 보기</span>
                    </button>

                    <button
                      onClick={() => router.push('/study-plan/history')}
                      className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors flex items-center gap-2"
                    >
                      <Calendar className="w-5 h-5" />
                      <span>학습 기록</span>
                    </button>
                  </div>

                  {/* Features */}
                  <div className="mt-4 flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span>맞춤형 시간표</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      <span>과목별 최적 배분</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                      <span>동기부여 메시지</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}