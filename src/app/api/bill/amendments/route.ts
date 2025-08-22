import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Amendment } from '@/types';

// This is an assumed response structure from congress.gov based on other endpoints.
interface CongressGovAmendmentsResponse {
    amendments: Amendment[];
    pagination: {
        count: number;
    };
}

export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const congress = searchParams.get('congress');
    const billType = searchParams.get('billType');
    const billNumber = searchParams.get('billNumber');

    if (!congress || !billType || !billNumber) {
        return NextResponse.json({ error: 'Missing required query parameters' }, { status: 400 });
    }

    const apiKey = process.env.CONGRESS_API_KEY;
    if (!apiKey) {
        console.error('CONGRESS_API_KEY is not set in environment variables.');
        return NextResponse.json({ error: 'API key is not configured' }, { status: 500 });
    }

    const url = `https://api.congress.gov/v3/bill/${congress}/${billType}/${billNumber}/amendments?api_key=${apiKey}&limit=250`;

    try {
        const res = await fetch(url, { 
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(5000)
        });

        if (!res.ok) {
            if (res.status === 404) {
                // This is a common case, it just means no amendments exist for this bill.
                return NextResponse.json({ amendments: [], count: 0 });
            }
            const errorText = await res.text();
            console.error(`Failed to fetch from congress.gov API: ${res.status} ${res.statusText}`, { url, errorText });
            throw new Error(`Failed to fetch from congress.gov API: ${res.status}`);
        }

        const data: CongressGovAmendmentsResponse = await res.json();

        return NextResponse.json({ amendments: data.amendments || [], count: data.pagination?.count || 0 });

    } catch (error) {
        console.error('Error fetching bill amendments:', error);
        
        // Return empty amendments for fetch failures rather than 500
        // This prevents the UI from breaking when amendments can't be fetched
        return NextResponse.json({ 
            amendments: [], 
            count: 0,
            error: 'Amendments temporarily unavailable'
        });
    }
}

