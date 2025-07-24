
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Bill, Amendment, RelatedBill, Summary, TextVersion } from '@/types';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Landmark, Users, Library, FileText, UserSquare2, FilePlus2, ChevronsUpDown, FileJson, Tags, BookText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getBillTypeSlug } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

async function fetchAllPages(url: string, apiKey: string, shouldFetchAll: boolean = true) {
    let results: any[] = [];
    let nextUrl: string | null = `${url}?api_key=${apiKey}&limit=250`;

    while (nextUrl) {
        try {
            const res = await fetch(nextUrl, { next: { revalidate: 3600 } });
            if (!res.ok) {
                console.error(`API request failed with status: ${res.status} for URL: ${nextUrl}`);
                if (res.status === 429) {
                  console.error("Rate limit exceeded. Please try again later or use a dedicated API key.");
                }
                return results; 
            }
            const data = await res.json();
            
            const dataKey = Object.keys(data).find(k => Array.isArray(data[k]));
            if (dataKey && Array.isArray(data[dataKey])) {
                results = results.concat(data[dataKey]);
            }

            if (data.pagination?.next && shouldFetchAll) {
                nextUrl = data.pagination.next;
                if (!nextUrl.includes('api_key=')) {
                    nextUrl += `&api_key=${apiKey}`;
                }
            } else {
                nextUrl = null;
            }
        } catch (error) {
            console.error("Error during paginated fetch:", error);
            return results;
        }
    }
    
    return results;
}

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

    bill.sponsors = bill.sponsors || [];
    bill.cosponsors = bill.cosponsors || { count: 0, url: '', items: [] };
    bill.committees = bill.committees || { count: 0, items: [] };
    bill.summaries = bill.summaries || { count: 0 };
    bill.actions = bill.actions || [];
    bill.amendments = bill.amendments || [];
    bill.relatedBills = bill.relatedBills || [];
    bill.subjects = bill.subjects || { count: 0, items: [] };
    bill.allSummaries = bill.allSummaries || [];
    bill.textVersions = bill.textVersions || [];

    bill.cosponsors.items = await fetchAllPages(`${baseUrl}/cosponsors`, API_KEY, false);
    bill.actions = await fetchAllPages(`${baseUrl}/actions`, API_KEY);
    bill.amendments = await fetchAllPages(`${baseUrl}/amendments`, API_KEY);
    bill.committees.items = await fetchAllPages(`${baseUrl}/committees`, API_KEY);
    bill.relatedBills = await fetchAllPages(`${baseUrl}/relatedbills`, API_KEY);
    bill.allSummaries = await fetchAllPages(`${baseUrl}/summaries`, API_KEY);
    bill.textVersions = await fetchAllPages(`${baseUrl}/text`, API_KEY);
    
    const subjectsData = await fetchAllPages(`${baseUrl}/subjects`, API_KEY);
    bill.subjects = {
        count: subjectsData.length,
        items: subjectsData.map(s => s.legislativeSubjects).flat().filter(Boolean)
    }


    bill.amendments.sort((a, b) => new Date(b.updateDate).getTime() - new Date(a.updateDate).getTime());
    bill.relatedBills.sort((a, b) => {
        if (!a.latestAction?.actionDate) return 1;
        if (!b.latestAction?.actionDate) return -1;
        return new Date(b.latestAction.actionDate).getTime() - new Date(a.latestAction.actionDate).getTime()
    });
    bill.allSummaries.sort((a, b) => new Date(b.actionDate).getTime() - new Date(a.actionDate).getTime());
    bill.textVersions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());


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
    const billTypeSlug = getBillTypeSlug(bill.type);
    return `https://www.congress.gov/bill/${bill.congress}th-congress/${chamber}-bill/${bill.number}`;
}

const TruncatedText = ({ text, limit = 500 }: { text: string; limit?: number }) => {
    const isHtml = /<[a-z][\s\S]*>/i.test(text);

    if (text.length <= limit) {
        if (isHtml) {
            return <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: text }} />;
        }
        return <p>{text}</p>;
    }

    return (
        <Collapsible>
            {isHtml ? (
                <CollapsibleContent
                    className="prose prose-sm max-w-none text-muted-foreground [&[data-state=closed]]:line-clamp-6"
                    dangerouslySetInnerHTML={{ __html: text }}
                />
            ) : (
                <CollapsibleContent
                    className="prose prose-sm max-w-none text-muted-foreground [&[data-state=closed]]:line-clamp-6"
                >
                    <p>{text}</p>
                </CollapsibleContent>
            )}
            <CollapsibleTrigger asChild>
                <Button variant="link" className="p-0 h-auto text-xs mt-2">
                    <ChevronsUpDown className="mr-1 h-3 w-3" />
                    Show more
                </Button>
            </CollapsibleTrigger>
        </Collapsible>
    );
};


