import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { mapApiSubjectToAllowed } from '@/lib/subjects';

interface CongressBill {
  congress: number;
  number: string;
  type: string;
  title: string;
  url: string;
  updateDate: string;
  originChamber: string;
  originChamberCode: string;
  latestAction?: {
    actionDate: string;
    text: string;
  };
  subjects?: {
    url?: string;
    count?: number;
    legislativeSubjects?: Array<{
      name: string;
    }>;
    policyArea?: {
      name: string;
    };
  };
}

interface CachedBill {
  id: string;
  congress: number;
  number: string;
  type: string;
  title: string;
  url: string;
  updateDate: string;
  originChamber: string;
  originChamberCode: string;
  latestAction: {
    actionDate: string;
    text: string;
  };
  subjects: string[];
  apiSubjects: string[];
  lastCached: string;
}

export async function POST(request: Request) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const API_KEY = process.env.CONGRESS_API_KEY;
    if (!API_KEY) {
      return NextResponse.json({ error: 'Congress API key not configured' }, { status: 500 });
    }

    console.log('🚀 Starting bill cache refresh...');

    // Fetch the latest 500 bills from Congress API
    const congress = '119'; // Current congress
    const apiUrl = `https://api.congress.gov/v3/bill/${congress}?api_key=${API_KEY}&format=json&limit=500&sort=updateDate+desc`;

    const response = await fetch(apiUrl, {
      headers: { 'User-Agent': 'BillTracker/1.0' },
    });

    if (!response.ok) {
      throw new Error(`Congress API responded with ${response.status}`);
    }

    const data = await response.json();
    const bills: CongressBill[] = data.bills || [];

    console.log(`📋 Fetched ${bills.length} bills from Congress API`);

    let processedCount = 0;
    let errorCount = 0;
    const batchSize = 10; // Process in smaller batches to avoid timeouts

    // Process bills in batches
    for (let i = 0; i < bills.length; i += batchSize) {
      const batch = bills.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (bill) => {
        try {
          // Fetch detailed subjects for each bill
          const subjectsUrl = `https://api.congress.gov/v3/bill/${bill.congress}/${bill.type.toLowerCase()}/${bill.number}/subjects?api_key=${API_KEY}&format=json`;
          
          const subjectsResponse = await fetch(subjectsUrl, {
            headers: { 'User-Agent': 'BillTracker/1.0' },
          });

          let apiSubjects: string[] = [];
          let mappedSubjects: string[] = [];

          if (subjectsResponse.ok) {
            const subjectsData = await subjectsResponse.json();
            
            // Extract all API subjects
            if (subjectsData.subjects?.policyArea?.name) {
              apiSubjects.push(subjectsData.subjects.policyArea.name);
            }
            
            if (subjectsData.subjects?.legislativeSubjects) {
              subjectsData.subjects.legislativeSubjects.forEach((subject: any) => {
                if (subject.name) {
                  apiSubjects.push(subject.name);
                }
              });
            }

            // Map API subjects to our allowed categories
            for (const apiSubject of apiSubjects) {
              const mapped = mapApiSubjectToAllowed(apiSubject);
              if (mapped && !mappedSubjects.includes(mapped)) {
                mappedSubjects.push(mapped);
              }
            }
          }

          // Create cached bill document
          const cachedBill: CachedBill = {
            id: `${bill.type}-${bill.number}-${bill.congress}`,
            congress: bill.congress,
            number: bill.number,
            type: bill.type,
            title: bill.title,
            url: bill.url,
            updateDate: bill.updateDate,
            originChamber: bill.originChamber,
            originChamberCode: bill.originChamberCode,
            latestAction: bill.latestAction || {
              actionDate: bill.updateDate,
              text: 'No recent action available'
            },
            subjects: mappedSubjects,
            apiSubjects: apiSubjects,
            lastCached: new Date().toISOString()
          };

          // Save to Firestore
          await adminDb.collection('cached_bills').doc(cachedBill.id).set(cachedBill);
          processedCount++;

        } catch (error) {
          console.error(`❌ Error processing bill ${bill.type} ${bill.number}:`, error);
          errorCount++;
        }
      }));

      // Add a small delay between batches to be gentle on the API
      if (i + batchSize < bills.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Update cache metadata
    await adminDb.collection('cache_metadata').doc('bills').set({
      lastRefresh: new Date().toISOString(),
      totalBills: processedCount,
      errors: errorCount,
      congress: congress
    });

    console.log(`✅ Cache refresh complete: ${processedCount} bills processed, ${errorCount} errors`);

    return NextResponse.json({
      success: true,
      processed: processedCount,
      errors: errorCount,
      message: `Successfully cached ${processedCount} bills`
    });

  } catch (error) {
    console.error('❌ Cache refresh failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}

// Also allow GET for manual testing
export async function GET() {
  return NextResponse.json({
    message: 'Bill cache refresh endpoint. Use POST to trigger refresh.',
    lastRun: 'Check cache_metadata/bills document for last refresh time'
  });
}