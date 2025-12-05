'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to check if the current user has premium access.
 * Uses the localStorage 'testAsPremium' flag for testing purposes.
 * Listens for storage events to react to changes from the dashboard toggle.
 */
export function usePremiumAccess(): { isPremium: boolean; isLoading: boolean } {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkPremium = () => {
      if (typeof window !== 'undefined') {
        setIsPremium(localStorage.getItem('testAsPremium') === 'true');
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

  return { isPremium, isLoading };
}
