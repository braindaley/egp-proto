import { NextResponse } from 'next/server';
import { campaignsService } from '@/lib/campaigns';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const groupSlug = searchParams.get('group');

  try {
    if (groupSlug) {
      const campaigns = campaignsService.getCampaignsByGroup(groupSlug);
      return NextResponse.json({ campaigns });
    } else {
      const campaigns = campaignsService.getAllCampaigns();
      return NextResponse.json({ campaigns });
    }
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      groupSlug,
      groupName,
      bill,
      position,
      reasoning,
      actionButtonText = 'Voice your opinion'
    } = body;

    // Validate required fields
    if (!groupSlug || !groupName || !bill || !position || !reasoning) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if campaign already exists for this group and bill
    const existingCampaign = campaignsService.getCampaignByGroupAndBill(
      groupSlug, 
      bill.type, 
      bill.number
    );

    if (existingCampaign) {
      return NextResponse.json(
        { error: 'Campaign already exists for this bill and group' },
        { status: 409 }
      );
    }

    // Create the campaign
    const campaign = campaignsService.createCampaign({
      groupSlug,
      groupName,
      bill,
      position,
      reasoning,
      actionButtonText,
      supportCount: 0,
      opposeCount: 0,
      isActive: true
    });

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    );
  }
}