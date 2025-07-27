import { NextResponse, type NextRequest } from 'next/server';
import type { Bill, Subject, PolicyArea } from '@/types';
import { filterAllowedSubjects } from '@/lib/subjects'; // ADD THIS LINE

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
    console.log('Fetching basic bill data from server API...');
    const basicUrl = `${baseUrl}?embed=sponsors&api_key=${API_KEY}`;
    
    const basicRes = await fetch(basicUrl, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(15000)
    });

    if (!basicRes.ok) {
        console.error(`Basic API request failed: ${basicRes.status}`);
        return NextResponse.json({ error: 'Failed to fetch bill details' }, { status: basicRes.status });
    }

    const basicData = await basicRes.json();
    const bill: Bill = basicData.bill;
    
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

    const fetchPromises = [];

    // Fetch all titles and find the best short title
    const titlesUrl = `${baseUrl}/titles?api_key=${API_KEY}`;
    fetchPromises.push(
        fetch(titlesUrl, { signal: AbortSignal.timeout(10000) })
            .then(res => res.ok ? res.json() : Promise.resolve(null))
            .then(data => {
                if (data?.titles && Array.isArray(data.titles)) {
                    // Find a "Short Title" - often more user-friendly
                    const shortTitle = data.titles.find((t: any) => 
                        t.titleType?.toLowerCase().includes('short') && t.isForPortion !== 'Y'
                    );
                    if (shortTitle) {
                        bill.title = shortTitle.title; // Override the long official title
                    }
                }
            }).catch(e => console.log('Titles fetch failed:', e.message))
    );

    // Summaries
    if (bill.summaries?.url) {
        fetchPromises.push(
            fetch(`${bill.summaries.url}&api_key=${API_KEY}`, { signal: AbortSignal.timeout(10000) })
            .then(res => res.ok ? res.json() : Promise.resolve(null)) // Gracefully handle failed requests
            .then(data => {
                const summaries = data?.summaries;
                if (summaries && Array.isArray(summaries) && summaries.length > 0) {
                    const sorted = [...summaries].sort((a, b) => new Date(b.updateDate).getTime() - new Date(a.updateDate).getTime());
                    bill.allSummaries = sorted;
                    // Ensure the latest summary is attached directly for easier access
                    if (sorted.length > 0) {
                        bill.summaries.summary = sorted[0];
                    }
                }
            }).catch(e => console.log('Summaries fetch failed:', e.message))
        );
    }
    
    // Actions
     if (bill.actions?.url) {
        fetchPromises.push(
             fetch(`${bill.actions.url}&api_key=${API_KEY}`, { signal: AbortSignal.timeout(10000) })
            .then(res => res.ok ? res.json() : Promise.resolve(null))
            .then(data => {
                if (data?.actions && Array.isArray(data.actions)) {
                    bill.actions.items = data.actions;
                }
            }).catch(e => console.log('Actions fetch failed:', e.message))
        );
    }
    
    // Committees
     if (bill.committees?.url) {
        fetchPromises.push(
             fetch(`${bill.committees.url}&api_key=${API_KEY}`, { signal: AbortSignal.timeout(10000) })
            .then(res => res.ok ? res.json() : Promise.resolve(null))
            .then(data => {
                if (data?.committees && Array.isArray(data.committees)) {
                    bill.committees.items = data.committees;
                }
            }).catch(e => console.log('Committees fetch failed:', e.message))
        );
    }

    // Subjects - with pagination and filtering
    if (bill.subjects?.url) {
        const fetchAllSubjects = async () => {
            let allSubjects: (Subject | PolicyArea)[] = [];
            let nextUrl: string | undefined = `${bill.subjects.url}&api_key=${API_KEY}&limit=250`;
            
            while (nextUrl) {
                try {
                    const res = await fetch(nextUrl, { signal: AbortSignal.timeout(10000) });
                    if (!res.ok) break;
                    const data = await res.json();
                    
                    const legislativeSubjects = data.subjects?.legislativeSubjects || [];
                    const policyArea = data.subjects?.policyArea ? [data.subjects.policyArea] : [];
                    
                    allSubjects.push(...legislativeSubjects, ...policyArea);
                    
                    // Check for pagination.next property
                    nextUrl = data.pagination?.next ? `${data.pagination.next}&api_key=${API_KEY}` : undefined;
                } catch (e) {
                    console.log('A subject page fetch failed:', e.message);
                    break;
                }
            }
            
            if (allSubjects.length > 0) {
                // Extract subject names for filtering
                const subjectNames = allSubjects.map((subject: any) => subject.name).filter(name => name);
                
                // Filter to only show allowed subjects
                const filteredSubjectNames = filterAllowedSubjects(subjectNames);
                
                // Convert back to subject objects format
                const filteredSubjects = filteredSubjectNames.map(name => ({ name }));
                
                // Update bill subjects with filtered results
                bill.subjects.items = filteredSubjects;
                bill.subjects.count = filteredSubjects.length;
                
                console.log(`✅ Bill ${billType?.toUpperCase()} ${billNumber}: Filtered subjects from ${allSubjects.length} to ${filteredSubjects.length} allowed subjects`);
            }
        };
        fetchPromises.push(fetchAllSubjects());
    }

    await Promise.all(fetchPromises);
    
    // Final check to ensure summaries items is populated from allSummaries
    if (bill.allSummaries && bill.allSummaries.length > 0) {
        bill.summaries.items = bill.allSummaries;
        bill.summaries.count = bill.allSummaries.length;
    } else {
        bill.summaries.items = [];
        bill.summaries.count = 0;
    }

    return NextResponse.json(bill);

  } catch (error) {
    console.error('Server API Error in bill detail route:', error);
    return NextResponse.json({ error: 'Failed to fetch bill details' }, { status: 500 });
  }
}