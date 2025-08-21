'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

const STORAGE_KEY = 'egp-watched-groups';

export function useWatchedGroups() {
  const { user } = useAuth();
  const [watchedGroups, setWatchedGroups] = useState<string[]>([]);
  const isUpdatingRef = useRef(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const db = getFirestore();

  // Load watched groups from Firestore (user account) or localStorage (fallback)
  useEffect(() => {
    if (!isInitialized) {
      const loadWatchedGroups = async () => {
        if (user) {
          // Load from user's Firestore document
          try {
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              const userData = userDoc.data();
              const watched = userData?.watchedGroups || [];
              setWatchedGroups(Array.isArray(watched) ? watched : []);
            } else {
              setWatchedGroups([]);
            }
          } catch (e) {
            console.error('Error loading watched groups from Firestore:', e);
            setWatchedGroups([]);
          }
        } else {
          // Fallback to localStorage for non-authenticated users
          if (typeof window !== 'undefined') {
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
          }
        }
        setIsInitialized(true);
      };
      
      loadWatchedGroups();
    }
  }, [user, isInitialized, db]);

  // Save to Firestore (user account) or localStorage (fallback) whenever watchedGroups changes
  useEffect(() => {
    if (isInitialized && !isUpdatingRef.current) {
      const saveWatchedGroups = async () => {
        if (user) {
          // Save to user's Firestore document
          try {
            const userDocRef = doc(db, 'users', user.uid);
            await setDoc(userDocRef, { watchedGroups }, { merge: true });
          } catch (e) {
            console.error('Error saving watched groups to Firestore:', e);
          }
        } else {
          // Fallback to localStorage for non-authenticated users
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(watchedGroups));
          }
        }
      };
      
      saveWatchedGroups();
    }
  }, [watchedGroups, isInitialized, user, db]);

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
    console.log('toggleWatch called with:', groupSlug);
    setWatchedGroups(prev => {
      const newState = prev.includes(groupSlug) 
        ? prev.filter(slug => slug !== groupSlug)
        : [...prev, groupSlug];
      console.log('watchedGroups updating from:', prev, 'to:', newState);
      return newState;
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