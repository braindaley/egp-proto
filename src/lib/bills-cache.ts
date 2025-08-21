import type { Bill } from '@/types';

// Cache configuration
const CACHE_DURATION = 3600; // 1 hour in seconds
const CACHE_STALE_WHILE_REVALIDATE = 7200; // 2 hours

interface CachedBillsResponse {
  bills: Bill[];
  timestamp: number;
  congress: string;
}

// Use a global variable in development to persist cache across HMR
declare global {
  var billsCache: Map<string, CachedBillsResponse> | undefined;
}

// In-memory cache that persists across HMR in development
const memoryCache = global.billsCache || new Map<string, CachedBillsResponse>();
if (!global.billsCache) {
  global.billsCache = memoryCache;
}

/**
 * Fetches bills from Congress API with caching
 */
export async function fetchBillsWithCache(
  congress: string,
  options?: {
    subject?: string;
    limit?: number;
    sort?: string;
  }
): Promise<{ bills: Bill[]; fromCache: boolean; cacheAge?: number }> {
  const API_KEY = process.env.CONGRESS_API_KEY;
  
  if (!API_KEY || API_KEY === 'your_congress_api_key_here') {
    throw new Error('Congress API key is not configured');
  }

  // Create cache key
  const cacheKey = `bills-${congress}-${options?.subject || 'all'}-${options?.limit || 20}`;
  
  // Check memory cache first (for development)
  const cached = memoryCache.get(cacheKey);
  const now = Date.now();
  
  if (cached) {
    const age = Math.floor((now - cached.timestamp) / 1000);
    
    // Return cached data if still fresh
    if (age < CACHE_DURATION) {
      console.log(`[Bills Cache] Serving from memory cache (age: ${age}s)`);
      return {
        bills: cached.bills,
        fromCache: true,
        cacheAge: age
      };
    }
    
    // Return stale data while revalidating in background
    if (age < CACHE_STALE_WHILE_REVALIDATE) {
      console.log(`[Bills Cache] Serving stale while revalidating (age: ${age}s)`);
      
      // Trigger background revalidation
      fetchAndCacheBills(congress, options, cacheKey).catch(console.error);
      
      return {
        bills: cached.bills,
        fromCache: true,
        cacheAge: age
      };
    }
  }
  
  // No cache or expired - fetch fresh data
  console.log(`[Bills Cache] Fetching fresh data for congress ${congress}`);
  const result = await fetchAndCacheBills(congress, options, cacheKey);
  
  return {
    bills: result.bills,
    fromCache: false,
    cacheAge: 0
  };
}

/**
 * Fetches bills from API and updates cache
 */
async function fetchAndCacheBills(
  congress: string,
  options?: {
    subject?: string;
    limit?: number;
    sort?: string;
  },
  cacheKey?: string
): Promise<CachedBillsResponse> {
  const API_KEY = process.env.CONGRESS_API_KEY;
  const limit = options?.limit || 20;
  const sort = options?.sort || 'updateDate+desc';
  
  let url = `https://api.congress.gov/v3/bill/${congress}?api_key=${API_KEY}&limit=${limit}&sort=${sort}`;
  
  if (options?.subject) {
    url = `https://api.congress.gov/v3/bill/${congress}?api_key=${API_KEY}&limit=${limit}&subject=${encodeURIComponent(options.subject)}`;
  }
  
  const response = await fetch(url, {
    next: { 
      revalidate: CACHE_DURATION,
      tags: [`bills-${congress}`]
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch bills: ${response.statusText}`);
  }
  
  const data = await response.json();
  const bills = data.bills || [];
  
  // Store in cache
  const cacheData: CachedBillsResponse = {
    bills,
    timestamp: Date.now(),
    congress
  };
  
  if (cacheKey) {
    memoryCache.set(cacheKey, cacheData);
    
    // Clean up old cache entries
    if (memoryCache.size > 100) {
      const oldestKey = memoryCache.keys().next().value;
      if (oldestKey) memoryCache.delete(oldestKey);
    }
  }
  
  return cacheData;
}

/**
 * Prefetch bills for multiple congresses
 * This can be called from API routes or server components
 */
export async function prefetchBills(
  congresses: string[] = ['119', '118'],
  options?: { limit?: number; subject?: string }
) {
  const limit = options?.limit || 20; // Use same default as API
  console.log(`[Bills Cache] Prefetching bills for congresses: ${congresses.join(', ')} (limit: ${limit})`);
  
  const promises = congresses.map(congress => 
    fetchBillsWithCache(congress, { ...options, limit })
      .catch(err => {
        console.error(`[Bills Cache] Failed to prefetch congress ${congress}:`, err);
        return null;
      })
  );
  
  const results = await Promise.allSettled(promises);
  
  const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
  console.log(`[Bills Cache] Prefetch complete. ${successful}/${congresses.length} successful`);
  
  return results;
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  const stats = {
    entriesCount: memoryCache.size,
    entries: Array.from(memoryCache.entries()).map(([key, value]) => ({
      key,
      congress: value.congress,
      billsCount: value.bills.length,
      age: Math.floor((Date.now() - value.timestamp) / 1000),
      timestamp: new Date(value.timestamp).toISOString()
    }))
  };
  
  return stats;
}

/**
 * Clear cache
 */
export function clearBillsCache() {
  memoryCache.clear();
  console.log('[Bills Cache] Cache cleared');
}