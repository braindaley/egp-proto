import { NextResponse } from 'next/server';
import type { Bill, Subject, PolicyArea } from '@/types';
import { mapApiSubjectToAllowed, ALLOWED_SUBJECTS } from '@/lib/subjects';

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
  [key: string]: any;
}

function transformApiBillToBill(apiBill: CongressBill, assignedSubjects: string[] = []): Bill {
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
      count: assignedSubjects.length, 
      items: assignedSubjects.map(name => ({ name }))
    },
    summaries: { count: 0 },
    allSummaries: [],
    actions: { count: 0, items: [] },
    relatedBills: { count: 0, items: [] },
    amendments: { count: 0, items: [] },
    textVersions: { count: 0, items: [] }
  };
}

// Check if a bill matches the requested subjects based on its data
function billMatchesSubjects(bill: CongressBill, requestedSubjects: string[]): { matches: boolean, matchedSubjects: string[], billSubjects: string[] } {
  const matchedSubjects: string[] = [];
  const billSubjects: string[] = [];
  
  // Get all subjects from the bill
  if (bill.subjects?.policyArea?.name) {
    billSubjects.push(bill.subjects.policyArea.name);
  }
  
  if (bill.subjects?.legislativeSubjects) {
    bill.subjects.legislativeSubjects.forEach(subject => {
      if (subject.name) {
        billSubjects.push(subject.name);
      }
    });
  }

  console.log(`🔎 Checking ${bill.type} ${bill.number}:`);
  console.log(`   Requested: [${requestedSubjects.join(', ')}]`);
  console.log(`   Bill subjects: [${billSubjects.join(', ')}]`);

  // Check for matches
  for (const requestedSubject of requestedSubjects) {
    for (const billSubject of billSubjects) {
      // Exact match
      if (billSubject === requestedSubject) {
        console.log(`   ✅ EXACT MATCH: "${requestedSubject}"`);
        matchedSubjects.push(requestedSubject);
        break;
      }
      // Case insensitive match
      else if (billSubject.toLowerCase() === requestedSubject.toLowerCase()) {
        console.log(`   ✅ CASE MATCH: "${requestedSubject}"`);
        matchedSubjects.push(requestedSubject);
        break;
      }
      // Contains match
      else if (billSubject.toLowerCase().includes(requestedSubject.toLowerCase()) ||
               requestedSubject.toLowerCase().includes(billSubject.toLowerCase())) {
        console.log(`   ⚠️ PARTIAL MATCH: "${requestedSubject}" <-> "${billSubject}"`);
        matchedSubjects.push(requestedSubject);
        break;
      }
      // Animal keyword matching
      else if (requestedSubject.toLowerCase() === 'animals' && 
               (billSubject.toLowerCase().includes('animal') || 
                billSubject.toLowerCase().includes('wildlife') ||
                billSubject.toLowerCase().includes('livestock') ||
                billSubject.toLowerCase().includes('pet'))) {
        console.log(`   🐾 ANIMAL KEYWORD MATCH: "${requestedSubject}" found in "${billSubject}"`);
        matchedSubjects.push(requestedSubject);
        break;
      }
    }
  }

  const matches = matchedSubjects.length > 0;
  console.log(`   Result: ${matches ? '✅ MATCHES' : '❌ NO MATCH'}`);

  return {
    matches,
    matchedSubjects,
    billSubjects
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const subjects = searchParams.get('subjects');
  const congress = searchParams.get('congress') || '119';
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');

  console.log(`🚀 API called with:`, {
    subjects: subjects,
    congress: congress,
    limit: limit,
    offset: offset
  });

  const API_KEY = process.env.CONGRESS_API_KEY;
  if (!API_KEY) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  try {
    let debugInfo: any = {};
    const hasSubjectsFilter = subjects && subjects.trim().length > 0;
    
    console.log(`🔍 hasSubjectsFilter: ${hasSubjectsFilter}`);

    if (!hasSubjectsFilter) {
      console.log('📝 No subjects filter - getting recent bills...');
      
      // No subjects filter - get recent bills
      const apiUrl = `https://api.congress.gov/v3/bill/${congress}?api_key=${API_KEY}&format=json&limit=${limit}&offset=${offset}&sort=updateDate+desc`;
      
      const response = await fetch(apiUrl, {
        headers: { 'User-Agent': 'BillTracker/1.0' },
      });

      if (!response.ok) {
        throw new Error(`Congress API responded with ${response.status}`);
      }

      const data = await response.json();
      const bills = data.bills || [];
      
      const processedBills = bills.map((bill: CongressBill) => transformApiBillToBill(bill, []));
      
      debugInfo = { 
        mode: 'recent', 
        apiUrl: apiUrl.replace(API_KEY, 'API_KEY'),
        originalCount: bills.length 
      };

      return NextResponse.json({
        bills: processedBills,
        pagination: {
          count: processedBills.length,
          offset: offset,
          hasMore: true,
          total: null
        },
        debug: debugInfo
      });

    } else {
      // HYBRID APPROACH: Search + Subject Verification
      const subjectList = subjects!.split(',').map(s => s.trim()).filter(s => s.length > 0);
      console.log('🎯 FILTERING MODE - Requested subjects:', subjectList);

      debugInfo = {
        mode: 'filtered',
        requestedSubjects: subjectList,
        strategy: 'hybrid_search_and_verify',
        candidatesFromSearch: 0,
        candidatesChecked: 0,
        actuallyMatched: 0,
        sampleBillSubjects: [] as any[],
        searchAttempts: [] as any[]
      };

      let candidateBills: CongressBill[] = [];

      // Step 1: Use Congress.gov search to get candidates
      for (const subject of subjectList) {
        console.log(`🔍 Getting candidates for subject: "${subject}"`);

        // Try policyArea search
        try {
          const policyUrl = `https://api.congress.gov/v3/bill/${congress}?api_key=${API_KEY}&format=json&limit=100&sort=updateDate+desc&policyArea=${encodeURIComponent(subject)}`;
          
          console.log(`🔍 Searching policyArea for "${subject}"`);
          
          const response = await fetch(policyUrl, {
            headers: { 'User-Agent': 'BillTracker/1.0' },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.bills && data.bills.length > 0) {
              console.log(`📋 Found ${data.bills.length} candidates for "${subject}" via policyArea`);
              
              // Add to candidates (remove duplicates by bill key)
              data.bills.forEach((bill: CongressBill) => {
                const key = `${bill.type}-${bill.number}`;
                if (!candidateBills.find(b => `${b.type}-${b.number}` === key)) {
                  candidateBills.push(bill);
                }
              });

              debugInfo.searchAttempts.push({
                subject,
                method: 'policyArea',
                found: data.bills.length,
                success: true
              });
              
              continue; // Found candidates, try next subject
            }
          }
        } catch (error) {
          console.log(`❌ policyArea search failed for "${subject}":`, error);
        }

        // Try subject parameter search
        try {
          const subjectUrl = `https://api.congress.gov/v3/bill/${congress}?api_key=${API_KEY}&format=json&limit=100&sort=updateDate+desc&subject=${encodeURIComponent(subject)}`;
          
          console.log(`🔍 Searching subject param for "${subject}"`);
          
          const response = await fetch(subjectUrl, {
            headers: { 'User-Agent': 'BillTracker/1.0' },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.bills && data.bills.length > 0) {
              console.log(`📋 Found ${data.bills.length} candidates for "${subject}" via subject param`);
              
              // Add to candidates (remove duplicates)
              data.bills.forEach((bill: CongressBill) => {
                const key = `${bill.type}-${bill.number}`;
                if (!candidateBills.find(b => `${b.type}-${b.number}` === key)) {
                  candidateBills.push(bill);
                }
              });

              debugInfo.searchAttempts.push({
                subject,
                method: 'subject',
                found: data.bills.length,
                success: true
              });
            }
          }
        } catch (error) {
          console.log(`❌ subject search failed for "${subject}":`, error);
          debugInfo.searchAttempts.push({
            subject,
            method: 'subject',
            found: 0,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      debugInfo.candidatesFromSearch = candidateBills.length;
      console.log(`📋 Total candidates from search: ${candidateBills.length}`);

      // Step 2: Fetch actual subjects for candidates and verify matches
      let verifiedBills: { bill: CongressBill, subjects: string[] }[] = [];

      for (const candidate of candidateBills.slice(0, 50)) { // Limit to prevent timeouts
        debugInfo.candidatesChecked++;
        
        try {
          // Fetch the bill's actual subjects
          const subjectsUrl = `https://api.congress.gov/v3/bill/${candidate.congress}/${candidate.type.toLowerCase()}/${candidate.number}/subjects?api_key=${API_KEY}&format=json`;
          
          const subjectsResponse = await fetch(subjectsUrl, {
            headers: { 'User-Agent': 'BillTracker/1.0' },
          });

          if (subjectsResponse.ok) {
            const subjectsData = await subjectsResponse.json();
            
            // Create bill with actual subject data
            const billWithSubjects: CongressBill = {
              ...candidate,
              subjects: subjectsData.subjects || { count: 0 }
            };

            // Check if it matches our requested subjects
            const { matches, matchedSubjects, billSubjects } = billMatchesSubjects(billWithSubjects, subjectList);
            
            // Add to debug sample (first 5)
            if (debugInfo.sampleBillSubjects.length < 5) {
              debugInfo.sampleBillSubjects.push({
                bill: `${candidate.type} ${candidate.number}`,
                title: candidate.title.substring(0, 80) + '...',
                policyArea: subjectsData.subjects?.policyArea?.name || 'None',
                legislativeSubjects: subjectsData.subjects?.legislativeSubjects?.map((s: any) => s.name) || [],
                matches: matches,
                matchedSubjects: matchedSubjects
              });
            }

            if (matches) {
              verifiedBills.push({ bill: billWithSubjects, subjects: matchedSubjects });
              debugInfo.actuallyMatched++;
              
              console.log(`✅ VERIFIED MATCH: ${candidate.type} ${candidate.number} - subjects: [${billSubjects.join(', ')}]`);
              
              // Stop when we have enough
              if (verifiedBills.length >= limit) {
                break;
              }
            } else {
              console.log(`❌ NO MATCH: ${candidate.type} ${candidate.number} - subjects: [${billSubjects.join(', ')}]`);
            }
          } else {
            console.log(`❌ Failed to fetch subjects for ${candidate.type} ${candidate.number}: ${subjectsResponse.status}`);
          }
        } catch (error) {
          console.log(`❌ Error checking ${candidate.type} ${candidate.number}:`, error);
        }
      }

      console.log(`🎯 Final results: ${verifiedBills.length} verified matches out of ${candidateBills.length} candidates`);

      // Transform the verified bills
      const processedBills = verifiedBills
        .map(({ bill, subjects: assignedSubjects }) => transformApiBillToBill(bill, assignedSubjects));

      return NextResponse.json({
        bills: processedBills,
        pagination: {
          count: processedBills.length,
          offset: offset,
          hasMore: false, // We've verified all matches
          total: processedBills.length
        },
        debug: debugInfo
      });
    }

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