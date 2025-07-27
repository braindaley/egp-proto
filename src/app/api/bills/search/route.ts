import { NextResponse } from 'next/server';
import { filterAllowedSubjects } from '@/lib/subjects';
import type { Bill } from '@/types';

interface CongressBill {
  congress: number;
  number: string;
  type: string;
  title: string;
  url: string;
  updateDate: string;
  introducedDate?: string;
  originChamber: string;
  originChamberCode: string;
  latestAction?: {
    actionDate: string;
    text: string;
  };
  subjects?: {
    legislativeSubjects?: Array<{ name: string; updateDate: string }>;
    policyArea?: { name: string };
  };
  sponsors?: any[];
  [key: string]: any;
}

function transformApiBillToBill(apiBill: CongressBill): Bill {
  // Extract and filter subjects
  const allSubjects = [
    ...(apiBill.subjects?.legislativeSubjects?.map(s => s.name) || []),
    ...(apiBill.subjects?.policyArea?.name ? [apiBill.subjects.policyArea.name] : [])
  ];
  
  const filteredSubjects = filterAllowedSubjects(allSubjects);

  return {
    congress: apiBill.congress,
    number: apiBill.number,
    type: apiBill.type,
    title: apiBill.title,
    shortTitle: `${apiBill.type} ${apiBill.number} - ${apiBill.title}`,
    url: apiBill.url,
    latestAction: apiBill.latestAction || {
      actionDate: apiBill.updateDate,
      text: 'No recent action available'
    },
    updateDate: apiBill.updateDate,
    originChamber: apiBill.originChamber,
    introducedDate: apiBill.introducedDate || apiBill.updateDate,
    originChamberCode: apiBill.originChamberCode,
    sponsors: apiBill.sponsors || [],
    cosponsors: { count: 0, items: [], url: '' },
    committees: { count: 0, items: [] },
    subjects: { count: filteredSubjects.length, items: filteredSubjects.map(name => ({ name })) },
    summaries: { count: 0 },
    allSummaries: [],
    actions: { count: 0, items: [] },
    relatedBills: { count: 0, items: [] },
    amendments: { count: 0, items: [] },
    textVersions: { count: 0, items: [] }
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const subjects = searchParams.get('subjects'); // comma-separated subjects
  const congress = searchParams.get('congress') || '119';
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');

  const API_KEY = process.env.CONGRESS_API_KEY;
  if (!API_KEY) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  try {
    let allBills: CongressBill[] = [];
    let debugInfo: any = {};

    if (!subjects) {
      // No subjects filter - get recent bills
      const apiUrl = `https://api.congress.gov/v3/bill/${congress}?api_key=${API_KEY}&format=json&limit=${limit}&offset=${offset}&sort=updateDate+desc`;
      
      console.log('🔍 Fetching recent bills:', apiUrl.replace(API_KEY, 'API_KEY'));

      const response = await fetch(apiUrl, {
        headers: { 'User-Agent': 'BillTracker/1.0' },
      });

      if (!response.ok) {
        throw new Error(`Congress API responded with ${response.status}`);
      }

      const data = await response.json();
      allBills = data.bills || [];
      debugInfo = { 
        mode: 'recent', 
        apiUrl: apiUrl.replace(API_KEY, 'API_KEY'),
        originalCount: allBills.length 
      };

    } else {
      // Subject filtering - try multiple approaches
      const subjectList = subjects.split(',').map(s => s.trim()).filter(s => s.length > 0);
      console.log('🎯 Filtering by subjects:', subjectList);

      // Approach 1: Try the subject parameter
      for (const subject of subjectList) {
        try {
          // Try exact subject name
          let apiUrl = `https://api.congress.gov/v3/bill/${congress}?api_key=${API_KEY}&format=json&limit=${limit}&offset=${offset}&sort=updateDate+desc`;
          
          // Try different subject parameter formats
          const subjectQueries = [
            `subject=${encodeURIComponent(subject)}`,
            `subject=${encodeURIComponent(`"${subject}"`)}`,
            `policyArea=${encodeURIComponent(subject)}`,
            `legislativeSubject=${encodeURIComponent(subject)}`
          ];

          for (const subjectQuery of subjectQueries) {
            const testUrl = `${apiUrl}&${subjectQuery}`;
            console.log('🧪 Testing API URL:', testUrl.replace(API_KEY, 'API_KEY'));

            const response = await fetch(testUrl, {
              headers: { 'User-Agent': 'BillTracker/1.0' },
            });

            if (response.ok) {
              const data = await response.json();
              if (data.bills && data.bills.length > 0) {
                console.log(`✅ Found ${data.bills.length} bills for subject "${subject}" using ${subjectQuery}`);
                allBills.push(...data.bills);
                debugInfo[subject] = { 
                  query: subjectQuery, 
                  count: data.bills.length,
                  url: testUrl.replace(API_KEY, 'API_KEY')
                };
                break; // Found bills with this query format
              }
            }
          }
        } catch (err) {
          console.log(`❌ Error fetching bills for subject "${subject}":`, err);
        }
      }

      // If no bills found with subject parameters, try text search
      if (allBills.length === 0) {
        console.log('🔍 No bills found with subject parameters, trying text search...');
        
        for (const subject of subjectList.slice(0, 2)) { // Limit to first 2 subjects to avoid too many requests
          try {
            // Search in title and summary
            const searchQuery = encodeURIComponent(subject);
            const apiUrl = `https://api.congress.gov/v3/bill/${congress}/search?api_key=${API_KEY}&format=json&limit=${limit}&q=${searchQuery}&sort=updateDate+desc`;
            
            console.log('🔍 Text search URL:', apiUrl.replace(API_KEY, 'API_KEY'));

            const response = await fetch(apiUrl, {
              headers: { 'User-Agent': 'BillTracker/1.0' },
            });

            if (response.ok) {
              const data = await response.json();
              if (data.bills && data.bills.length > 0) {
                console.log(`✅ Text search found ${data.bills.length} bills for "${subject}"`);
                allBills.push(...data.bills);
                debugInfo[`${subject}_text_search`] = { 
                  count: data.bills.length,
                  url: apiUrl.replace(API_KEY, 'API_KEY')
                };
              }
            }
          } catch (err) {
            console.log(`❌ Text search error for "${subject}":`, err);
          }
        }
      }

      debugInfo.mode = 'filtered';
      debugInfo.requestedSubjects = subjectList;
      debugInfo.totalFound = allBills.length;
    }

    // Remove duplicates (same bill might appear in multiple subject searches)
    const uniqueBills = allBills.filter((bill, index, arr) => 
      arr.findIndex(b => b.number === bill.number && b.type === bill.type) === index
    );

    // Transform bills
    const transformedBills = uniqueBills.map(transformApiBillToBill);
    
    // Additional filtering to ensure bills actually match requested subjects
    let finalBills = transformedBills;
    if (subjects) {
      const requestedSubjects = subjects.split(',').map(s => s.trim().toLowerCase());
      finalBills = transformedBills.filter(bill => {
        const billSubjects = bill.subjects?.items?.map(s => s.name?.toLowerCase()) || [];
        const billTitle = bill.title?.toLowerCase() || '';
        const billShortTitle = bill.shortTitle?.toLowerCase() || '';
        
        return requestedSubjects.some(requested => 
          billSubjects.some(billSubject => 
            billSubject?.includes(requested) || requested.includes(billSubject)
          ) ||
          billTitle.includes(requested) ||
          billShortTitle.includes(requested)
        );
      });
    }

    debugInfo.afterTransform = transformedBills.length;
    debugInfo.afterFiltering = finalBills.length;

    return NextResponse.json({
      bills: finalBills.slice(0, limit), // Respect limit
      pagination: {
        count: finalBills.length,
        offset: offset,
        hasMore: finalBills.length > limit,
        total: null
      },
      debug: debugInfo
    });

  } catch (error) {
    console.error('Bills search error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({
      error: errorMessage,
      bills: [],
      pagination: { count: 0, offset: 0, hasMore: false },
      debug: { error: errorMessage }
    }, { status: 500 });
  }
}
