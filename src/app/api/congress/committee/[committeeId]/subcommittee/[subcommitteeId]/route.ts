import { NextResponse, type NextRequest } from 'next/server';

// This route redirects to the correct subcommittee API path
export async function GET(req: NextRequest, { params }: { params: { committeeId: string, subcommitteeId: string } }) {
  const { committeeId, subcommitteeId } = await params;
  const { searchParams } = new URL(req.url);
  const congress = searchParams.get('congress');

  if (!congress || !committeeId || !subcommitteeId) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  try {
    // Forward to the actual subcommittee API route
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const url = `${baseUrl}/api/congress/committee/${committeeId}/${subcommitteeId}?congress=${congress}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Subcommittee not found' }, { status: 404 });
    }
    
    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error(`Error fetching subcommittee details for ${subcommitteeId}:`, error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}