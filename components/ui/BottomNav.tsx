import React from 'react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  onClick?: () => void;
}

interface BottomNavProps {
  items: NavItem[];
  activeItem: string;
  onItemClick?: (id: string) => void;
  className?: string;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  items,
  activeItem,
  onItemClick,
  className = ''
}) => {
  return (
    <nav className={`fixed bottom-0 left-0 right-0 bg-[var(--color-bg-secondary)] border-t border-[var(--color-border-primary)] safe-bottom ${className}`}>
      <div className="flex items-center justify-around h-16">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              item.onClick?.();
              onItemClick?.(item.id);
            }}
            className={`flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[64px] transition-all duration-200 tap-scale ${
              activeItem === item.id
                ? 'text-[var(--color-primary-400)]'
                : 'text-[var(--color-text-tertiary)]'
            }`}
          >
            <div className="relative">
              <div className={`w-6 h-6 ${activeItem === item.id ? 'scale-110' : ''} transition-transform duration-200`}>
                {item.icon}
              </div>
              {item.badge && item.badge > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-[var(--color-error)] text-white text-[10px] font-medium rounded-full flex items-center justify-center">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </div>
            <span className="text-[11px] font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

// Mobile Menu Drawer Component
interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  position?: 'left' | 'right';
}

export const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  onClose,
  children,
  position = 'left'
}) => {
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* Menu Panel */}
      <div
        className={`fixed top-0 bottom-0 ${position === 'left' ? 'left-0' : 'right-0'} w-[80%] max-w-sm bg-[var(--color-bg-primary)] z-50 transition-transform duration-300 ${
          isOpen 
            ? 'translate-x-0' 
            : position === 'left' ? '-translate-x-full' : 'translate-x-full'
        } safe-top safe-bottom`}
      >
        <div className="h-full overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  );
};