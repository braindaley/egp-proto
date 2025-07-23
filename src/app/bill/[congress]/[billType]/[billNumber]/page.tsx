
import { notFound } from 'next/navigation';
import type { Bill, Amendment } from '@/types';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Landmark, Users, Library, FileText, UserSquare2, FilePlus2, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';


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

    // Safely initialize nested objects and arrays to prevent runtime errors
    bill.sponsors = bill.sponsors || [];
    bill.cosponsors = bill.cosponsors || { count: 0, url: '', items: [] };
    bill.committees = bill.committees || { count: 0, items: [] };
    bill.summaries = bill.summaries || { count: 0 };
    bill.actions = bill.actions || [];
    bill.amendments = bill.amendments || [];

    const [cosponsorsRes, actionsRes, amendmentsRes, committeesRes] = await Promise.all([
      fetch(`${baseUrl}/cosponsors?api_key=${API_KEY}`, { next: { revalidate: 3600 } }),
      fetch(`${baseUrl}/actions?api_key=${API_KEY}`, { next: { revalidate: 3600 } }),
      fetch(`${baseUrl}/amendments?api_key=${API_KEY}`, { next: { revalidate: 3600 } }),
      fetch(`${baseUrl}/committees?api_key=${API_KEY}`, { next: { revalidate: 3600 } })
    ]);

    if (cosponsorsRes.ok) {
      const cosponsorsData = await cosponsorsRes.json();
      bill.cosponsors.items = cosponsorsData.cosponsors || [];
    } else {
      console.error(`API request for cosponsors failed with status: ${cosponsorsRes.status}`);
    }

    if(actionsRes.ok) {
        const actionsData = await actionsRes.json();
        bill.actions = actionsData.actions || [];
    } else {
        console.error(`API request for actions failed with status: ${actionsRes.status}`);
    }

    if(amendmentsRes.ok) {
        const amendmentsData = await amendmentsRes.json();
        bill.amendments = amendmentsData.amendments || [];
    } else {
        console.error(`API request for amendments failed with status: ${amendmentsRes.status}`);
    }

    if(committeesRes.ok) {
        const committeesData = await committeesRes.json();
        bill.committees.items = committeesData.committees || [];
    } else {
        console.error(`API request for committees failed with status: ${committeesRes.status}`);
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
    // The bill type in the URL needs to be massaged for congress.gov
    const billTypeSlug = bill.type.toLowerCase().replace(/\./g, '').replace(/\s/g, '');
    return `https://www.congress.gov/bill/${bill.congress}th-congress/${chamber}-bill/${bill.number}`;
}


export default async function BillDetailPage({ params }: { params: { congress: string; billType: string; billNumber: string } }) {
  const bill = await getBillDetails(params.congress, params.billType, params.billNumber);

  if (!bill) {
    notFound();
  }
  
  const hasSponsors = bill.sponsors && bill.sponsors.length > 0;
  const hasCosponsors = bill.cosponsors && bill.cosponsors.items && bill.cosponsors.items.length > 0;
  const hasCommittees = bill.committees && bill.committees.items && bill.committees.items.length > 0;
  const hasSummaries = bill.summaries?.summary?.text;
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
                     <p>{bill.summaries.summary.text}</p>
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
                                  Cosponsors ({bill.cosponsors?.items?.length.toLocaleString() || 0})
                              </h4>
                                <ul className="space-y-2 max-h-60 overflow-y-auto">
                                  {bill.cosponsors?.items?.map((cosponsor, index) => (
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
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Committee</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Activity</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {bill.committees.items.flatMap((committee, committeeIndex) =>
                                committee.activities.map((activity, activityIndex) => (
                                    <TableRow key={`${committeeIndex}-${activityIndex}`}>
                                        <TableCell className="font-medium">
                                            <a href={committee.url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                                                {committee.name} <ExternalLink className="h-3 w-3" />
                                            </a>
                                        </TableCell>
                                        <TableCell>{formatDate(activity.date || '')}</TableCell>
                                        <TableCell>{activity.name}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
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
                          <div className="font-semibold flex justify-between items-center">
                            <span>{amendment.type} {amendment.number}</span>
                            <span className="text-xs text-muted-foreground font-normal">
                               Updated: {formatDate(amendment.updateDate)}
                            </span>
                          </div>
                           {amendment.description && (
                            <p className="text-sm text-muted-foreground mt-2 prose prose-sm max-w-none">
                                {amendment.description}
                            </p>
                           )}
                           {amendment.latestAction && (
                            <div className="text-xs text-muted-foreground mt-2 pt-2 border-t border-secondary">
                                <p><span className="font-semibold">Latest Action:</span> {formatDate(amendment.latestAction.actionDate)}</p>
                                <p className="mt-1">{amendment.latestAction.text}</p>
                            </div>
                           )}
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
                    {bill.actions.slice(0, 5).map((action, index) => (
                      <li key={index} className="text-sm p-3 bg-secondary/50 rounded-md">
                        <p className="font-semibold">{formatDate(action.actionDate)}</p>
                        <p className="text-muted-foreground mt-1">{action.text}</p>
                      </li>
                    ))}
                    {bill.actions.length > 5 && (
                      <Collapsible>
                        <CollapsibleContent className="space-y-4">
                          {bill.actions.slice(5).map((action, index) => (
                            <li key={index + 5} className="text-sm p-3 bg-secondary/50 rounded-md">
                              <p className="font-semibold">{formatDate(action.actionDate)}</p>
                              <p className="text-muted-foreground mt-1">{action.text}</p>
                            </li>
                          ))}
                        </CollapsibleContent>
                        <CollapsibleTrigger asChild>
                           <Button variant="outline" className="w-full mt-4">
                            <ChevronsUpDown className="mr-2 h-4 w-4" />
                            Show all {bill.actions.length} actions
                          </Button>
                        </CollapsibleTrigger>
                      </Collapsible>
                    )}
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

    