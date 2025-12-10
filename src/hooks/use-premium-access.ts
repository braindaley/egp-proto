'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';

/**
 * Hook to check if the current user has premium access.
 * Uses the localStorage 'testAsPremium' flag for testing purposes.
 * Listens for storage events to react to changes from the dashboard toggle.
 *
 * IMPORTANT: Premium access requires the user to be logged in.
 * Logged out users will never be treated as premium, even if the test flag is set.
 */
export function usePremiumAccess(): { isPremium: boolean; isLoading: boolean } {
  const { user, loading: authLoading } = useAuth();
  const [testAsPremium, setTestAsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkPremium = () => {
      if (typeof window !== 'undefined') {
        setTestAsPremium(localStorage.getItem('testAsPremium') === 'true');
      }
      setIsLoading(false);
    };

    // Initial check
    checkPremium();

    // Listen for storage changes (when toggle is changed on dashboard)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'testAsPremium') {
        checkPremium();
      }
    };

    // Also listen for custom events for same-window updates
    const handleCustomEvent = () => {
      checkPremium();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('premiumStatusChanged', handleCustomEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('premiumStatusChanged', handleCustomEvent);
    };
  }, []);

  // Only premium if logged in AND test flag is set
  const isPremium = !!user && testAsPremium;

  return { isPremium, isLoading: isLoading || authLoading };
}
