import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: Request) {
  // For now, return a simplified response until Firebase auth is properly configured
  // The dashboard will handle campaign fetching client-side
  return NextResponse.json({ 
    campaigns: [],
    message: 'Use client-side fetching for now'
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      userId,
      groupSlug,
      groupName,
      bill,
      position,
      reasoning,
      actionButtonText = 'Voice your opinion',
      name,
      billTitle,
      billType,
      billNumber,
      congress,
      stance,
      campaignType,
      issueTitle
    } = body;

    // Get userId if not provided
    const effectiveUserId = userId;
    
    if (!effectiveUserId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Handle both old format (from campaigns service) and new format (from dashboard)
    const campaignData: any = {
      userId: effectiveUserId,
      groupSlug: groupSlug || '',
      groupName: groupName || '',
      campaignType: campaignType || 'Legislation',
      name: name || `${bill?.title || billTitle || issueTitle || 'Campaign'}`,
      billNumber: billNumber || bill?.number,
      billType: billType || bill?.type,
      congress: congress || bill?.congress || '119',
      billTitle: billTitle || bill?.title || issueTitle || '',
      issueTitle: issueTitle || null,
      stance: stance || position?.toLowerCase() || 'support',
      position: position || (stance === 'support' ? 'Support' : 'Oppose'),
      reasoning: reasoning || '',
      actionButtonText: actionButtonText || 'Voice your opinion',
      supportCount: 0,
      opposeCount: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Validate required fields based on campaign type
    if (campaignData.campaignType === 'Issue') {
      if (!campaignData.issueTitle) {
        return NextResponse.json(
          { error: 'Missing required issue information' },
          { status: 400 }
        );
      }
    } else {
      if (!campaignData.billNumber || !campaignData.billType) {
        return NextResponse.json(
          { error: 'Missing required bill information' },
          { status: 400 }
        );
      }
    }

    // Check if campaign already exists for this GROUP and bill/issue
    // (allowing different groups to campaign for the same bill/issue)
    if (campaignData.groupSlug) {
      let query = adminDb
        .collection('campaigns')
        .where('groupSlug', '==', campaignData.groupSlug);

      if (campaignData.campaignType === 'Issue') {
        query = query
          .where('campaignType', '==', 'Issue')
          .where('issueTitle', '==', campaignData.issueTitle);
      } else {
        query = query
          .where('billType', '==', campaignData.billType)
          .where('billNumber', '==', campaignData.billNumber);
      }

      const existingSnapshot = await query.get();

      if (!existingSnapshot.empty) {
        const itemType = campaignData.campaignType === 'Issue' ? 'issue' : 'bill';
        return NextResponse.json(
          { error: `This organization already has a campaign for this ${itemType}` },
          { status: 409 }
        );
      }
    }

    // Create the campaign in Firestore
    const docRef = await adminDb.collection('campaigns').add(campaignData);
    
    const campaign = {
      id: docRef.id,
      ...campaignData
    };

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    );
  }
}