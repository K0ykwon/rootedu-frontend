import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hover?: boolean;
  compact?: boolean;
  elevated?: boolean;
  glass?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hover = false,
  compact = false,
  elevated = false,
  glass = true,
  ...props
}) => {
  const baseClasses = glass 
    ? 'glass-card rounded-xl transition-all duration-200' 
    : 'bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-xl transition-all duration-200';
  const paddingClasses = compact ? 'p-4' : 'p-6';
  const hoverClasses = hover ? 'hover:border-[var(--color-primary-400)] hover:shadow-[0_8px_24px_rgba(86,186,125,0.12)] hover:bg-[var(--color-bg-quaternary)]' : '';
  const elevatedClasses = elevated ? 'shadow-[0_4px_12px_rgba(0,0,0,0.15)]' : '';

  return (
    <div
      {...props}
      className={`${baseClasses} ${paddingClasses} ${hoverClasses} ${elevatedClasses} ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => {
  return (
    <div className={`mb-4 pb-4 border-b border-[var(--color-border-secondary)] ${className}`}>
      {children}
    </div>
  );
};

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export const CardTitle: React.FC<CardTitleProps> = ({ children, className = '' }) => {
  return (
    <h3 className={`text-[21px] font-medium text-[var(--color-text-primary)] m-0 ${className}`}>
      {children}
    </h3>
  );
};

interface CardSubtitleProps {
  children: React.ReactNode;
  className?: string;
}

export const CardSubtitle: React.FC<CardSubtitleProps> = ({ children, className = '' }) => {
  return (
    <p className={`text-sm text-[var(--color-text-tertiary)] mt-1 mb-0 ${className}`}>
      {children}
    </p>
  );
};

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({ children, className = '' }) => {
  return (
    <div className={`text-[var(--color-text-secondary)] ${className}`}>
      {children}
    </div>
  );
};

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => {
  return (
    <div className={`mt-4 pt-4 border-t border-[var(--color-border-secondary)] ${className}`}>
      {children}
    </div>
  );
};