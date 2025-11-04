'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Megaphone, ThumbsUp, ThumbsDown, Eye, ArrowRight } from 'lucide-react';
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
            console.log('Campaign data from Firestore:', { id: doc.id, data }); // Debug log
            return {
              id: doc.id,
              groupSlug: data.groupSlug || '',
              groupName: data.groupName || '',
              campaignType: data.campaignType,
              bill: data.bill,
              candidate: data.candidate,
              poll: data.poll,
              position: data.position || 'Support',
              reasoning: data.reasoning || '',
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

        console.log('Processed campaigns:', campaignsData); // Debug log
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
            {campaigns.map((campaign) => {
              // Check if this is a poll campaign
              if (campaign.campaignType === 'Poll' || campaign.campaignType === 'Voter Poll') {
                return (
                  <Card key={campaign.id} className="w-full">
                    <CardContent className="p-6">
                      {/* Header with Badge and Organization */}
                      <div className="flex items-center gap-2 mb-4">
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-200">
                          Poll
                        </Badge>
                        {campaign.groupName && (
                          <span className="text-sm text-muted-foreground">{campaign.groupName}</span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="text-2xl font-bold mb-2">{campaign.poll?.title}</h3>

                      {/* Question */}
                      <h4 className="text-lg text-muted-foreground mb-4">{campaign.poll?.question}</h4>

                      {/* Description */}
                      {campaign.poll?.description && (
                        <p className="text-sm text-muted-foreground mb-4">
                          {campaign.poll.description}
                        </p>
                      )}

                      {/* Options */}
                      {campaign.poll?.choices && campaign.poll.choices.length > 0 && (
                        <div className="mb-6">
                          <h5 className="font-semibold mb-2">Options</h5>
                          <ul className="list-disc list-inside space-y-1">
                            {campaign.poll.choices.map((choice, index) => (
                              <li key={index} className="text-sm text-muted-foreground">{choice}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Action Button */}
                      <Button asChild size="lg" className="w-full">
                        <Link href={`/advocacy-message?poll=${campaign.id}`}>
                          {campaign.actionButtonText || 'Voice your opinion'}
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              }

              // Regular campaign (Legislation, Issue, Candidate)
              // Determine badge variant and icon
              const badgeVariant = campaign.position === 'Support' ? 'default' : 'destructive';
              const PositionIcon = campaign.position === 'Support' ? ThumbsUp : ThumbsDown;

              // Determine advocacy URL
              const advocacyUrl = campaign.campaignType === 'Candidate'
                ? `/advocacy-message?candidate1=${encodeURIComponent(campaign.candidate?.candidate1Name || '')}&candidate2=${encodeURIComponent(campaign.candidate?.candidate2Name || '')}`
                : `/advocacy-message?congress=${congress}&type=${campaign.bill?.type.toLowerCase()}&number=${campaign.bill?.number}`;

              // Get bill display
              const billNumber = campaign.campaignType === 'Legislation' && campaign.bill
                ? `${campaign.bill.type} ${campaign.bill.number}`
                : campaign.campaignType === 'Candidate'
                ? 'Candidate'
                : 'Issue';

              const billTitle = campaign.campaignType === 'Candidate'
                ? `${campaign.candidate?.candidate1Name} vs ${campaign.candidate?.candidate2Name}`
                : campaign.bill?.title || 'Campaign';

              return (
                <Card key={campaign.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    {/* Organization name - only show if it exists */}
                    {campaign.groupName && (
                      <div className="mb-3">
                        <div className="text-sm text-muted-foreground font-semibold">{campaign.groupName}</div>
                      </div>
                    )}

                    {/* Position badge with icon */}
                    <div className="mb-4">
                      <Badge variant={badgeVariant} className="flex items-center gap-1 text-sm px-3 py-1 w-fit">
                        <PositionIcon className="h-4 w-4" />
                        <span>{campaign.position}</span>
                      </Badge>
                    </div>

                    {/* Bill number and title */}
                    <h3 className="text-xl font-bold mb-4 leading-tight">
                      {billNumber}: {billTitle}
                    </h3>

                    {/* Description/Reasoning */}
                    {campaign.reasoning && (
                      <p className="text-muted-foreground text-sm mb-6 leading-relaxed line-clamp-3">
                        {campaign.reasoning}
                      </p>
                    )}

                    {/* Action button and eye icon */}
                    <div className="flex items-center justify-between">
                      <Button size="default" variant="outline" asChild>
                        <Link href={advocacyUrl}>
                          {campaign.actionButtonText || `${campaign.position} ${billNumber}`}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                      <Eye className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
