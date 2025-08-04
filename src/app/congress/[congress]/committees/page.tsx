
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { CommitteeInfo } from '@/types';

interface CommitteesResponse {
    houseCommittees: CommitteeInfo[];
    senateCommittees: CommitteeInfo[];
}

async function getCommittees(congress: string): Promise<CommitteesResponse> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
    const url = `${baseUrl}/api/congress/committees?congress=${congress}`;
    try {
        const res = await fetch(url, { next: { revalidate: 3600 } });
        if (!res.ok) {
            console.error(`Failed to fetch committees from internal API: ${res.status}`);
            return { houseCommittees: [], senateCommittees: [] };
        }
        return await res.json();
    } catch (error) {
        console.error("Error fetching committees:", error);
        return { houseCommittees: [], senateCommittees: [] };
    }
}


export default async function CommitteesPage({ params }: { params: { congress: string } }) {
  const { congress } = await params;
  const { houseCommittees, senateCommittees } = await getCommittees(congress);

  // Sort committees alphabetically by name
  houseCommittees.sort((a, b) => a.name.localeCompare(b.name));
  senateCommittees.sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="text-center mb-12">
        <p className="text-lg text-muted-foreground font-medium mb-1">{congress}th Congress</p>
        <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-2">
          Committees
        </h1>
        <p className="text-lg text-muted-foreground">
          Browse congressional committees for this session.
        </p>
      </header>
      
      <section>
        <h2 className="font-headline text-3xl font-bold text-primary mb-6 border-b pb-3">House Committees</h2>
        {houseCommittees.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {houseCommittees.map((committee) => (
              <Link
                href={`/congress/${congress}/committees/${committee.systemCode.toLowerCase()}`}
                key={committee.systemCode}
                className="text-center p-4 rounded-lg bg-card text-card-foreground shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors duration-200 ease-in-out"
              >
                <span className="font-medium">{committee.name}</span>
              </Link>
            ))}
          </div>
        ) : (
            <p className="text-muted-foreground">Could not load House committees.</p>
        )}
      </section>

      <section className="mt-12">
        <h2 className="font-headline text-3xl font-bold text-primary mb-6 border-b pb-3">Senate Committees</h2>
        {senateCommittees.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {senateCommittees.map((committee) => (
              <Link
                href={`/congress/${congress}/committees/${committee.systemCode.toLowerCase()}`}
                key={committee.systemCode}
                className="text-center p-4 rounded-lg bg-card text-card-foreground shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors duration-200 ease-in-out"
              >
                <span className="font-medium">{committee.name}</span>
              </Link>
            ))}
          </div>
        ) : (
            <p className="text-muted-foreground">Could not load Senate committees.</p>
        )}
      </section>

    </div>
  );
}
