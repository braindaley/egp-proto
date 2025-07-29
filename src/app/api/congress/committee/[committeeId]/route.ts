
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { committeeId: string } }) {
  const { committeeId } = params;
  const { searchParams } = new URL(req.url);
  const congress = searchParams.get('congress');
  const API_KEY = process.env.CONGRESS_API_KEY;

  if (!congress || !committeeId || !API_KEY) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  try {
    // The committeeId is usually something like 'hssm', but the API expects the chamber and code like 'house-judiciary'
    // However, the v3/committee/{congress}/{committeeCode} endpoint should also work with just the system code.
    const url = `https://api.congress.gov/v3/committee/${congress}/${committeeId}?format=json&api_key=${API_KEY}`;
    
    console.log(`Fetching committee details from: ${url}`);
    
    const res = await fetch(url, { next: { revalidate: 3600 } });

    if (!res.ok) {
        console.error(`API committee detail request failed for ${committeeId}: ${res.status}`);
        // Let's try fetching the full list and filtering, as a fallback
        const listUrl = `https://api.congress.gov/v3/committee/${congress}?limit=250&format=json&api_key=${API_KEY}`;
        const listRes = await fetch(listUrl, { next: { revalidate: 3600 } });
        if(listRes.ok) {
            const listData = await listRes.json();
            const foundCommittee = (listData.committees || []).find((c: any) => c.systemCode?.toLowerCase() === committeeId.toLowerCase());
            if (foundCommittee) {
                return NextResponse.json({ committee: foundCommittee });
            }
        }
       return NextResponse.json({ error: `Failed to fetch committee details: ${res.statusText}` }, { status: res.status });
    }
    
    const data = await res.json();
    // The single committee endpoint wraps the result in a "committee" object
    return NextResponse.json(data);

  } catch (error) {
    console.error(`Error fetching committee details for ${committeeId}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
