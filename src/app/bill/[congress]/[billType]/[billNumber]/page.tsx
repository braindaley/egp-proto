
import { notFound } from 'next/navigation';
import type { Bill } from '@/types';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Landmark, CalendarDays, Users, Library, FileText, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

async function getBillDetails(congress: string, billType: string, billNumber: string): Promise<Bill | null> {
  const API_KEY = process.env.CONGRESS_API_KEY || 'DEMO_KEY';
  const url = `https://api.congress.gov/v3/bill/${congress}/${billType}/${billNumber}?api_key=${API_KEY}`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 3600 },
    });

    if (res.status === 404) {
      return null;
    }

    if (!res.ok) {
      console.error(`API request failed with status: ${res.status}`);
      const errorText = await res.text();
      console.error(`Error details: ${errorText}`);
      throw new Error(`Failed to fetch data: ${res.statusText}`);
    }
    
    const data = await res.json();
    return data.bill;
  } catch (error) {
    console.error("Error fetching bill details:", error);
    return null; 
  }
}

function formatDate(dateString: string) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
}
  
function constructBillUrl(bill: Bill): string {
    const chamber = bill.originChamber.toLowerCase();
    return `https://www.congress.gov/bill/${bill.congress}th-congress/${chamber}-bill/${bill.number}`;
}

export default async function BillDetailPage({ params }: { params: { congress: string; billType: string; billNumber: string } }) {
  const bill = await getBillDetails(params.congress, params.billType, params.billNumber);

  if (!bill) {
    notFound();
  }
  
  const hasSponsors = bill.sponsors && bill.sponsors.length > 0;
  const hasCosponsors = bill.cosponsors && bill.cosponsors.count > 0;
  const hasCommittees = bill.committees && bill.committees.count > 0;
  const hasSummaries = bill.summaries && bill.summaries.count > 0;

  return (
    <div className="bg-background min-h-screen">
      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          <header className="mb-8">
            <p className="text-lg text-muted-foreground font-medium mb-1">{bill.number} &bull; {bill.congress}th Congress</p>
            <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary">
              {bill.title}
            </h1>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {hasSummaries && (
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="text-primary" />
                            <span>Summary</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="prose prose-sm max-w-none text-muted-foreground">
                       <p>{bill.summaries.summary.text}</p>
                    </CardContent>
                </Card>
              )}

              {hasCommittees && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Library className="text-primary" />
                        <span>Committees</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {bill.committees.items.map((committee, index) => (
                        <li key={index} className="text-sm p-3 bg-secondary/50 rounded-md">
                          <p className="font-semibold">{committee.name}</p>
                          <div className="text-xs text-muted-foreground mt-1">
                            {committee.activities.map(activity => activity.name).join(', ')}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Introduced</span>
                            <span className="font-medium">{formatDate(bill.introducedDate)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Chamber</span>
                             <Badge variant="outline" className="flex items-center gap-1.5">
                                <Landmark className="h-3 w-3" />
                                {bill.originChamber}
                            </Badge>
                        </div>
                         <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Bill Type</span>
                            <Badge variant="secondary" className="font-semibold">{bill.type}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Last Update</span>
                             <span className="font-medium">{formatDate(bill.updateDate)}</span>
                        </div>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Latest Action</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-1">
                        <p className="font-semibold">{formatDate(bill.latestAction.actionDate)}</p>
                        <p className="text-muted-foreground">{bill.latestAction.text}</p>
                    </CardContent>
                </Card>

                {(hasSponsors || hasCosponsors) && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Users />
                                <span>Sponsorship</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Accordion type="single" collapsible className="w-full">
                                {hasSponsors && (
                                    <AccordionItem value="sponsors">
                                    <AccordionTrigger className="text-sm">Sponsors ({bill.sponsors.length})</AccordionTrigger>
                                    <AccordionContent>
                                        <ul className="space-y-2 pt-2">
                                            {bill.sponsors.map((sponsor, index) => (
                                                <li key={index} className="text-xs p-2 bg-secondary/50 rounded-md">
                                                    <a href={sponsor.url} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline flex justify-between items-center">
                                                        {sponsor.fullName} ({sponsor.party}-{sponsor.state}) <ExternalLink className="h-3 w-3" />
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </AccordionContent>
                                    </AccordionItem>
                                )}
                                {hasCosponsors && (
                                     <AccordionItem value="cosponsors">
                                        <AccordionTrigger className="text-sm">
                                            Cosponsors ({bill.cosponsors.count.toLocaleString()})
                                        </AccordionTrigger>
                                        <AccordionContent className="text-xs text-center text-muted-foreground pt-2">
                                            <p>A full list of cosponsors is available on Congress.gov</p>
                                        </AccordionContent>
                                     </AccordionItem>
                                )}
                            </Accordion>
                        </CardContent>
                    </Card>
                )}

                <Button asChild className="w-full">
                    <a href={constructBillUrl(bill)} target="_blank" rel="noopener noreferrer">
                        View on Congress.gov <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                </Button>
            </div>
          </div>
        </div>
      </main>
      <footer className="text-center py-6 text-sm text-muted-foreground mt-8 border-t">
        <p>Data provided by the <a href="https://www.congress.gov/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">U.S. Congress</a> via <a href="https://api.congress.gov/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">api.congress.gov</a>.</p>
      </footer>
    </div>
  );
}
