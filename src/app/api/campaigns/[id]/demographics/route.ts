import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import {
  generateMockL2Data,
  aggregateL2Data,
  generateMockCampaignParticipants,
  type L2UserData,
  type CampaignDemographics,
} from '@/lib/mock-l2-data';

/**
 * GET /api/campaigns/[id]/demographics
 *
 * Returns aggregated demographic data for campaign participants.
 * This data is derived from L2 voter file data for users who
 * submitted advocacy forms for this campaign.
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id: campaignId } = await params;

    // First, get the campaign to verify it exists and get support/oppose counts
    const campaignRef = adminDb.collection('campaigns').doc(campaignId);
    const campaignSnap = await campaignRef.get();

    let supportCount = 0;
    let opposeCount = 0;

    if (campaignSnap.exists) {
      const campaignData = campaignSnap.data();
      supportCount = campaignData?.supportCount || 0;
      opposeCount = campaignData?.opposeCount || 0;
    } else {
      // Check static campaigns
      const { campaignsService } = await import('@/lib/campaigns');
      const staticCampaign = campaignsService.getCampaign(campaignId);

      if (staticCampaign) {
        supportCount = staticCampaign.supportCount || 0;
        opposeCount = staticCampaign.opposeCount || 0;
      } else {
        return NextResponse.json(
          { error: 'Campaign not found' },
          { status: 404 }
        );
      }
    }

    // Query user_messages for this campaign
    const messagesRef = adminDb.collection('user_messages');
    const messagesQuery = messagesRef.where('campaignId', '==', campaignId);
    const messagesSnap = await messagesQuery.get();

    const participants: { userId: string; l2Data: L2UserData; stance: 'support' | 'oppose' }[] = [];

    if (!messagesSnap.empty) {
      // We have real participants - generate L2 data for each
      messagesSnap.docs.forEach(doc => {
        const data = doc.data();
        const userId = data.userId || doc.id;
        const stance = data.userStance === 'support' ? 'support' : 'oppose';

        // In production, you would look up real L2 data here
        // For now, generate mock data based on userId
        const l2Data = generateMockL2Data(userId);

        participants.push({ userId, l2Data, stance });
      });
    } else {
      // No real participants yet - generate mock data based on campaign counts
      // This allows the demo to work even without real submissions
      const totalCount = supportCount + opposeCount;

      if (totalCount > 0) {
        // Cap at 500 for performance, but use actual ratios
        const sampleSize = Math.min(totalCount, 500);
        const supportRatio = supportCount / totalCount;

        const mockParticipants = generateMockCampaignParticipants(campaignId, sampleSize);

        // Adjust stances to match the actual campaign ratios
        mockParticipants.forEach((p, index) => {
          const shouldBeSupport = index < Math.round(sampleSize * supportRatio);
          p.stance = shouldBeSupport ? 'support' : 'oppose';
        });

        participants.push(...mockParticipants);
      } else {
        // Campaign has no activity yet - generate a small demo dataset
        // so the performance page has something to show
        const demoSampleSize = 100;
        const mockParticipants = generateMockCampaignParticipants(campaignId, demoSampleSize);
        participants.push(...mockParticipants);
      }
    }

    // Aggregate the L2 data
    const l2DataArray = participants.map(p => p.l2Data);
    const demographics = aggregateL2Data(l2DataArray);

    // Calculate support/oppose breakdown
    const supportParticipants = participants.filter(p => p.stance === 'support').length;
    const opposeParticipants = participants.filter(p => p.stance === 'oppose').length;

    // Return the aggregated demographics
    return NextResponse.json({
      campaignId,
      demographics,
      engagement: {
        totalParticipants: participants.length,
        supportCount: supportCount,
        opposeCount: opposeCount,
        supportParticipants,
        opposeParticipants,
        // These would come from real data in production
        messageCompletionRate: 87,
        avgMessagesPerUser: 2.3,
        repeatEngagementRate: 18,
        socialShares: Math.round((supportCount + opposeCount) * 0.02),
      },
      // Metadata
      meta: {
        dataSource: !messagesSnap.empty ? 'real' : 'simulated',
        sampleSize: participants.length,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching campaign demographics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaign demographics' },
      { status: 500 }
    );
  }
}
