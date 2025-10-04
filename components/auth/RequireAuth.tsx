'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import Button from '../ui/Button';
import Card from '../ui/Card';

interface RequireAuthProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export default function RequireAuth({ children, redirectTo = '/auth/login' }: RequireAuthProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[var(--color-primary-500)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[var(--color-text-secondary)]">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated' || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 sm:p-10 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center">
              <svg className="w-10 h-10 text-[var(--color-primary-500)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-[clamp(1.5rem,4vw,2rem)] font-bold text-[var(--color-text-primary)] mb-2">
              로그인이 필요합니다
            </h2>
            <p className="text-[var(--color-text-secondary)]">
              이 페이지에 접근하려면 먼저 로그인해주세요
            </p>
          </div>

          <div className="space-y-3">
            <Link href={redirectTo} className="block">
              <Button variant="primary" size="lg" className="w-full">
                로그인하러 가기
              </Button>
            </Link>
            <Link href="/auth/register" className="block">
              <Button variant="outline" size="lg" className="w-full">
                회원가입
              </Button>
            </Link>
            <Link href="/" className="block">
              <Button variant="ghost" size="md" className="w-full">
                홈으로 돌아가기
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
