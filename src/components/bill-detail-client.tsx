'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { Bill, RelatedBill } from '@/types';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Landmark, Users, Library, FileText, UserSquare2, FileJson, Tags, BookText, Download, History, ArrowRight, ThumbsUp, ThumbsDown, Eye } from 'lucide-react';
import { getBillSupportData } from '@/lib/bill-support-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getBillTypeSlug, formatDate, constructBillUrl } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BillAmendments } from './bill-amendments';
import { SummaryDisplay } from './bill-summary-display';
import { UserVerificationModal } from '@/components/user-verification-modal';
import { useAuth } from '@/hooks/use-auth';
import { useZipCode } from '@/hooks/use-zip-code';
import { mapPolicyAreaToSiteCategory } from '@/lib/policy-area-mapping';
import { extractSubjectsFromApiResponse } from '@/lib/subjects';

const getBillStatus = (latestAction: any): string => {
    if (!latestAction?.text) return 'Introduced';
    
    const actionText = latestAction.text.toLowerCase();
    
    if (actionText.includes('became law') || actionText.includes('signed into law')) {
        return 'Became Law';
    }
    if (actionText.includes('to president') || actionText.includes('presented to president')) {
        return 'To President';
    }
    if (actionText.includes('passed senate') || (actionText.includes('passed') && actionText.includes('senate'))) {
        return 'Passed Senate';
    }
    if (actionText.includes('passed house') || (actionText.includes('passed') && actionText.includes('house'))) {
        return 'Passed House';
    }
    if (actionText.includes('committee') || actionText.includes('referred to')) {
        return 'In Committee';
    }
    
    return 'Introduced';
};

const BillStatusIndicator = ({ status }: { status: string }) => {
    const steps: string[] = ['Introduced', 'In Committee', 'Passed House', 'Passed Senate', 'To President', 'Became Law'];
    let currentStepIndex = steps.indexOf(status);

    if (currentStepIndex === -1) {
        currentStepIndex = 1; // Default to 'In Committee' if status is not found
    }

    const progressPercentage = ((currentStepIndex + 1) / steps.length) * 100;

    return (
        <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-2 px-1">
                {steps.map((step, index) => (
                    <span key={step} className={`text-center ${index === currentStepIndex ? 'font-bold text-primary' : ''}`}>
                        {step}
                    </span>
                ))}
            </div>
            <Progress value={progressPercentage} className="h-2" />
        </div>
    );
};

