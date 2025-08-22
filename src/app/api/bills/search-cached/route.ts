import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import type { Bill } from '@/types';
import { ALLOWED_SUBJECTS } from '@/lib/subjects';

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

function transformCachedBillToBill(cachedBill: CachedBill): Bill {
  return {
    congress: cachedBill.congress,
    number: cachedBill.number,
    type: cachedBill.type,
    title: cachedBill.title,
    shortTitle: `${cachedBill.type} ${cachedBill.number} - ${cachedBill.title}`,
    url: cachedBill.url,
    latestAction: cachedBill.latestAction,
    updateDate: cachedBill.updateDate,
    originChamber: cachedBill.originChamber,
    introducedDate: cachedBill.updateDate,
    originChamberCode: cachedBill.originChamberCode,
    sponsors: [],
    cosponsors: { count: 0, items: [], url: '' },
    committees: { count: 0, items: [] },
    subjects: { 
      count: cachedBill.subjects.length, 
      items: cachedBill.subjects.map(name => ({ name }))
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
  const subjects = searchParams.get('subjects');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');

  console.log(`🚀 Cached API called with:`, {
    subjects: subjects,
    limit: limit,
    offset: offset
  });

  try {
    // Try to use the cache first
    const cacheResult = await tryGetFromCache(subjects, limit, offset);
    if (cacheResult.success) {
      const response = NextResponse.json(cacheResult.data);
      // Cache for 30 minutes since bills update every few hours
      response.headers.set('Cache-Control', 'public, max-age=1800, s-maxage=1800');
      response.headers.set('CDN-Cache-Control', 'public, max-age=1800');
      return response;
    }
    
    // If cache fails (local development or empty cache), fall back to original API
    console.log('🔄 Cache unavailable, falling back to live API...');
    return await fallbackToLiveAPI(request);
    
  } catch (error) {
    console.error('Cached bills search error:', error);
    
    // Try fallback to live API on any error
    try {
      console.log('🔄 Error occurred, trying fallback to live API...');
      return await fallbackToLiveAPI(request);
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return NextResponse.json({
        error: errorMessage,
        bills: [],
        pagination: { count: 0, offset: 0, hasMore: false },
        debug: { error: errorMessage, cached: false, fallbackFailed: true }
      }, { status: 500 });
    }
  }
}

async function tryGetFromCache(subjects: string | null, limit: number, offset: number) {
  try {
    const hasSubjectsFilter = subjects && subjects.trim().length > 0;
    
    if (!hasSubjectsFilter) {
      // No subjects filter - get recent bills
      console.log('📝 No subjects filter - getting recent cached bills...');
      
      const snapshot = await adminDb
        .collection('cached_bills')
        .orderBy('updateDate', 'desc')
        .limit(limit)
        .offset(offset)
        .get();

      const bills = snapshot.docs.map(doc => {
        const cachedBill = doc.data() as CachedBill;
        return transformCachedBillToBill(cachedBill);
      });

      return {
        success: true,
        data: {
          bills: bills,
          pagination: {
            count: bills.length,
            offset: offset,
            hasMore: bills.length === limit,
            total: null
          },
          debug: { 
            mode: 'recent_cached',
            cached: true,
            originalCount: bills.length 
          }
        }
      };

    } else {
      // Filter by subjects
      const subjectList = subjects!.split(',').map(s => s.trim()).filter(s => s.length > 0);
      console.log('🎯 FILTERING MODE - Requested subjects:', subjectList);

      // Query Firestore for bills that match any of the requested subjects
      const snapshot = await adminDb
        .collection('cached_bills')
        .where('subjects', 'array-contains-any', subjectList)
        .orderBy('updateDate', 'desc')
        .limit(limit * 2) // Get more than needed in case of duplicates
        .get();

      let matchedBills: CachedBill[] = [];
      
      snapshot.docs.forEach(doc => {
        const cachedBill = doc.data() as CachedBill;
        
        // Double-check that the bill actually matches one of our requested subjects
        const hasMatchingSubject = cachedBill.subjects.some(subject => 
          subjectList.includes(subject)
        );
        
        if (hasMatchingSubject) {
          matchedBills.push(cachedBill);
        }
      });

      // Apply pagination
      const paginatedBills = matchedBills.slice(offset, offset + limit);
      
      // Transform to Bill format
      const bills = paginatedBills.map(cachedBill => transformCachedBillToBill(cachedBill));

      console.log(`🎯 Found ${matchedBills.length} total matches, returning ${bills.length} bills`);

      return {
        success: true,
        data: {
          bills: bills,
          pagination: {
            count: bills.length,
            offset: offset,
            hasMore: matchedBills.length > offset + limit,
            total: matchedBills.length
          },
          debug: {
            mode: 'filtered_cached',
            cached: true,
            requestedSubjects: subjectList,
            totalMatches: matchedBills.length,
            returned: bills.length
          }
        }
      };
    }
  } catch (error) {
    console.log('Cache query failed:', error);
    return { success: false, error };
  }
}

async function fallbackToLiveAPI(request: Request) {
  // Use the original search API as fallback
  const { searchParams } = new URL(request.url);
  const subjects = searchParams.get('subjects');
  const limit = searchParams.get('limit') || '20';
  const offset = searchParams.get('offset') || '0';
  
  // Import the original search route logic
  const originalApiUrl = new URL('/api/bills/search', request.url);
  originalApiUrl.search = `subjects=${encodeURIComponent(subjects || '')}&limit=${limit}&offset=${offset}`;
  
  console.log('🔍 Fallback URL being called:', originalApiUrl.toString());
  
  const response = await fetch(originalApiUrl.toString(), {
    headers: {
      'User-Agent': request.headers.get('User-Agent') || 'BillTracker/1.0'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Original API failed with status ${response.status}`);
  }
  
  const data = await response.json();
  
  // Add debug info to indicate this came from fallback
  if (data.debug) {
    data.debug.usedFallback = true;
    data.debug.cached = false;
  }
  
  const fallbackResponse = NextResponse.json(data);
  // Cache fallback responses for 10 minutes to reduce load on Congress API
  fallbackResponse.headers.set('Cache-Control', 'public, max-age=600, s-maxage=600');
  fallbackResponse.headers.set('CDN-Cache-Control', 'public, max-age=600');
  return fallbackResponse;
}