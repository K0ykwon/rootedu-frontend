import React from 'react';

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  showPercentage?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'error';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  className = '',
  showPercentage = false,
  color = 'primary'
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const colorClasses = {
    primary: 'from-[var(--color-primary-400)] to-[var(--color-primary-500)]',
    success: 'from-[var(--color-success)] to-green-600',
    warning: 'from-[var(--color-warning)] to-orange-600',
    error: 'from-[var(--color-error)] to-red-600'
  };

  return (
    <div className={`${className}`}>
      {showPercentage && (
        <div className="flex justify-between mb-1">
          <span className="text-sm text-[var(--color-text-secondary)]">Progress</span>
          <span className="text-sm font-medium text-[var(--color-primary-400)]">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className="w-full h-2 bg-[var(--color-bg-quaternary)] rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${colorClasses[color]} transition-all duration-300 ease-out rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

interface ProgressRingProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 border-2',
    md: 'w-12 h-12 border-4',
    lg: 'w-16 h-16 border-4'
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-full border-[var(--color-bg-quaternary)] border-t-[var(--color-primary-400)] animate-spin ${className}`}
    />
  );
};

interface LearningProgressProps {
  title: string;
  progress: number;
  total?: number;
  icon?: React.ReactNode;
  className?: string;
}

export const LearningProgress: React.FC<LearningProgressProps> = ({
  title,
  progress,
  total = 100,
  icon,
  className = ''
}) => {
  const percentage = Math.round((progress / total) * 100);

  return (
    <div className={`flex items-center gap-2 p-3 bg-[var(--color-bg-tertiary)] rounded-lg border border-[var(--color-border-primary)] ${className}`}>
      {icon && (
        <div className="w-6 h-6 rounded-full bg-[var(--color-primary-400)] flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
      )}
      <div className="flex-1 text-sm text-[var(--color-text-secondary)]">
        {title}
      </div>
      <div className="text-sm font-medium text-[var(--color-primary-400)]">
        {percentage}%
      </div>
    </div>
  );
};

interface StepsProgressProps {
  steps: { label: string; completed: boolean }[];
  currentStep: number;
  className?: string;
}

export const StepsProgress: React.FC<StepsProgressProps> = ({
  steps,
  currentStep,
  className = ''
}) => {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      {steps.map((step, index) => {
        const isCompleted = step.completed;
        const isCurrent = index === currentStep;
        const isUpcoming = index > currentStep;

        return (
          <React.Fragment key={index}>
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all duration-200 ${
                  isCompleted
                    ? 'bg-[var(--color-primary-400)] text-white'
                    : isCurrent
                    ? 'bg-[var(--color-bg-quaternary)] text-[var(--color-primary-400)] border-2 border-[var(--color-primary-400)]'
                    : 'bg-[var(--color-bg-quaternary)] text-[var(--color-text-tertiary)] border border-[var(--color-border-primary)]'
                }`}
              >
                {isCompleted ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M13.5 2L6 9.5 2.5 6l1.4-1.4 2.1 2.1 6.1-6.1L13.5 2z"/>
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <span className={`text-xs mt-2 ${
                isCompleted || isCurrent
                  ? 'text-[var(--color-text-primary)]'
                  : 'text-[var(--color-text-tertiary)]'
              }`}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${
                step.completed
                  ? 'bg-[var(--color-primary-400)]'
                  : 'bg-[var(--color-border-primary)]'
              }`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};