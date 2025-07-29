
import { notFound } from 'next/navigation';
import type { CommitteeInfo } from '@/types';

interface CommitteeDetailResponse {
    committee: CommitteeInfo;
}

async function getCommitteeDetails(congress: string, committeeId: string): Promise<CommitteeInfo | null> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
    const url = `${baseUrl}/api/congress/committee/${committeeId}?congress=${congress}`;

    try {
        const res = await fetch(url, { next: { revalidate: 3600 } });
        if (!res.ok) {
            console.error(`Failed to fetch committee details from internal API: ${res.status}`);
            return null;
        }
        const data: CommitteeDetailResponse = await res.json();
        return data.committee;
    } catch (error) {
        console.error("Error fetching committee details:", error);
        return null;
    }
}


export default async function CommitteeDetailPage({ params }: { params: { congress: string, committeeId: string } }) {
  const { congress, committeeId } = await params;
  const committee = await getCommitteeDetails(congress, committeeId);

  if (!committee) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="text-center mb-12">
         <p className="text-lg text-muted-foreground font-medium mb-1">{congress}th Congress</p>
        <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-2">
          {committee.name}
        </h1>
        <p className="text-lg text-muted-foreground">
          This feature is coming soon.
        </p>
      </header>
    </div>
  );
}
