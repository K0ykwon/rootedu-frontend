'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

interface AuthRedirectProps {
  children: React.ReactNode;
  redirectIfAuthenticated?: boolean;
  redirectTo?: string;
}

export default function AuthRedirect({ 
  children, 
  redirectIfAuthenticated = true,
  redirectTo = '/' 
}: AuthRedirectProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (redirectIfAuthenticated && status === 'authenticated') {
      const callbackUrl = searchParams.get('callbackUrl') || redirectTo;
      router.push(callbackUrl);
    }
  }, [status, router, redirectTo, redirectIfAuthenticated, searchParams]);

  // Show loading while session is being determined
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center">
        <div className="text-[var(--color-text-primary)]">로딩 중...</div>
      </div>
    );
  }

  // If redirecting authenticated users and user is authenticated, show loading
  if (redirectIfAuthenticated && status === 'authenticated') {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center">
        <div className="text-[var(--color-text-primary)]">리디렉션 중...</div>
      </div>
    );
  }

  return <>{children}</>;
}