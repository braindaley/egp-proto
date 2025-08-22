import { NextResponse } from 'next/server';
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

export async function POST(request: Request) {
  try {
    // Verify this is a legitimate request
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const API_KEY = process.env.CONGRESS_API_KEY;
    if (!API_KEY) {
      return NextResponse.json({ error: 'Congress API key not configured' }, { status: 500 });
    }

    console.log('🧪 Testing bill cache process (no Firebase writes)...');

    // Fetch the latest 10 bills from Congress API for testing
    const congress = '119'; // Current congress
    const apiUrl = `https://api.congress.gov/v3/bill/${congress}?api_key=${API_KEY}&format=json&limit=10&sort=updateDate+desc`;

    console.log('🔗 Fetching from:', apiUrl);
    
    const response = await fetch(apiUrl, {
      headers: { 'User-Agent': 'BillTracker/1.0' },
    });

    console.log('📡 API Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error response:', errorText);
      throw new Error(`Congress API responded with ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const bills: CongressBill[] = data.bills || [];

    console.log(`📋 Fetched ${bills.length} bills from Congress API`);

    let processedCount = 0;
    let errorCount = 0;
    const processedBills = [];

    // Process first 3 bills for testing
    for (const bill of bills.slice(0, 3)) {
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

        // Create cached bill document (for testing - not saving to Firebase)
        const cachedBill = {
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

        processedBills.push(cachedBill);
        processedCount++;

        console.log(`✅ Processed ${bill.type} ${bill.number}: ${mappedSubjects.length} subjects mapped`);

      } catch (error) {
        console.error(`❌ Error processing bill ${bill.type} ${bill.number}:`, error);
        errorCount++;
      }
    }

    console.log(`🧪 Test complete: ${processedCount} bills processed, ${errorCount} errors`);

    return NextResponse.json({
      success: true,
      test: true,
      processed: processedCount,
      errors: errorCount,
      message: `Test completed: processed ${processedCount} bills without writing to Firebase`,
      sampleBills: processedBills,
      totalAvailable: bills.length
    });

  } catch (error) {
    console.error('❌ Test cache process failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Test bill cache process (no Firebase writes). Use POST to test.',
    instructions: 'This endpoint tests the bill caching process without writing to Firebase.'
  });
}