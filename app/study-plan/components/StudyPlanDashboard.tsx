'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Quote, RefreshCw, Plus, LayoutGrid, Clock3, Sparkles, MessageCircle } from 'lucide-react';
import type { DailyStudyPlan, SubjectPlan, CreateSubjectRequest, UpdateSubjectRequest } from '@/lib/types/study-plan';
import SubjectCard from './SubjectCard';
import EnhancedSubjectCard from './EnhancedSubjectCard';
import AddSubjectCard from './AddSubjectCard';
import ReflectionModal from './ReflectionModal';
import ReflectionChat from './reflection/ReflectionChat';
import TimeBlockView from './TimeBlockView';
import RegeneratePlanDialog from './RegeneratePlanDialog';
import { useRouter } from 'next/navigation';

interface StudyPlanDashboardProps {
  plan: DailyStudyPlan;
  onUpdateSubject: (subjectId: string, updates: Partial<SubjectPlan>) => Promise<boolean>;
  onToggleComplete: (subjectId: string) => Promise<boolean>;
  onAddReflection: (subjectId: string, reflection: string) => Promise<boolean>;
  onCreateSubject: (subjectData: CreateSubjectRequest) => Promise<SubjectPlan | null>;
  onDeletePlan: () => Promise<boolean>;
  onUpdate: () => void;
}

