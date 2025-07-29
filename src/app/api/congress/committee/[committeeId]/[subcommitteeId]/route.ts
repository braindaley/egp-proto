import { NextResponse, type NextRequest } from 'next/server';

async function getCommitteeDetails(congress: string, committeeId: string) {
    // This assumes the app is running on localhost, which is fine for dev.
    // In a real deployment, you'd use a relative URL or an env var for the base URL.
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
    const url = `${baseUrl}/api/congress/committee/${committeeId}?congress=${congress}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return res.json();
}

export async function GET(req: NextRequest, { params }: { params: { congress: string, committeeId: string, subcommitteeId: string } }) {
  const { searchParams } = new URL(req.url);
  const congress = searchParams.get('congress');
  const { committeeId, subcommitteeId } = params;

  if (!congress || !committeeId || !subcommitteeId) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  try {
    const committeeData = await getCommitteeDetails(congress, committeeId);
    if (!committeeData || !committeeData.committee) {
      return NextResponse.json({ error: 'Parent committee not found' }, { status: 404 });
    }

    const subcommittee = committeeData.committee.subcommittees?.find(
      (sub: any) => sub.systemCode?.toLowerCase() === subcommitteeId.toLowerCase()
    );

    if (!subcommittee) {
      return NextResponse.json({ error: 'Subcommittee not found' }, { status: 404 });
    }

    // Add parent committee info for context
    const response = {
        ...subcommittee,
        parentCommittee: {
            name: committeeData.committee.name,
            systemCode: committeeData.committee.systemCode,
            chamber: committeeData.committee.chamber
        }
    };

    return NextResponse.json({ subcommittee: response });

  } catch (error) {
    console.error(`Error fetching subcommittee details for ${subcommitteeId}:`, error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
