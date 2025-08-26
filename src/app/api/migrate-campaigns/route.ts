import { NextResponse } from 'next/server';
import { getFirestore, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { getAdvocacyGroupData } from '@/lib/advocacy-groups';

// Define all advocacy group slugs that have campaigns
const advocacyGroupSlugs = [
  'league-of-women-voters',
  'brennan-center-for-justice', 
  'common-cause',
  'fair-elections-center',
  'fairvote',
  'vote-smart',
  'voteriders',
  'rock-the-vote',
  'mi-familia-vota',
  'black-voters-matter',
  'when-we-all-vote',
  'fair-fight-action',
  'campaign-legal-center',
  'ballotready',
  'democracy-works-turbovote',
  'headcount',
  'state-voices',
  'asian-americans-advancing-justice',
  'naacp-legal-defense-fund',
  'voto-latino',
  'alliance-for-youth-action',
  'national-vote-at-home-institute',
  'national-voter-registration-day',
  'democracy-nc',
  'the-civics-center',
  'no-labels'
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, createAsTemplate = false, migrateAllAsTemplates = false } = body;

    if (!userId && !createAsTemplate && !migrateAllAsTemplates) {
      return NextResponse.json(
        { error: 'userId is required unless creating as template or migrating all as templates' },
        { status: 400 }
      );
    }

    const db = getFirestore(app);
    const migratedCampaigns = [];
    const errors = [];

    for (const groupSlug of advocacyGroupSlugs) {
      try {
        const groupData = getAdvocacyGroupData(groupSlug);
        
        if (!groupData || !groupData.priorityBills) {
          continue;
        }

        for (const priorityBill of groupData.priorityBills) {
          try {
            // Check if campaign already exists for this user and bill (if migrating for specific user)
            if (userId) {
              const existingQuery = query(
                collection(db, 'campaigns'),
                where('userId', '==', userId),
                where('billType', '==', priorityBill.bill.type),
                where('billNumber', '==', priorityBill.bill.number)
              );
              
              const existingSnapshot = await getDocs(existingQuery);
              if (!existingSnapshot.empty) {
                console.log(`Campaign already exists for ${priorityBill.bill.type} ${priorityBill.bill.number}`);
                continue;
              }
            }

            // Get bill title from API if possible
            let billTitle = '';
            try {
              const billResponse = await fetch(`/api/bill?congress=${priorityBill.bill.congress}&billType=${priorityBill.bill.type}&billNumber=${priorityBill.bill.number}`);
              if (billResponse.ok) {
                const billData = await billResponse.json();
                billTitle = billData.title || '';
              }
            } catch (billError) {
              console.warn(`Could not fetch bill title for ${priorityBill.bill.type} ${priorityBill.bill.number}:`, billError);
            }

            const campaignData = {
              userId: userId || 'template', // Use 'template' for template campaigns
              groupSlug: groupData.slug,
              groupName: groupData.name,
              name: `${groupData.name} - ${priorityBill.bill.type} ${priorityBill.bill.number}`,
              billNumber: priorityBill.bill.number,
              billType: priorityBill.bill.type,
              congress: priorityBill.bill.congress?.toString() || '119',
              billTitle: billTitle,
              stance: priorityBill.position.toLowerCase(),
              position: priorityBill.position,
              reasoning: priorityBill.reasoning || '',
              actionButtonText: priorityBill.actionButtonText || 'Voice your opinion',
              supportCount: priorityBill.supportCount || 0,
              opposeCount: priorityBill.opposeCount || 0,
              isActive: true,
              isTemplate: createAsTemplate || migrateAllAsTemplates, // Mark as template if creating templates
              createdAt: new Date(),
              updatedAt: new Date(),
              migratedFrom: 'advocacy-groups', // Track migration source
              url: `/groups/${groupData.slug}/${priorityBill.bill.type.toLowerCase()}-${priorityBill.bill.number}` // Add URL for easy access
            };

            const docRef = await addDoc(collection(db, 'campaigns'), campaignData);
            
            migratedCampaigns.push({
              id: docRef.id,
              groupSlug: groupData.slug,
              billType: priorityBill.bill.type,
              billNumber: priorityBill.bill.number,
              position: priorityBill.position
            });

          } catch (billError) {
            console.error(`Error migrating bill ${priorityBill.bill.type} ${priorityBill.bill.number} for ${groupSlug}:`, billError);
            errors.push(`${groupSlug}: ${priorityBill.bill.type} ${priorityBill.bill.number} - ${billError.message}`);
          }
        }
      } catch (groupError) {
        console.error(`Error processing group ${groupSlug}:`, groupError);
        errors.push(`${groupSlug}: ${groupError.message}`);
      }
    }

    return NextResponse.json({ 
      success: true,
      migratedCount: migratedCampaigns.length,
      migratedCampaigns,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully migrated ${migratedCampaigns.length} campaigns${createAsTemplate || migrateAllAsTemplates ? ' as templates' : ` for user ${userId}`}`
    });

  } catch (error) {
    console.error('Error during migration:', error);
    return NextResponse.json(
      { error: 'Migration failed', details: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint to preview what would be migrated
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const preview = searchParams.get('preview') === 'true';

    if (!preview) {
      return NextResponse.json({ error: 'Use ?preview=true to see migration preview' });
    }

    const campaignsToMigrate = [];

    for (const groupSlug of advocacyGroupSlugs) {
      const groupData = getAdvocacyGroupData(groupSlug);
      
      if (!groupData || !groupData.priorityBills) {
        continue;
      }

      for (const priorityBill of groupData.priorityBills) {
        campaignsToMigrate.push({
          groupSlug: groupData.slug,
          groupName: groupData.name,
          billType: priorityBill.bill.type,
          billNumber: priorityBill.bill.number,
          congress: priorityBill.bill.congress,
          position: priorityBill.position,
          hasReasoning: !!priorityBill.reasoning,
          supportCount: priorityBill.supportCount,
          opposeCount: priorityBill.opposeCount
        });
      }
    }

    return NextResponse.json({
      totalCampaigns: campaignsToMigrate.length,
      campaigns: campaignsToMigrate,
      message: `Found ${campaignsToMigrate.length} campaigns ready for migration`
    });

  } catch (error) {
    console.error('Error during migration preview:', error);
    return NextResponse.json(
      { error: 'Preview failed', details: error.message },
      { status: 500 }
    );
  }
}