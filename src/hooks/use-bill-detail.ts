import { useQuery } from '@tanstack/react-query';
import type { Bill } from '@/types';

async function fetchBillDetail(congress: string, billType: string, billNumber: string): Promise<Bill> {
  const response = await fetch(`/api/bill?congress=${congress}&billType=${billType}&billNumber=${billNumber}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch bill: ${response.status}`);
  }
  
  return await response.json();
}

export function useBillDetail(congress: string | null, billType: string | null, billNumber: string | null) {
  return useQuery({
    queryKey: ['bill-detail', congress, billType, billNumber],
    queryFn: () => fetchBillDetail(congress!, billType!, billNumber!),
    enabled: !!(congress && billType && billNumber),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
  });
}