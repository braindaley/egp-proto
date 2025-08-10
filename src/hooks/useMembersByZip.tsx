
'use client';

import { useState, useEffect, useCallback } from 'react';

// This should match the structure of the objects returned by our /api/congress/members/by-zip endpoint
interface Representative {
  name: string;
  party: string;
  phones?: string[];
  urls?: string[];
  photoUrl?: string;
  officeTitle: string;
  districtNumber?: number;
}

export const useMembersByZip = (zipCode: string | null) => {
  const [representatives, setRepresentatives] = useState<Representative[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    if (!zipCode) {
      setRepresentatives([]);
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
