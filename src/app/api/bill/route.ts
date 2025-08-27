
import { NextResponse, type NextRequest } from 'next/server';
import type { Bill, Subject, PolicyArea } from '@/types';
import { filterAllowedSubjects, mapApiSubjectToAllowed } from '@/lib/subjects';
import { adminDb } from '@/lib/firebase-admin';

// Type for API responses
interface ApiResponse {
  [key: string]: any;
}

// Interface for cached bill data
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

interface TitlesResponse {
  titles?: Array<{
    title: string;
    titleType: string;
    isForPortion?: string;
  }>;
}

interface SummariesResponse {
  summaries?: Array<{
    updateDate: string;
    [key: string]: any;
  }>;
}

interface ActionsResponse {
  actions?: Array<{
    actionDate: string;
    text: string;
    [key: string]: any;
  }>;
}

interface CommitteesResponse {
  committees?: Array<{
    name: string;
    systemCode: string;
    activities: Array<{
      name: string;
      date?: string;
    }>;
    [key: string]: any;
  }>;
}

interface SubjectsResponse {
  subjects?: {
    legislativeSubjects?: Array<{ name: string }>;
    policyArea?: { name: string };
  };
  pagination?: {
    next?: string;
  };
}

// Transform cached bill to full Bill format
function transformCachedBillToBill(cachedBillDoc: any): Bill {
  // Handle the nested structure from cache
  const billData = cachedBillDoc.billData || cachedBillDoc;
  const subjects = cachedBillDoc.subjects || [];
  const type = billData.type || '';
  const latestAction = billData.latestAction || { actionDate: '', text: '' };
  const sponsor = billData.sponsorFullName ? [{
    fullName: billData.sponsorFullName,
    party: billData.sponsorParty || '',
    state: billData.sponsorState || '',
    bioguideId: billData.sponsorBioguideId || '',
    imageUrl: billData.sponsorImageUrl || ''
  }] : [];
  
  return {
    congress: billData.congress || 0,
    number: billData.number || '',
    type: type,
    title: billData.shortTitle || '',
    shortTitle: billData.shortTitle || `${type.toUpperCase()} ${billData.number}`,
    url: cachedBillDoc.url || '',
    latestAction: latestAction,
    updateDate: cachedBillDoc.updateDate || '',
    originChamber: cachedBillDoc.originChamber || '',
    introducedDate: cachedBillDoc.updateDate || latestAction.actionDate || '',
    originChamberCode: cachedBillDoc.originChamberCode || '',
    sponsors: sponsor,
    cosponsors: { count: 0, items: [], url: '' },
    committees: { count: 0, items: [] },
    subjects: { 
      count: subjects.length, 
      items: subjects.map((name: string) => ({ name }))
    },
    summaries: { count: 0 },
    allSummaries: [],
    actions: { count: 1, items: [latestAction] },
    relatedBills: { count: 0, items: [] },
    amendments: { count: 0, items: [] },
    textVersions: { count: 0, items: [] }
  };
}

