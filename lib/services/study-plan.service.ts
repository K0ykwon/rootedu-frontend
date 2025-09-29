import { getRedisClient } from '@/lib/redis';
import { v4 as uuidv4 } from 'uuid';
import type {
  DailyStudyPlan,
  SubjectPlan,
  ChatSessionState,
  ChatResponses,
  ChatStep,
} from '@/lib/types/study-plan';

export class StudyPlanService {
  // Get today's date in YYYY-MM-DD format
  static getTodayDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  // Get or create today's plan for a user
  static async getTodaysPlan(userId: string): Promise<DailyStudyPlan | null> {
    const redis = await getRedisClient();
    const date = this.getTodayDate();
    const todayKey = `plan:today:${userId}:${date}`;

    try {
      const planId = await redis.get(todayKey);
      if (!planId) return null;

      return await this.getPlanById(userId, planId);
    } catch (error) {
      console.error('Error getting today\'s plan:', error);
      return null;
    }
  }

  // Get a specific plan by ID
  static async getPlanById(userId: string, planId: string): Promise<DailyStudyPlan | null> {
    const redis = await getRedisClient();
    const planKey = `plan:${userId}:${planId}`;
    const subjectsKey = `plan:subjects:${userId}:${planId}`;

    try {
      // Get plan metadata
      const planData = await redis.hGetAll(planKey);
      if (!planData || Object.keys(planData).length === 0) return null;

      // Get subject plans
      const subjectsData = await redis.lRange(subjectsKey, 0, -1);
      const subjects = subjectsData.map(s => JSON.parse(s) as SubjectPlan);

      return {
        id: planData.id,
        userId: planData.userId,
        date: planData.date,
        totalStartTime: planData.totalStartTime,
        totalEndTime: planData.totalEndTime,
        motivationalQuote: planData.motivationalQuote || undefined,
        plans: subjects,
        createdAt: planData.createdAt,
        updatedAt: planData.updatedAt,
      };
    } catch (error) {
      console.error('Error getting plan by ID:', error);
      return null;
    }
  }

  // Create a new study plan
  static async createPlan(
    userId: string,
    plans: Omit<SubjectPlan, 'id' | 'completed' | 'reflection'>[],
    motivationalQuote?: string
  ): Promise<DailyStudyPlan> {
    const redis = await getRedisClient();
    const planId = uuidv4();
    const date = this.getTodayDate();
    const now = new Date().toISOString();

    // Calculate total time range
    const startTimes = plans.map(p => p.startTime).sort();
    const endTimes = plans.map(p => p.endTime).sort();
    const totalStartTime = startTimes[0];
    const totalEndTime = endTimes[endTimes.length - 1];

    // Create subject plans with IDs
    const subjectPlans: SubjectPlan[] = plans.map((plan, index) => ({
      ...plan,
      id: `sub_${index + 1}`,
      completed: false,
    }));

    const dailyPlan: DailyStudyPlan = {
      id: planId,
      userId,
      date,
      totalStartTime,
      totalEndTime,
      motivationalQuote,
      plans: subjectPlans,
      createdAt: now,
      updatedAt: now,
    };

    try {
      // Save plan metadata
      const planKey = `plan:${userId}:${planId}`;
      await redis.hSet(planKey, {
        id: planId,
        userId,
        date,
        totalStartTime,
        totalEndTime,
        motivationalQuote: motivationalQuote || '',
        createdAt: now,
        updatedAt: now,
      });

      // Save subject plans
      const subjectsKey = `plan:subjects:${userId}:${planId}`;
      for (const subject of subjectPlans) {
        await redis.rPush(subjectsKey, JSON.stringify(subject));
      }

      // Set today's plan reference
      const todayKey = `plan:today:${userId}:${date}`;
      await redis.set(todayKey, planId);

      // Add to user's plan index (sorted set by date)
      const indexKey = `plan:index:${userId}`;
      const dateScore = new Date(date).getTime();
      await redis.zAdd(indexKey, { score: dateScore, value: planId });

      // Set expiry for 90 days (extended for history)
      await redis.expire(planKey, 90 * 24 * 60 * 60);
      await redis.expire(subjectsKey, 90 * 24 * 60 * 60);
      await redis.expire(indexKey, 90 * 24 * 60 * 60);
      await redis.expire(todayKey, 24 * 60 * 60); // Today key expires after 24 hours

      return dailyPlan;
    } catch (error) {
      console.error('Error creating plan:', error);
      throw error;
    }
  }

