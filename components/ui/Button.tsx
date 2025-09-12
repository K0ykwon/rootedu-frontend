import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 cursor-pointer whitespace-nowrap select-none hover-lift tap-scale touch-target relative overflow-hidden';
  
  const sizeClasses = {
    sm: 'min-h-[44px] px-4 text-[14px]', // Mobile optimized min touch target
    md: 'min-h-[48px] px-5 text-[16px]', // Larger for mobile
    lg: 'min-h-[52px] px-6 text-[18px]'  // Extra large for primary CTAs
  };

  const variantClasses = {
    primary: 'metallic-button-green text-white dark:text-white border border-[var(--color-border-primary)] hover:shadow-[0_0_20px_rgba(86,186,125,0.3)]',
    secondary: 'metallic-button bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] border border-[var(--color-border-primary)]',
    outline: 'glass-card text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]',
    ghost: 'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]',
    danger: 'metallic-button bg-gradient-to-r from-[var(--color-error)] to-red-600 text-white dark:text-white border border-[var(--color-border-primary)] hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]',
    success: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border border-[var(--color-border-primary)] hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:from-green-600 hover:to-emerald-700'
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;