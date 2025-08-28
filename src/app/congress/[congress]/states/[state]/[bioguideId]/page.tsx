
import { notFound } from 'next/navigation';
import type { Member, LegislatorData, ExtendedMemberIds } from '@/types';
import { MemberDetailClient } from '@/components/member-detail-client';

async function getMemberDetails(bioguideId: string): Promise<Member | null> {
  const API_KEY = process.env.CONGRESS_API_KEY;
  if (!API_KEY) {
    console.error('Server configuration error: CONGRESS_API_KEY not found.');
    return null;
  }
  
  try {
    console.log(`[MemberDetailPage] Fetching member details for bioguideId: ${bioguideId}`);

    const memberApiUrl = `https://api.congress.gov/v3/member/${bioguideId}?api_key=${API_KEY}`;
    const legislatorsDataUrl = 'https://unitedstates.github.io/congress-legislators/legislators-current.json';

    const [congressResponse, legislatorsResponse] = await Promise.all([
      fetch(memberApiUrl, { next: { revalidate: 3600 } }),
      fetch(legislatorsDataUrl, { next: { revalidate: 3600 } })
    ]);

    if (!congressResponse.ok) {
      console.error(`[MemberDetailPage] Failed to fetch member from Congress API. Status: ${congressResponse.status}`);
      return null;
    }

    const congressData = await congressResponse.json();
    const member: Member = congressData.member;

    if (!member) {
        console.error('[MemberDetailPage] Member data not found in Congress API response.');
        return null;
    }

    // Add extended IDs from the second data source
    if (legislatorsResponse.ok) {
        const legislatorsData: LegislatorData[] = await legislatorsResponse.json();
        const legislator = legislatorsData.find(leg => leg.id?.bioguide === bioguideId);
        if (legislator) {
            member.extendedIds = legislator.id;
        }
    } else {
        console.warn(`[MemberDetailPage] Could not fetch extended legislators data. Status: ${legislatorsResponse.status}`);
    }

    // Add mock email address
    const memberName = member.directOrderName.toLowerCase().replace(/\s+/g, '.');
    member.email = `${memberName}@congress-placeholder.com`;

    return member;
    
  } catch (error) {
    console.error("[MemberDetailPage] Error in getMemberDetails:", error);
    return null; 
  }
}

export default async function MemberDetailPage({ params }: { params: { bioguideId: string, congress: string, state: string } }) {
  const { bioguideId, congress } = await params;
  
  const member = await getMemberDetails(bioguideId);

  if (!member) {
    notFound();
  }
  
  return (
    <div className="bg-secondary/30 flex-1">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="flex justify-center">
          <div className="w-full max-w-2xl">
            {/* Pass minimal data to the client, which will fetch the rest */}
            <MemberDetailClient initialMember={member} congress={congress} />
          </div>
        </div>
      </div>
    </div>
  );
}
