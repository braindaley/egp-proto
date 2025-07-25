
import { NextResponse, type NextRequest } from 'next/server';
import type { Bill, Subject, PolicyArea } from '@/types';

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
    
    bill.sponsors = bill.sponsors || [];

    const fetchPromises = [];

    // Summaries
    if (bill.summaries?.url) {
        fetchPromises.push(
            fetch(`${bill.summaries.url}&api_key=${API_KEY}`, { signal: AbortSignal.timeout(10000) })
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data?.summaries?.length > 0) {
                    const sorted = [...data.summaries].sort((a, b) => new Date(b.updateDate).getTime() - new Date(a.updateDate).getTime());
                    bill.summaries.items = sorted;
                    bill.allSummaries = sorted;
                    bill.summaries.summary = sorted[0];
                }
            }).catch(e => console.log('Summaries fetch failed:', e.message))
        );
    }
    
    // Actions
     if (bill.actions?.url) {
        fetchPromises.push(
             fetch(`${bill.actions.url}&api_key=${API_KEY}`, { signal: AbortSignal.timeout(10000) })
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data?.actions?.length > 0) {
                    bill.actions.items = data.actions;
                }
            }).catch(e => console.log('Actions fetch failed:', e.message))
        );
    }
    
    // Committees
     if (bill.committees?.url) {
        fetchPromises.push(
             fetch(`${bill.committees.url}&api_key=${API_KEY}`, { signal: AbortSignal.timeout(10000) })
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data?.committees?.length > 0) {
                    bill.committees.items = data.committees;
                }
            }).catch(e => console.log('Committees fetch failed:', e.message))
        );
    }

    // Subjects
    if (bill.subjects?.url) {
        const fetchAllSubjects = async () => {
            let allSubjects: (Subject | PolicyArea)[] = [];
            let nextUrl: string | undefined = `${bill.subjects.url}&api_key=${API_KEY}`;
            while (nextUrl) {
                try {
                    const res = await fetch(nextUrl, { signal: AbortSignal.timeout(10000) });
                    if (!res.ok) break;
                    const data = await res.json();
                    const legislativeSubjects = data.subjects?.legislativeSubjects || [];
                    const policyArea = data.subjects?.policyArea ? [data.subjects.policyArea] : [];
                    allSubjects.push(...legislativeSubjects, ...policyArea);
                    nextUrl = data.pagination?.next ? `${data.pagination.next}&api_key=${API_KEY}` : undefined;
                } catch (e) {
                    console.log('A subject page fetch failed:', e.message);
                    break;
                }
            }
            if (allSubjects.length > 0) {
                bill.subjects.items = allSubjects;
            }
        };
        fetchPromises.push(fetchAllSubjects());
    }

    await Promise.all(fetchPromises);
    
    // Initialize any missing data structures to prevent client errors
    bill.cosponsors = bill.cosponsors || { count: 0, url: '', items: [] };
    bill.committees = bill.committees || { count: 0, items: [] };
    bill.actions = bill.actions || { count: 0, items: [] };
    bill.amendments = bill.amendments || { count: 0, items: [] };
    bill.relatedBills = bill.relatedBills || { count: 0, items: [] };
    bill.subjects = bill.subjects || { count: 0, items: [] };
    bill.textVersions = bill.textVersions || { count: 0, items: [] };
    bill.summaries = bill.summaries || { count: 0, items: [] };
    bill.allSummaries = bill.allSummaries || [];

    return NextResponse.json(bill);

  } catch (error) {
    console.error('Server API Error in bill detail route:', error);
    return NextResponse.json({ error: 'Failed to fetch bill details' }, { status: 500 });
  }
}
