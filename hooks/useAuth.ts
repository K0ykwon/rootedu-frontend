'use client';

import { useSession } from 'next-auth/react';
import { useState, useCallback } from 'react';

interface UseAuthReturn {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
  showAuthModal: boolean;
  requireAuth: (callback?: () => void) => boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}

export function useAuth(): UseAuthReturn {
  const { data: session, status } = useSession();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authCallback, setAuthCallback] = useState<(() => void) | null>(null);

  const isAuthenticated = !!session?.user;
  const isLoading = status === 'loading';

  const requireAuth = useCallback((callback?: () => void) => {
    if (isAuthenticated) {
      if (callback) callback();
      return true;
    } else {
      setAuthCallback(() => callback);
      setShowAuthModal(true);
      return false;
    }
  }, [isAuthenticated]);

  const openAuthModal = useCallback(() => {
    setShowAuthModal(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setShowAuthModal(false);
    setAuthCallback(null);
  }, []);

  // Execute callback after successful authentication
  if (isAuthenticated && authCallback) {
    authCallback();
    setAuthCallback(null);
  }

  return {
    isAuthenticated,
    isLoading,
    user: session?.user,
    showAuthModal,
    requireAuth,
    openAuthModal,
    closeAuthModal
  };
}