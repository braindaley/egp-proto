import { NextRequest, NextResponse } from 'next/server';

interface VoteResult {
  rollCall?: string;
  session?: string;
  date?: string;
  result?: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const congress = searchParams.get('congress');
  const billType = searchParams.get('billType');
  const billNumber = searchParams.get('billNumber');

  if (!congress || !billType || !billNumber) {
    return NextResponse.json({
      error: 'Missing required parameters: congress, billType, and billNumber are required'
    }, { status: 400 });
  }

  const API_KEY = process.env.CONGRESS_API_KEY;
  if (!API_KEY) {
    console.error("[API /house-votes] CONGRESS_API_KEY is not set.");
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  try {
    // Try both sessions
    for (const session of ['1', '2']) {
      console.log(`[API /house-votes] Searching session ${session} for ${billType} ${billNumber}`);

      const url = `https://api.congress.gov/v3/house-vote/${congress}/${session}?api_key=${API_KEY}&limit=250`;
      const response = await fetch(url);

      if (!response.ok) {
        console.error(`Failed to fetch votes for session ${session}: ${response.status}`);
        continue;
      }

      const data = await response.json();
      const votes = data.rollCalls || [];

      // Look for votes related to our bill
      for (const vote of votes) {
        const billInfo = vote.bill;
        if (billInfo &&
            billInfo.type?.toUpperCase() === billType.toUpperCase() &&
            billInfo.number === billNumber) {

          console.log(`[API /house-votes] Found vote for ${billType} ${billNumber}: Roll ${vote.roll}`);

          return NextResponse.json({
            rollCall: vote.roll,
            session: session,
            date: vote.date,
            result: vote.result,
            question: vote.question
          });
        }
      }
    }

    // No votes found
    console.log(`[API /house-votes] No votes found for ${billType} ${billNumber}`);
    return NextResponse.json({ error: 'No votes found for this bill' }, { status: 404 });

  } catch (error) {
    console.error('Error searching for house votes:', error);
    return NextResponse.json({
      error: 'Internal server error while searching for votes'
    }, { status: 500 });
  }
}