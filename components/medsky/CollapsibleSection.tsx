'use client';

import React, { useState } from 'react';

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  headerActions?: React.ReactNode;
  className?: string;
}

export function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
  headerActions,
  className = ''
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`border rounded-lg ${className}`}>
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center space-x-2">
          <span className={`transform transition-transform ${isOpen ? 'rotate-90' : ''}`}>
            ▶
          </span>
          <h4 className="font-semibold text-gray-900">{title}</h4>
        </div>
        {headerActions && (
          <div onClick={(e) => e.stopPropagation()}>
            {headerActions}
          </div>
        )}
      </div>
      {isOpen && (
        <div className="p-4 border-t">
          {children}
        </div>
      )}
    </div>
  );
}