export function BillDetailClient({ bill }: { bill: Bill }) {
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [sponsorImageUrl, setSponsorImageUrl] = useState<string | null>(null);
  const { user } = useAuth();
  const { saveZipCode } = useZipCode();
  const router = useRouter();
  
  const hasSponsors = bill.sponsors && bill.sponsors.length > 0;
  
  // Fetch sponsor image when component mounts
  useEffect(() => {
    const fetchSponsorImage = async () => {
      if (hasSponsors && bill.sponsors[0]?.bioguideId) {
        try {
          const response = await fetch(`https://api.congress.gov/v3/member/${bill.sponsors[0].bioguideId}?format=json&api_key=Wfxsy1WLgtTWIaKixMUDHz2DtRuaaqAtEZOU0E49`);
          if (response.ok) {
            const data = await response.json();
            const imageUrl = data.member?.depiction?.imageUrl;
            if (imageUrl) {
              setSponsorImageUrl(imageUrl);
            }
          }
        } catch (error) {
          console.warn('Failed to fetch sponsor image:', error);
        }
      }
    };

    fetchSponsorImage();
  }, [bill.sponsors, hasSponsors]);
  const hasCosponsors = bill.cosponsors?.items && bill.cosponsors.items.length > 0;
  const hasCommittees = bill.committees?.items && bill.committees.items.length > 0;
  const hasAllSummaries = bill.allSummaries && Array.isArray(bill.allSummaries) && bill.allSummaries.length > 0;
  const hasTextVersions = bill.textVersions?.items && bill.textVersions.items.length > 0;
  const hasActions = bill.actions?.items && bill.actions.items.length > 0;
  const hasRelatedBills = bill.relatedBills?.items && bill.relatedBills.items.length > 0;
  
  // Get consistent mock support data
  const { supportCount, opposeCount } = getBillSupportData(bill.congress!, bill.type!, bill.number!);
  
  // Extract all subjects using the same logic as homepage
  const allPolicyIssues = bill.subjects ? extractSubjectsFromApiResponse(bill.subjects) : [];
  
  // Step 1: Look up primary issue (Congress.gov policy area) and map it to our categories
  const policyAreaName = bill.subjects?.policyArea?.name;
  const primaryMappedCategory = policyAreaName ? mapPolicyAreaToSiteCategory(policyAreaName) : null;
  
  // Step 2: Extract and map secondary issues from subjects
  const secondaryIssues = allPolicyIssues.filter(issue => issue !== primaryMappedCategory);
  
  // Step 3: Apply primary category (policy area mapping takes precedence)
  let sitePolicyCategory = primaryMappedCategory;
  
  // Fallback: If no primary mapping exists, use first extracted subject
  if (!sitePolicyCategory && allPolicyIssues.length > 0) {
    sitePolicyCategory = allPolicyIssues[0];
  }
  
  // Improved title logic - prioritize title over shortTitle for main heading
  // and show shortTitle as subtitle if it exists and is different
  const displayTitle = bill.title || bill.shortTitle || 'Untitled Bill';
  const hasDistinctShortTitle = bill.shortTitle && 
                                bill.title && 
                                bill.shortTitle !== bill.title && 
                                bill.shortTitle.trim().length > 0;

  const handleVoiceOpinionClick = () => {
    if (!user) {
      setShowVerificationModal(true);
    } else {
      router.push(`/advocacy-message?congress=${bill.congress}&type=${bill.type}&number=${bill.number}&verified=true`);
    }
  };

  const handleVerificationComplete = (userInfo: any) => {
    // Store verification info in session storage for the advocacy page
    sessionStorage.setItem('verifiedUser', JSON.stringify(userInfo));
    
    // Update the global zip code with the verified user's zip code
    if (userInfo.zipCode) {
      saveZipCode(userInfo.zipCode);
    }
    
    setShowVerificationModal(false);
    router.push(`/advocacy-message?congress=${bill.congress}&type=${bill.type}&number=${bill.number}&verified=true`);
  };

  const handleVerificationSkip = () => {
    setShowVerificationModal(false);
    // Redirect to login page with return URL
    const returnUrl = `/advocacy-message?congress=${bill.congress}&type=${bill.type}&number=${bill.number}`;
    router.push(`/login?returnTo=${encodeURIComponent(returnUrl)}`);
  };

  return (
    <div>
      <main>
        <div className="max-w-[672px] mx-auto space-y-8">
          <Card>
            <CardHeader>
              {/* Bill number */}
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <Badge variant="outline" className="shrink-0 font-semibold">{bill.type} {bill.number}</Badge>
              </div>

              {/* Bill title - keeping H1 size */}
              <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary mb-4">
                {displayTitle}
              </h1>
              {hasDistinctShortTitle && (
                <p className="text-xl text-muted-foreground mt-2 mb-4 font-medium">
                  {bill.shortTitle}
                </p>
              )}

              {/* Sponsor info under the title */}
              {hasSponsors && bill.sponsors[0] && (
                <div className="flex items-center gap-4 mb-0">
                  {sponsorImageUrl && (
                    <div className="w-[60px] h-[60px] rounded-full overflow-hidden flex-shrink-0">
                      <Image 
                        src={sponsorImageUrl} 
                        alt={bill.sponsors[0].fullName}
                        width={60}
                        height={60}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <span className={`flex items-center gap-1.5 px-3 py-2 rounded-full ${
                    bill.sponsors[0].party === 'R' ? 'bg-red-100 text-red-800' 
                    : bill.sponsors[0].party === 'D' ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                  }`}>
                    <Users className="h-3 w-3" />
                    {bill.sponsors[0].fullName} ({bill.sponsors[0].party}-{bill.sponsors[0].state})
                  </span>
                </div>
              )}
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Latest Action */}
              {bill.latestAction && (
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">Latest Action:</span>{' '}
                  {bill.latestAction.text} ({formatDate(bill.latestAction.actionDate)})
                </p>
              )}

              {/* Status Bar */}
              {bill.latestAction && (
                <BillStatusIndicator status={getBillStatus(bill.latestAction)} />
              )}
            </CardContent>
            
            <CardFooter className="flex items-center gap-2 pt-4 border-t">
              <Button size="sm" onClick={handleVoiceOpinionClick}>
                  Voice your opinion
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center gap-2 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
              >
                <ThumbsUp className="h-4 w-4" />
                <span className="font-semibold">{supportCount.toLocaleString()}</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              >
                <ThumbsDown className="h-4 w-4" />
                <span className="font-semibold">{opposeCount.toLocaleString()}</span>
              </Button>
              <Button 
                variant="outline"
                size="sm"
                className="flex items-center gap-2 text-muted-foreground"
              >
                <Eye className="h-4 w-4" />
                Watch
              </Button>
            </CardFooter>
          </Card>

          {(hasAllSummaries || bill.summaries?.count > 0 || bill.title || bill.shortTitle) && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <FileText className="text-primary" />
                            {hasAllSummaries ? `All Summaries (${bill.allSummaries.length})` : 'Summary'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {hasAllSummaries ? (
                            <>
                                {/* Show first summary normally */}
                                <SummaryDisplay summary={bill.allSummaries[0]} showPoliticalPerspectives={false} />
                                
                                {/* Show additional summaries in accordions */}
                                {bill.allSummaries.length > 1 && (
                                    <div className="space-y-2">
                                        {bill.allSummaries.slice(1).map((summary, index) => (
                                            <Collapsible key={index + 1}>
                                                <CollapsibleTrigger className="flex items-center justify-between w-full p-3 border rounded-md hover:bg-gray-50 transition-colors">
                                                    <div className="flex items-center gap-2 text-left">
                                                        <FileText className="h-4 w-4 text-primary" />
                                                        <span className="font-medium text-sm">{summary.actionDesc} ({summary.versionCode})</span>
                                                        <span className="text-xs text-muted-foreground">{formatDate(summary.updateDate)}</span>
                                                    </div>
                                                    <ArrowRight className="h-4 w-4 transition-transform duration-200" />
                                                </CollapsibleTrigger>
                                                <CollapsibleContent className="pt-2">
                                                    <SummaryDisplay summary={summary} showPoliticalPerspectives={false} />
                                                </CollapsibleContent>
                                            </Collapsible>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-sm">
                                {bill.summaries?.count > 0 ? (
                                    <p className="text-muted-foreground italic">
                                        Summary is being processed. Please check back later.
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        <div>
                                            <p className="font-medium text-muted-foreground mb-1">Official Title</p>
                                            <p className="text-foreground">{bill.title || displayTitle}</p>
                                        </div>
                                        {bill.shortTitle && bill.shortTitle !== bill.title && (
                                            <div>
                                                <p className="font-medium text-muted-foreground mb-1">Short Title</p>
                                                <p className="text-foreground">{bill.shortTitle}</p>
                                            </div>
                                        )}
                                        <p className="text-muted-foreground italic mt-4">
                                            Official congressional summary not yet available. Visit Congress.gov for the latest information.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
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
                                      <li key={index} className="flex items-center justify-between p-2 border rounded-md">
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
                                      <li key={index} className="flex items-center justify-between p-2 border rounded-md">
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
                                committee.activities
                                    .filter(activity => activity.name !== 'Unknown')
                                    .map((activity, activityIndex) => {
                                        const committeeLink = `/congress/${bill.congress}/committees/${committee.systemCode.toLowerCase()}`;
                                        // Transform committee name: "Budget Committee" -> "House Budget"
                                        const displayName = committee.chamber === 'House' && committee.name.includes('Committee')
                                            ? `House ${committee.name.replace(' Committee', '')}`
                                            : committee.name;
                                        
                                        return (
                                            <TableRow key={`${committeeIndex}-${activityIndex}`}>
                                                <TableCell className="font-medium">
                                                    <Link href={committeeLink} className="hover:underline flex items-center gap-1">
                                                        {displayName}
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

            {(sitePolicyCategory || bill.subjects?.policyArea) && (
              <Card>
                  <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                          <Tags className="text-primary" />
                          Policy Area & Issues
                      </CardTitle>
                  </CardHeader>
                  <CardContent>
                     {sitePolicyCategory && (
                       <div>
                         <p className="text-sm font-medium text-muted-foreground mb-1">Primary Issue Category</p>
                         <Badge variant="default" className="text-sm">
                             {sitePolicyCategory}
                         </Badge>
                         {secondaryIssues.length > 0 && (
                           <div className="mt-2">
                             <p className="text-sm font-medium text-muted-foreground mb-1">Additional Issues</p>
                             <div className="flex flex-wrap gap-1">
                               {secondaryIssues.map(issue => (
                                 <Badge key={issue} variant="outline" className="text-xs">
                                   {issue}
                                 </Badge>
                               ))}
                             </div>
                           </div>
                         )}
                       </div>
                     )}
                     {bill.subjects?.policyArea && (
                        <div className={`${sitePolicyCategory ? 'mt-3 pt-3 border-t border-border' : ''}`}>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Congress.gov Policy Area</p>
                            <Badge variant="secondary" className="text-sm">
                                {bill.subjects.policyArea.name}
                            </Badge>
                        </div>
                     )}
                  </CardContent>
              </Card>
            )}

            {/* Placeholder cards */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Winners/Losers</CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Third party ratings</CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Industry support</CardTitle>
              </CardHeader>
            </Card>

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
                                    <li key={index} className="text-sm p-3 border rounded-md">
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
                                      <li key={index + 5} className="text-sm p-3 border rounded-md">
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
      
      <UserVerificationModal
        open={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        onVerified={handleVerificationComplete}
        onLogin={handleVerificationSkip}
      />
    </div>
  );
}
