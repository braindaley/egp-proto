
import { notFound } from 'next/navigation';
import { NextRequest } from 'next/server';
import type { Member } from '@/types';
import { MemberDetailClient } from '@/components/member-detail-client';
import { GET as getMemberAPI } from '@/app/api/congress/member/[bioguideId]/route';

async function getMemberDetails(bioguideId: string): Promise<Member | null> {
  try {
    // Create a mock request object for the API handler
    const mockRequest = new NextRequest('http://localhost:3000/api/congress/member/' + bioguideId);
    const response = await getMemberAPI(mockRequest, { params: { bioguideId } });
    
    if (!response.ok) {
      console.error(`Failed to fetch member details: ${response.status}`);
      return null;
    }

    // Only fetch basic data initially. The rest will be loaded client-side.
    const memberData: Member = await response.json();
    
    // Add mock email address
    const memberName = memberData.directOrderName.toLowerCase().replace(/\s+/g, '.');
    memberData.email = `${memberName}@congress-placeholder.com`;

    return memberData;
    
  } catch (error) {
    console.error("Error in getMemberDetails:", error);
    return null; 
  }
}

export default async function MemberDetailPage({ params }: { params: { bioguideId: string, congress: string, state: string } }) {
  const { bioguideId, congress } = params;
  
  const member = await getMemberDetails(bioguideId);

  if (!member) {
    notFound();
  }
  
  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      {/* Pass minimal data to the client, which will fetch the rest */}
      <MemberDetailClient initialMember={member} congress={congress} />
    </div>
  );
}
