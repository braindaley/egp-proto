import { NextRequest, NextResponse } from 'next/server';

interface VotePosition {
  member_id: string;
  name: string;
  party: string;
  state: string;
  district?: string;
  vote_position: string;
  bioguideId: string;
}

interface HouseVoteResponse {
  vote: {
    rollCall: number;
    session: number;
    congress: string;
    date: string;
    result: string;
    question: string;
  };
  positions?: VotePosition[];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const congress = searchParams.get('congress');
  const session = searchParams.get('session');
  const rollCall = searchParams.get('rollCall');

  if (!congress || !session || !rollCall) {
    return NextResponse.json({
      error: 'Missing required parameters: congress, session, and rollCall are required'
    }, { status: 400 });
  }

  const API_KEY = process.env.CONGRESS_API_KEY;
  if (!API_KEY) {
    console.error("[API /house-vote] CONGRESS_API_KEY is not set.");
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  try {
    // First, get general vote information
    const voteUrl = `https://api.congress.gov/v3/house-vote/${congress}/${session}/${rollCall}?api_key=${API_KEY}`;
    console.log(`[API /house-vote] Fetching vote info for congress ${congress}, session ${session}, rollCall ${rollCall}`);

    const voteResponse = await fetch(voteUrl);
    if (!voteResponse.ok) {
      console.error(`Failed to fetch vote info: ${voteResponse.status}`);
      return NextResponse.json({
        error: `Failed to fetch vote information: ${voteResponse.status}`
      }, { status: voteResponse.status });
    }

    const voteData = await voteResponse.json();

    // Then fetch member positions
    const membersUrl = `https://api.congress.gov/v3/house-vote/${congress}/${session}/${rollCall}/members?api_key=${API_KEY}&limit=500`;
    console.log(`[API /house-vote] Fetching member positions`);

    const membersResponse = await fetch(membersUrl);
    if (!membersResponse.ok) {
      console.error(`Failed to fetch member positions: ${membersResponse.status}`);
      // Return vote data without positions if member fetch fails
      return NextResponse.json({
        vote: {
          rollCall: voteData.rollCall?.roll,
          session: voteData.rollCall?.session,
          congress: voteData.rollCall?.congress,
          date: voteData.rollCall?.date,
          result: voteData.rollCall?.result,
          question: voteData.rollCall?.question,
        },
        positions: []
      });
    }

    const membersData = await membersResponse.json();

    // Transform the member positions data
    console.log('[API /house-vote] Sample member data:', JSON.stringify(membersData.houseRollCallVoteMemberVotes?.results?.slice(0, 2), null, 2));

    const positions: VotePosition[] = (membersData.houseRollCallVoteMemberVotes?.results || []).map((member: any) => ({
      member_id: member.memberId,
      name: `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.name,
      party: member.voteParty || member.party,
      state: member.voteState || member.state,
      district: member.district,
      vote_position: member.voteCast || member.votePosition || member.position || 'Not Voting',  // API uses voteCast
      bioguideId: member.bioguideID || member.bioguideId  // API uses bioguideID (capital D)
    }));

    const response: HouseVoteResponse = {
      vote: {
        rollCall: voteData.rollCall?.roll,
        session: voteData.rollCall?.session,
        congress: voteData.rollCall?.congress,
        date: voteData.rollCall?.date,
        result: voteData.rollCall?.result,
        question: voteData.rollCall?.question,
      },
      positions
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching house vote:', error);
    return NextResponse.json({
      error: 'Internal server error while fetching vote data'
    }, { status: 500 });
  }
}