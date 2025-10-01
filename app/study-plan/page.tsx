'use client';

import { useEffect, useState } from 'react';
import { useStudyPlan } from './hooks/useStudyPlan';
import StudyPlanDashboard from './components/StudyPlanDashboard';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Calendar, Sparkles, ArrowRight, Loader2 } from 'lucide-react';

export default function StudyPlanPage() {
  const router = useRouter();
  const { plan, loading, error, refetch, updateSubject, toggleCompletion, addReflection, createSubject, deletePlan } = useStudyPlan();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">학습 계획을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">😔</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">오류가 발생했습니다</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={refetch}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  // If no plan exists, show create prompt
  if (!plan) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="inline-block"
              >
                <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                </div>
              </motion.div>

              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                오늘의 학습 계획이 없습니다
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                당신만의 맞춤형 학습 계획을 만들어드립니다.
                몇 가지 질문에 답해주시면 완벽한 하루 계획을 세워드릴게요!
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-semibold text-sm">1</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-100">학습 시간 설정</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">오늘 공부할 시간대를 알려주세요</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-semibold text-sm">2</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-100">과목 선택</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">공부하고 싶은 과목들을 선택해주세요</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-semibold text-sm">3</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-100">맞춤 계획 생성</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">최적화된 학습 계획을 자동으로 생성합니다</p>
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/study-plan/new')}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 group"
            >
              <Sparkles className="w-5 h-5" />
              <span>맞춤 학습 계획 만들기</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </div>

          <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>💡 하루 5분 투자로 학습 효율을 200% 높여보세요</p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Show dashboard
  return (
    <StudyPlanDashboard
      plan={plan}
      onUpdateSubject={updateSubject}
      onToggleComplete={toggleCompletion}
      onAddReflection={addReflection}
      onCreateSubject={createSubject}
      onDeletePlan={deletePlan}
      onUpdate={refetch}
    />
  );
}