import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm'
  };

  const variantClasses = {
    default: 'premium-badge text-[var(--color-text-secondary)]',
    primary: 'premium-badge bg-[var(--color-primary-400)]/10 text-[var(--color-primary-400)] border-[var(--color-primary-400)]/20 shadow-[inset_0_0_10px_rgba(86,186,125,0.1)]',
    success: 'premium-badge bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/20',
    warning: 'premium-badge bg-[var(--color-warning)]/10 text-[var(--color-warning)] border-[var(--color-warning)]/20',
    error: 'premium-badge bg-[var(--color-error)]/10 text-[var(--color-error)] border-[var(--color-error)]/20',
    info: 'premium-badge bg-[var(--color-info)]/10 text-[var(--color-info)] border-[var(--color-info)]/20'
  };

  return (
    <span
      className={`inline-flex items-center justify-center font-medium rounded-full ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;