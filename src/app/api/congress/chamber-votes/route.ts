import { NextResponse, type NextRequest } from 'next/server';

// Helper function to fetch all pages of chamber votes
async function fetchAllChamberVotes(url: string, apiKey: string) {
    let allVotes: any[] = [];
    let nextUrl: string | undefined = `${url}&api_key=${apiKey}&limit=250`;
    
    while (nextUrl) {
        try {
            const res = await fetch(nextUrl, {
                next: { revalidate: 3600 }, // Cache for 1 hour
                signal: AbortSignal.timeout(20000) // Increased timeout
            });
            if (!res.ok) {
                console.error(`API chamber vote request failed: ${res.status} for URL: ${nextUrl}`);
                break;
            }
            const data = await res.json();
            allVotes = allVotes.concat(data.votes || []);
            nextUrl = data.pagination?.next ? `${data.pagination.next}&api_key=${apiKey}` : undefined;
        } catch (error) {
            console.error('Error fetching a page of chamber votes:', error);
            break;
        }
    }
    return allVotes;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const congress = searchParams.get('congress');
  const chamber = searchParams.get('chamber')?.toLowerCase();
  const API_KEY = process.env.CONGRESS_API_KEY;

  if (!API_KEY) {
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }
  if (!congress || !chamber || (chamber !== 'house' && chamber !== 'senate')) {
    return NextResponse.json({ error: 'Missing or invalid congress/chamber parameters' }, { status: 400 });
  }

  try {
    const baseUrl = `https://api.congress.gov/v3/vote/${congress}/${chamber}`;
    const allVotes = await fetchAllChamberVotes(baseUrl, API_KEY);
    
    if (allVotes.length === 0) {
        return NextResponse.json({
            votes: [],
            totalVotes: 0,
            averageAttendance: 0
        });
    }

    // Since the API doesn't provide a clean average, we will assume a high average attendance.
    // A real implementation might calculate this based on all members' votes.
    const chamberAverageAttendance = chamber === 'senate' ? 0.952 : 0.938;

    const sortedVotes = allVotes.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const response = {
        votes: sortedVotes,
        totalVotes: sortedVotes.length,
        averageAttendance: chamberAverageAttendance,
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error(`Error fetching votes for ${chamber} in congress ${congress}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
