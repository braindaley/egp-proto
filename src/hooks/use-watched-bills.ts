'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

interface WatchedBill {
  congress: number;
  type: string;
  number: string;
  title?: string;
  watchedAt: string;
}

const STORAGE_KEY = 'egp-watched-bills';

export function useWatchedBills() {
  const { user } = useAuth();
  const [watchedBills, setWatchedBills] = useState<WatchedBill[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const db = getFirestore();

  // Load watched bills from Firestore (user account) or localStorage (fallback)
  useEffect(() => {
    if (!isInitialized) {
      const loadWatchedBills = async () => {
        if (user) {
          // Load from user's Firestore document
          try {
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              const userData = userDoc.data();
              const watched = userData?.watchedBills || [];
              setWatchedBills(Array.isArray(watched) ? watched : []);
            } else {
              setWatchedBills([]);
            }
          } catch (e) {
            console.error('Error loading watched bills from Firestore:', e);
            setWatchedBills([]);
          }
        } else {
          // Fallback to localStorage for non-authenticated users
          if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored && stored !== 'null' && stored !== 'undefined') {
              try {
                const parsed = JSON.parse(stored);
                const result = Array.isArray(parsed) ? parsed : [];
                setWatchedBills(result);
              } catch (e) {
                setWatchedBills([]);
              }
            } else {
              setWatchedBills([]);
            }
          }
        }
        setIsInitialized(true);
      };
      
      loadWatchedBills();
    }
  }, [user, isInitialized, db]);

  // Save to Firestore (user account) or localStorage (fallback) whenever watchedBills changes
  useEffect(() => {
    if (isInitialized) {
      const saveWatchedBills = async () => {
        if (user) {
          // Save to user's Firestore document
          try {
            const userDocRef = doc(db, 'users', user.uid);
            await setDoc(userDocRef, { watchedBills }, { merge: true });
          } catch (e) {
            console.error('Error saving watched bills to Firestore:', e);
          }
        } else {
          // Fallback to localStorage for non-authenticated users
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(watchedBills));
          }
        }
      };
      
      saveWatchedBills();
    }
  }, [watchedBills, isInitialized, user, db]);

  const watchBill = useCallback((congress: number, type: string, number: string, title?: string) => {
    setWatchedBills(prev => {
      // Check if already watched
      const exists = prev.some(bill => 
        bill.congress === congress && 
        bill.type === type && 
        bill.number === number
      );
      
      if (exists) return prev;
      
      const newBill: WatchedBill = {
        congress,
        type,
        number,
        title,
        watchedAt: new Date().toISOString()
      };
      
      return [...prev, newBill];
    });
  }, []);

  const unwatchBill = useCallback((congress: number, type: string, number: string) => {
    setWatchedBills(prev => prev.filter(bill => 
      !(bill.congress === congress && bill.type === type && bill.number === number)
    ));
  }, []);

  const toggleWatchBill = useCallback((congress: number, type: string, number: string, title?: string) => {
    setWatchedBills(prev => {
      const exists = prev.some(bill => 
        bill.congress === congress && 
        bill.type === type && 
        bill.number === number
      );
      
      if (exists) {
        return prev.filter(bill => 
          !(bill.congress === congress && bill.type === type && bill.number === number)
        );
      } else {
        const newBill: WatchedBill = {
          congress,
          type,
          number,
          title,
          watchedAt: new Date().toISOString()
        };
        return [...prev, newBill];
      }
    });
  }, []);

  const isWatchedBill = useCallback((congress: number, type: string, number: string) => {
    return watchedBills.some(bill => 
      bill.congress === congress && 
      bill.type === type && 
      bill.number === number
    );
  }, [watchedBills]);

  return {
    watchedBills,
    watchBill,
    unwatchBill,
    toggleWatchBill,
    isWatchedBill
  };
}