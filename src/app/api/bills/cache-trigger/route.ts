import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // This endpoint allows manual triggering of the cache refresh
    // It calls the cache-refresh endpoint with the proper authorization
    
    const CRON_SECRET = process.env.CRON_SECRET;
    if (!CRON_SECRET) {
      return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
    }

    // Get the base URL for the request
    const host = request.headers.get('host');
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const baseUrl = `${protocol}://${host}`;

    // Call the cache refresh endpoint
    const response = await fetch(`${baseUrl}/api/bills/cache-refresh`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: 'Cache refresh triggered successfully',
        result: data
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Cache refresh failed',
        details: data
      }, { status: response.status });
    }

  } catch (error) {
    console.error('Error triggering cache refresh:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Manual cache refresh trigger. Use POST to trigger refresh.',
    instructions: 'This endpoint manually triggers the bill cache refresh process.'
  });
}