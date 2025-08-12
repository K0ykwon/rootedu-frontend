import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center gap-2 border font-medium rounded-lg transition-all duration-150 cursor-pointer whitespace-nowrap select-none shadow-linear hover-lift tap-scale touch-target';
  
  const sizeClasses = {
    sm: 'min-h-[44px] px-4 text-[14px]', // Mobile optimized min touch target
    md: 'min-h-[48px] px-5 text-[16px]', // Larger for mobile
    lg: 'min-h-[52px] px-6 text-[18px]'  // Extra large for primary CTAs
  };

  const variantClasses = {
    primary: 'bg-[var(--color-primary-400)] text-white border-[var(--color-primary-400)] hover:bg-[var(--color-primary-500)] hover:border-[var(--color-primary-500)]',
    secondary: 'bg-[#e6e6e6] text-[var(--color-bg-primary)] border-[#e6e6e6] hover:bg-[#d6d6d6] hover:border-[#d6d6d6]',
    outline: 'bg-transparent text-[var(--color-text-tertiary)] border-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-secondary)] hover:border-[var(--color-text-secondary)]',
    ghost: 'bg-transparent text-[var(--color-text-secondary)] border-transparent hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]',
    danger: 'bg-[var(--color-error)] text-white border-[var(--color-error)] hover:bg-red-600 hover:border-red-600'
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