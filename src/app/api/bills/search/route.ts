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
    summaries: { count: 0, items: [] },
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
    let apiUrl = `https://api.congress.gov/v3/bill/${congress}?api_key=${API_KEY}&format=json&limit=${limit}&offset=${offset}&sort=updateDate+desc`;
    
    // Add subject filter if provided
    if (subjects) {
      const subjectList = subjects.split(',').map(s => s.trim()).filter(s => s.length > 0);
      if (subjectList.length > 0) {
        // Create OR query for subjects
        const subjectQuery = subjectList.map(s => `"${s}"`).join(' OR ');
        apiUrl += `&subject=${encodeURIComponent(subjectQuery)}`;
      }
    }

    console.log('🔍 Fetching bills:', apiUrl.replace(API_KEY, 'API_KEY'));

    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'BillTracker/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Congress API responded with ${response.status}`);
    }

    const data = await response.json();
    const apiBills: CongressBill[] = data.bills || [];
    
    // Transform and filter bills
    const transformedBills = apiBills.map(transformApiBillToBill);
    
    // If subjects filter was applied, do additional filtering on transformed bills
    // to ensure they actually contain the requested subjects
    let filteredBills = transformedBills;
    if (subjects) {
      const requestedSubjects = subjects.split(',').map(s => s.trim());
      filteredBills = transformedBills.filter(bill => {
        const billSubjects = bill.subjects?.items?.map(s => (s as any).name) || [];
        return requestedSubjects.some(requested => 
          billSubjects.some(billSubject => 
            billSubject.toLowerCase().includes(requested.toLowerCase()) ||
            requested.toLowerCase().includes(billSubject.toLowerCase())
          )
        );
      });
    }

    return NextResponse.json({
      bills: filteredBills,
      pagination: {
        count: filteredBills.length,
        offset: offset,
        hasMore: filteredBills.length === limit,
        total: data.pagination?.count || null
      },
      debug: {
        requestedSubjects: subjects?.split(',') || null,
        originalCount: apiBills.length,
        filteredCount: filteredBills.length,
        apiUrl: apiUrl.replace(API_KEY, 'API_KEY')
      }
    });

  } catch (error) {
    console.error('Bills search error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({
      error: errorMessage,
      bills: [],
      pagination: { count: 0, offset: 0, hasMore: false, total: 0 }
    }, { status: 500 });
  }
}