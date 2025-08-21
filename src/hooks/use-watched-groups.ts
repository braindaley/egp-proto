'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY = 'egp-watched-groups';

export function useWatchedGroups() {
  const [watchedGroups, setWatchedGroups] = useState<string[]>([]);
  const isUpdatingRef = useRef(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load watched groups from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && !isInitialized) {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && stored !== 'null' && stored !== 'undefined') {
        try {
          const parsed = JSON.parse(stored);
          const result = Array.isArray(parsed) ? parsed : [];
          setWatchedGroups(result);
        } catch (e) {
          setWatchedGroups([]);
        }
      } else {
        setWatchedGroups([]);
      }
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // Save to localStorage whenever watchedGroups changes (but only after initialization)
  useEffect(() => {
    if (typeof window !== 'undefined' && isInitialized) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(watchedGroups));
    }
  }, [watchedGroups, isInitialized]);

  const watchGroup = useCallback((groupSlug: string) => {
    setWatchedGroups(prev => {
      if (prev.includes(groupSlug)) {
        return prev;
      }
      return [...prev, groupSlug];
    });
  }, []);

  const unwatchGroup = useCallback((groupSlug: string) => {
    setWatchedGroups(prev => prev.filter(slug => slug !== groupSlug));
  }, []);

  const toggleWatch = useCallback((groupSlug: string) => {
    setWatchedGroups(prev => {
      return prev.includes(groupSlug) 
        ? prev.filter(slug => slug !== groupSlug)
        : [...prev, groupSlug];
    });
  }, []);

  const isWatched = useCallback((groupSlug: string) => {
    return watchedGroups.includes(groupSlug);
  }, [watchedGroups]);

  return {
    watchedGroups,
    watchGroup,
    unwatchGroup,
    toggleWatch,
    isWatched
  };
}