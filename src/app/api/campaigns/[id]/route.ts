import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    
    // First check Firebase
    const docRef = adminDb.collection('campaigns').doc(id);
    const docSnap = await docRef.get();
    
    if (docSnap.exists) {
      const data = docSnap.data() as any;
      const campaign = {
        id: docSnap.id,
        ...data,
        // Normalize bill shape expected by clients
        bill: data.bill || ((data.billType || data.billNumber || data.billTitle || data.congress) ? {
          type: data.billType,
          number: data.billNumber,
          title: data.billTitle || data.issueSpecificTitle,
          congress: data.congress,
        } : undefined),
        campaignType: data.campaignType || 'Legislation',
        issueTitle: data.issueTitle,
        isStatic: false,
      };
      return NextResponse.json({ campaign });
    }

    // If not found in Firebase, check static campaigns service
    const { campaignsService } = await import('@/lib/campaigns');
    const staticCampaign = campaignsService.getCampaign(id);
    
    if (staticCampaign) {
      // Convert static campaign to the format expected by the edit page
      const campaign = {
        id: staticCampaign.id,
        groupSlug: staticCampaign.groupSlug,
        bill: staticCampaign.bill,
        position: staticCampaign.position,
        reasoning: staticCampaign.reasoning,
        actionButtonText: staticCampaign.actionButtonText,
        supportCount: staticCampaign.supportCount,
        opposeCount: staticCampaign.opposeCount,
        isStatic: true
      };
      return NextResponse.json({ campaign });
    }

    return NextResponse.json(
      { error: 'Campaign not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error fetching campaign:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaign' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const docRef = adminDb.collection('campaigns').doc(id);
    
    // Check if campaign exists
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }
    
    // Update the campaign
    const updateData = {
      ...body,
      updatedAt: new Date()
    };
    
    await docRef.update(updateData);
    
    const updatedCampaign = {
      id: id,
      ...docSnap.data(),
      ...updateData
    };

    return NextResponse.json({ campaign: updatedCampaign });
  } catch (error) {
    console.error('Error updating campaign:', error);
    return NextResponse.json(
      { error: 'Failed to update campaign' },
      { status: 500 }
    );
  }
}

// DELETE endpoint for campaign deletion
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const docRef = adminDb.collection('campaigns').doc(id);
    
    // Check if campaign exists
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }
    
    // Delete the campaign
    await docRef.delete();

    return NextResponse.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return NextResponse.json(
      { error: 'Failed to delete campaign' },
      { status: 500 }
    );
  }
}