  // Update a subject plan
  static async updateSubjectPlan(
    userId: string,
    planId: string,
    subjectId: string,
    updates: Partial<SubjectPlan>
  ): Promise<boolean> {
    const redis = await getRedisClient();
    const subjectsKey = `plan:subjects:${userId}:${planId}`;
    const planKey = `plan:${userId}:${planId}`;

    try {
      console.log('🔧 REDIS: Starting atomic update transaction', { userId, planId, subjectId, updates });

      // Use Redis transaction for atomic operations
      const multi = redis.multi();

      // Get current subjects list
      const subjectsData = await redis.lRange(subjectsKey, 0, -1);

      if (!subjectsData || subjectsData.length === 0) {
        console.error('🔧 REDIS: No subjects found in list', { subjectsKey });
        return false;
      }

      const subjects = subjectsData.map(s => {
        try {
          return JSON.parse(s) as SubjectPlan;
        } catch (parseError) {
          console.error('🔧 REDIS: Failed to parse subject data', { data: s, error: parseError });
          throw new Error(`Invalid subject data: ${s}`);
        }
      });

      const subjectIndex = subjects.findIndex(s => s.id === subjectId);

      if (subjectIndex === -1) {
        console.error('🔧 REDIS: Subject not found in list', {
          subjectId,
          availableSubjects: subjects.map(s => ({ id: s.id, subject: s.subject }))
        });
        return false;
      }

      console.log('🔧 REDIS: Found subject at index', { subjectIndex, originalSubject: subjects[subjectIndex] });

      // Update the subject with validation
      const originalSubject = subjects[subjectIndex];
      const updatedSubject = { ...originalSubject, ...updates };

      // Validate the updated subject
      if (updates.startTime && updates.endTime) {
        if (updates.startTime >= updates.endTime) {
          console.error('🔧 REDIS: Invalid time range', { startTime: updates.startTime, endTime: updates.endTime });
          return false;
        }
      }

      subjects[subjectIndex] = updatedSubject;

      console.log('🔧 REDIS: Updated subject data', { updatedSubject });

      // Atomic transaction: delete and recreate list
      multi.del(subjectsKey);
      for (const subject of subjects) {
        multi.rPush(subjectsKey, JSON.stringify(subject));
      }
      multi.hSet(planKey, 'updatedAt', new Date().toISOString());

      // Execute transaction
      const results = await multi.exec();

      if (!results) {
        console.error('🔧 REDIS: Transaction failed - no results returned');
        return false;
      }

      // Check if any command in the transaction failed
      if (Array.isArray(results)) {
        for (let i = 0; i < results.length; i++) {
          const result = results[i];
          if (Array.isArray(result)) {
            const [error, value] = result;
            if (error) {
              console.error('🔧 REDIS: Transaction command failed', { commandIndex: i, error });
              return false;
            }
          }
        }
      }

      console.log('🔧 REDIS: ✅ Atomic update successful');
      return true;

    } catch (error) {
      console.error('🔧 REDIS: ❌ Error updating subject plan:', error);

      // Add more specific error details
      if (error instanceof Error) {
        console.error('🔧 REDIS: Error details:', {
          message: error.message,
          stack: error.stack,
          userId,
          planId,
          subjectId,
          updates
        });
      }

      return false;
    }
  }

  // Add reflection to a subject
  static async addReflection(
    userId: string,
    planId: string,
    subjectId: string,
    reflection: string
  ): Promise<boolean> {
    return this.updateSubjectPlan(userId, planId, subjectId, { reflection });
  }

