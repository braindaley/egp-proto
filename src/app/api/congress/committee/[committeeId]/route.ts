
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
    // The committeeId is the systemCode from the list endpoint.
    // The API is a bit inconsistent. We need to find out the chamber and full committee code.
    // As a robust method, we'll fetch the full list for the congress and find our committee.
    const listUrl = `https://api.congress.gov/v3/committee/${congress}?limit=250&format=json&api_key=${API_KEY}`;
    const listRes = await fetch(listUrl, { next: { revalidate: 3600 } });

    if (!listRes.ok) {
        console.error(`API committee list request failed for congress ${congress}: ${listRes.status}`);
        return NextResponse.json({ error: `Failed to fetch committee list: ${listRes.statusText}` }, { status: listRes.status });
    }
    
    const listData = await listRes.json();
    const foundCommittee = (listData.committees || []).find((c: any) => c.systemCode?.toLowerCase() === committeeId.toLowerCase());

    if (foundCommittee) {
        // Now, we can try to get more details with the full committee code if needed,
        // but for now, the data from the list is often sufficient.
        return NextResponse.json({ committee: foundCommittee });
    } else {
        return NextResponse.json({ error: 'Committee not found' }, { status: 404 });
    }

  } catch (error) {
    console.error(`Error fetching committee details for ${committeeId}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
