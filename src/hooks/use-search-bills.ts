import { useQuery } from '@tanstack/react-query';
import type { FeedBill } from '@/types';

interface SearchBillsResponse {
  bills: FeedBill[];
  total?: number;
  searched?: number;
}

async function searchBills(searchTerm: string): Promise<SearchBillsResponse> {
  if (!searchTerm || searchTerm.trim().length < 2) {
    return { bills: [] };
  }

  const searchUrl = `/api/search/bills?q=${encodeURIComponent(searchTerm)}`;
  
  const response = await fetch(searchUrl, {
    cache: 'no-cache',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Search failed: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

export function useSearchBills(searchTerm: string) {
  return useQuery({
    queryKey: ['search-bills', searchTerm],
    queryFn: () => searchBills(searchTerm),
    enabled: searchTerm.trim().length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
}