'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Clock, Copy, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { DailyStudyPlan, ApiResponse } from '@/lib/types/study-plan';
import TimeBlockView from '../../components/TimeBlockView';

interface PlanDetailPageProps {
  params: Promise<{ planId: string }>;
}

export default function PlanDetailPage({ params }: PlanDetailPageProps) {
  const router = useRouter();
  const { planId } = use(params);
  const [plan, setPlan] = useState<DailyStudyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/study-plan/${planId}`);
        const data: ApiResponse<DailyStudyPlan> = await response.json();

        if (data.success && data.data) {
          setPlan(data.data);
        } else {
          setError(data.error || 'Plan not found');
        }
      } catch (err) {
        setError('Failed to fetch plan');
        console.error('Error fetching plan:', err);
      } finally {
        setLoading(false);
      }
    };

    if (planId) {
      fetchPlan();
    }
  }, [planId]);

  const handleCopyPlan = async () => {
    if (!plan) return;

    try {
      // This would navigate to the plan creation with pre-filled data
      // For now, we'll just show an alert
      alert('계획 복사 기능은 곧 추가될 예정입니다!');
    } catch (err) {
      console.error('Error copying plan:', err);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'yyyy년 M월 d일 EEEE', { locale: ko });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">계획을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😔</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">계획을 찾을 수 없습니다</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  // Calculate completion stats
  const completedSubjects = plan.plans.filter(s => s.completed).length;
  const totalSubjects = plan.plans.length;
  const completionRate = totalSubjects > 0 ? (completedSubjects / totalSubjects) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto p-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              돌아가기
            </button>

            <button
              onClick={handleCopyPlan}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Copy className="w-4 h-4" />
              이 계획 복사하기
            </button>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  {formatDate(plan.date)} 학습 기록
                </h1>
                <div className="flex items-center gap-6 text-gray-600">
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {formatDate(plan.date)}
                  </span>
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {plan.totalStartTime} - {plan.totalEndTime}
                  </span>
                </div>

                {plan.motivationalQuote && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                    <p className="text-blue-800 italic">"{plan.motivationalQuote}"</p>
                  </div>
                )}
              </div>

              <div className="text-right">
                <div className={`px-4 py-2 rounded-xl text-lg font-bold ${
                  completionRate >= 80 ? 'text-green-600 bg-green-100' :
                  completionRate >= 60 ? 'text-blue-600 bg-blue-100' :
                  completionRate >= 40 ? 'text-yellow-600 bg-yellow-100' :
                  'text-red-600 bg-red-100'
                }`}>
                  {Math.round(completionRate)}% 완료
                </div>
                <p className="text-gray-600 mt-2">
                  {completedSubjects}/{totalSubjects} 과목 완료
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Timeline View */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <TimeBlockView
            plan={plan}
            onUpdateSubject={async (subjectId: string, updates: any) => {
              // Read-only mode for history, no updates allowed
              return false;
            }}
            onAddReflection={async (subjectId: string, reflection: string) => {
              // Read-only mode for history, no reflections can be added
              return false;
            }}
            readOnly={true}
          />
        </motion.div>
      </div>
    </div>
  );
}