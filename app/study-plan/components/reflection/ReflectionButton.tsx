'use client';

import { motion } from 'framer-motion';
import { MessageCircle, Sparkles, Clock } from 'lucide-react';
import type { DailyStudyPlan } from '@/lib/types/study-plan';

interface ReflectionButtonProps {
  plan: DailyStudyPlan;
  onStart: () => void;
  disabled?: boolean;
}

export default function ReflectionButton({ plan, onStart, disabled = false }: ReflectionButtonProps) {
  // 완료된 과목 수 계산
  const completedCount = plan.plans.filter(subject => subject.completed).length;
  const totalCount = plan.plans.length;
  const hasCompletedSubjects = completedCount > 0;

  // 버튼 텍스트 및 스타일 결정
  const getButtonContent = () => {
    if (completedCount === 0) {
      return {
        text: '학습을 시작한 후 AI 회고 가능',
        subText: '완료된 학습이 있을 때 AI 컨설턴트와 오늘 하루 학습을 회고할 수 있어요',
        gradient: 'from-gray-400 to-gray-500',
        icon: Clock,
        disabled: true
      };
    }

    if (completedCount === totalCount) {
      return {
        text: 'AI 컨설턴트와 오늘 학습 회고하기',
        subText: `모든 학습을 완료하셨군요! AI 컨설턴트와 함께 오늘 하루를 돌아보고 맞춤형 피드백을 받아보세요 (약 5분)`,
        gradient: 'from-green-500 to-blue-500',
        icon: Sparkles,
        disabled: false
      };
    }

    return {
      text: 'AI 컨설턴트와 중간 회고하기',
      subText: `${completedCount}/${totalCount} 과목 완료 · AI 컨설턴트와 함께 지금까지의 학습을 분석하고 개선점을 찾아보세요`,
      gradient: 'from-purple-500 to-pink-500',
      icon: MessageCircle,
      disabled: false
    };
  };

  const buttonContent = getButtonContent();
  const isDisabled = disabled || buttonContent.disabled;
  const IconComponent = buttonContent.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="mt-8"
    >
      <motion.button
        className={`w-full p-6 rounded-2xl font-semibold shadow-lg transition-all
                   flex flex-col items-center gap-3 text-white
                   ${isDisabled
                     ? 'bg-gradient-to-r cursor-not-allowed opacity-60'
                     : 'bg-gradient-to-r hover:shadow-xl cursor-pointer'
                   } ${buttonContent.gradient}`}
        whileHover={!isDisabled ? { scale: 1.02, y: -2 } : {}}
        whileTap={!isDisabled ? { scale: 0.98 } : {}}
        onClick={() => !isDisabled && onStart()}
        disabled={isDisabled}
      >
        {/* 메인 아이콘 */}
        <motion.div
          className="flex items-center justify-center gap-3"
          animate={!isDisabled ? {
            scale: [1, 1.1, 1],
          } : {}}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        >
          <IconComponent className="w-6 h-6" />
          <span className="text-xl font-bold">{buttonContent.text}</span>
          {!isDisabled && <Sparkles className="w-6 h-6" />}
        </motion.div>

        {/* 부가 설명 */}
        <p className="text-sm opacity-90 text-center max-w-lg leading-relaxed">
          {buttonContent.subText}
        </p>

        {/* 진행률 표시 (학습 중인 경우) */}
        {hasCompletedSubjects && !isDisabled && (
          <div className="w-full max-w-xs">
            <div className="flex justify-between text-xs opacity-75 mb-1">
              <span>학습 진행률</span>
              <span>{Math.round((completedCount / totalCount) * 100)}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <motion.div
                className="bg-white rounded-full h-2"
                initial={{ width: 0 }}
                animate={{ width: `${(completedCount / totalCount) * 100}%` }}
                transition={{ duration: 0.5, delay: 0.8 }}
              />
            </div>
          </div>
        )}
      </motion.button>

      {/* 추가 정보 카드 */}
      {hasCompletedSubjects && !isDisabled && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="mt-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10"
        >
          <div className="flex items-center gap-2 text-sm text-white/80">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span>🤖 전문 AI 컨설턴트가 오늘 하루 학습을 심층 분석하고 개인화된 개선안을 제공합니다</span>
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs text-white/60">
            <span>• 약 5분 대화</span>
            <span>• AI 학습 분석</span>
            <span>• 개인 맞춤 피드백</span>
            <span>• 내일 학습 가이드</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}