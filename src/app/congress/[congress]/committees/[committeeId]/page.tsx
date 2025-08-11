
import { notFound } from 'next/navigation';
import { CommitteeDetailClient } from '@/components/committee-detail-client';
import type { EnhancedCommitteeInfo } from '@/types';

async function getCommitteeDetails(committeeId: string): Promise<EnhancedCommitteeInfo | null> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
    const url = `${baseUrl}/api/congress/committee/${committeeId}`;
    try {
        const res = await fetch(url, { next: { revalidate: 3600 } });
        if (!res.ok) {
            console.error(`Failed to fetch committee details: ${res.status}`);
            return null;
        }
        const data = await res.json();
        return data.committee;
    } catch (error) {
        console.error("Error in getCommitteeDetails:", error);
        return null;
    }
}

export default async function CommitteeDetailPage({ params }: { params: { congress: string, committeeId: string } }) {
  const { committeeId } = await params;
  
  const committee = await getCommitteeDetails(committeeId);

  if (!committee) {
    notFound();
  }
  
  return (
    <CommitteeDetailClient committee={committee} />
  );
}
