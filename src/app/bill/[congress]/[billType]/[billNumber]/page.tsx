
import { notFound } from 'next/navigation';
import type { Bill, Amendment } from '@/types';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Landmark, Users, Library, FileText, UserSquare2, FilePlus2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

async function getBillDetails(congress: string, billType: string, billNumber: string): Promise<Bill | null> {
  const API_KEY = process.env.CONGRESS_API_KEY || 'DEMO_KEY';
  const baseUrl = `https://api.congress.gov/v3/bill/${congress}/${billType}/${billNumber}`;

  try {
    const billRes = await fetch(`${baseUrl}?api_key=${API_KEY}`, {
      next: { revalidate: 3600 },
    });

    if (billRes.status === 404) {
      return null;
    }

    if (!billRes.ok) {
      console.error(`API request for bill failed with status: ${billRes.status}`);
      throw new Error(`Failed to fetch bill data: ${billRes.statusText}`);
    }
    
    const billData = await billRes.json();
    const bill: Bill = billData.bill;

    const [cosponsorsRes, actionsRes, amendmentsRes] = await Promise.all([
      fetch(`${baseUrl}/cosponsors?api_key=${API_KEY}`, { next: { revalidate: 3600 } }),
      fetch(`${baseUrl}/actions?api_key=${API_KEY}`, { next: { revalidate: 3600 } }),
      fetch(`${baseUrl}/amendments?api_key=${API_KEY}`, { next: { revalidate: 3600 } })
    ]);

    if (cosponsorsRes.ok) {
      const cosponsorsData = await cosponsorsRes.json();
      if(bill.cosponsors){
          bill.cosponsors.items = cosponsorsData.cosponsors;
      }
    } else {
      console.error(`API request for cosponsors failed with status: ${cosponsorsRes.status}`);
    }

    if(actionsRes.ok) {
        const actionsData = await actionsRes.json();
        bill.actions = actionsData.actions;
    } else {
        console.error(`API request for actions failed with status: ${actionsRes.status}`);
    }

    if(amendmentsRes.ok) {
        const amendmentsData = await amendmentsRes.json();
        bill.amendments = amendmentsData.amendments;
    } else {
        console.error(`API request for amendments failed with status: ${amendmentsRes.status}`);
    }
    
    return bill;
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

function constructAmendmentUrl(amendment: Amendment): string {
    const type = amendment.type.toLowerCase().replace('.', '');
    return `https://www.congress.gov/amendment/${amendment.congress}th-congress/house-amendment/${amendment.number}`;
}


export default async function BillDetailPage({ params }: { params: { congress: string; billType: string; billNumber: string } }) {
  const bill = await getBillDetails(params.congress, params.billType, params.billNumber);

  if (!bill) {
    notFound();
  }
  
  const hasSponsors = bill.sponsors && bill.sponsors.length > 0;
  const hasCosponsors = bill.cosponsors && bill.cosponsors.items && bill.cosponsors.items.length > 0;
  const hasCommittees = bill.committees && bill.committees.items && bill.committees.items.length > 0;
  const hasSummaries = bill.summaries && bill.summaries.summary && bill.summaries.summary.text;
  const hasActions = bill.actions && bill.actions.length > 0;
  const hasAmendments = bill.amendments && bill.amendments.length > 0;

  return (
    <div className="bg-background min-h-screen">
      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <header>
            <p className="text-lg text-muted-foreground font-medium mb-1">{bill.type} {bill.number} &bull; {bill.congress}th Congress</p>
            <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary">
              {bill.title}
            </h1>
          </header>

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
                        <span className="text-muted-foreground">Last Update</span>
                         <span className="font-medium">{formatDate(bill.updateDate)}</span>
                    </div>
                </CardContent>
            </Card>

            {hasSummaries && (
               <Card>
                  <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                          <FileText className="text-primary" />
                          Summary
                      </CardTitle>
                  </CardHeader>
                  <CardContent className="prose prose-sm max-w-none text-muted-foreground">
                     <p>{bill.summaries.summary!.text}</p>
                  </CardContent>
              </Card>
            )}
            
            {(hasSponsors || hasCosponsors) && (
                  <Card>
                      <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                              <Users />
                              Sponsorship
                          </CardTitle>
                      </CardHeader>
                      <CardContent>
                          {hasSponsors && (
                              <div className="space-y-3">
                                  <h4 className="font-semibold text-sm flex items-center gap-2">
                                      <UserSquare2 className="h-4 w-4" />
                                      Sponsors ({bill.sponsors.length})
                                  </h4>
                                  <ul className="space-y-2">
                                      {bill.sponsors.map((sponsor, index) => (
                                          <li key={index} className="text-xs p-2 bg-secondary/50 rounded-md">
                                              <a href={sponsor.url} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline flex justify-between items-center">
                                                  {sponsor.fullName} ({sponsor.party}-{sponsor.state}) <ExternalLink className="h-3 w-3" />
                                              </a>
                                          </li>
                                      ))}
                                  </ul>
                              </div>
                          )}
                          {hasSponsors && hasCosponsors && (
                              <Separator className="my-4" />
                          )}
                          {hasCosponsors && (
                              <div className="space-y-3">
                                  <h4 className="font-semibold text-sm flex items-center gap-2">
                                     <Users className="h-4 w-4" />
                                      Cosponsors ({bill.cosponsors.items.length.toLocaleString()})
                                  </h4>
                                   <ul className="space-y-2 max-h-60 overflow-y-auto">
                                      {bill.cosponsors.items.map((cosponsor, index) => (
                                          <li key={index} className="text-xs p-2 bg-secondary/50 rounded-md">
                                              <a href={cosponsor.url} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline flex justify-between items-center">
                                                  {cosponsor.fullName} ({cosponsor.party}-{cosponsor.state}) <ExternalLink className="h-3 w-3" />
                                              </a>
                                          </li>
                                      ))}
                                  </ul>
                              </div>
                          )}
                      </CardContent>
                  </Card>
              )}

            {hasCommittees && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                      <Library className="text-primary" />
                      Committees
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

            {hasAmendments && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                      <FilePlus2 className="text-primary" />
                      Amendments ({bill.amendments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {bill.amendments.map((amendment, index) => (
                      <li key={index} className="text-sm p-3 bg-secondary/50 rounded-md">
                          <a href={constructAmendmentUrl(amendment)} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline flex justify-between items-center">
                            <span>{amendment.type} {amendment.number}: {amendment.purpose}</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                          <p className="text-xs text-muted-foreground mt-1">
                            Latest Action: {formatDate(amendment.latestAction.actionDate)} - {amendment.latestAction.text}
                          </p>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {hasActions && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Recent actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4">
                    {bill.actions.map((action, index) => (
                      <li key={index} className="text-sm p-3 bg-secondary/50 rounded-md">
                        <p className="font-semibold">{formatDate(action.actionDate)}</p>
                        <p className="text-muted-foreground mt-1">{action.text}</p>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            
            <Button asChild className="w-full">
                <a href={constructBillUrl(bill)} target="_blank" rel="noopener noreferrer">
                    View on Congress.gov <ExternalLink className="ml-2 h-4 w-4" />
                </a>
            </Button>
        </div>
      </main>
      <footer className="text-center py-6 text-sm text-muted-foreground mt-8 border-t">
        <p>Data provided by the <a href="https://www.congress.gov/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">U.S. Congress</a> via <a href="https://api.congress.gov/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">api.congress.gov</a>.</p>
      </footer>
    </div>
  );
}
