
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useZipCode } from '@/hooks/use-zip-code';

// This should match the structure of the objects returned by our /api/congress/members/by-zip endpoint
interface Representative {
  name: string;
  party: string;
  phones?: string[];
  urls?: string[];
  photoUrl?: string;
  officeTitle: string;
  districtNumber?: number;
  bioguideId?: string;
  stateCode?: string;
}

interface CachedData {
  data: Representative[];
  timestamp: number;
}

const CACHE_KEY = 'members_by_zip_cache';
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

export const useMembersByZip = (zipCodeProp?: string | null) => {
  const { zipCode: cookieZipCode } = useZipCode();
  const [representatives, setRepresentatives] = useState<Representative[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const zipCode = zipCodeProp || cookieZipCode;

  const getCacheKey = (zip: string) => `${CACHE_KEY}_${zip}`;

  const getCachedData = (zip: string): Representative[] | null => {
    if (typeof window === 'undefined') return null;

    try {
      const cached = localStorage.getItem(getCacheKey(zip));
      if (!cached) return null;

      const { data, timestamp }: CachedData = JSON.parse(cached);
      const isExpired = Date.now() - timestamp > CACHE_DURATION;

      if (isExpired) {
        localStorage.removeItem(getCacheKey(zip));
        return null;
      }

      return data;
    } catch (err) {
      console.error('[useMembersByZip] Error reading cache:', err);
      return null;
    }
  };

  const setCachedData = (zip: string, data: Representative[]) => {
    if (typeof window === 'undefined') return;

    try {
      const cacheData: CachedData = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(getCacheKey(zip), JSON.stringify(cacheData));
    } catch (err) {
      console.error('[useMembersByZip] Error setting cache:', err);
    }
  };

  const fetchMembers = useCallback(async () => {
    if (!zipCode) {
      setRepresentatives([]);
      setIsLoading(false);
      return;
    }

    // Try to load from cache first
    const cached = getCachedData(zipCode);
    if (cached) {
      console.log(`[useMembersByZip] Using cached data for zip code: ${zipCode}`);
      setRepresentatives(cached);
      setIsLoading(false);
      return;
    }

    console.log(`[useMembersByZip] Starting fetch for zip code: ${zipCode}`);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/congress/members/by-zip?zip=${zipCode}`);

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = `Failed to fetch representatives: ${response.status} ${response.statusText} - ${errorData.error || 'Unknown error'}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log(`[useMembersByZip] Successfully fetched ${data.length} representatives.`);
      setRepresentatives(data);
      setCachedData(zipCode, data);

    } catch (err: any) {
      console.error(`[useMembersByZip] Error fetching members:`, err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [zipCode]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  return { representatives, isLoading, error, refetch: fetchMembers };
};
