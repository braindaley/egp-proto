'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { campaignsService, type Campaign } from '@/lib/campaigns';
import { SITE_ISSUE_CATEGORIES } from '@/lib/policy-area-mapping';
import { ThumbsUp, ThumbsDown, ArrowRight, ChevronRight, Menu, Eye } from 'lucide-react';
import { getBillTypeSlug } from '@/lib/utils';
import { parseSimpleMarkdown } from '@/lib/markdown-utils';
import { useState, useEffect } from 'react';

export default function Home() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(campaignsService.getAllCampaigns().filter(c => c.isActive));
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Load campaigns from Firebase to match admin dashboard
  useEffect(() => {
    const fetchFirebaseCampaigns = async () => {
      try {
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
              congress: 119,
              type: data.billType,
              number: data.billNumber,
              title: data.billTitle
            },
            position: data.stance === 'support' ? 'Support' : data.stance === 'oppose' ? 'Oppose' : data.position,
            reasoning: data.reasoning,
            actionButtonText: 'Voice your opinion',
            supportCount: data.supportCount || 0,
            opposeCount: data.opposeCount || 0,
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt || new Date().toISOString(),
            isActive: true
          };
        });
        
        console.log('*** DEBUG: Loaded Firebase campaigns:', firebaseCampaigns.map(c => `${c.groupName} - ${c.bill.type} ${c.bill.number}`));
        setCampaigns(firebaseCampaigns);
        
      } catch (error) {
        console.error('Error fetching Firebase campaigns:', error);
        // Fallback to static campaigns if Firebase fails
        setCampaigns(campaignsService.getAllCampaigns().filter(c => c.isActive));
      }
    };
    
    fetchFirebaseCampaigns();
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
        <div className="flex justify-center">
          <div className="w-full max-w-2xl">
            {/* Main Content - Campaigns */}
            <div className="w-full">
              <h1 className="text-2xl md:text-3xl font-bold text-center mb-6 md:mb-8">Current Campaigns</h1>
              
              {/* Issues Filter Dropdown */}
              <div className="mb-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="flex items-center gap-2 w-full"
                >
                  <Menu className="h-4 w-4" />
                  Browse by issue
                </Button>
              </div>

              {/* Categories Dropdown */}
              {isMobileMenuOpen && (
                <div className="mb-6">
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
              <div className="space-y-4 md:space-y-6">
                {campaigns.map((campaign) => {
                  const isSupport = campaign.position === 'Support';
                  const badgeVariant = isSupport ? 'default' : 'destructive';
                  const PositionIcon = isSupport ? ThumbsUp : ThumbsDown;
                  const billTypeSlug = getBillTypeSlug(campaign.bill.type);
                  
                  return (
                    <Card key={campaign.id} className="shadow-md hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-4">
                        <div className="flex flex-col gap-3">
                          {/* 1. Group Name's Opinion with Badge */}
                          <div className="flex justify-between items-center">
                            <p className="text-sm font-medium text-muted-foreground">
                              {campaign.groupName} urges you to {campaign.position.toLowerCase()} {campaign.bill.type.toUpperCase()} {campaign.bill.number}
                            </p>
                            <Badge variant={badgeVariant} className="flex items-center gap-2 text-sm px-2 py-1 shrink-0">
                              <PositionIcon className="h-3 w-3" />
                              <span>{campaign.position}</span>
                            </Badge>
                          </div>
                          
                          {/* 3. H2: Bill Short Title */}
                          <CardTitle className="text-lg sm:text-xl font-bold leading-tight">
                            <Link 
                              href={`/bill/${campaign.bill.congress}/${billTypeSlug}/${campaign.bill.number}`} 
                              className="hover:underline break-words"
                            >
                              {campaign.bill.title || `Legislation ${campaign.bill.type.toUpperCase()} ${campaign.bill.number}`}
                            </Link>
                          </CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {/* 4. Formatted Markdown Reasoning (3 rows max) */}
                        <div 
                          className="text-muted-foreground mb-4 text-sm leading-relaxed overflow-hidden line-clamp-3 [&>h3]:hidden [&>ul]:list-disc [&>ul]:pl-5 [&>li]:leading-relaxed" 
                          style={{ 
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                          dangerouslySetInnerHTML={{ 
                            __html: parseSimpleMarkdown(campaign.reasoning, { hideHeaders: true })
                          }} 
                        />
                        
                        {/* 5. Bottom Section with Buttons */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t gap-3">
                          <div className="flex gap-2 flex-wrap justify-center sm:justify-start">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="flex items-center gap-2 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                            >
                              <ThumbsUp className="h-4 w-4" />
                              <span className="font-semibold">{campaign.supportCount.toLocaleString()}</span>
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            >
                              <ThumbsDown className="h-4 w-4" />
                              <span className="font-semibold">{campaign.opposeCount.toLocaleString()}</span>
                            </Button>
                            <Button 
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-2 text-muted-foreground"
                            >
                              <Eye className="h-4 w-4" />
                              Watch
                            </Button>
                          </div>
                          <Button size="sm" asChild className="w-full sm:w-auto">
                            <Link href={`/campaigns/${campaign.groupSlug}/${campaign.bill.type.toLowerCase()}-${campaign.bill.number}`}>
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