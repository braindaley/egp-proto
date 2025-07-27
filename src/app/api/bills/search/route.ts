import { NextResponse } from 'next/server';
import type { Bill } from '@/types';

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
  [key: string]: any;
}

function transformApiBillToBill(apiBill: CongressBill, filterSubjects: string[] = []): Bill {
  // Since Congress.gov list API doesn't include subjects, 
  // we'll create placeholder subjects based on the filter
  const placeholderSubjects = filterSubjects.length > 0 
    ? filterSubjects.map(subject => ({ name: subject }))
    : [];

  return {
    congress: (apiBill.congress ?? 119) as number,
    number: (apiBill.number ?? '') as string,
    type: (apiBill.type ?? '') as string,
    title: (apiBill.title ?? '') as string,
    shortTitle: `${apiBill.type ?? ''} ${apiBill.number ?? ''} - ${apiBill.title ?? ''}`,
    url: (apiBill.url ?? '') as string,
    latestAction: apiBill.latestAction ?? {
      actionDate: (apiBill.updateDate ?? new Date().toISOString()) as string,
      text: 'No recent action available'
    },
    updateDate: (apiBill.updateDate ?? new Date().toISOString()) as string,
    originChamber: (apiBill.originChamber ?? 'Unknown') as string,
    introducedDate: (apiBill.updateDate ?? new Date().toISOString()) as string,
    originChamberCode: (apiBill.originChamberCode ?? '') as string,
    sponsors: [],
    cosponsors: { count: 0, items: [], url: '' },
    committees: { count: 0, items: [] },
    subjects: { 
      count: placeholderSubjects.length, 
      items: placeholderSubjects 
    },
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
      // Subject filtering - try multiple API approaches
      const subjectList = subjects.split(',').map(s => s.trim()).filter(s => s.length > 0);
      console.log('🎯 Filtering by subjects:', subjectList);

      // Try multiple approaches for each subject
      for (const subject of subjectList) {
        try {
          // Approach 1: Try policyArea parameter
          let apiUrl = `https://api.congress.gov/v3/bill/${congress}?api_key=${API_KEY}&format=json&limit=${limit}&offset=${offset}&sort=updateDate+desc&policyArea=${encodeURIComponent(subject)}`;
          
          console.log('🔍 Trying policyArea:', apiUrl.replace(API_KEY, 'API_KEY'));

          let response = await fetch(apiUrl, {
            headers: { 'User-Agent': 'BillTracker/1.0' },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.bills && data.bills.length > 0) {
              console.log(`✅ Found ${data.bills.length} bills for subject "${subject}" using policyArea`);
              allBills.push(...data.bills);
              debugInfo[subject] = { 
                query: 'policyArea', 
                count: data.bills.length,
                url: apiUrl.replace(API_KEY, 'API_KEY')
              };
              continue; // Found bills, move to next subject
            }
          }

          // Approach 2: Try subject parameter
          apiUrl = `https://api.congress.gov/v3/bill/${congress}?api_key=${API_KEY}&format=json&limit=${limit}&offset=${offset}&sort=updateDate+desc&subject=${encodeURIComponent(subject)}`;
          
          console.log('🔍 Trying subject param:', apiUrl.replace(API_KEY, 'API_KEY'));

          response = await fetch(apiUrl, {
            headers: { 'User-Agent': 'BillTracker/1.0' },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.bills && data.bills.length > 0) {
              console.log(`✅ Found ${data.bills.length} bills for subject "${subject}" using subject param`);
              allBills.push(...data.bills);
              debugInfo[subject] = { 
                query: 'subject', 
                count: data.bills.length,
                url: apiUrl.replace(API_KEY, 'API_KEY')
              };
              continue; // Found bills, move to next subject
            }
          }

          // Approach 3: Try text search as fallback
          apiUrl = `https://api.congress.gov/v3/bill/${congress}?api_key=${API_KEY}&format=json&limit=${limit}&offset=${offset}&sort=updateDate+desc`;
          
          console.log(`🔍 No bills found for "${subject}" with policy/subject params, trying recent bills...`);

          response = await fetch(apiUrl, {
            headers: { 'User-Agent': 'BillTracker/1.0' },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.bills && data.bills.length > 0) {
              // Filter client-side by title/content for this subject
              const filteredBills = data.bills.filter((bill: any) => 
                bill.title?.toLowerCase().includes(subject.toLowerCase()) ||
                bill.shortTitle?.toLowerCase().includes(subject.toLowerCase())
              );
              
              if (filteredBills.length > 0) {
                console.log(`✅ Found ${filteredBills.length} bills for subject "${subject}" using text filtering`);
                allBills.push(...filteredBills);
                debugInfo[subject] = { 
                  query: 'text_filter', 
                  count: filteredBills.length,
                  url: apiUrl.replace(API_KEY, 'API_KEY')
                };
              } else {
                console.log(`❌ No bills found for "${subject}" with any method`);
                debugInfo[subject] = { 
                  query: 'none', 
                  count: 0,
                  error: 'No bills found with any approach'
                };
              }
            }
          }

        } catch (err) {
          console.log(`❌ Error fetching bills for subject "${subject}":`, err);
          debugInfo[subject] = { 
            query: 'error', 
            count: 0,
            error: err instanceof Error ? err.message : 'Unknown error'
          };
        }
      }

      // Remove duplicates
      const uniqueBills = allBills.filter((bill, index, arr) => 
        arr.findIndex(b => b.number === bill.number && b.type === bill.type) === index
      );
      
      allBills = uniqueBills;
      debugInfo.mode = 'filtered';
      debugInfo.requestedSubjects = subjectList;
      debugInfo.totalFound = allBills.length;
    }

    // Transform bills (pass filter subjects for display)
    const requestedSubjects = subjects ? subjects.split(',').map(s => s.trim()) : [];
    const transformedBills = allBills.map(bill => transformApiBillToBill(bill, requestedSubjects));
    
    // No additional filtering needed - Congress.gov already filtered correctly!
    const finalBills = transformedBills;

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