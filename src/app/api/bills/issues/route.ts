import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const congress = searchParams.get('congress') || '118'; // Default to current congress
  const subjects = searchParams.get('subjects');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');
  
  try {
    // Build the search parameters
    const params = new URLSearchParams({
      congress: congress,
      limit: limit.toString(),
      offset: offset.toString()
    });

    if (subjects) {
      params.append('subjects', subjects);
    }

    // Use the internal search API
    const baseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3006' 
      : 'https://egp.gscadmin.com';
    
    const response = await fetch(`${baseUrl}/api/bills/search?${params.toString()}`, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Search API returned ${response.status}`);
    }

    const data = await response.json();
    
    console.log(`[Issues Bills API] Congress ${congress} - Found ${data.bills?.length || 0} bills`);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error fetching bills by issues for congress ${congress}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch bills by issues' },
      { status: 500 }
    );
  }
}