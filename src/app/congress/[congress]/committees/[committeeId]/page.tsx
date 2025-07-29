
import { notFound } from 'next/navigation';
import type { CommitteeInfo } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ExternalLink, Building, Globe, Phone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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

  // Some details might be nested or not always present
  const chamber = committee.chamber;
  const office = committee.office;
  const phone = committee.phoneNumber;
  const website = committee.url ? new URL(committee.url).origin : null;


  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-12 text-center">
         <p className="text-lg text-muted-foreground font-medium mb-1">{congress}th Congress</p>
        <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-2">
          {committee.name}
        </h1>
        <div className="flex gap-2 mt-4 justify-center">
            <Badge variant="secondary">{chamber}</Badge>
            <Badge variant="outline">Standing Committee</Badge>
        </div>
      </header>

      <div className="max-w-3xl mx-auto space-y-8">
        <Card>
            <CardHeader>
              <CardTitle>About This Committee</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Detailed information about the committee's jurisdiction, responsibilities, and current activities will be displayed here soon.
              </p>
               {committee.url && (
                 <a href={committee.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline mt-4 inline-flex items-center gap-1">
                    Visit Official Committee Page <ExternalLink className="h-3 w-3"/>
                </a>
               )}
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {office ? (
                    <div className="flex items-start gap-3">
                        <Building className="h-5 w-5 text-muted-foreground mt-1" />
                        <div>
                            <h4 className="font-semibold">Office</h4>
                            <p className="text-muted-foreground">{office}</p>
                        </div>
                    </div>
                ) : (
                     <p className="text-sm text-muted-foreground">Office location not available.</p>
                )}
                {phone && (
                     <div className="flex items-start gap-3">
                        <Phone className="h-5 w-5 text-muted-foreground mt-1" />
                        <div>
                            <h4 className="font-semibold">Phone</h4>
                            <p className="text-muted-foreground">{phone}</p>
                        </div>
                    </div>
                )}
                 {website && (
                     <div className="flex items-start gap-3">
                        <Globe className="h-5 w-5 text-muted-foreground mt-1" />
                        <div>
                            <h4 className="font-semibold">Website</h4>
                            <a href={website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">{website}</a>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Membership</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">
                    Information about the committee chair, ranking member, and all members will be displayed here soon.
                </p>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