  // Chat Session Management
  static async createChatSession(userId: string): Promise<ChatSessionState> {
    const redis = await getRedisClient();
    const sessionId = uuidv4();
    const now = new Date().toISOString();

    const session: ChatSessionState = {
      sessionId,
      userId,
      step: 'time_range',
      responses: {},
      createdAt: now,
      updatedAt: now,
    };

    const sessionKey = `chat:planner:${userId}:${sessionId}`;
    await redis.hSet(sessionKey, {
      sessionId,
      userId,
      step: session.step,
      responses: JSON.stringify(session.responses),
      createdAt: now,
      updatedAt: now,
    });

    // Expire after 1 hour
    await redis.expire(sessionKey, 60 * 60);

    return session;
  }

  static async getChatSession(userId: string, sessionId: string): Promise<ChatSessionState | null> {
    const redis = await getRedisClient();
    const sessionKey = `chat:planner:${userId}:${sessionId}`;

    try {
      const sessionData = await redis.hGetAll(sessionKey);
      if (!sessionData || Object.keys(sessionData).length === 0) return null;

      return {
        sessionId: sessionData.sessionId,
        userId: sessionData.userId,
        step: sessionData.step as ChatStep,
        responses: JSON.parse(sessionData.responses || '{}'),
        createdAt: sessionData.createdAt,
        updatedAt: sessionData.updatedAt,
      };
    } catch (error) {
      console.error('Error getting chat session:', error);
      return null;
    }
  }

  static async updateChatSession(
    userId: string,
    sessionId: string,
    step: ChatStep,
    responses: ChatResponses
  ): Promise<boolean> {
    const redis = await getRedisClient();
    const sessionKey = `chat:planner:${userId}:${sessionId}`;

    try {
      await redis.hSet(sessionKey, {
        step,
        responses: JSON.stringify(responses),
        updatedAt: new Date().toISOString(),
      });

      return true;
    } catch (error) {
      console.error('Error updating chat session:', error);
      return false;
    }
  }

  // Check if user already has a plan for today
  static async hasActivePlanToday(userId: string): Promise<boolean> {
    const plan = await this.getTodaysPlan(userId);
    return plan !== null;
  }

  // Get user's plan history (paginated)
  static async getUserPlans(userId: string, page = 1, limit = 10): Promise<{
    plans: DailyStudyPlan[];
    totalCount: number;
    hasMore: boolean;
  }> {
    const redis = await getRedisClient();
    const indexKey = `plan:index:${userId}`;

    try {
      // Get total count
      const totalCount = await redis.zCard(indexKey);

      // Calculate pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit - 1;

      // Get plan IDs in reverse chronological order (newest first)
      const planIds = await redis.zRange(indexKey, startIndex, endIndex, { REV: true });

      // Fetch all plans
      const plans: DailyStudyPlan[] = [];
      if (planIds && Array.isArray(planIds)) {
        for (const planId of planIds) {
          if (typeof planId === 'string') {
            const plan = await this.getPlanById(userId, planId);
            if (plan) {
              plans.push(plan);
            }
          }
        }
      }

      return {
        plans,
        totalCount,
        hasMore: totalCount > startIndex + plans.length,
      };
    } catch (error) {
      console.error('Error getting user plans:', error);
      return { plans: [], totalCount: 0, hasMore: false };
    }
  }

  // Get plans by date range
  static async getPlansByDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<DailyStudyPlan[]> {
    const redis = await getRedisClient();
    const indexKey = `plan:index:${userId}`;

    try {
      const startScore = new Date(startDate).getTime();
      const endScore = new Date(endDate).getTime();

      // Get plan IDs in date range
      const planIds = await redis.zRangeByScore(indexKey, startScore, endScore);

      // Fetch all plans
      const plans: DailyStudyPlan[] = [];
      if (planIds && Array.isArray(planIds)) {
        for (const planId of planIds) {
          if (typeof planId === 'string') {
            const plan = await this.getPlanById(userId, planId);
            if (plan) {
              plans.push(plan);
            }
          }
        }
      }

      return plans.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      console.error('Error getting plans by date range:', error);
      return [];
    }
  }

