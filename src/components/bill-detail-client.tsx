'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Bill, RelatedBill } from '@/types';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Landmark, Users, Library, FileText, UserSquare2, FileJson, Tags, BookText, Download, History, ArrowRight, ThumbsUp, ThumbsDown, Eye, MessageSquareText } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { getBillSupportData } from '@/lib/bill-support-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getBillTypeSlug, formatDate, constructBillUrl } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BillAmendments } from './bill-amendments';
import { SummaryDisplay } from './bill-summary-display';
import { useZipCode } from '@/hooks/use-zip-code';
import { mapPolicyAreaToSiteCategory } from '@/lib/policy-area-mapping';
import { extractSubjectsFromApiResponse } from '@/lib/subjects';
import { useWatchedBills } from '@/hooks/use-watched-bills';
import { campaignsService } from '@/lib/campaigns';

const getBillStatus = (latestAction: any): string => {
    if (!latestAction?.text) return 'Introduced';
    
    const actionText = latestAction.text.toLowerCase();
    
    if (actionText.includes('became law') || 
        actionText.includes('signed into law') || 
        actionText.includes('became public law') ||
        actionText.includes('public law no') ||
        actionText.includes('signed by president')) {
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

export function BillDetailClient({ bill }: { bill: Bill }) {
  const { user } = useAuth();
  const router = useRouter();
  
  // Get initial support data and set up state
  const initialSupportData = getBillSupportData(bill.congress!, bill.type!, bill.number!);
  const [supportCount, setSupportCount] = useState(initialSupportData.supportCount);
  const [opposeCount, setOpposeCount] = useState(initialSupportData.opposeCount);
  const [userAction, setUserAction] = useState<'support' | 'oppose' | null>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  
  // Load campaigns for this bill from both static data and Firebase
  useEffect(() => {
    const loadCampaigns = async () => {
      // Get static campaigns
      const staticCampaigns = campaignsService.getCampaignsByBill(bill.congress!, bill.type!, bill.number!);
      
      try {
        // Try to fetch from Firebase as well
        const { getFirestore, collection, query, where, getDocs } = await import('firebase/firestore');
        const { app } = await import('@/lib/firebase');
        const db = getFirestore(app);
        
        const campaignsQuery = query(
          collection(db, 'campaigns'),
          where('billType', '==', bill.type),
          where('billNumber', '==', bill.number)
        );
        
        const querySnapshot = await getDocs(campaignsQuery);
        const firebaseCampaigns = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            groupSlug: data.groupSlug,
            groupName: data.organizationName || data.groupName,
            position: data.position,
            supportCount: data.supportCount || 0,
            opposeCount: data.opposeCount || 0,
            bill: {
              congress: data.congress || bill.congress,
              type: data.billType,
              number: data.billNumber
            }
          };
        });
        
        // Combine static and Firebase campaigns, avoiding duplicates
        const allCampaigns = [...staticCampaigns];
        firebaseCampaigns.forEach(fbCampaign => {
          const exists = allCampaigns.some(c => 
            c.groupSlug === fbCampaign.groupSlug && 
            c.bill.type === fbCampaign.bill.type && 
            c.bill.number === fbCampaign.bill.number
          );
          if (!exists) {
            allCampaigns.push(fbCampaign);
          }
        });
        
        setCampaigns(allCampaigns);
      } catch (error) {
        console.log('Firebase not available or error fetching:', error);
        // Fall back to static campaigns only
        setCampaigns(staticCampaigns);
      }
    };
    
    loadCampaigns();
  }, [bill]);
  
  // Add watch functionality
  const { isWatchedBill, toggleWatchBill } = useWatchedBills();
  
  const hasSponsors = bill.sponsors && bill.sponsors.length > 0;
  const isWatched = isWatchedBill(bill.congress!, bill.type!, bill.number!);
  
  const handleWatchClick = () => {
    if (!user) {
      const currentUrl = window.location.pathname;
      router.push(`/login?returnTo=${encodeURIComponent(currentUrl)}`);
      return;
    }
    
    console.log('Watch button clicked');
    toggleWatchBill(bill.congress!, bill.type!, bill.number!, bill.title || bill.shortTitle);
  };
  const hasCosponsors = bill.cosponsors?.items && bill.cosponsors.items.length > 0;
  const hasCommittees = bill.committees?.items && bill.committees.items.length > 0;
  const hasAllSummaries = bill.allSummaries && Array.isArray(bill.allSummaries) && bill.allSummaries.length > 0;
  const hasTextVersions = bill.textVersions?.items && bill.textVersions.items.length > 0;
  const hasActions = bill.actions?.items && bill.actions.items.length > 0;
  const hasRelatedBills = bill.relatedBills?.items && bill.relatedBills.items.length > 0;
  
  
  // Extract all subjects using the same logic as homepage
  const allPolicyIssues = bill.subjects ? extractSubjectsFromApiResponse(bill.subjects) : [];
  
  // Step 1: Look up primary issue (Congress.gov policy area) and map it to our categories
  const policyAreaName = bill.subjects?.policyArea?.name;
  const primaryMappedCategory = policyAreaName ? mapPolicyAreaToSiteCategory(policyAreaName) : null;
  
  // Step 2: Extract and map secondary issues from subjects
  const secondaryIssues = allPolicyIssues.filter(issue => issue !== primaryMappedCategory);
  
  // Step 3: Apply primary category (policy area mapping takes precedence)
  let sitePolicyCategory = primaryMappedCategory;
  
  // Fallback: If no primary mapping exists, use first extracted subject if it's valid
  if (!sitePolicyCategory && allPolicyIssues.length > 0) {
    // Since allPolicyIssues comes from extractSubjectsFromApiResponse which filters by ALLOWED_SUBJECTS,
    // the first item should be a valid SiteIssueCategory
    sitePolicyCategory = allPolicyIssues[0] as any;
  }
  
  // Improved title logic - prioritize title over shortTitle for main heading
  // and show shortTitle as subtitle if it exists and is different
  const displayTitle = bill.title || bill.shortTitle || 'Untitled Bill';
  const hasDistinctShortTitle = bill.shortTitle && 
                                bill.title && 
                                bill.shortTitle !== bill.title && 
                                bill.shortTitle.trim().length > 0;

  const handleVoiceOpinionClick = () => {
    // Always go directly to advocacy message page - verification is now handled in Step 3
    router.push(`/advocacy-message?congress=${bill.congress}&type=${bill.type}&number=${bill.number}`);
  };

  const handleSupportOppose = async (action: 'support' | 'oppose') => {
    if (!user) {
      window.location.href = '/login';
      return;
    }

    try {
      // Store action in localStorage as temporary solution
      const userActions = JSON.parse(localStorage.getItem('userBillActions') || '[]');
      const newAction = {
        id: Date.now().toString(),
        userId: user.uid,
        userEmail: user.email,
        campaignId: `bill-${bill.congress}-${bill.type}-${bill.number}`,
        billNumber: bill.number,
        billType: bill.type,
        congress: bill.congress,
        billTitle: bill.title,
        action: action,
        timestamp: new Date().toISOString(),
        groupName: 'Individual Action',
        groupSlug: 'individual'
      };
      
      userActions.push(newAction);
      localStorage.setItem('userBillActions', JSON.stringify(userActions));

      // Update local state to reflect the change immediately
      if (action === 'support') {
        setSupportCount(prev => prev + 1);
      } else {
        setOpposeCount(prev => prev + 1);
      }

      // Set user action state to show success on button
      setUserAction(action);
      
      // Clear the success state after 2 seconds
      setTimeout(() => {
        setUserAction(null);
      }, 2000);

    } catch (error) {
      console.error('Error recording support/oppose action:', error);
      alert('There was an error recording your action. Please try again.');
    }
  };


  return (
    <div>
      <main>
        <div className="max-w-2xl mx-auto space-y-8">
          <Card>
            <CardHeader>
              {/* Bill number, status, and category */}
              <div className="flex items-center gap-2 sm:gap-3 mb-3 flex-wrap">
                <Badge variant="outline" className="shrink-0 font-semibold">{bill.type} {bill.number}</Badge>
                <Badge className="shrink-0 bg-black text-white hover:bg-black/90">
                  {getBillStatus(bill.latestAction)}
                </Badge>
                {sitePolicyCategory && (
                  <Badge className="shrink-0 bg-gray-500 text-white hover:bg-gray-600 text-xs">
                    {sitePolicyCategory}
                  </Badge>
                )}
              </div>

              {/* Bill title - responsive sizing */}
              <h1 className="font-headline text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-4 break-words">
                {displayTitle}
              </h1>
              {hasDistinctShortTitle && (
                <p className="text-xl text-muted-foreground mt-2 mb-4 font-medium">
                  {bill.shortTitle}
                </p>
              )}
              {/* Twitter-style Action Bar - mobile optimized */}
              <div className="flex items-center justify-between px-1 sm:px-2 py-3 border-t border-gray-200 gap-0.5 sm:gap-1 overflow-x-auto">
                <button
                  onClick={handleVoiceOpinionClick}
                  className="bg-black text-white hover:bg-black/90 rounded-md px-3 sm:px-4 py-1.5 sm:py-2 transition-colors flex-shrink-0"
                >
                  <span className="text-xs sm:text-sm font-medium">Voice your opinion</span>
                </button>
                
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleSupportOppose('support');
                  }}
                  className={`flex items-center gap-0.5 sm:gap-1 rounded-full px-2 sm:px-3 py-1.5 sm:py-2 transition-colors group flex-shrink-0 ${
                    userAction === 'support'
                      ? 'text-red-600 bg-red-50'
                      : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                  }`}
                  title={user ? 'Support this bill' : 'Login to support this bill'}
                >
                  <ThumbsUp className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                  <span className="text-xs sm:text-sm font-medium">
                    {supportCount.toLocaleString()}
                  </span>
                </button>
                
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleSupportOppose('oppose');
                  }}
                  className={`flex items-center gap-0.5 sm:gap-1 rounded-full px-2 sm:px-3 py-1.5 sm:py-2 transition-colors group flex-shrink-0 ${
                    userAction === 'oppose'
                      ? 'text-red-600 bg-red-50'
                      : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                  }`}
                  title={user ? 'Oppose this bill' : 'Login to oppose this bill'}
                >
                  <ThumbsDown className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                  <span className="text-xs sm:text-sm font-medium">
                    {opposeCount.toLocaleString()}
                  </span>
                </button>
                
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleWatchClick();
                  }}
                  className={`flex items-center gap-0.5 sm:gap-1 rounded-full px-2 sm:px-3 py-1.5 sm:py-2 transition-colors group flex-shrink-0 ${
                    isWatched 
                      ? 'text-blue-600 bg-blue-50' 
                      : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                  title={user ? (isWatched ? 'Stop watching this bill' : 'Watch this bill for updates') : 'Login to watch this bill'}
                >
                  <Eye className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                  <span className="text-xs sm:text-sm font-medium">123K</span>
                </button>
                
                <a
                  href={constructBillUrl(bill)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-0.5 sm:gap-1 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-full px-2 sm:px-3 py-1.5 sm:py-2 transition-colors group flex-shrink-0"
                >
                  <ExternalLink className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                  <span className="text-xs sm:text-sm font-medium">Bill</span>
                </a>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Summary Display */}
              {hasAllSummaries && bill.allSummaries[0] ? (
                <div className="mb-4">
                  <SummaryDisplay summary={bill.allSummaries[0]} showPoliticalPerspectives={false} />
                </div>
              ) : (
                <div className="mb-4 p-4 bg-gray-50 rounded-md border">
                  <p className="text-sm text-muted-foreground italic">
                    A summary is in progress.
                  </p>
                </div>
              )}
              
              {/* Campaigns Section */}
              {campaigns.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-medium text-muted-foreground mb-3">Campaigns:</p>
                  <div className="space-y-3">
                    {campaigns.map((campaign) => (
                      <div key={campaign.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium break-words">{campaign.groupName}</span>
                          <Badge 
                            variant={campaign.position === 'Support' ? 'default' : 'secondary'}
                            className={`text-xs flex-shrink-0 ${
                              campaign.position === 'Support' 
                                ? 'bg-black text-white hover:bg-black/90' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            {campaign.position}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 text-xs text-muted-foreground flex-wrap">
                          <div className="flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3 flex-shrink-0" />
                            <span>{campaign.supportCount.toLocaleString()}</span>
                          </div>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <ThumbsDown className="h-3 w-3 flex-shrink-0" />
                            <span>{campaign.opposeCount.toLocaleString()}</span>
                          </div>
                          <span>•</span>
                          <Link 
                            href={`/campaigns/${campaign.groupSlug}/${bill.type?.toLowerCase()}-${bill.number}`}
                            className="text-primary hover:underline whitespace-nowrap"
                          >
                            View
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Collapsible section for additional details */}
          <Collapsible>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 border rounded-md hover:bg-gray-50 transition-colors">
              <h3 className="text-lg font-semibold">More about this bill</h3>
              <ArrowRight className="h-4 w-4 transition-transform duration-200" />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-6 mt-4">

          {/* Bill Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="text-primary" />
                Bill Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Introduced</p>
                  <p className="text-sm">{formatDate(bill.introducedDate)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Origin Chamber</p>
                  <p className="text-sm">{bill.originChamber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Last Updated</p>
                  <p className="text-sm">{formatDate(bill.updateDate)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Congress</p>
                  <p className="text-sm">{bill.congress}th Congress</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Show additional summaries card only if there are more than 1 summary */}
          {hasAllSummaries && bill.allSummaries.length > 1 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <FileText className="text-primary" />
                            Additional Summaries ({bill.allSummaries.length - 1})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
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
                    </CardContent>
                </Card>
            )}

          {/* Show fallback summary card if no allSummaries but has title/shortTitle */}
          {!hasAllSummaries && (bill.summaries?.count > 0 || bill.title || bill.shortTitle) && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <FileText className="text-primary" />
                            Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
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
                                              <Link href={`/federal/congress/${bill.congress}/${sponsor.state.toLowerCase()}/${sponsor.bioguideId}`}>
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
                                              <Link href={`/federal/congress/${bill.congress}/${cosponsor.state.toLowerCase()}/${cosponsor.bioguideId}`}>
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
                                        const committeeLink = `/federal/congress/${bill.congress}/committees/${committee.systemCode.toLowerCase()}`;
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

            {/* Legislative Actions Timeline */}
            {hasActions && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <History className="text-primary" />
                    Legislative Actions ({bill.actions.count})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {bill.actions.items.slice(0, 10).map((action, index) => (
                      <div key={index} className="flex flex-col sm:flex-row sm:items-start gap-2 p-3 border rounded-md">
                        <div className="flex-shrink-0">
                          <Badge variant="outline" className="text-xs">
                            {formatDate(action.actionDate)}
                          </Badge>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">{action.text}</p>
                        </div>
                      </div>
                    ))}
                    {bill.actions.items.length > 10 && (
                      <Collapsible>
                        <CollapsibleContent className="space-y-3 mt-3">
                          {bill.actions.items.slice(10).map((action, index) => (
                            <div key={index + 10} className="flex flex-col sm:flex-row sm:items-start gap-2 p-3 border rounded-md">
                              <div className="flex-shrink-0">
                                <Badge variant="outline" className="text-xs">
                                  {formatDate(action.actionDate)}
                                </Badge>
                              </div>
                              <div className="flex-1">
                                <p className="text-sm">{action.text}</p>
                              </div>
                            </div>
                          ))}
                        </CollapsibleContent>
                        <CollapsibleTrigger asChild>
                          <Button variant="outline" className="w-full mt-4">
                            Show all {bill.actions.items.length} actions
                          </Button>
                        </CollapsibleTrigger>
                      </Collapsible>
                    )}
                  </div>
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

            </CollapsibleContent>
          </Collapsible>
        </div>
      </main>
      <footer className="text-center py-6 text-sm text-muted-foreground mt-8 border-t">
        <p>Data provided by the <a href="https://www.congress.gov/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">U.S. Congress</a> via <a href="https://api.congress.gov/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">api.congress.gov</a>.</p>
      </footer>
    </div>
  );
}
