'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Megaphone } from 'lucide-react';
import Link from 'next/link';

interface Campaign {
  id: string;
  groupSlug: string;
  groupName: string;
  campaignType?: 'Legislation' | 'Issue' | 'Candidate' | 'Poll' | 'Voter Poll';
  bill?: {
    congress: number;
    type: string;
    number: string;
    title?: string;
  };
  candidate?: {
    candidate1Name: string;
    candidate1Bio?: string;
    candidate2Name: string;
    candidate2Bio?: string;
    selectedCandidate: 1 | 2;
  };
  poll?: {
    title: string;
    question: string;
    answerType: 'multiple-choice-single' | 'multiple-choice-multiple' | 'open-text';
    choices?: string[];
    description?: string;
    imageUrl?: string;
  };
  position: 'Support' | 'Oppose' | string;
  reasoning: string;
  actionButtonText: string;
  supportCount: number;
  opposeCount: number;
  responseCount?: number;
  results?: { [choice: string]: number };
}

interface MemberCampaignsSectionProps {
  bioguideId: string;
  memberName: string;
  congress: string;
}

export function MemberCampaignsSection({ bioguideId, memberName, congress }: MemberCampaignsSectionProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const { getFirestore, collection, query, where, getDocs } = await import('firebase/firestore');
        const { app } = await import('@/lib/firebase');

        const db = getFirestore(app);
        // Simple query - we'll filter and sort in memory
        const campaignsQuery = query(
          collection(db, 'campaigns'),
          where('bioguideId', '==', bioguideId)
        );

        const querySnapshot = await getDocs(campaignsQuery);
        const campaignsData = querySnapshot.docs
          .map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              groupSlug: data.groupSlug,
              groupName: data.groupName,
              campaignType: data.campaignType,
              bill: data.bill,
              candidate: data.candidate,
              poll: data.poll,
              position: data.position,
              reasoning: data.reasoning,
              actionButtonText: data.actionButtonText || 'Voice your opinion',
              supportCount: data.supportCount || 0,
              opposeCount: data.opposeCount || 0,
              responseCount: data.responseCount,
              results: data.results,
              isActive: data.isActive,
              createdAt: data.createdAt
            };
          })
          // Filter for active campaigns only
          .filter(campaign => campaign.isActive !== false)
          // Sort by creation date (newest first)
          .sort((a, b) => {
            const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
            const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
            return bTime - aTime;
          });

        setCampaigns(campaignsData as Campaign[]);
      } catch (error) {
        console.error('Error fetching member campaigns:', error);
        setCampaigns([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, [bioguideId]);

  if (loading) {
    return (
      <div id="campaigns" className="scroll-mt-20">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              Campaigns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Loading campaigns...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div id="campaigns" className="scroll-mt-20">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              Campaigns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              No active campaigns targeting this member yet.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div id="campaigns" className="scroll-mt-20">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Campaigns ({campaigns.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {campaigns.map((campaign) => (
              <Card key={campaign.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">
                          {campaign.campaignType === 'Poll' || campaign.campaignType === 'Voter Poll'
                            ? campaign.poll?.title
                            : campaign.campaignType === 'Candidate'
                            ? `${campaign.candidate?.candidate1Name} vs ${campaign.candidate?.candidate2Name}`
                            : campaign.campaignType === 'Issue'
                            ? campaign.bill?.title
                            : campaign.bill?.title || `${campaign.bill?.type} ${campaign.bill?.number}`
                          }
                        </h3>
                        {campaign.bill && campaign.campaignType === 'Legislation' && (
                          <p className="text-sm text-muted-foreground">
                            {campaign.bill.type} {campaign.bill.number}
                          </p>
                        )}
                      </div>
                      <Badge variant={campaign.position === 'Support' ? 'default' : 'destructive'}>
                        {campaign.position}
                      </Badge>
                    </div>

                    {/* Organization attribution */}
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {campaign.groupName}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {campaign.reasoning}
                  </div>

                  {/* Engagement metrics */}
                  <div className="flex items-center gap-4 text-sm">
                    {(campaign.campaignType === 'Poll' || campaign.campaignType === 'Voter Poll') ? (
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-blue-600">{campaign.responseCount || 0}</span>
                        <span className="text-muted-foreground">responses</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-green-600">{campaign.supportCount.toLocaleString()}</span>
                          <span className="text-muted-foreground">support</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-red-600">{campaign.opposeCount.toLocaleString()}</span>
                          <span className="text-muted-foreground">oppose</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Action button */}
                  <Button asChild className="w-full">
                    <Link
                      href={
                        campaign.campaignType === 'Poll' || campaign.campaignType === 'Voter Poll'
                          ? `/advocacy-message?pollId=${campaign.id}`
                          : campaign.campaignType === 'Candidate'
                          ? `/advocacy-message?candidate1=${encodeURIComponent(campaign.candidate?.candidate1Name || '')}&candidate2=${encodeURIComponent(campaign.candidate?.candidate2Name || '')}`
                          : `/advocacy-message?congress=${congress}&type=${campaign.bill?.type.toLowerCase()}&number=${campaign.bill?.number}`
                      }
                    >
                      {campaign.actionButtonText}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
