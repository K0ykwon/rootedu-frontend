'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  Filter,
  BarChart3,
  TrendingUp,
  Book,
  Target,
  Flame,
  ChevronDown,
  ChevronUp,
  Eye,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { usePlanHistory } from '../hooks/usePlanHistory';
import type { DailyStudyPlan, HistoryFilters } from '@/lib/types/study-plan';
import { useRouter } from 'next/navigation';

interface PlanHistoryProps {
  initialView?: 'list' | 'stats';
}

export default function PlanHistory({ initialView = 'list' }: PlanHistoryProps) {
  const router = useRouter();
  const {
    plans,
    statistics,
    loading,
    statisticsLoading,
    hasMore,
    loadMore,
    filterPlans,
    fetchByDateRange,
    getPlanSummary,
  } = usePlanHistory();

  const [viewMode, setViewMode] = useState<'list' | 'stats'>(initialView);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<HistoryFilters>({});
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    start: '',
    end: '',
  });

  // Apply filters to plans
  const filteredPlans = useMemo(() => {
    if (Object.keys(filters).length === 0) return plans;
    return filterPlans(filters);
  }, [plans, filters, filterPlans]);

  const handleDateRangeFilter = () => {
    if (dateRange.start && dateRange.end) {
      fetchByDateRange(dateRange.start, dateRange.end);
      setFilters(prev => ({ ...prev, startDate: dateRange.start, endDate: dateRange.end }));
    }
  };

  const clearFilters = () => {
    setFilters({});
    setDateRange({ start: '', end: '' });
    // This will trigger a refetch of all plans
    window.location.reload();
  };

  const viewPlanDetails = (planId: string) => {
    router.push(`/study-plan/history/${planId}`);
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'M월 d일 (E)', { locale: ko });
    } catch {
      return dateStr;
    }
  };

  const getCompletionColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600 bg-green-100';
    if (rate >= 60) return 'text-blue-600 bg-blue-100';
    if (rate >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  // Statistics View Component
  const StatisticsView = () => (
    <div className="space-y-6">
      {statisticsLoading ? (
        <div className="text-center py-8">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-2 text-gray-600">통계를 불러오는 중...</p>
        </div>
      ) : statistics ? (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 text-center"
            >
              <Target className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold text-gray-800">{statistics.totalPlans}</p>
              <p className="text-sm text-gray-600">총 계획 수</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-6 text-center"
            >
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold text-gray-800">{statistics.averageCompletionRate.toFixed(0)}%</p>
              <p className="text-sm text-gray-600">평균 완성률</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-6 text-center"
            >
              <Clock className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <p className="text-2xl font-bold text-gray-800">{statistics.totalStudyHours}h</p>
              <p className="text-sm text-gray-600">총 학습시간</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card p-6 text-center"
            >
              <Flame className="w-8 h-8 mx-auto mb-2 text-orange-600" />
              <p className="text-2xl font-bold text-gray-800">{statistics.studyStreak}</p>
              <p className="text-sm text-gray-600">연속 학습일</p>
            </motion.div>
          </div>

          {/* Most Studied Subjects */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card p-6"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Book className="w-6 h-6 text-blue-600" />
              가장 많이 공부한 과목
            </h3>
            <div className="space-y-3">
              {statistics.mostStudiedSubjects.map((subject, index) => (
                <div key={subject.subject} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-semibold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="text-gray-800 font-medium">{subject.subject}</span>
                  </div>
                  <span className="text-gray-600">{subject.count}회</span>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      ) : (
        <div className="text-center py-8 text-gray-600">
          통계를 불러올 수 없습니다.
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">학습 기록</h1>

        {/* View Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 bg-white rounded-xl shadow-sm p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <CalendarIcon className="w-4 h-4 inline mr-2" />
              기록 목록
            </button>
            <button
              onClick={() => setViewMode('stats')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'stats'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              통계
            </button>
          </div>

          {viewMode === 'list' && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <Filter className="w-4 h-4" />
              필터
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && viewMode === 'list' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 bg-white rounded-xl shadow-sm p-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    시작 날짜
                  </label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    종료 날짜
                  </label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-end gap-2">
                  <button
                    onClick={handleDateRangeFilter}
                    disabled={!dateRange.start || !dateRange.end}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    적용
                  </button>
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    초기화
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Content */}
      {viewMode === 'stats' ? (
        <StatisticsView />
      ) : (
        <div className="space-y-4">
          {loading && plans.length === 0 ? (
            <div className="text-center py-8">
              <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-2 text-gray-600">계획을 불러오는 중...</p>
            </div>
          ) : filteredPlans.length === 0 ? (
            <div className="text-center py-12 text-gray-600">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">학습 기록이 없습니다</p>
              <p>첫 번째 학습 계획을 만들어보세요!</p>
            </div>
          ) : (
            <>
              {filteredPlans.map((plan, index) => {
                const summary = getPlanSummary(plan);
                const isExpanded = expandedPlan === plan.id;

                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass-card p-6 cursor-pointer hover:shadow-lg transition-shadow"
                  >
                    <div
                      onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}
                      className="flex items-center justify-between mb-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-gray-800">
                            {format(parseISO(plan.date), 'd', { locale: ko })}
                          </p>
                          <p className="text-sm text-gray-600">
                            {format(parseISO(plan.date), 'MMM', { locale: ko })}
                          </p>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-800">
                            {formatDate(plan.date)}
                          </h3>
                          <p className="text-gray-600">
                            {plan.totalStartTime} - {plan.totalEndTime} | {summary.totalHours}시간
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getCompletionColor(summary.completionRate)}`}>
                            {summary.completionRate}% 완료
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {summary.completedSubjects}/{summary.totalSubjects} 완료
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            viewPlanDetails(plan.id);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="상세 보기"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border-t border-gray-200 pt-4"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-semibold text-gray-800 mb-2">과목 목록</h4>
                              <div className="space-y-2">
                                {plan.plans.map((subject) => (
                                  <div key={subject.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                      {subject.completed ? (
                                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                                      ) : (
                                        <Circle className="w-4 h-4 text-gray-400" />
                                      )}
                                      <span className={subject.completed ? 'text-green-700' : 'text-gray-700'}>
                                        {subject.subject}
                                      </span>
                                    </div>
                                    <span className="text-sm text-gray-600">
                                      {subject.startTime}-{subject.endTime}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {plan.motivationalQuote && (
                              <div>
                                <h4 className="font-semibold text-gray-800 mb-2">동기부여 문구</h4>
                                <div className="p-4 bg-blue-50 rounded-lg">
                                  <p className="text-blue-800 italic">"{plan.motivationalQuote}"</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}

              {/* Load More Button */}
              {hasMore && (
                <div className="text-center">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? '로딩 중...' : '더 보기'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}