// Try to get bill from cache
async function tryGetBillFromCache(congress: string, billType: string, billNumber: string): Promise<Bill | null> {
  try {
    const billId = `${congress}-${billType.toUpperCase()}-${billNumber}`;
    console.log(`🔍 Checking cache for bill: ${billId}`);
    
    const doc = await adminDb.collection('cached_bills').doc(billId).get();
    
    if (doc.exists) {
      const cachedBill = doc.data() as CachedBill;
      console.log(`✅ Found cached bill: ${billId}`);
      return transformCachedBillToBill(cachedBill);
    }
    
    console.log(`❌ No cached bill found: ${billId}`);
    
    // For development, let's list available cached bills to see what we have
    if (process.env.NODE_ENV === 'development') {
      try {
        // Check specifically for Senate bills
        const senateBills = await adminDb.collection('cached_bills').where('__name__', '>=', `${congress}-S-`).where('__name__', '<', `${congress}-S-\uf8ff`).limit(10).get();
        const senateIds = senateBills.docs.map(doc => doc.id);
        if (senateIds.length > 0) {
          console.log(`🏛️ Available Senate bills: ${senateIds.join(', ')}`);
        }
        
        const billsSnapshot = await adminDb.collection('cached_bills').limit(5).get();
        const availableBills = billsSnapshot.docs.map(doc => doc.id);
        console.log(`📋 Sample cached bills: ${availableBills.join(', ')}`);
      } catch (listError) {
        console.log('❌ Could not list cached bills:', listError);
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching from cache:', error);
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const congress = searchParams.get('congress');
  const billType = searchParams.get('billType');
  const billNumber = searchParams.get('billNumber');

  const API_KEY = process.env.CONGRESS_API_KEY;

  if (!congress || !billType || !billNumber) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  // Try cache first for faster response
  console.log(`🔍 Attempting to fetch bill: ${congress}-${billType}-${billNumber}`);
  const cachedBill = await tryGetBillFromCache(congress, billType, billNumber);
  
  if (cachedBill) {
    // If cached bill has no subjects, try to fetch fresh subjects data
    if (!cachedBill.subjects || cachedBill.subjects.count === 0) {
      console.log('⚠️ Cached bill has no subjects, fetching fresh data from Congress API');
      // Don't return cached data if subjects are missing - fall through to fetch fresh
    } else {
      console.log('✅ Serving from cache with subjects');
      const response = NextResponse.json(cachedBill);
      response.headers.set('X-Data-Source', 'cache');
      return response;
    }
  }

  if (!API_KEY) {
    return NextResponse.json({ 
      error: 'Congress API key not configured and no cached data available' 
    }, { status: 503 });
  }
  
  const baseUrl = `https://api.congress.gov/v3/bill/${congress}/${billType}/${billNumber}`;

  try {
    const basicUrl = `${baseUrl}?api_key=${API_KEY}`;
    console.log(`📡 Fetching from Congress API: ${basicUrl.replace(API_KEY, '[REDACTED]')}`);
    
    let basicRes = await fetch(basicUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; Next.js)'
      },
      redirect: 'manual',
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(10000)
    });

    // Handle redirect manually to avoid infinite redirect loops
    let redirectCount = 0;
    while (basicRes.status >= 300 && basicRes.status < 400 && redirectCount < 3) {
      const redirectUrl = basicRes.headers.get('Location');
      if (redirectUrl) {
        redirectCount++;
        console.log(`📡 Following redirect ${redirectCount} to: ${redirectUrl.replace(API_KEY, '[REDACTED]')}`);
        basicRes = await fetch(redirectUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (compatible; Next.js)'
          },
          redirect: 'manual',
          signal: AbortSignal.timeout(10000)
        });
      } else {
        break;
      }
    }

    if (!basicRes.ok) {
        console.error(`Basic API request failed: ${basicRes.status}`);
        const errorText = await basicRes.text().catch(() => 'Unknown error');
        console.error(`Response status: ${basicRes.status}, headers:`, Object.fromEntries(basicRes.headers));
        console.error('Congress API Error Response:', errorText);
        
        // Check if it's a known Congress API database error
        if (errorText.includes('column law.law_passage_type_id does not exist') || 
            errorText.includes('ProgrammingError')) {
            
            // Try to get from cache as fallback
            console.log('🔄 Congress API down, trying cache fallback...');
            const cachedBill = await tryGetBillFromCache(congress, billType, billNumber);
            
            if (cachedBill) {
                console.log('✅ Serving cached bill data');
                const response = NextResponse.json(cachedBill);
                response.headers.set('X-Data-Source', 'cache-fallback');
                response.headers.set('X-Cache-Warning', 'Congress API temporarily unavailable');
                return response;
            }
            
            return NextResponse.json({ 
                error: 'The Congress.gov API is currently experiencing technical difficulties. Please try again later.',
                details: 'Congress API database error',
                temporary: true
            }, { status: 503 });
        }
        
        return NextResponse.json({ error: 'Failed to fetch bill details' }, { status: basicRes.status });
    }

    console.log(`✅ Congress API responded with status: ${basicRes.status}`);
    const basicData: ApiResponse = await basicRes.json();
    const bill: Bill = basicData.bill;
    
    // Store the original title before any modifications
    const originalTitle = bill.title;
    
    // Initialize all optional structures to prevent client errors
    bill.sponsors = bill.sponsors || [];
    bill.cosponsors = bill.cosponsors || { count: 0, url: '', items: [] };
    bill.committees = bill.committees || { count: 0, items: [] };
    bill.actions = bill.actions || { count: 0, items: [] };
    bill.amendments = bill.amendments || { count: 0, items: [] };
    bill.textVersions = bill.textVersions || { count: 0, items: [] };
    bill.relatedBills = bill.relatedBills || { count: 0, items: [] };
    bill.subjects = bill.subjects || { count: 0, items: [] };
    bill.summaries = { ...bill.summaries, count: 0, items: [] }; // Ensure items is an array
    bill.allSummaries = []; // Start with an empty array
    
    // Preserve policyArea if it exists in the basic response
    if (basicData.bill?.policyArea) {
        bill.subjects.policyArea = basicData.bill.policyArea;
    }

    const fetchPromises: Promise<void>[] = [];

    // Fetch all titles and find the best short title
    const titlesUrl = `${baseUrl}/titles?api_key=${API_KEY}`;
    fetchPromises.push(
        fetch(titlesUrl, { signal: AbortSignal.timeout(4000) })
            .then((res: Response) => res.ok ? res.json() : Promise.resolve(null))
            .then((data: TitlesResponse | null) => {
                if (data?.titles && Array.isArray(data.titles)) {
                    // Find a "Short Title" - often more user-friendly
                    const shortTitle = data.titles.find((t) => 
                        t.titleType?.toLowerCase().includes('short title(s) as introduced')
                    );
                    if (shortTitle) {
                        // Keep both titles - don't override the original
                        bill.shortTitle = shortTitle.title;
                        bill.title = originalTitle; // Preserve the original full title
                    }
                }
            }).catch((e: unknown) => {
                const errorMessage = e instanceof Error ? e.message : 'Unknown error';
                console.log('Titles fetch failed:', errorMessage);
            })
    );

    // Summaries
    if (bill.summaries && 'url' in bill.summaries && bill.summaries.url) {
        const summariesUrl = bill.summaries.url.includes('api_key') ? bill.summaries.url : `${bill.summaries.url}&api_key=${API_KEY}`;
        fetchPromises.push(
            fetch(summariesUrl, { signal: AbortSignal.timeout(8000) })
            .then((res: Response) => res.ok ? res.json() : Promise.resolve(null))
            .then((data: SummariesResponse | null) => {
                const summaries = data?.summaries;
                if (summaries && Array.isArray(summaries) && summaries.length > 0) {
                    const sorted = [...summaries].sort((a, b) => new Date(b.updateDate).getTime() - new Date(a.updateDate).getTime());
                    bill.allSummaries = sorted as any[]; // Cast to avoid type issues with API response structure
                    // Ensure the latest summary is attached directly for easier access
                    if (sorted.length > 0) {
                        bill.summaries.summary = sorted[0] as any;
                    }
                }
            }).catch((e: unknown) => {
                const errorMessage = e instanceof Error ? e.message : 'Unknown error';
                console.log('Summaries fetch failed:', errorMessage);
            })
        );
    }
    
    // Actions
    if (bill.actions && 'url' in bill.actions && bill.actions.url) {
        const actionsUrl = bill.actions.url.includes('api_key') ? bill.actions.url : `${bill.actions.url}&api_key=${API_KEY}`;
        fetchPromises.push(
             fetch(actionsUrl, { signal: AbortSignal.timeout(8000) })
            .then((res: Response) => res.ok ? res.json() : Promise.resolve(null))
            .then((data: ActionsResponse | null) => {
                if (data?.actions && Array.isArray(data.actions)) {
                    bill.actions.items = data.actions as any[]; // Cast to avoid type issues with API response structure
                }
            }).catch((e: unknown) => {
                const errorMessage = e instanceof Error ? e.message : 'Unknown error';
                console.log('Actions fetch failed:', errorMessage);
            })
        );
    }
    
    // Committees
    if (bill.committees && 'url' in bill.committees && bill.committees.url) {
        const committeesUrl = bill.committees.url.includes('api_key') ? bill.committees.url : `${bill.committees.url}&api_key=${API_KEY}`;
        fetchPromises.push(
             fetch(committeesUrl, { signal: AbortSignal.timeout(8000) })
            .then((res: Response) => {
    return res.ok ? res.json() : Promise.resolve(null);
            })
            .then((data: CommitteesResponse | null) => {
                if (data?.committees && Array.isArray(data.committees)) {
                    bill.committees.items = data.committees as any[]; // Cast to avoid type issues with API response structure
                }
            }).catch((e: unknown) => {
                const errorMessage = e instanceof Error ? e.message : 'Unknown error';
                console.log('Committees fetch failed:', errorMessage);
            })
        );
    }

    // Cosponsors
    if (bill.cosponsors && 'url' in bill.cosponsors && bill.cosponsors.url) {
        const cosponsorsUrl = bill.cosponsors.url.includes('api_key') ? bill.cosponsors.url : `${bill.cosponsors.url}&api_key=${API_KEY}`;
        fetchPromises.push(
             fetch(cosponsorsUrl, { signal: AbortSignal.timeout(8000) })
            .then((res: Response) => {
                console.log('👥 Cosponsors response status:', res.status);
                return res.ok ? res.json() : Promise.resolve(null);
            })
            .then((data: any) => {
                console.log('👥 Cosponsors data received:', data?.cosponsors ? data.cosponsors.length : 0);
                if (data?.cosponsors && Array.isArray(data.cosponsors)) {
                    bill.cosponsors.items = data.cosponsors as any[];
                    console.log('👥 Set cosponsors with', data.cosponsors.length, 'items');
                }
            }).catch((e: unknown) => {
                const errorMessage = e instanceof Error ? e.message : 'Unknown error';
                console.log('👥 Cosponsors fetch failed:', errorMessage);
            })
        );
    }

    // Text Versions  
    if (bill.textVersions && 'url' in bill.textVersions && bill.textVersions.url) {
        const textVersionsUrl = bill.textVersions.url.includes('api_key') ? bill.textVersions.url : `${bill.textVersions.url}&api_key=${API_KEY}`;
        fetchPromises.push(
             fetch(textVersionsUrl, { signal: AbortSignal.timeout(8000) })
            .then((res: Response) => res.ok ? res.json() : Promise.resolve(null))
            .then((data: any) => {
                if (data?.textVersions && Array.isArray(data.textVersions)) {
                    bill.textVersions.items = data.textVersions as any[];
                }
            }).catch((e: unknown) => {
                const errorMessage = e instanceof Error ? e.message : 'Unknown error';
                console.log('Text versions fetch failed:', errorMessage);
            })
        );
    }

    // Related Bills
    if (bill.relatedBills && 'url' in bill.relatedBills && bill.relatedBills.url) {
        const relatedBillsUrl = bill.relatedBills.url.includes('api_key') ? bill.relatedBills.url : `${bill.relatedBills.url}&api_key=${API_KEY}`;
        fetchPromises.push(
             fetch(relatedBillsUrl, { signal: AbortSignal.timeout(8000) })
            .then((res: Response) => {
                console.log('🗗 Related bills response status:', res.status);
                return res.ok ? res.json() : Promise.resolve(null);
            })
            .then((data: any) => {
                console.log('🗗 Related bills data received:', data?.relatedBills ? data.relatedBills.length : 0);
                if (data?.relatedBills && Array.isArray(data.relatedBills)) {
                    bill.relatedBills.items = data.relatedBills as any[];
                    console.log('🗗 Set related bills with', data.relatedBills.length, 'items');
                }
            }).catch((e: unknown) => {
                const errorMessage = e instanceof Error ? e.message : 'Unknown error';
                console.log('🗗 Related bills fetch failed:', errorMessage);
            })
        );
    }

    // Subjects - with pagination, mapping, and filtering
    if (bill.subjects && 'url' in bill.subjects && bill.subjects.url) {
        const fetchAllSubjects = async (): Promise<void> => {
            let allSubjects: (Subject | PolicyArea)[] = [];
            let fetchedPolicyArea: PolicyArea | null = null;
            const baseSubjectsUrl = bill.subjects.url.includes('api_key') ? bill.subjects.url : `${bill.subjects.url}&api_key=${API_KEY}`;
            let nextUrl: string | undefined = `${baseSubjectsUrl}&limit=250`;
            console.log('🏷️ Fetching subjects from:', nextUrl.replace(API_KEY, '[REDACTED]'));
            
            while (nextUrl) {
                try {
                    const res: Response = await fetch(nextUrl, { signal: AbortSignal.timeout(4000) });
                    if (!res.ok) break;
                    const data: SubjectsResponse = await res.json();
                    
                    const legislativeSubjects = data.subjects?.legislativeSubjects || [];
                    // Store policy area separately to preserve it
                    if (data.subjects?.policyArea) {
                        fetchedPolicyArea = data.subjects.policyArea;
                    }
                    
                    allSubjects.push(...legislativeSubjects);
                    
                    // Check for pagination.next property
                    nextUrl = data.pagination?.next ? data.pagination.next : undefined;
                } catch (e: unknown) {
                    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
                    console.log('A subject page fetch failed:', errorMessage);
                    break;
                }
            }
            
            if (allSubjects.length > 0) {
                // Extract subject names
                const subjectNames = allSubjects.map((subject: any) => subject.name).filter(name => name);
                
                // Map Congress.gov subjects to standardized names and filter
                const mappedAndFilteredNames: string[] = [];
                
                for (const subjectName of subjectNames) {
                    // Try to map the API subject to an allowed subject
                    const mappedSubject = mapApiSubjectToAllowed(subjectName);
                    if (mappedSubject) {
                        mappedAndFilteredNames.push(mappedSubject);
                    }
                }
                
                // Remove duplicates and sort
                const finalSubjects = [...new Set(mappedAndFilteredNames)].sort();
                
                // Convert back to subject objects format
                const filteredSubjects = finalSubjects.map(name => ({ name }));
                
                // Update bill subjects with filtered results
                bill.subjects.items = filteredSubjects;
                bill.subjects.count = filteredSubjects.length;
                
                // Preserve the policyArea if it was fetched
                if (fetchedPolicyArea) {
                    bill.subjects.policyArea = fetchedPolicyArea;
                }
            }
        };
        fetchPromises.push(fetchAllSubjects());
    }

    await Promise.all(fetchPromises);
    
    // Final check to ensure summaries items is populated from allSummaries
    if (bill.allSummaries && bill.allSummaries.length > 0) {
        bill.summaries.items = bill.allSummaries as any[]; // Cast to avoid type issues
        bill.summaries.count = bill.allSummaries.length;
    } else {
        bill.summaries.items = [];
        bill.summaries.count = 0;
    }

    return NextResponse.json(bill);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Server API Error in bill detail route:', errorMessage);
    console.error('Full error details:', error);
    
    // Last resort: try cache again in case of API failures
    console.log('🔄 API failed, trying cache fallback one more time...');
    const fallbackBill = await tryGetBillFromCache(congress, billType, billNumber);
    
    if (fallbackBill) {
      console.log('✅ Serving cached fallback data');
      const response = NextResponse.json(fallbackBill);
      response.headers.set('X-Data-Source', 'cache-fallback');
      response.headers.set('X-API-Status', 'failed');
      return response;
    }
    
    // If nothing else works, return a structured error with helpful information
    return NextResponse.json({ 
      error: 'Failed to fetch bill details',
      details: 'Both Congress API and cached data are unavailable',
      billId: `${congress}-${billType.toUpperCase()}-${billNumber}`,
      suggestion: 'This bill may not exist or may not be cached yet. Try again later.'
    }, { status: 503 });
  }
}
