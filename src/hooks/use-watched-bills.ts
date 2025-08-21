'use client';

import { useState, useEffect, useCallback } from 'react';

interface WatchedBill {
  congress: number;
  type: string;
  number: string;
  title?: string;
  watchedAt: string;
}

const STORAGE_KEY = 'egp-watched-bills';

export function useWatchedBills() {
  const [watchedBills, setWatchedBills] = useState<WatchedBill[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load watched bills from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && !isInitialized) {
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
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // Save to localStorage whenever watchedBills changes (but only after initialization)
  useEffect(() => {
    if (typeof window !== 'undefined' && isInitialized) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(watchedBills));
    }
  }, [watchedBills, isInitialized]);

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