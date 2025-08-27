'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { campaignsService, type Campaign } from '@/lib/campaigns';
import { SITE_ISSUE_CATEGORIES } from '@/lib/policy-area-mapping';
import { ThumbsUp, ThumbsDown, ArrowRight, ChevronRight, Menu } from 'lucide-react';
import { getBillTypeSlug } from '@/lib/utils';
import { useState, useEffect } from 'react';

export default function Home() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(campaignsService.getAllCampaigns().filter(c => c.isActive));
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Fetch campaigns from both static data and Firebase
  useEffect(() => {
    const fetchAllCampaigns = async () => {
      try {
        // Start with static campaigns
        const staticCampaigns = campaignsService.getAllCampaigns().filter(c => c.isActive);
        
        // Fetch campaigns from Firebase
        const { getFirestore, collection, getDocs } = await import('firebase/firestore');
        const { app } = await import('@/lib/firebase');
        
        const db = getFirestore(app);
        const campaignsRef = collection(db, 'campaigns');
        const snapshot = await getDocs(campaignsRef);
        
        const firebaseCampaigns: Campaign[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            groupSlug: data.groupSlug,
            groupName: data.groupName || data.groupSlug,
            bill: {
              congress: 119, // Default to current congress
              type: data.billType,
              number: data.billNumber,
              title: data.billTitle
            },
            position: data.position,
            reasoning: data.reasoning,
            actionButtonText: 'Voice your opinion',
            supportCount: data.supportCount || 0,
            opposeCount: data.opposeCount || 0,
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt || new Date().toISOString(),
            isActive: true
          };
        });
        
        // Combine both sets, avoiding duplicates
        const allCampaigns = [...staticCampaigns];
        firebaseCampaigns.forEach(fbCampaign => {
          const exists = staticCampaigns.some(staticCampaign => 
            staticCampaign.groupSlug === fbCampaign.groupSlug &&
            staticCampaign.bill.type.toLowerCase() === fbCampaign.bill.type.toLowerCase() &&
            staticCampaign.bill.number === fbCampaign.bill.number
          );
          if (!exists) {
            allCampaigns.push(fbCampaign);
          }
        });
        
        setCampaigns(allCampaigns);
      } catch (error) {
        console.error('Error fetching campaigns:', error);
        // Fallback to static campaigns if Firebase fetch fails
        setCampaigns(campaignsService.getAllCampaigns().filter(c => c.isActive));
      }
    };
    
    fetchAllCampaigns();
  }, []);
  
  function convertTitleToSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }
  
  return (
    <div className="bg-secondary/30 flex-1">
      <div className="container mx-auto px-4 py-6 md:py-12">
        {/* Mobile Menu Button */}
        <div className="lg:hidden mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex items-center gap-2"
          >
            <Menu className="h-4 w-4" />
            Issues
          </Button>
        </div>

        {/* Mobile Categories Dropdown */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mb-6">
            <Card>
              <CardContent className="p-0">
                <nav className="space-y-1">
                  {SITE_ISSUE_CATEGORIES.map((category) => (
                    <Link
                      key={category}
                      href={`/issues/${convertTitleToSlug(category)}`}
                      className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-muted transition-colors group"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <span className="text-muted-foreground group-hover:text-foreground">
                        {category}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                    </Link>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="flex flex-col lg:flex-row lg:justify-center">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 w-full max-w-6xl">
            {/* Desktop Left Navigation Panel */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Issues</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <nav className="space-y-1">
                      {SITE_ISSUE_CATEGORIES.map((category) => (
                        <Link
                          key={category}
                          href={`/issues/${convertTitleToSlug(category)}`}
                          className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-muted transition-colors group"
                        >
                          <span className="text-muted-foreground group-hover:text-foreground">
                            {category}
                          </span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                        </Link>
                      ))}
                    </nav>
                  </CardContent>
                </Card>
              </div>
            </aside>

            {/* Main Content - Campaigns */}
            <div className="w-full lg:max-w-[672px] lg:flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-center mb-6 md:mb-8">Current Campaigns</h1>
              <div className="space-y-4 md:space-y-6">
                {campaigns.map((campaign) => {
                  const isSupport = campaign.position === 'Support';
                  const badgeVariant = isSupport ? 'default' : 'destructive';
                  const PositionIcon = isSupport ? ThumbsUp : ThumbsDown;
                  const billTypeSlug = getBillTypeSlug(campaign.bill.type);
                  
                  return (
                    <Card key={campaign.id} className="shadow-md hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-4">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-primary mb-1">
                              {campaign.bill.type.toUpperCase()} {campaign.bill.number} • {campaign.bill.congress}th Congress
                            </p>
                            <CardTitle className="text-base sm:text-lg font-bold mb-2 leading-tight">
                              <Link 
                                href={`/bill/${campaign.bill.congress}/${billTypeSlug}/${campaign.bill.number}`} 
                                className="hover:underline break-words"
                              >
                                {campaign.bill.title || `Legislation ${campaign.bill.type.toUpperCase()} ${campaign.bill.number}`}
                              </Link>
                            </CardTitle>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              {campaign.groupName}
                            </p>
                          </div>
                          <Badge variant={badgeVariant} className="flex items-center gap-2 text-sm px-2 py-1 sm:text-base sm:px-3 sm:py-1.5 shrink-0">
                            <PositionIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span>{campaign.position}</span>
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div 
                          className="text-muted-foreground mb-4 text-sm leading-relaxed [&>h3]:hidden [&>ul]:list-disc [&>ul]:pl-5 [&>li]:leading-relaxed" 
                          dangerouslySetInnerHTML={{ 
                            __html: campaign.reasoning.replace(/<h3>.*?<\/h3>/gi, '').substring(0, 200) + '...' 
                          }} 
                        />
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t gap-3">
                          <div className="flex gap-4 justify-center sm:justify-start">
                            <div className="flex items-center gap-1 text-sm text-green-600">
                              <ThumbsUp className="h-4 w-4" />
                              <span className="font-semibold">{campaign.supportCount.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-red-600">
                              <ThumbsDown className="h-4 w-4" />
                              <span className="font-semibold">{campaign.opposeCount.toLocaleString()}</span>
                            </div>
                          </div>
                          <Button size="sm" asChild className="w-full sm:w-auto">
                            <Link href={`/campaigns/groups/${campaign.groupSlug}/${campaign.bill.type.toLowerCase()}-${campaign.bill.number}`}>
                              View Campaign
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}