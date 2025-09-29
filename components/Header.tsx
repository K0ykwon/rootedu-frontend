'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import Button from './ui/Button';

export default function Header() {
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-0 z-50 glass-card-heavy border-b border-[var(--glass-border)] shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="text-xl font-semibold text-[var(--color-text-primary)]">
              RootEdu
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/study-plan"
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              📚 학습 계획
            </Link>
            <Link
              href="/study-proof"
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              🔥 공부 인증
            </Link>
            <Link
              href="/influencers"
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              인플루언서 탐색
            </Link>
            <Link 
              href="/community" 
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              커뮤니티
            </Link>
            <Link 
              href="/tools" 
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              AI 학습 도구
            </Link>
            <Link 
              href="/assessments" 
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              진단평가
            </Link>
          </nav>

          {/* Auth Section */}
          <div className="flex items-center space-x-4">
            {status === 'loading' ? (
              <div className="w-8 h-8 rounded-full bg-[var(--color-bg-tertiary)] animate-pulse" />
            ) : session ? (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-[var(--color-text-secondary)]">
                  {session.user.name}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => signOut()}
                >
                  로그아웃
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/auth/login">
                  <Button variant="outline" size="sm">
                    로그인
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button variant="primary" size="sm">
                    회원가입
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}