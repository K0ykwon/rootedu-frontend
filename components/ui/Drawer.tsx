import React, { useEffect, useRef } from 'react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  height?: 'auto' | 'full' | 'half';
  showHandle?: boolean;
  className?: string;
}

const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  height = 'auto',
  showHandle = true,
  className = ''
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isDragging = useRef(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || !sheetRef.current) return;
    
    currentY.current = e.touches[0].clientY;
    const translateY = Math.max(0, currentY.current - startY.current);
    sheetRef.current.style.transform = `translateY(${translateY}px)`;
  };

  const handleTouchEnd = () => {
    if (!isDragging.current || !sheetRef.current) return;
    
    const translateY = currentY.current - startY.current;
    
    if (translateY > 100) {
      onClose();
    } else {
      sheetRef.current.style.transform = 'translateY(0)';
    }
    
    isDragging.current = false;
  };

  const heightClasses = {
    auto: 'max-h-[90vh]',
    half: 'h-[50vh]',
    full: 'h-[90vh]'
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div
        ref={sheetRef}
        className={`fixed bottom-0 left-0 right-0 bg-[var(--color-bg-secondary)] rounded-t-2xl z-50 transition-transform duration-300 ${heightClasses[height]} ${className}`}
        style={{
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
        }}
      >
        {/* Drag Handle */}
        {showHandle && (
          <div
            className="sticky top-0 bg-[var(--color-bg-secondary)] rounded-t-2xl py-3 cursor-grab active:cursor-grabbing"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="w-12 h-1 bg-[var(--color-border-primary)] rounded-full mx-auto" />
          </div>
        )}
        
        {/* Header */}
        {title && (
          <div className="sticky top-10 bg-[var(--color-bg-secondary)] px-6 py-4 border-b border-[var(--color-border-primary)]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{title}</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors tap-scale"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" className="text-[var(--color-text-tertiary)]">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6l8 8M14 6l-8 8" />
                </svg>
              </button>
            </div>
          </div>
        )}
        
        {/* Content */}
        <div className="overflow-y-auto px-6 py-4 safe-bottom">
          {children}
        </div>
      </div>
    </>
  );
};

export default Drawer;