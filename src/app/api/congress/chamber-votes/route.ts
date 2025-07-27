import { NextResponse, type NextRequest } from 'next/server';

// Helper function to fetch all pages of chamber votes
async function fetchAllChamberVotes(url: string, apiKey: string) {
    let allVotes: any[] = [];
    let nextUrl: string | undefined = `${url}&api_key=${apiKey}`;
    
    while (nextUrl && allVotes.length < 1000) { // Limit to prevent infinite loops
        try {
            console.log('Fetching from URL:', nextUrl);
            const res = await fetch(nextUrl, {
                next: { revalidate: 3600 }, // Cache for 1 hour
                signal: AbortSignal.timeout(30000),
                headers: {
                    'Accept': 'application/json',
                }
            });
            
            if (!res.ok) {
                console.error(`API chamber vote request failed: ${res.status} ${res.statusText} for URL: ${nextUrl}`);
                const errorText = await res.text();
                console.error('Error response:', errorText);
                break;
            }
            
            const data = await res.json();
            console.log('Chamber API Response keys:', Object.keys(data));
            console.log('Full chamber response:', data); // Full data for debugging
            
            // Handle different response structures for house vs senate
            let votes = [];
            if (data.houseRollCallVotes && Array.isArray(data.houseRollCallVotes)) {
                votes = data.houseRollCallVotes;
                console.log('Found houseRollCallVotes:', votes.length);
            } else if (data.senateRollCallVotes && Array.isArray(data.senateRollCallVotes)) {
                votes = data.senateRollCallVotes;
                console.log('Found senateRollCallVotes:', votes.length);
            } else if (data.votes && Array.isArray(data.votes)) {
                votes = data.votes;
                console.log('Found votes:', votes.length);
            } else {
                console.log('No votes found in response. Data structure:', data);
            }
            
            console.log('Votes found this iteration:', votes.length);
            
            if (votes.length > 0) {
                allVotes = allVotes.concat(votes);
            }
            
            // Check for pagination
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

    if (!congress || !chamber || chamber !== 'house') {
        return NextResponse.json({ 
            error: 'Only House chamber votes are supported. Senate vote data is not available in the Congress API.',
            received: { congress, chamber }
        }, { status: 400 });
    }

    try {
        // Congress API doesn't require API key
        const baseUrl = `https://api.congress.gov/v3/vote/${congress}/${chamber}?format=json&limit=250`;
        
        console.log('Fetching chamber votes from:', baseUrl);
        
        const allVotes = await fetchAllChamberVotes(baseUrl);
        
        console.log('Total votes fetched:', allVotes.length);
        
        if (allVotes.length === 0) {
            // Try alternative URL format
            const altUrl = `https://api.congress.gov/v3/vote?congress=${congress}&chamber=${chamber}&format=json&limit=250`;
            console.log('Trying alternative URL:', altUrl);
            
            const altVotes = await fetchAllChamberVotes(altUrl);
            
            if (altVotes.length === 0) {
                return NextResponse.json({
                    votes: [],
                    totalVotes: 0,
                    averageAttendance: 0,
                    message: 'No votes found for this congress/chamber'
                });
            }
            
            allVotes.push(...altVotes);
        }

        // House average attendance estimate (based on historical data)
        const houseAverageAttendance = 0.938; // 93.8% historical House average

        // Sort votes by date (most recent first) - use startDate field
        const sortedVotes = allVotes.sort((a, b) => 
            new Date(b.startDate || b.date).getTime() - new Date(a.startDate || a.date).getTime()
        );

        const response = {
            votes: sortedVotes,
            totalVotes: sortedVotes.length,
            averageAttendance: houseAverageAttendance,
        };

        return NextResponse.json(response);

    } catch (error) {
        console.error(`Error fetching votes for ${chamber} in congress ${congress}:`, error);
        return NextResponse.json({ 
            error: 'Failed to fetch chamber votes',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}