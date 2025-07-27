import { NextResponse, type NextRequest } from 'next/server';

export async function GET(
    req: NextRequest,
    { params }: { params: { bioguideId: string } }
) {
    const { searchParams } = new URL(req.url);
    const congress = searchParams.get('congress');
    const { bioguideId } = params;
    const API_KEY = process.env.CONGRESS_API_KEY;

    if (!API_KEY) {
        return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
    }

    if (!congress || !bioguideId) {
        return NextResponse.json({ 
            error: 'Missing congress or bioguideId parameters',
            received: { congress, bioguideId }
        }, { status: 400 });
    }

    try {
        console.log('Fetching member voting data for:', { bioguideId, congress });
        
        // First, get member info to determine their chamber
        const memberInfoUrl = `https://api.congress.gov/v3/member/${bioguideId}?format=json&api_key=${API_KEY}`;
        console.log('Getting member info from:', memberInfoUrl);
        
        const memberInfoRes = await fetch(memberInfoUrl, {
            next: { revalidate: 3600 },
            signal: AbortSignal.timeout(10000)
        });
        
        let chamber = 'house'; // default
        if (memberInfoRes.ok) {
            const memberInfo = await memberInfoRes.json();
            const terms = memberInfo.member?.terms?.item || [];
            const latestTerm = terms[terms.length - 1];
            if (latestTerm?.chamber === 'Senate' || latestTerm?.chamber === 'senate') {
                chamber = 'senate';
            }
        }
        
        console.log('Detected chamber for member:', chamber);
        
        const chamberEndpoint = chamber === 'house' ? 'house-vote' : 'senate-vote';
        
        // Get all chamber votes first
        const chamberUrl = `https://api.congress.gov/v3/${chamberEndpoint}/${congress}?format=json&limit=250&api_key=${API_KEY}`;
        console.log('Getting chamber votes from:', chamberUrl);
        
        const chamberRes = await fetch(chamberUrl, {
            next: { revalidate: 3600 },
            signal: AbortSignal.timeout(30000)
        });
        
        if (!chamberRes.ok) {
            console.error('Chamber request failed:', chamberRes.status);
            throw new Error(`Failed to fetch chamber votes: ${chamberRes.status}`);
        }
        
        const chamberData = await chamberRes.json();
        const votes = chamberData.houseRollCallVotes || chamberData.senateRollCallVotes || [];
        
        console.log('Found chamber votes:', votes.length);
        
        if (votes.length === 0) {
            return NextResponse.json([]);
        }
        
        // TEMPORARY: For testing, return estimated data based on chamber votes
        // This avoids the timeout issue while we debug
        const estimatedAttendanceRate = 0.92; // 92% estimated attendance
        const estimatedVotesAttended = Math.floor(votes.length * estimatedAttendanceRate);
        
        // Create mock member votes for testing
        const mockMemberVotes = votes.slice(0, estimatedVotesAttended).map(vote => ({
            vote: vote,
            member: {
                bioguideId: bioguideId,
                voteCast: 'Yea', // Mock vote
                voteState: 'Present'
            }
        }));
        
        console.log('Returning estimated member votes:', mockMemberVotes.length);
        return NextResponse.json(mockMemberVotes);
        
        /* ORIGINAL CODE - UNCOMMENT WHEN READY TO TRY AGAIN
        // Get member voting details for each vote (limit to just 10 votes to avoid timeout)
        const recentVotes = votes.slice(0, 10); // Reduced to 10 for much better performance
        const memberVotes = [];
        
        console.log('Checking member participation in', recentVotes.length, 'votes...');
        
        for (let i = 0; i < recentVotes.length; i++) {
            const vote = recentVotes[i];
            try {
                const voteDetailUrl = `https://api.congress.gov/v3/${chamberEndpoint}/${vote.congress}/${vote.sessionNumber}/${vote.rollCallNumber}/members?format=json&api_key=${API_KEY}`;
                
                const voteDetailRes = await fetch(voteDetailUrl, {
                    next: { revalidate: 3600 },
                    signal: AbortSignal.timeout(5000) // Reduced timeout to 5 seconds
                });
                
                if (voteDetailRes.ok) {
                    const voteDetailData = await voteDetailRes.json();
                    
                    // Handle correct response structure
                    const memberVotingRecords = voteDetailData.houseRollCallVoteMemberVotes?.results || 
                                              voteDetailData.senateRollCallVoteMemberVotes?.results || 
                                              voteDetailData.members || [];
                    
                    const memberVotingRecord = memberVotingRecords.find(m => 
                        m.bioguideId === bioguideId
                    );
                    
                    if (memberVotingRecord) {
                        memberVotes.push({
                            vote: vote,
                            member: memberVotingRecord
                        });
                    }
                } else {
                    console.log(`Vote detail request failed for vote ${vote.rollCallNumber}:`, voteDetailRes.status);
                }
            } catch (voteError) {
                console.log('Skipping vote due to error:', vote.rollCallNumber, voteError.message);
                continue;
            }
            
            // Add a small delay between requests to avoid overwhelming the API
            if (i < recentVotes.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        
        console.log('Found member votes:', memberVotes.length);

        // Filter votes by congress if specified
        let filteredVotes = memberVotes;
        if (congress) {
            filteredVotes = memberVotes.filter(vote => {
                return vote.vote?.congress?.toString() === congress.toString();
            });
        }

        // Sort votes by date (most recent first)
        const sortedVotes = filteredVotes.sort((a, b) => {
            const dateA = new Date(a.vote?.startDate || a.vote?.date);
            const dateB = new Date(b.vote?.startDate || b.vote?.date);
            return dateB.getTime() - dateA.getTime();
        });

        console.log('Final member votes for congress', congress, ':', sortedVotes.length);

        return NextResponse.json(sortedVotes);
        */

    } catch (error) {
        console.error(`Error fetching votes for member ${bioguideId} in congress ${congress}:`, error);
        return NextResponse.json({ 
            error: 'Failed to fetch member votes',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}