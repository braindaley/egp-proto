'use client';

import Link from 'next/link';
import type { Bill, RelatedBill } from '@/types';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Landmark, Users, Library, FileText, UserSquare2, FileJson, Tags, BookText, Download, History, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getBillTypeSlug, formatDate, constructBillUrl } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BillTracker } from '@/components/bill-tracker';
import { BillAmendments } from './bill-amendments';
import { SummaryDisplay } from './bill-summary-display';

export function BillDetailClient({ bill }: { bill: Bill }) {
  const hasSponsors = bill.sponsors && bill.sponsors.length > 0;
  const hasCosponsors = bill.cosponsors?.items && bill.cosponsors.items.length > 0;
  const hasCommittees = bill.committees?.items && bill.committees.items.length > 0;
  const hasAllSummaries = bill.allSummaries && Array.isArray(bill.allSummaries) && bill.allSummaries.length > 0;
  const hasTextVersions = bill.textVersions?.items && bill.textVersions.items.length > 0;
  const hasActions = bill.actions?.items && bill.actions.items.length > 0;
  const hasRelatedBills = bill.relatedBills?.items && bill.relatedBills.items.length > 0;
  
  // Extract subject names from the API response (now properly mapped by the API)
  const subjectNames = bill.subjects?.items?.map(subject => 
    typeof subject === 'string' ? subject : subject?.name
  ).filter(name => name && typeof name === 'string') || [];
  
  const hasSubjects = subjectNames.length > 0;
  
  // Improved title logic - prioritize title over shortTitle for main heading
  // and show shortTitle as subtitle if it exists and is different
  const displayTitle = bill.title || bill.shortTitle || 'Untitled Bill';
  const hasDistinctShortTitle = bill.shortTitle && 
                                bill.title && 
                                bill.shortTitle !== bill.title && 
                                bill.shortTitle.trim().length > 0;

  return (
    <div className="bg-background min-h-screen">
      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <header>
            <p className="text-lg text-muted-foreground font-medium mb-1">{bill.type} {bill.number} &bull; {bill.congress}th Congress</p>
            <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary">
              {displayTitle}
            </h1>
            {hasDistinctShortTitle && (
              <p className="text-xl text-muted-foreground mt-2 font-medium">
                {bill.shortTitle}
              </p>
            )}
          </header>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Chamber</span>
                         <Badge variant="outline" className="flex items-center gap-1.5">
                            <Landmark className="h-3 w-3" />
                            {bill.originChamber}
                        </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Introduced</span>
                        <span className="font-medium">{formatDate(bill.introducedDate)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Last Update</span>
                         <span className="font-medium">{formatDate(bill.updateDate)}</span>
                    </div>
                     {bill.latestAction && (
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Latest Action</span>
                            <div className="text-right">
                                <span className="font-medium block">{formatDate(bill.latestAction.actionDate)}</span>
                                <span className="text-muted-foreground text-xs">{bill.latestAction.text}</span>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {bill.latestAction && <BillTracker latestAction={bill.latestAction} originChamber={bill.originChamber} />}

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
                           <SummaryDisplay key={index} summary={summary} showPoliticalPerspectives={index === 0} />
                        ))}
                    </CardContent>
                </Card>
            )}

            {hasSubjects && (
              <Card>
                  <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                          <Tags className="text-primary" />
                          Issues
                      </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                     {subjectNames.map((subject, index) => (
                        <Badge key={index} variant="secondary" className="text-sm">
                            {subject}
                        </Badge>
                     ))}
                  </CardContent>
              </Card>
            )}

            {hasTextVersions && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <BookText className="text-primary" />
                            Text Versions ({bill.textVersions.count})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue={bill.textVersions.items[0]?.type} className="w-full">
                            <TabsList className="grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-4 h-auto flex-wrap">
                                {bill.textVersions.items.map((version) => (
                                  <TabsTrigger key={version.type} value={version.type} className="flex-1 text-xs px-2 py-1.5 whitespace-normal h-auto">{version.type}</TabsTrigger>
                                ))}
                            </TabsList>
                            {bill.textVersions.items.map((version) => {
                                const fullText = version.formats.find(f => f.type.toLowerCase().includes('text'))?.url;
                                const pdfUrl = version.formats.find(f => f.type === 'PDF')?.url;

                                return (
                                <TabsContent key={version.type} value={version.type}>
                                    <div className="p-4 bg-secondary/50 rounded-md">
                                        <div className="flex justify-between items-center mb-3">
                                            <p className="text-sm font-medium">Published: {formatDate(version.date)}</p>
                                            <div className="flex gap-2">
                                                {fullText && (
                                                    <Button asChild size="sm" variant="outline">
                                                        <a href={fullText} target="_blank" rel="noopener noreferrer">
                                                            View text <ExternalLink className="ml-2 h-4 w-4" />
                                                        </a>
                                                    </Button>
                                                )}
                                                {pdfUrl && (
                                                    <Button asChild size="sm">
                                                        <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                                                            <Download className="mr-2 h-4 w-4" />
                                                            Download PDF
                                                        </a>
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                        {!fullText && !pdfUrl && (
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
                                      <li key={index} className="flex items-center justify-between p-2 bg-secondary/50 rounded-md">
                                          <span className="font-semibold text-sm">{sponsor.fullName} ({sponsor.party}-{sponsor.state})</span>
                                           <Button asChild variant="link" size="sm" className="h-auto p-0">
                                              <Link href={`/congress/${bill.congress}/${sponsor.state.toLowerCase()}/${sponsor.bioguideId}`}>
                                                  View Member <ArrowRight className="ml-1 h-3 w-3" />
                                              </Link>
                                          </Button>
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
                                      <li key={index} className="flex items-center justify-between p-2 bg-secondary/50 rounded-md">
                                          <span className="font-semibold text-sm">{cosponsor.fullName} ({cosponsor.party}-{cosponsor.state})</span>
                                          <Button asChild variant="link" size="sm" className="h-auto p-0">
                                              <Link href={`/congress/${bill.congress}/${cosponsor.state.toLowerCase()}/${cosponsor.bioguideId}`}>
                                                   View Member <ArrowRight className="ml-1 h-3 w-3" />
                                              </Link>
                                          </Button>
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
                      Committees ({bill.committees.count})
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
                                committee.activities.map((activity, activityIndex) => {
                                    const committeeLink = `/congress/${bill.congress}/committees/${committee.systemCode.toLowerCase()}`;
                                    return (
                                        <TableRow key={`${committeeIndex}-${activityIndex}`}>
                                            <TableCell className="font-medium">
                                                <Link href={committeeLink} className="hover:underline flex items-center gap-1">
                                                    {committee.name}
                                                </Link>
                                            </TableCell>
                                            <TableCell>{formatDate(activity.date || '')}</TableCell>
                                            <TableCell>{activity.name}</TableCell>
                                        </TableRow>
                                    )
                                })
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
                            Related Bills ({bill.relatedBills.count})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                         <ul className="space-y-3 list-none p-0">
                            {bill.relatedBills.items.slice(0, 5).map((relatedBill: RelatedBill, index: number) => {
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
                         {bill.relatedBills.items.length > 5 && (
                          <Collapsible>
                            <CollapsibleContent className="space-y-3 list-none p-0 mt-3">
                              {bill.relatedBills.items.slice(5).map((relatedBill: RelatedBill, index: number) => {
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
                                Show all {bill.relatedBills.items.length} related bills
                              </Button>
                            </CollapsibleTrigger>
                          </Collapsible>
                        )}
                    </CardContent>
                </Card>
            )}

            <BillAmendments
              congress={bill.congress}
              billType={bill.type}
              billNumber={bill.number}
            />

            {hasActions && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                      <History className="text-primary" />
                      Actions ({bill.actions.count})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4 list-none p-0">
                    {bill.actions.items.slice(0, 5).map((action, index) => (
                      <li key={index} className="text-sm p-3 bg-secondary/50 rounded-md">
                        <p className="font-semibold">{formatDate(action.actionDate)}</p>
                        <p className="text-muted-foreground mt-1">{action.text}</p>
                      </li>
                    ))}
                    {bill.actions.items.length > 5 && (
                      <Collapsible>
                        <CollapsibleContent className="space-y-4 list-none p-0 mt-3">
                          {bill.actions.items.slice(5).map((action, index) => (
                            <li key={index + 5} className="text-sm p-3 bg-secondary/50 rounded-md">
                              <p className="font-semibold">{formatDate(action.actionDate)}</p>
                              <p className="text-muted-foreground mt-1">{action.text}</p>
                            </li>
                          ))}
                        </CollapsibleContent>
                        <CollapsibleTrigger asChild>
                           <Button variant="outline" className="w-full mt-4">
                            Show all {bill.actions.items.length} actions
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
