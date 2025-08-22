import { useQuery } from '@tanstack/react-query';
import type { Bill } from '@/types';

async function fetchBillDetail(congress: string, billType: string, billNumber: string): Promise<Bill> {
  const response = await fetch(`/api/bill?congress=${congress}&billType=${billType}&billNumber=${billNumber}`);
  
  if (!response.ok) {
    let errorMessage = `Failed to fetch bill: ${response.status}`;
    
    try {
      const errorData = await response.json();
      if (errorData.error) {
        errorMessage = errorData.error;
      }
      
      // Handle specific 503 errors from Congress API
      if (response.status === 503 && errorData.temporary) {
        errorMessage = errorData.error;
      }
    } catch {
      // If we can't parse the error response, use the default message
    }
    
    throw new Error(errorMessage);
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