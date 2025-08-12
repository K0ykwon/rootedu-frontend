import React, { useState } from 'react';

interface FABProps {
  icon: React.ReactNode;
  onClick?: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: React.ReactNode; // For extended FAB with label
}

export const FloatingActionButton: React.FC<FABProps> = ({
  icon,
  onClick,
  position = 'bottom-right',
  size = 'md',
  className = '',
  children
}) => {
  const positionClasses = {
    'bottom-right': 'bottom-20 right-4',
    'bottom-left': 'bottom-20 left-4',
    'bottom-center': 'bottom-20 left-1/2 -translate-x-1/2'
  };

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-14 h-14',
    lg: 'w-16 h-16'
  };

  const iconSizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-7 h-7'
  };

  return (
    <button
      onClick={onClick}
      className={`fixed ${positionClasses[position]} ${sizeClasses[size]} bg-[var(--color-primary-400)] text-white rounded-full shadow-lg hover:bg-[var(--color-primary-500)] transition-all duration-200 flex items-center justify-center z-40 tap-scale hover-lift safe-bottom ${className}`}
    >
      {children ? (
        <div className="flex items-center gap-2 px-4">
          <div className={iconSizeClasses[size]}>{icon}</div>
          <span className="text-sm font-medium whitespace-nowrap">{children}</span>
        </div>
      ) : (
        <div className={iconSizeClasses[size]}>{icon}</div>
      )}
    </button>
  );
};

// Speed Dial FAB with multiple actions
interface SpeedDialAction {
  id: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

interface SpeedDialFABProps {
  actions: SpeedDialAction[];
  position?: 'bottom-right' | 'bottom-left';
  className?: string;
}

export const SpeedDialFAB: React.FC<SpeedDialFABProps> = ({
  actions,
  position = 'bottom-right',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const positionClasses = {
    'bottom-right': 'bottom-20 right-4',
    'bottom-left': 'bottom-20 left-4'
  };

  const actionPositionClasses = position === 'bottom-right' 
    ? 'items-end' 
    : 'items-start';

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Actions */}
      <div className={`fixed ${positionClasses[position]} z-40 safe-bottom`}>
        <div className={`flex flex-col ${actionPositionClasses} gap-3 mb-3 transition-all duration-300 ${
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}>
          {actions.map((action, index) => (
            <div
              key={action.id}
              className="flex items-center gap-2"
              style={{
                transitionDelay: isOpen ? `${index * 50}ms` : '0ms'
              }}
            >
              {position === 'bottom-left' && (
                <span className="bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] px-3 py-1 rounded-lg text-sm font-medium">
                  {action.label}
                </span>
              )}
              <button
                onClick={() => {
                  action.onClick();
                  setIsOpen(false);
                }}
                className="w-12 h-12 bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] rounded-full shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center tap-scale"
              >
                {action.icon}
              </button>
              {position === 'bottom-right' && (
                <span className="bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] px-3 py-1 rounded-lg text-sm font-medium">
                  {action.label}
                </span>
              )}
            </div>
          ))}
        </div>
        
        {/* Main FAB */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 bg-[var(--color-primary-400)] text-white rounded-full shadow-lg hover:bg-[var(--color-primary-500)] transition-all duration-200 flex items-center justify-center tap-scale ${
            isOpen ? 'rotate-45' : ''
          } ${className}`}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="transition-transform duration-200">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </>
  );
};