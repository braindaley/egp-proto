import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const congress = searchParams.get('congress') || '118'; // Default to current congress
  
  try {
    // Use the same cache mechanism as the page
    const { fetchBillsWithCache } = await import('@/lib/bills-cache');
    
    const { bills, fromCache, cacheAge } = await fetchBillsWithCache(congress, {
      limit: 20,
      sort: 'updateDate+desc'
    });
    
    console.log(`[Recent Bills API] Congress ${congress} - Cache: ${fromCache ? 'HIT' : 'MISS'}, Age: ${cacheAge}s`);
    
    return NextResponse.json({
      bills,
      congress,
      fromCache,
      cacheAge
    });
  } catch (error) {
    console.error(`Error fetching recent bills for congress ${congress}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch recent bills' },
      { status: 500 }
    );
  }
}