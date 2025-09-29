'use client';

import { useState, useEffect, useCallback } from 'react';
import type {
  DailyStudyPlan,
  PlanHistoryResponse,
  PlanStatistics,
  ApiResponse,
  HistoryFilters,
} from '@/lib/types/study-plan';

export function usePlanHistory() {
  const [plans, setPlans] = useState<DailyStudyPlan[]>([]);
  const [statistics, setStatistics] = useState<PlanStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [statisticsLoading, setStatisticsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch plan history with pagination
  const fetchHistory = useCallback(async (page = 1, limit = 10, reset = false) => {
    try {
      setLoading(true);
      if (reset) {
        setError(null);
        setCurrentPage(1);
      }

      const response = await fetch(`/api/study-plan/history?page=${page}&limit=${limit}`);
      const data: ApiResponse<PlanHistoryResponse> = await response.json();

      if (data.success && data.data) {
        const planData = data.data;
        if (reset || page === 1) {
          setPlans(planData.plans);
        } else {
          setPlans(prev => [...prev, ...planData.plans]);
        }

        setTotalCount(planData.totalCount);
        setHasMore(planData.hasMore);
        setCurrentPage(page);
      } else {
        setError(data.error || 'Failed to fetch plan history');
      }
    } catch (err) {
      setError('Network error');
      console.error('Error fetching plan history:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch plans by date range
  const fetchByDateRange = useCallback(async (startDate: string, endDate: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/study-plan/history/range?startDate=${startDate}&endDate=${endDate}`);
      const data: ApiResponse<DailyStudyPlan[]> = await response.json();

      if (data.success && data.data) {
        setPlans(data.data);
        setTotalCount(data.data.length);
        setHasMore(false);
        setCurrentPage(1);
      } else {
        setError(data.error || 'Failed to fetch plans by date range');
      }
    } catch (err) {
      setError('Network error');
      console.error('Error fetching plans by date range:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch a specific plan by ID
  const fetchPlanById = useCallback(async (planId: string): Promise<DailyStudyPlan | null> => {
    try {
      const response = await fetch(`/api/study-plan/${planId}`);
      const data: ApiResponse<DailyStudyPlan> = await response.json();

      if (data.success && data.data) {
        return data.data;
      } else {
        console.error('Failed to fetch plan:', data.error);
        return null;
      }
    } catch (err) {
      console.error('Error fetching plan by ID:', err);
      return null;
    }
  }, []);

  // Fetch statistics
  const fetchStatistics = useCallback(async () => {
    try {
      setStatisticsLoading(true);

      const response = await fetch('/api/study-plan/stats');
      const data: ApiResponse<PlanStatistics> = await response.json();

      if (data.success && data.data) {
        setStatistics(data.data);
      } else {
        console.error('Failed to fetch statistics:', data.error);
      }
    } catch (err) {
      console.error('Error fetching statistics:', err);
    } finally {
      setStatisticsLoading(false);
    }
  }, []);

  // Load more plans (pagination)
  const loadMore = useCallback(async () => {
    if (hasMore && !loading) {
      await fetchHistory(currentPage + 1, 10, false);
    }
  }, [hasMore, loading, currentPage, fetchHistory]);

  // Filter plans based on criteria
  const filterPlans = useCallback((filters: HistoryFilters) => {
    let filtered = [...plans];

    // Filter by completion status
    if (filters.completed !== undefined) {
      filtered = filtered.filter(plan => {
        const completedSubjects = plan.plans.filter(s => s.completed).length;
        const totalSubjects = plan.plans.length;
        const isCompleted = totalSubjects > 0 && completedSubjects === totalSubjects;
        return isCompleted === filters.completed;
      });
    }

    // Filter by subjects
    if (filters.subjects && filters.subjects.length > 0) {
      filtered = filtered.filter(plan =>
        plan.plans.some(subject =>
          filters.subjects!.some(filterSubject =>
            subject.subject.toLowerCase().includes(filterSubject.toLowerCase())
          )
        )
      );
    }

    // Filter by date range (client-side for already loaded data)
    if (filters.startDate || filters.endDate) {
      filtered = filtered.filter(plan => {
        const planDate = new Date(plan.date);
        if (filters.startDate && planDate < new Date(filters.startDate)) {
          return false;
        }
        if (filters.endDate && planDate > new Date(filters.endDate)) {
          return false;
        }
        return true;
      });
    }

    return filtered;
  }, [plans]);

  // Reset to initial state
  const reset = useCallback(() => {
    setPlans([]);
    setStatistics(null);
    setError(null);
    setTotalCount(0);
    setHasMore(false);
    setCurrentPage(1);
  }, []);

  // Calculate plan summary for quick stats
  const getPlanSummary = useCallback((plan: DailyStudyPlan) => {
    const completedSubjects = plan.plans.filter(s => s.completed).length;
    const totalSubjects = plan.plans.length;
    const completionRate = totalSubjects > 0 ? (completedSubjects / totalSubjects) * 100 : 0;

    const totalMinutes = plan.plans.reduce((acc, subject) => {
      const [startHour, startMin] = subject.startTime.split(':').map(Number);
      const [endHour, endMin] = subject.endTime.split(':').map(Number);
      return acc + (endHour * 60 + endMin) - (startHour * 60 + startMin);
    }, 0);

    return {
      completedSubjects,
      totalSubjects,
      completionRate: Math.round(completionRate),
      totalHours: Math.round((totalMinutes / 60) * 10) / 10,
      subjects: [...new Set(plan.plans.map(s => s.subject))],
    };
  }, []);

  // Initial load
  useEffect(() => {
    fetchHistory(1, 10, true);
    fetchStatistics();
  }, [fetchHistory, fetchStatistics]);

  return {
    // Data
    plans,
    statistics,
    totalCount,
    hasMore,
    currentPage,

    // Loading states
    loading,
    statisticsLoading,
    error,

    // Actions
    fetchHistory,
    fetchByDateRange,
    fetchPlanById,
    fetchStatistics,
    loadMore,
    filterPlans,
    reset,

    // Utilities
    getPlanSummary,
  };
}