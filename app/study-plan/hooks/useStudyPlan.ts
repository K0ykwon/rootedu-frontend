'use client';

import { useState, useEffect, useCallback } from 'react';
import type {
  DailyStudyPlan,
  ApiResponse,
  UpdateSubjectRequest,
  CreateSubjectRequest,
  SubjectPlan,
} from '@/lib/types/study-plan';

export function useStudyPlan() {
  const [plan, setPlan] = useState<DailyStudyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch today's plan
  const fetchTodaysPlan = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/study-plan/today');
      const data: ApiResponse<DailyStudyPlan | null> = await response.json();

      if (data.success) {
        setPlan(data.data || null);
      } else {
        setError(data.error || 'Failed to fetch plan');
      }
    } catch (err) {
      setError('Network error');
      console.error('Error fetching plan:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Retry with exponential backoff
  const retryWithBackoff = async (
    operation: () => Promise<boolean>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<boolean> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        if (result) {
          if (attempt > 1) {
            console.log(`🔧 ✅ Retry successful on attempt ${attempt}`);
          }
          return true;
        }
      } catch (error) {
        console.error(`🔧 ❌ Attempt ${attempt} failed:`, error);
      }

      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
        console.log(`🔧 ⏳ Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    console.error(`🔧 ❌ All ${maxRetries} retry attempts failed`);
    return false;
  };

  // Update subject with optimistic updates, retry logic, and rollback
  const updateSubject = useCallback(
    async (subjectId: string, updates: UpdateSubjectRequest) => {
      if (!plan) return false;

      console.log('🔧 useStudyPlan updateSubject called:', { subjectId, updates, planId: plan.id });

      // Store original state for rollback
      const originalSubject = plan.plans.find(p => p.id === subjectId);
      if (!originalSubject) {
        console.error('🔧 Original subject not found:', subjectId);
        return false;
      }

      // Optimistic update
      setPlan(prev => {
        if (!prev) return null;
        return {
          ...prev,
          plans: prev.plans.map(p =>
            p.id === subjectId ? { ...p, ...updates } : p
          ),
          updatedAt: new Date().toISOString(),
        };
      });

      // Define the API call operation for retry
      const apiOperation = async (): Promise<boolean> => {
        console.log('🔧 Making API call to:', `/api/study-plan/${plan.id}/subjects/${subjectId}`);

        const response = await fetch(
          `/api/study-plan/${plan.id}/subjects/${subjectId}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          }
        );

        console.log('🔧 API response status:', response.status);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data: ApiResponse = await response.json();
        console.log('🔧 API response data:', data);

        if (data.success) {
          console.log('🔧 ✅ Subject update successful!');
          return true;
        } else {
          throw new Error(data.error || 'Unknown server error');
        }
      };

      // Execute with retry logic
      const success = await retryWithBackoff(apiOperation);

      if (!success) {
        // Rollback on failure after all retries
        setPlan(prev => {
          if (!prev) return null;
          return {
            ...prev,
            plans: prev.plans.map(p =>
              p.id === subjectId ? originalSubject : p
            ),
            updatedAt: new Date().toISOString(),
          };
        });
        console.error('🔧 ❌ Failed to update subject after all retries');
      }

      return success;
    },
    [plan]
  );

  // Toggle completion
  const toggleCompletion = useCallback(
    async (subjectId: string) => {
      if (!plan) return false;

      const subject = plan.plans.find(p => p.id === subjectId);
      if (!subject) return false;

      return updateSubject(subjectId, { completed: !subject.completed });
    },
    [plan, updateSubject]
  );

  // Add reflection with optimistic updates and rollback
  const addReflection = useCallback(
    async (subjectId: string, reflection: string) => {
      if (!plan) return false;

      // Store original state for rollback
      const originalSubject = plan.plans.find(p => p.id === subjectId);
      if (!originalSubject) return false;

      // Optimistic update
      setPlan(prev => {
        if (!prev) return null;
        return {
          ...prev,
          plans: prev.plans.map(p =>
            p.id === subjectId ? { ...p, reflection } : p
          ),
          updatedAt: new Date().toISOString(),
        };
      });

      try {
        const response = await fetch(
          `/api/study-plan/${plan.id}/subjects/${subjectId}/reflection`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reflection }),
          }
        );

        const data: ApiResponse = await response.json();

        if (data.success) {
          return true;
        } else {
          // Rollback on server error
          setPlan(prev => {
            if (!prev) return null;
            return {
              ...prev,
              plans: prev.plans.map(p =>
                p.id === subjectId ? originalSubject : p
              ),
              updatedAt: new Date().toISOString(),
            };
          });
          console.error('Server error adding reflection:', data.error);
          return false;
        }
      } catch (err) {
        // Rollback on network error
        setPlan(prev => {
          if (!prev) return null;
          return {
            ...prev,
            plans: prev.plans.map(p =>
              p.id === subjectId ? originalSubject : p
            ),
            updatedAt: new Date().toISOString(),
          };
        });
        console.error('Network error adding reflection:', err);
        return false;
      }
    },
    [plan]
  );

  // Create new subject
  const createSubject = useCallback(
    async (subjectData: CreateSubjectRequest): Promise<SubjectPlan | null> => {
      if (!plan) return null;

      console.log('🔧 useStudyPlan createSubject called:', { subjectData, planId: plan.id });

      try {
        const response = await fetch(
          `/api/study-plan/${plan.id}/subjects`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subjectData),
          }
        );

        console.log('🔧 Create subject API response status:', response.status);

        const data: ApiResponse<SubjectPlan> = await response.json();
        console.log('🔧 Create subject API response data:', data);

        if (data.success && data.data) {
          // Add new subject to local state
          setPlan(prev => {
            if (!prev) return null;
            return {
              ...prev,
              plans: [...prev.plans, data.data as SubjectPlan],
              updatedAt: new Date().toISOString(),
            };
          });
          console.log('🔧 ✅ Subject creation successful!');
          return data.data;
        } else {
          console.error('🔧 ❌ Server error creating subject:', data.error);
          return null;
        }
      } catch (err) {
        console.error('🔧 ❌ Network error creating subject:', err);
        return null;
      }
    },
    [plan]
  );

  // Delete current plan
  const deletePlan = useCallback(
    async (): Promise<boolean> => {
      if (!plan) return false;

      try {
        const response = await fetch(`/api/study-plan/${plan.id}`, {
          method: 'DELETE',
        });

        const data: ApiResponse = await response.json();

        if (data.success) {
          setPlan(null);
          return true;
        }
        return false;
      } catch (err) {
        console.error('Error deleting plan:', err);
        return false;
      }
    },
    [plan]
  );

  // Load plan on mount
  useEffect(() => {
    fetchTodaysPlan();
  }, [fetchTodaysPlan]);

  return {
    plan,
    loading,
    error,
    refetch: fetchTodaysPlan,
    updateSubject,
    toggleCompletion,
    addReflection,
    createSubject,
    deletePlan,
  };
}