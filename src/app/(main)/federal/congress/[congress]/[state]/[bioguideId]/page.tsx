
import { notFound } from 'next/navigation';
import type { Member } from '@/types';
import { MemberDetailClient } from '@/components/member-detail-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

async function getMemberDetails(bioguideId: string): Promise<Member | null> {
  // Ensure the base URL is set correctly, especially in a server component
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const url = `${baseUrl}/api/congress/member/${bioguideId}`;
  
  try {
    console.log(`[MemberDetailPage] Fetching member details from: ${url}`);
    const res = await fetch(url, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!res.ok) {
      console.error(`[MemberDetailPage] Failed to fetch member. Status: ${res.status}, URL: ${url}`);
      return null;
    }

    const memberData: Member = await res.json();

    // Basic data validation
    if (!memberData || !memberData.bioguideId) {
      console.error('[MemberDetailPage] Fetched data is invalid or missing bioguideId.');
      return null;
    }

    return memberData;
    
  } catch (error) {
    console.error("[MemberDetailPage] Error in getMemberDetails:", error);
    return null; 
  }
}

export default async function MemberDetailPage({ params }: { params: { bioguideId: string, congress: string } }) {
  const { bioguideId, congress } = await params;
  
  const member = await getMemberDetails(bioguideId);

  if (!member) {
    // Instead of a hard 404, we can render a more graceful error message on the page
    return (
        <div className="container mx-auto px-4 py-8 md:py-12" style={{ maxWidth: '672px' }}>
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="text-red-500" />
                        Error Loading Member
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p>
                        We're sorry, but there was a problem loading the details for this member. 
                        This could be a temporary issue with our data provider.
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Bioguide ID: {bioguideId}
                    </p>
                </CardContent>
            </Card>
        </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8 md:py-12" style={{ maxWidth: '672px' }}>
      <MemberDetailClient initialMember={member} congress={congress} />
    </div>
  );
}
