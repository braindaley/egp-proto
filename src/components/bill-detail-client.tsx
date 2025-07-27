
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Bill, Amendment, RelatedBill, Summary, TextVersion } from '@/types';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Landmark, Users, Library, FileText, UserSquare2, FilePlus2, ChevronsUpDown, FileJson, Tags, BookText, Download, Loader2, History, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getBillTypeSlug } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { summarizeText, getDemocraticPerspective, getRepublicanPerspective } from '@/ai/flows/summarize-text-flow';
import { BillTracker } from '@/components/bill-tracker';
import { filterAllowedSubjects } from '@/lib/subjects';


function formatDate(dateString: string) {
    if (!dateString) return 'N/A';
    // Use UTC to prevent hydration errors from timezone differences
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC'
    });
}
  
function constructBillUrl(bill: Bill): string {
    const chamber = bill.originChamber.toLowerCase();
    const billTypeSlug = getBillTypeSlug(bill.type);
    return `https://www.congress.gov/bill/${bill.congress}th-congress/${chamber}-bill/${bill.number}`;
}

const TruncatedText = ({ text, limit = 500 }: { text: string; limit?: number }) => {
    if (!text) return null;
    const isHtml = /<[a-z][\s\S]*>/i.test(text);

    if (text.length <= limit) {
        if (isHtml) {
            return <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: text }} />;
        }
        return <p>{text}</p>;
    }

    return (
        <Collapsible>
            <CollapsibleTrigger asChild>
                 <div className="relative">
                    {isHtml ? (
                        <div className="prose prose-sm max-w-none text-muted-foreground line-clamp-6" dangerouslySetInnerHTML={{ __html: text }} />
                    ) : (
                        <p className="text-muted-foreground line-clamp-6">{text}</p>
                    )}
                </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
                 {isHtml ? (
                    <div className="prose prose-sm max-w-none text-muted-foreground" dangerouslySetInnerHTML={{ __html: text }} />
                ) : (
                    <p className="text-muted-foreground">{text}</p>
                )}
            </CollapsibleContent>
             <CollapsibleTrigger asChild>
                <Button variant="link" className="p-0 h-auto text-xs mt-2">
                    <ChevronsUpDown className="mr-1 h-3 w-3" />
                    Show more
                </Button>
            </CollapsibleTrigger>
        </Collapsible>
    );
};

