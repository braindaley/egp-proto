import { useQuery } from '@tanstack/react-query';
import type { FeedBill } from '@/types';

interface BillsResponse {
  bills: FeedBill[];
  error?: string;
}

async function fetchBills(): Promise<FeedBill[]> {
  const response = await fetch('/api/feed/bills', {
    cache: 'no-cache',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch bills: ${response.status}`);
  }

  const result: BillsResponse = await response.json();
  
  if (result.error) {
    throw new Error(result.error);
  }

  return result.bills || [];
}

export function useBills() {
  return useQuery({
    queryKey: ['bills'],
    queryFn: fetchBills,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
}