  // Get plan statistics for a user
  static async getPlanStatistics(userId: string): Promise<{
    totalPlans: number;
    completedSubjects: number;
    totalSubjects: number;
    averageCompletionRate: number;
    totalStudyHours: number;
    studyStreak: number;
    mostStudiedSubjects: { subject: string; count: number }[];
  }> {
    const redis = await getRedisClient();
    const indexKey = `plan:index:${userId}`;

    try {
      // Get all plan IDs
      const planIds = await redis.zRevRange(indexKey, 0, -1);

      let completedSubjects = 0;
      let totalSubjects = 0;
      let totalStudyMinutes = 0;
      const subjectCounts: Record<string, number> = {};
      const planDates: string[] = [];

      // Process each plan
      if (planIds && Array.isArray(planIds)) {
        for (const planId of planIds) {
          if (typeof planId !== 'string') continue;
          const plan = await this.getPlanById(userId, planId);
          if (!plan) continue;

          planDates.push(plan.date);
          totalSubjects += plan.plans.length;

          for (const subject of plan.plans) {
            if (subject.completed) {
              completedSubjects++;
            }

            // Count subject frequency
            subjectCounts[subject.subject] = (subjectCounts[subject.subject] || 0) + 1;

            // Calculate study time
            const [startHour, startMin] = subject.startTime.split(':').map(Number);
            const [endHour, endMin] = subject.endTime.split(':').map(Number);
            const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
            totalStudyMinutes += durationMinutes;
          }
        }
      }

      // Calculate completion rate
      const averageCompletionRate = totalSubjects > 0 ? (completedSubjects / totalSubjects) * 100 : 0;

      // Calculate study streak (consecutive days with plans)
      let studyStreak = 0;
      if (planDates.length > 0) {
        const sortedDates = planDates.sort().reverse();
        const today = new Date().toISOString().split('T')[0];

        for (let i = 0; i < sortedDates.length; i++) {
          const expectedDate = new Date();
          expectedDate.setDate(expectedDate.getDate() - i);
          const expectedDateStr = expectedDate.toISOString().split('T')[0];

          if (sortedDates[i] === expectedDateStr) {
            studyStreak++;
          } else {
            break;
          }
        }
      }

      // Get most studied subjects
      const mostStudiedSubjects = Object.entries(subjectCounts)
        .map(([subject, count]) => ({ subject, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        totalPlans: Array.isArray(planIds) ? planIds.length : 0,
        completedSubjects,
        totalSubjects,
        averageCompletionRate: Math.round(averageCompletionRate * 100) / 100,
        totalStudyHours: Math.round((totalStudyMinutes / 60) * 100) / 100,
        studyStreak,
        mostStudiedSubjects,
      };
    } catch (error) {
      console.error('Error getting plan statistics:', error);
      return {
        totalPlans: 0,
        completedSubjects: 0,
        totalSubjects: 0,
        averageCompletionRate: 0,
        totalStudyHours: 0,
        studyStreak: 0,
        mostStudiedSubjects: [],
      };
    }
  }

  // Delete a plan and all associated data
  static async deletePlan(userId: string, planId: string): Promise<boolean> {
    const redis = await getRedisClient();
    const date = this.getTodayDate();

    try {
      // Delete plan metadata
      const planKey = `plan:${userId}:${planId}`;
      await redis.del(planKey);

      // Delete subject plans
      const subjectsKey = `plan:subjects:${userId}:${planId}`;
      await redis.del(subjectsKey);

      // Delete today's plan reference
      const todayKey = `plan:today:${userId}:${date}`;
      const todayPlanId = await redis.get(todayKey);

      // Only delete today's reference if it matches the plan being deleted
      if (todayPlanId === planId) {
        await redis.del(todayKey);
      }

      // Remove from user's plan index
      const indexKey = `plan:index:${userId}`;
      await redis.zRem(indexKey, planId);

      return true;
    } catch (error) {
      console.error('Error deleting plan:', error);
      return false;
    }
  }
}