const SummaryDisplay = ({ summary, showPoliticalPerspectives = false }: { summary: Summary; showPoliticalPerspectives?: boolean }) => {
  const [aiSummary, setAiSummary] = useState('');
  const [democraticView, setDemocraticView] = useState('');
  const [republicanView, setRepublicanView] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Helper function to strip HTML and clean text
  const cleanTextForAI = (htmlText: string | null | undefined): string | null => {
    if (!htmlText || typeof htmlText !== 'string') {
      return null;
    }
    
    // Strip HTML tags
    const stripped = htmlText.replace(/<[^>]*>/g, ' ');
    
    // Clean up extra whitespace and decode HTML entities
    const cleaned = stripped
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
    
    // Return null if the cleaned text is too short to be meaningful
    return cleaned.length > 20 ? cleaned : null;
  };

  useEffect(() => {
    const generateContent = async () => {
      if (!summary || !summary.text) {
        setAiSummary('No summary text available to analyze.');
        if (showPoliticalPerspectives) {
          setDemocraticView('No text available to analyze.');
          setRepublicanView('No text available to analyze.');
        }
        return;
      }

      const cleanedText = cleanTextForAI(summary.text);
      
      if (!cleanedText || cleanedText.length === 0 || cleanedText.trim().length === 0) {
        setAiSummary('No meaningful summary text available to analyze.');
        if (showPoliticalPerspectives) {
          setDemocraticView('No meaningful text available to analyze.');
          setRepublicanView('No meaningful text available to analyze.');
        }
        return;
      }

      try {
        setIsLoading(true);
        setError('');
        
        if (typeof cleanedText === 'string' && cleanedText.trim().length > 20) {
          if (showPoliticalPerspectives) {
            // Generate summary and political perspectives
            const [summaryResult, democraticResult, republicanResult] = await Promise.all([
              summarizeText(cleanedText),
              getDemocraticPerspective(cleanedText),
              getRepublicanPerspective(cleanedText)
            ]);
            
            setAiSummary(summaryResult || 'Summary generation completed but no result returned.');
            setDemocraticView(democraticResult || 'Democratic perspective analysis completed but no result returned.');
            setRepublicanView(republicanResult || 'Republican perspective analysis completed but no result returned.');
          } else {
            // Generate only summary for older summaries
            const summaryResult = await summarizeText(cleanedText);
            setAiSummary(summaryResult || 'Summary generation completed but no result returned.');
          }
        } else {
          setAiSummary('Text too short for analysis.');
          if (showPoliticalPerspectives) {
            setDemocraticView('Text too short for analysis.');
            setRepublicanView('Text too short for analysis.');
          }
        }
      } catch (e) {
        console.error("Error generating content:", e);
        setError('Could not generate content.');
      } finally {
        setIsLoading(false);
      }
    };

    generateContent();
  }, [summary, showPoliticalPerspectives]);

  return (
    <div className="p-3 bg-secondary/50 rounded-md">
      <div className="font-semibold text-sm mb-2 flex justify-between items-center">
        <span>{summary.actionDesc} ({summary.versionCode})</span>
        <span className="text-xs text-muted-foreground font-normal">{formatDate(summary.updateDate)}</span>
      </div>
      
      {isLoading && (
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Generating analysis...</span>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {!isLoading && !error && aiSummary && (
        <>
          <div className="mb-4">
            <p className="text-sm text-muted-foreground italic flex items-center gap-1">
              <FileText className="h-3 w-3" />
              AI-generated overview:
            </p>
            <p className="prose prose-sm max-w-none text-muted-foreground mt-1">{aiSummary}</p>
          </div>

          {(democraticView || republicanView) && showPoliticalPerspectives && (
            <div className="mb-4 space-y-3">
              <p className="text-sm text-muted-foreground font-medium flex items-center gap-1">
                <Users className="h-3 w-3" />
                Political perspectives:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {democraticView && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md border-l-4 border-blue-600">
                    <div className="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-line">{democraticView}</div>
                  </div>
                )}
                
                {republicanView && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-md border-l-4 border-red-600">
                    <div className="text-sm text-red-800 dark:text-red-200 whitespace-pre-line">{republicanView}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="mt-4" disabled={!summary.text}>View original text</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[90vw] h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Original Text: {summary.actionDesc} ({summary.versionCode})</DialogTitle>
            <DialogDescription>
              Full original text for the summary from {formatDate(summary.updateDate)}.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-grow pr-6">
             <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: summary.text }} />
          </ScrollArea>
          <DialogClose asChild>
            <Button type="button" variant="secondary" className="mt-4">
              Close
            </Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function BillDetailClient({ bill }: { bill: Bill }) {
  const hasSponsors = bill.sponsors && bill.sponsors.length > 0;
  const hasCosponsors = bill.cosponsors?.items && bill.cosponsors.items.length > 0;
  const hasCommittees = bill.committees?.items && bill.committees.items.length > 0;
  const hasAllSummaries = bill.allSummaries && Array.isArray(bill.allSummaries) && bill.allSummaries.length > 0;
  const hasTextVersions = bill.textVersions?.items && bill.textVersions.items.length > 0;
  const hasActions = bill.actions?.items && bill.actions.items.length > 0;
  const hasAmendments = bill.amendments?.items && bill.amendments.items.length > 0;
  const hasRelatedBills = bill.relatedBills?.items && bill.relatedBills.items.length > 0;
  
  const displaySubjects = filterAllowedSubjects(bill.subjects?.items || []);
  const hasSubjects = displaySubjects.length > 0;


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
                          Subjects
                      </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                     {displaySubjects.map((subject, index) => (
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
                                <ChevronsUpDown className="mr-2 h-4 w-4" />
                                Show all {bill.relatedBills.items.length} related bills
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
                      Amendments ({bill.amendments.count})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 list-none p-0">
                    {bill.amendments.items.slice(0, 5).map((amendment, index) => (
                      <li key={index} className="text-sm p-3 bg-secondary/50 rounded-md">
                          <div className="font-semibold flex justify-between items-center">
                            <span>{amendment.type} {amendment.number}</span>
                             <a href={amendment.url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1 text-xs">
                                <ExternalLink className="h-3 w-3" />
                            </a>
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
                     {bill.amendments.items.length > 5 && (
                      <Collapsible>
                        <CollapsibleContent className="space-y-3 list-none p-0 mt-3">
                          {bill.amendments.items.slice(5).map((amendment, index) => (
                            <li key={index + 5} className="text-sm p-3 bg-secondary/50 rounded-md">
                                <div className="font-semibold flex justify-between items-center">
                                  <span>{amendment.type} {amendment.number}</span>
                                    <a href={amendment.url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1 text-xs">
                                        <ExternalLink className="h-3 w-3" />
                                    </a>
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
                            Show all {bill.amendments.items.length} amendments
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
                            <ChevronsUpDown className="mr-2 h-4 w-4" />
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
