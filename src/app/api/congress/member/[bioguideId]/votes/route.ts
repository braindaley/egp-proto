import { NextResponse, type NextRequest } from 'next/server';

// Helper function to fetch all pages of votes for a member
async function fetchAllVotes(url: string, apiKey: string) {
    let allVotes: any[] = [];
    let nextUrl: string | undefined = `${url}&api_key=${apiKey}&limit=250`;
    
    while (nextUrl) {
        try {
            const res = await fetch(nextUrl, {
                next: { revalidate: 3600 }, // Cache for 1 hour
                signal: AbortSignal.timeout(20000) // Increased timeout for potentially long fetches
            });
            if (!res.ok) {
                console.error(`API vote request failed: ${res.status} for URL: ${nextUrl}`);
                break; 
            }
            const data = await res.json();
            allVotes = allVotes.concat(data.votes || []);
            
            // Check for next page link in pagination
            nextUrl = data.pagination?.next ? `${data.pagination.next}&api_key=${apiKey}` : undefined;
        } catch (error) {
            console.error('Error fetching a page of votes:', error);
            break; // Exit loop on error
        }
    }
    return allVotes;
}

export async function GET(req: NextRequest, { params }: { params: { bioguideId: string } }) {
  const { bioguideId } = params;
  const { searchParams } = new URL(req.url);
  const congress = searchParams.get('congress');
  const API_KEY = process.env.CONGRESS_API_KEY;

  if (!API_KEY) {
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  if (!bioguideId || !congress) {
    return NextResponse.json({ error: 'Missing bioguideId or congress parameter' }, { status: 400 });
  }

  try {
    const baseUrl = `https://api.congress.gov/v3/member/${bioguideId}/votes?congress=${congress}`;
    console.log(`Fetching all votes for member ${bioguideId} in congress ${congress}`);
    
    const votes = await fetchAllVotes(baseUrl, API_KEY);

    // Sort votes by date descending
    const sortedVotes = votes.sort((a, b) => {
        const dateA = new Date(a.vote.date).getTime();
        const dateB = new Date(b.vote.date).getTime();
        return dateB - dateA;
    });

    return NextResponse.json(sortedVotes);

  } catch (error) {
    console.error(`Error fetching votes for ${bioguideId}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
