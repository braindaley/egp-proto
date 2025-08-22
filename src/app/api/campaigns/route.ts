import { NextResponse } from 'next/server';
import { getFirestore, collection, query, where, getDocs, orderBy, addDoc, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase';

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
      stance
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
      name: name || `${bill?.title || billTitle || 'Campaign'}`,
      billNumber: billNumber || bill?.number,
      billType: billType || bill?.type,
      congress: congress || bill?.congress || '119',
      billTitle: billTitle || bill?.title || '',
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

    // Validate required fields
    if (!campaignData.billNumber || !campaignData.billType) {
      return NextResponse.json(
        { error: 'Missing required bill information' },
        { status: 400 }
      );
    }

    const db = getFirestore(app);

    // Check if campaign already exists for this user and bill
    const existingQuery = query(
      collection(db, 'campaigns'),
      where('userId', '==', effectiveUserId),
      where('billType', '==', campaignData.billType),
      where('billNumber', '==', campaignData.billNumber)
    );

    const existingSnapshot = await getDocs(existingQuery);
    if (!existingSnapshot.empty) {
      return NextResponse.json(
        { error: 'Campaign already exists for this bill' },
        { status: 409 }
      );
    }

    // Create the campaign in Firestore
    const docRef = await addDoc(collection(db, 'campaigns'), campaignData);
    
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