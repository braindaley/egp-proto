
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { fetchBillsWithCache } from '@/lib/bills-cache';

export async function GET(req: NextRequest, { params }: { params: Promise<{ congress: string }> }) {
  const { congress } = await params;
  const { searchParams } = new URL(req.url);
  const subject = searchParams.get('subject');
  const limit = searchParams.get('limit');

  // Validate that congress is a number
  if (isNaN(Number(congress))) {
    return NextResponse.json({ error: 'Invalid congress number provided.' }, { status: 400 });
  }

  try {
    // Use cached bills fetcher
    const { bills, fromCache, cacheAge } = await fetchBillsWithCache(congress, {
      subject: subject || undefined,
      limit: limit ? parseInt(limit) : 20,
      sort: 'updateDate+desc'
    });
    
    // Add cache headers for better CDN caching
    const headers = new Headers();
    headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
    headers.set('X-Cache-Status', fromCache ? 'HIT' : 'MISS');
    if (cacheAge !== undefined) {
      headers.set('X-Cache-Age', cacheAge.toString());
    }
    
    return NextResponse.json(
      { bills },
      { 
        status: 200,
        headers 
      }
    );

  } catch (error) {
    console.error(`Error fetching bills for congress ${congress}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
