
import { NextResponse, type NextRequest } from 'next/server';
import type { Bill, Subject, PolicyArea } from '@/types';
import { filterAllowedSubjects, mapApiSubjectToAllowed } from '@/lib/subjects';

// Type for API responses
interface ApiResponse {
  [key: string]: any;
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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const congress = searchParams.get('congress');
  const billType = searchParams.get('billType');
  const billNumber = searchParams.get('billNumber');

  const API_KEY = process.env.CONGRESS_API_KEY;

  if (!congress || !billType || !billNumber || !API_KEY) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }
  
  const baseUrl = `https://api.congress.gov/v3/bill/${congress}/${billType}/${billNumber}`;

  try {
    const basicUrl = `${baseUrl}?embed=sponsors&api_key=${API_KEY}`;
    
    const basicRes = await fetch(basicUrl, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(15000)
    });

    if (!basicRes.ok) {
        console.error(`Basic API request failed: ${basicRes.status}`);
        return NextResponse.json({ error: 'Failed to fetch bill details' }, { status: basicRes.status });
    }

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
    bill.relatedBills = bill.relatedBills || { count: 0, items: [] };
    bill.subjects = bill.subjects || { count: 0, items: [] };
    bill.textVersions = bill.textVersions || { count: 0, items: [] };
    bill.summaries = { ...bill.summaries, count: 0, items: [] }; // Ensure items is an array
    bill.allSummaries = []; // Start with an empty array

    const fetchPromises: Promise<void>[] = [];

    // Fetch all titles and find the best short title
    const titlesUrl = `${baseUrl}/titles?api_key=${API_KEY}`;
    fetchPromises.push(
        fetch(titlesUrl, { signal: AbortSignal.timeout(10000) })
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
        fetchPromises.push(
            fetch(`${bill.summaries.url}&api_key=${API_KEY}`, { signal: AbortSignal.timeout(10000) })
            .then((res: Response) => res.ok ? res.json() : Promise.resolve(null)) // Gracefully handle failed requests
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
        fetchPromises.push(
             fetch(`${bill.actions.url}&api_key=${API_KEY}`, { signal: AbortSignal.timeout(10000) })
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
        fetchPromises.push(
             fetch(`${bill.committees.url}&api_key=${API_KEY}`, { signal: AbortSignal.timeout(10000) })
            .then((res: Response) => res.ok ? res.json() : Promise.resolve(null))
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

    // Subjects - with pagination, mapping, and filtering
    if (bill.subjects && 'url' in bill.subjects && bill.subjects.url) {
        const fetchAllSubjects = async (): Promise<void> => {
            let allSubjects: (Subject | PolicyArea)[] = [];
            let nextUrl: string | undefined = `${bill.subjects.url}&api_key=${API_KEY}&limit=250`;
            
            while (nextUrl) {
                try {
                    const res: Response = await fetch(nextUrl, { signal: AbortSignal.timeout(10000) });
                    if (!res.ok) break;
                    const data: SubjectsResponse = await res.json();
                    
                    const legislativeSubjects = data.subjects?.legislativeSubjects || [];
                    const policyArea = data.subjects?.policyArea ? [data.subjects.policyArea] : [];
                    
                    allSubjects.push(...legislativeSubjects, ...policyArea);
                    
                    // Check for pagination.next property
                    nextUrl = data.pagination?.next ? `${data.pagination.next}&api_key=${API_KEY}` : undefined;
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
    return NextResponse.json({ error: 'Failed to fetch bill details' }, { status: 500 });
  }
}