export default function StudyPlanDashboard({
  plan,
  onUpdateSubject,
  onToggleComplete,
  onAddReflection,
  onCreateSubject,
  onDeletePlan,
  onUpdate,
}: StudyPlanDashboardProps) {
  const router = useRouter();
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [showReflectionModal, setShowReflectionModal] = useState(false);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'timeline'>('timeline');
  const [showDayReflection, setShowDayReflection] = useState(false);

  // Calculate progress
  const completedCount = plan.plans.filter((p: SubjectPlan) => p.completed).length;
  const totalCount = plan.plans.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  };

  const handleReflectionClick = (subjectId: string) => {
    setSelectedSubject(subjectId);
    setShowReflectionModal(true);
  };

  const handleReflectionSubmit = async (reflection: string) => {
    if (!selectedSubject) return;

    const success = await onAddReflection(selectedSubject, reflection);
    if (success) {
      setShowReflectionModal(false);
      setSelectedSubject(null);
      // No need to call onUpdate() since onAddReflection already updates state optimistically
    }
  };

  const handleUpdateSubject = async (subjectId: string, updates: Partial<SubjectPlan>) => {
    console.log('🔄 StudyPlanDashboard handleUpdateSubject called:', { subjectId, updates });
    try {
      const result = await onUpdateSubject(subjectId, updates);
      console.log('🔄 StudyPlanDashboard update result:', result);
      return result;
    } catch (error) {
      console.error('🔄 StudyPlanDashboard update error:', error);
      return false;
    }
  };

  // Enhanced update subject for cards (doesn't need subject ID)
  const handleEnhancedUpdateSubject = (subject: SubjectPlan) => async (updates: UpdateSubjectRequest): Promise<boolean> => {
    return handleUpdateSubject(subject.id, updates);
  };

  // Create new subject handler
  const handleCreateSubject = async (subjectData: CreateSubjectRequest): Promise<boolean> => {
    try {
      const newSubject = await onCreateSubject(subjectData);
      return newSubject !== null;
    } catch (error) {
      console.error('Error creating subject:', error);
      return false;
    }
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const success = await onDeletePlan();
      if (success) {
        // Navigate to new plan creation with force parameter
        router.push('/study-plan/new?force=true');
      } else {
        console.error('Failed to delete plan');
        setIsRegenerating(false);
      }
    } catch (error) {
      console.error('Error regenerating plan:', error);
      setIsRegenerating(false);
    }
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        {/* Action buttons - Always show */}
        <div className="flex justify-end gap-2 mb-4">
          <button
            onClick={() => router.push('/study-plan/history')}
            className="p-3 glass-card hover:bg-[var(--glass-bg-hover)] transition-colors"
            title="학습 기록 보기"
          >
            <Calendar className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode(viewMode === 'cards' ? 'timeline' : 'cards')}
            className="p-3 glass-card hover:bg-[var(--glass-bg-hover)] transition-colors"
            title={viewMode === 'cards' ? '타임라인 보기' : '카드 보기'}
          >
            {viewMode === 'cards' ? <Clock3 className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5" />}
          </button>
          {completedCount > 0 && (
            <button
              onClick={() => setShowDayReflection(true)}
              className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl hover:from-purple-600 hover:to-indigo-600 transition-all shadow-md hover:shadow-lg"
              title="AI 컨설턴트와 오늘 하루 학습 회고하기"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm font-medium whitespace-nowrap">AI 학습 회고</span>
            </button>
          )}
          <button
            onClick={() => setShowRegenerateDialog(true)}
            className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all shadow-md hover:shadow-lg"
            title="새 계획 만들기"
          >
            <Sparkles className="w-5 h-5" />
          </button>
        </div>

        {/* Header - Only show in cards mode */}
        {viewMode === 'cards' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 mb-6"
          >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                오늘의 학습 계획 📚
              </h1>
              <div className="flex items-center gap-4 text-gray-600">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(plan.date)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {plan.totalStartTime} - {plan.totalEndTime}
                </span>
              </div>
            </div>
          </div>

          {/* Motivational Quote */}
          {plan.motivationalQuote && (
            <div className="bg-blue-50 rounded-xl p-4 mb-4">
              <div className="flex items-start gap-3">
                <Quote className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                <p className="text-gray-700 italic">{plan.motivationalQuote}</p>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>오늘의 진행률</span>
              <span>
                {completedCount} / {totalCount} 완료 ({Math.round(progressPercentage)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <motion.div
                className="bg-green-600 h-3 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
          </motion.div>
        )}

        {/* Content based on view mode */}
        {viewMode === 'timeline' ? (
          <TimeBlockView
            plan={plan}
            onUpdateSubject={handleUpdateSubject}
            onAddReflection={onAddReflection}
          />
        ) : (
          <div className="space-y-4">
            {/* Enhanced Subject Cards */}
            {plan.plans.map((subject: SubjectPlan, index: number) => (
              <motion.div
                key={subject.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <EnhancedSubjectCard
                  subject={subject}
                  onToggleComplete={() => onToggleComplete(subject.id)}
                  onAddReflection={(reflection: string) => onAddReflection(subject.id, reflection)}
                  onUpdateSubject={handleEnhancedUpdateSubject(subject)}
                />
              </motion.div>
            ))}

            {/* Add New Subject Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: plan.plans.length * 0.1 + 0.2 }}
            >
              <AddSubjectCard onCreateSubject={handleCreateSubject} />
            </motion.div>
          </div>
        )}

        {/* Completion Message */}
        {completedCount === totalCount && totalCount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl shadow-lg p-8 text-center text-white"
          >
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold mb-2">축하합니다!</h2>
            <p className="text-lg">오늘의 모든 학습 계획을 완료하셨습니다!</p>
          </motion.div>
        )}

        {/* Refresh Button - Optional manual refresh */}
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              // Force a re-render by updating the updatedAt timestamp
              // This is much lighter than a full refetch
              window.location.reload();
            }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-500 rounded-xl shadow-sm hover:shadow-md transition-shadow opacity-50 hover:opacity-75"
            title="페이지 새로고침 (필요시에만 사용)"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="text-sm">새로고침</span>
          </button>
        </div>
      </div>

      {/* Reflection Modal */}
      <ReflectionModal
        isOpen={showReflectionModal}
        onClose={() => {
          setShowReflectionModal(false);
          setSelectedSubject(null);
        }}
        onSubmit={handleReflectionSubmit}
        subjectName={
          plan.plans.find((p: SubjectPlan) => p.id === selectedSubject)?.subject || ''
        }
      />

      {/* Regenerate Plan Dialog */}
      <RegeneratePlanDialog
        isOpen={showRegenerateDialog}
        onClose={() => setShowRegenerateDialog(false)}
        onConfirm={handleRegenerate}
        isLoading={isRegenerating}
      />

      {/* Day Reflection Chat - Available in both views when todos are completed */}
      <ReflectionChat
        isOpen={showDayReflection}
        onClose={() => setShowDayReflection(false)}
        plan={plan}
      />
    </div>
  );
}