export default async function BillDetailPage({ params }: { params: { congress: string; billType: string; billNumber: string } }) {
  const bill = await getBillDetails(params.congress, params.billType, params.billNumber);

  if (!bill) {
    notFound();
  }
  
  const hasSponsors = bill.sponsors && bill.sponsors.length > 0;
  const hasCosponsors = bill.cosponsors?.items && bill.cosponsors.items.length > 0;
  const hasCommittees = bill.committees?.items && bill.committees.items.length > 0;
  const hasSummaries = bill.summaries?.summary?.text;
  const hasAllSummaries = bill.allSummaries && bill.allSummaries.length > 0;
  const hasTextVersions = bill.textVersions && bill.textVersions.length > 0;
  const hasActions = bill.actions && bill.actions.length > 0;
  const hasAmendments = bill.amendments && bill.amendments.length > 0;
  const hasRelatedBills = bill.relatedBills && bill.relatedBills.length > 0;
  const hasSubjects = bill.subjects?.items && bill.subjects.items.length > 0;


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
                     <div dangerouslySetInnerHTML={{ __html: bill.summaries.summary.text }} />
                  </CardContent>
              </Card>
            )}

            {hasSubjects && (
              <Card>
                  <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                          <Tags className="text-primary" />
                          Subjects
                      </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                     {bill.subjects.items.map((subject, index) => (
                        <a href={subject.url} target="_blank" rel="noopener noreferrer" key={index}>
                            <Badge variant="secondary" className="text-xs hover:bg-primary/10 transition-colors">
                                {subject.name}
                            </Badge>
                        </a>
                     ))}
                  </CardContent>
              </Card>
            )}

            {hasAllSummaries && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <FileText className="text-primary" />
                            All Summaries ({bill.allSummaries.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {bill.allSummaries.map((summary, index) => (
                            <div key={index} className="p-3 bg-secondary/50 rounded-md">
                                <div className="font-semibold text-sm mb-2 flex justify-between items-center">
                                    <span>{summary.actionDesc} ({summary.versionCode})</span>
                                    <span className="text-xs text-muted-foreground font-normal">{formatDate(summary.actionDate)}</span>
                                </div>
                                <TruncatedText text={summary.text} />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {hasTextVersions && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <BookText className="text-primary" />
                            Text Versions ({bill.textVersions.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue={bill.textVersions[0].type} className="w-full">
                            <TabsList className="grid w-full grid-cols-3 mb-4">
                                {bill.textVersions.map((version) => (
                                  <TabsTrigger key={version.type} value={version.type}>{version.type}</TabsTrigger>
                                ))}
                            </TabsList>
                            {bill.textVersions.map((version) => {
                                const fullText = version.formats.find(f => f.type === 'Formatted Text')?.url;
                                const pdfUrl = version.formats.find(f => f.type === 'PDF')?.url;

                                return (
                                <TabsContent key={version.type} value={version.type}>
                                    <div className="p-4 bg-secondary/50 rounded-md">
                                        <div className="flex justify-between items-center mb-3">
                                            <p className="text-sm font-medium">Published: {formatDate(version.date)}</p>
                                            {pdfUrl && (
                                                <Button asChild size="sm">
                                                    <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                                                        <Download className="mr-2" />
                                                        Download PDF
                                                    </a>
                                                </Button>
                                            )}
                                        </div>
                                        {fullText ? (
                                             <a href={fullText} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                                                View full text <ExternalLink className="inline-block ml-1 h-3 w-3" />
                                            </a>
                                        ) : (
                                            <p className="text-sm text-muted-foreground italic">Full text not available in this format.</p>
                                        )}
                                    </div>
                                </TabsContent>
                                )
                            })}
                        </Tabs>
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

             {hasRelatedBills && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <FileJson className="text-primary" />
                            Related Bills ({bill.relatedBills.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                         <ul className="space-y-3 list-none p-0">
                            {bill.relatedBills.slice(0, 5).map((relatedBill: RelatedBill, index: number) => {
                                const billTypeSlug = getBillTypeSlug(relatedBill.type);
                                const detailUrl = `/bill/${relatedBill.congress}/${billTypeSlug}/${relatedBill.number}`;

                                return (
                                    <li key={index} className="text-sm p-3 bg-secondary/50 rounded-md">
                                        <Link href={detailUrl} className="font-semibold hover:underline">
                                            {relatedBill.type} {relatedBill.number}: {relatedBill.title}
                                        </Link>
                                        <div className="text-xs text-muted-foreground mt-2 pt-2 border-t border-secondary space-y-1">
                                            {relatedBill.relationshipDetails?.items?.map((rel, relIndex) => (
                                                <p key={relIndex}>
                                                    <span className="font-semibold">Relationship:</span> {rel.type} (Identified by: {rel.identifiedBy})
                                                </p>
                                            ))}
                                            {relatedBill.latestAction && (
                                                <p><span className="font-semibold">Latest Action:</span> {formatDate(relatedBill.latestAction.actionDate)}</p>
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                         {bill.relatedBills.length > 5 && (
                          <Collapsible>
                            <CollapsibleContent className="space-y-3 list-none p-0">
                              {bill.relatedBills.slice(5).map((relatedBill: RelatedBill, index: number) => {
                                  const billTypeSlug = getBillTypeSlug(relatedBill.type);
                                  const detailUrl = `/bill/${relatedBill.congress}/${billTypeSlug}/${relatedBill.number}`;
                                  return (
                                      <li key={index + 5} className="text-sm p-3 bg-secondary/50 rounded-md">
                                          <Link href={detailUrl} className="font-semibold hover:underline">
                                              {relatedBill.type} {relatedBill.number}: {relatedBill.title}
                                          </Link>
                                          <div className="text-xs text-muted-foreground mt-2 pt-2 border-t border-secondary space-y-1">
                                              {relatedBill.relationshipDetails?.items?.map((rel, relIndex) => (
                                                  <p key={relIndex}>
                                                      <span className="font-semibold">Relationship:</span> {rel.type} (Identified by: {rel.identifiedBy})
                                                  </p>
                                              ))}
                                              {relatedBill.latestAction && (
                                                  <p><span className="font-semibold">Latest Action:</span> {formatDate(relatedBill.latestAction.actionDate)}</p>
                                              )}
                                          </div>
                                      </li>
                                  );
                              })}
                            </CollapsibleContent>
                            <CollapsibleTrigger asChild>
                               <Button variant="outline" className="w-full mt-4">
                                <ChevronsUpDown className="mr-2 h-4 w-4" />
                                Show all {bill.relatedBills.length} related bills
                              </Button>
                            </CollapsibleTrigger>
                          </Collapsible>
                        )}
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
                  <ul className="space-y-3 list-none p-0">
                    {bill.amendments.slice(0, 5).map((amendment, index) => (
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
                     {bill.amendments.length > 5 && (
                      <Collapsible>
                        <CollapsibleContent className="space-y-3 list-none p-0">
                          {bill.amendments.slice(5).map((amendment, index) => (
                            <li key={index + 5} className="text-sm p-3 bg-secondary/50 rounded-md">
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
                        </CollapsibleContent>
                        <CollapsibleTrigger asChild>
                           <Button variant="outline" className="w-full mt-4">
                            <ChevronsUpDown className="mr-2 h-4 w-4" />
                            Show all {bill.amendments.length} amendments
                          </Button>
                        </CollapsibleTrigger>
                      </Collapsible>
                    )}
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
                  <ul className="space-y-4 list-none p-0">
                    {bill.actions.slice(0, 5).map((action, index) => (
                      <li key={index} className="text-sm p-3 bg-secondary/50 rounded-md">
                        <p className="font-semibold">{formatDate(action.actionDate)}</p>
                        <p className="text-muted-foreground mt-1">{action.text}</p>
                      </li>
                    ))}
                    {bill.actions.length > 5 && (
                      <Collapsible>
                        <CollapsibleContent className="space-y-4 list-none p-0">
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
