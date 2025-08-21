import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prefetchBills, getCacheStats } from '@/lib/bills-cache';

// This route can be called by external services (like Netlify Functions or cron jobs)
// to prefetch and warm up the cache
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get('secret');
  
  // Optional: Add a secret to prevent unauthorized cache warming
  const expectedSecret = process.env.CACHE_REVALIDATION_SECRET;
  if (expectedSecret && secret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    console.log('[Prefetch] Starting bills prefetch...');
    const startTime = Date.now();
    
    // Prefetch bills for recent congresses with the same limit as the API uses
    const congresses = ['119', '118', '117'];
    const results = await prefetchBills(congresses, { limit: 20 });
    
    const duration = Date.now() - startTime;
    const stats = getCacheStats();
    
    return NextResponse.json({
      success: true,
      message: 'Bills prefetched successfully',
      duration: `${duration}ms`,
      congressesPrefetched: congresses,
      cacheStats: stats
    });
  } catch (error) {
    console.error('[Prefetch] Error prefetching bills:', error);
    return NextResponse.json(
      { 
        error: 'Failed to prefetch bills',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST endpoint to trigger prefetch
export async function POST(req: NextRequest) {
  return GET(req);
}