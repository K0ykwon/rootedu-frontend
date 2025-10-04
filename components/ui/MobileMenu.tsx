'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  session: any;
  onSignOut: () => void;
}

const navItems = [
  { href: '/study-plan', label: '📚 학습 계획' },
  { href: '/study-proof', label: '🔥 공부 인증' },
  { href: '/influencers', label: '인플루언서 탐색' },
  { href: '/community', label: '커뮤니티' },
  { href: '/tools', label: 'AI 학습 도구' },
  { href: '/assessments', label: '진단평가' },
];

export default function MobileMenu({ isOpen, onClose, session, onSignOut }: MobileMenuProps) {
  const pathname = usePathname();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="absolute right-0 top-0 h-full w-[280px] glass-card-heavy border-l border-[var(--glass-border)] shadow-2xl animate-slide-up overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--glass-border)]">
          <span className="text-lg font-semibold text-[var(--color-text-primary)]">메뉴</span>
          <button
            onClick={onClose}
            className="touch-target p-2 hover:bg-[var(--color-bg-tertiary)] rounded-lg transition-colors"
            aria-label="메뉴 닫기"
          >
            <svg className="w-6 h-6 text-[var(--color-text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`
                  block px-4 py-3 rounded-lg touch-target transition-all duration-200
                  ${isActive
                    ? 'bg-[var(--color-primary-500)] text-white shadow-[var(--glow-green-subtle)]'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]'
                  }
                `}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Auth Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[var(--glass-border)] bg-[var(--color-bg-secondary)]">
          {session ? (
            <div className="space-y-3">
              <p className="text-sm text-[var(--color-text-secondary)] truncate">
                {session.user.name}
              </p>
              <button
                onClick={() => {
                  onSignOut();
                  onClose();
                }}
                className="w-full px-4 py-2 bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] rounded-lg touch-target hover:bg-[var(--color-bg-quaternary)] transition-colors"
              >
                로그아웃
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <Link href="/auth/login" onClick={onClose}>
                <button className="w-full px-4 py-2 glass-card text-[var(--color-text-primary)] rounded-lg touch-target hover:bg-[var(--color-bg-tertiary)] transition-colors">
                  로그인
                </button>
              </Link>
              <Link href="/auth/register" onClick={onClose}>
                <button className="w-full px-4 py-2 bg-[var(--color-primary-500)] text-white rounded-lg touch-target hover:shadow-[var(--glow-green)] transition-all">
                  회원가입
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
