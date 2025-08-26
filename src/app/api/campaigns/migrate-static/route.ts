import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { getAdvocacyGroupData } from '@/lib/advocacy-groups';

// This endpoint migrates static campaigns from advocacy-groups.ts to Firestore
// Run this once to populate the database with existing campaigns
export async function POST(request: NextRequest) {
  try {
    const { userId, groupSlugs } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const db = getFirestore(app);
    const migratedCampaigns = [];

    // Default to all groups if none specified
    const slugsToProcess = groupSlugs || [
      'league-of-women-voters',
      'brennan-center-for-justice', 
      'common-cause',
      'fair-elections-center',
      'fairvote',
      'voteriders',
      'rock-the-vote',
      'mi-familia-vota',
      'black-voters-matter',
      'when-we-all-vote'
    ];

    for (const groupSlug of slugsToProcess) {
      const groupData = getAdvocacyGroupData(groupSlug);
      
      if (groupData && groupData.priorityBills) {
        for (const priorityBill of groupData.priorityBills) {
          // Check if campaign already exists
          const existingQuery = query(
            collection(db, 'campaigns'),
            where('userId', '==', userId),
            where('groupSlug', '==', groupSlug),
            where('billType', '==', priorityBill.bill.type),
            where('billNumber', '==', priorityBill.bill.number)
          );
          
          const existingSnap = await getDocs(existingQuery);
          
          if (existingSnap.empty) {
            // Create new campaign
            const campaignData = {
              userId,
              groupSlug,
              groupName: groupData.name,
              billType: priorityBill.bill.type,
              billNumber: priorityBill.bill.number,
              billTitle: priorityBill.bill.title || '',
              congress: priorityBill.bill.congress || 119,
              position: priorityBill.position,
              reasoning: priorityBill.reasoning,
              actionButtonText: priorityBill.actionButtonText,
              supportCount: priorityBill.supportCount,
              opposeCount: priorityBill.opposeCount,
              createdAt: new Date(),
              updatedAt: new Date()
            };
            
            const docRef = await addDoc(collection(db, 'campaigns'), campaignData);
            migratedCampaigns.push({
              id: docRef.id,
              ...campaignData
            });
          }
        }
      }
    }

    return NextResponse.json({
      message: `Migrated ${migratedCampaigns.length} campaigns`,
      campaigns: migratedCampaigns
    });

  } catch (error) {
    console.error('Error migrating campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to migrate campaigns' },
      { status: 500 }
    );
  }
}