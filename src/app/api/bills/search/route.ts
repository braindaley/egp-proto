import { NextResponse } from 'next/server';
import type { Bill, Subject, PolicyArea } from '@/types';
import { mapApiSubjectToAllowed, ALLOWED_SUBJECTS, getApiSubjectsForCategory } from '@/lib/subjects';

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
  // Generate internal URL instead of using the congress.gov API URL
  const billTypeSlug = (apiBill.type ?? '').toLowerCase().replace(/\./g, '');
  const internalUrl = `/federal/bill/${apiBill.congress ?? 119}/${billTypeSlug}/${apiBill.number ?? ''}`;

  return {
    congress: (apiBill.congress ?? 119) as number,
    number: (apiBill.number ?? '') as string,
    type: (apiBill.type ?? '') as string,
    title: (apiBill.title ?? '') as string,
    shortTitle: `${apiBill.type ?? ''} ${apiBill.number ?? ''} - ${apiBill.title ?? ''}`,
    url: internalUrl,
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

  // Check for matches by mapping API subjects to our categories
  for (const requestedSubject of requestedSubjects) {
    let found = false;
    
    for (const billSubject of billSubjects) {
      // First try to map the bill's API subject to our category
      const mappedCategory = mapApiSubjectToAllowed(billSubject);
      
      if (mappedCategory === requestedSubject) {
        console.log(`   ✅ MAPPED MATCH: "${billSubject}" -> "${mappedCategory}" matches "${requestedSubject}"`);
        matchedSubjects.push(requestedSubject);
        found = true;
        break;
      }
      
      // Fallback to exact/case-insensitive matching
      if (billSubject === requestedSubject || billSubject.toLowerCase() === requestedSubject.toLowerCase()) {
        console.log(`   ✅ DIRECT MATCH: "${requestedSubject}"`);
        matchedSubjects.push(requestedSubject);
        found = true;
        break;
      }
    }
    
    if (!found) {
      console.log(`   ❌ NO MATCH for "${requestedSubject}"`);
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
  const query = searchParams.get('q'); // Add support for general text search
  const congress = searchParams.get('congress') || '119';
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');

  console.log(`🚀 API called with:`, {
    subjects: subjects,
    query: query,
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
    
    // Handle text search query (e.g., "HR 14" or "14")
    if (query && query.trim().length > 0) {
      console.log(`🔎 Text search for: "${query}"`);
      
      // Parse the query to extract bill type and number if provided
      const upperQuery = query.toUpperCase().trim();
      const billPattern = /^(HR|S|HJRES|SJRES|HCONRES|SCONRES|HRES|SRES)?\s*(\d+)$/i;
      const match = upperQuery.match(billPattern);
      
      if (match) {
        const billType = match[1] || ''; // Could be empty
        const billNumber = match[2];
        
        console.log(`📋 Detected bill search: type="${billType}", number="${billNumber}"`);
        
        // If we have a specific bill type and number, try to fetch it directly
        if (billType && billNumber) {
          try {
            const directUrl = `https://api.congress.gov/v3/bill/${congress}/${billType.toLowerCase()}/${billNumber}?api_key=${API_KEY}&format=json`;
            const directResponse = await fetch(directUrl, {
              headers: { 'User-Agent': 'BillTracker/1.0' },
            });
            
            if (directResponse.ok) {
              const directData = await directResponse.json();
              if (directData.bill) {
                return NextResponse.json({
                  bills: [transformApiBillToBill(directData.bill, [])],
                  pagination: { count: 1, offset: 0, hasMore: false, total: 1 },
                  debug: { mode: 'direct_lookup', query }
                });
              }
            }
          } catch (error) {
            console.error('Direct lookup failed:', error);
          }
        }
        
        // If no type provided or direct lookup failed, search all types with that number
        if (billNumber) {
          const billTypes = billType ? [billType.toLowerCase()] : ['hr', 's', 'hjres', 'sjres', 'hconres', 'sconres', 'hres', 'sres'];
          const foundBills: Bill[] = [];
          
          for (const type of billTypes) {
            try {
              const searchUrl = `https://api.congress.gov/v3/bill/${congress}/${type}/${billNumber}?api_key=${API_KEY}&format=json`;
              const response = await fetch(searchUrl, {
                headers: { 'User-Agent': 'BillTracker/1.0' },
              });
              
              if (response.ok) {
                const data = await response.json();
                if (data.bill) {
                  foundBills.push(transformApiBillToBill(data.bill, []));
                }
              }
            } catch (error) {
              // Continue searching other types
            }
          }
          
          if (foundBills.length > 0) {
            return NextResponse.json({
              bills: foundBills,
              pagination: { count: foundBills.length, offset: 0, hasMore: false, total: foundBills.length },
              debug: { mode: 'number_search', query, billNumber }
            });
          }
        }
      }
      
      // If not a bill number search, fall back to getting recent bills
      // This could be enhanced to search bill titles in the future
      console.log('📝 Falling back to recent bills for text search');
    }
    
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

        // Get the actual API subjects that map to this category
        const apiSubjects = getApiSubjectsForCategory(subject);
        console.log(`🔍 API subjects for "${subject}": [${apiSubjects.join(', ')}]`);

        // If we have mapped API subjects, search for those
        const searchTerms = apiSubjects.length > 0 ? apiSubjects : [subject];

        for (const searchTerm of searchTerms) {
          // Try policyArea search
          try {
            const policyUrl = `https://api.congress.gov/v3/bill/${congress}?api_key=${API_KEY}&format=json&limit=100&sort=updateDate+desc&policyArea=${encodeURIComponent(searchTerm)}`;
            
            console.log(`🔍 Searching policyArea for "${searchTerm}"`);
            
            const response = await fetch(policyUrl, {
              headers: { 'User-Agent': 'BillTracker/1.0' },
            });

            if (response.ok) {
              const data = await response.json();
              if (data.bills && data.bills.length > 0) {
                console.log(`📋 Found ${data.bills.length} candidates for "${searchTerm}" via policyArea`);
                
                // Add to candidates (remove duplicates by bill key)
                data.bills.forEach((bill: CongressBill) => {
                  const key = `${bill.type}-${bill.number}`;
                  if (!candidateBills.find(b => `${b.type}-${b.number}` === key)) {
                    candidateBills.push(bill);
                  }
                });

                debugInfo.searchAttempts.push({
                  subject: `${subject} -> ${searchTerm}`,
                  method: 'policyArea',
                  found: data.bills.length,
                  success: true
                });
                
                continue; // Found candidates, try next search term
              }
            }
          } catch (error) {
            console.log(`❌ policyArea search failed for "${searchTerm}":`, error);
          }

          // Try subject parameter search
          try {
            const subjectUrl = `https://api.congress.gov/v3/bill/${congress}?api_key=${API_KEY}&format=json&limit=100&sort=updateDate+desc&subject=${encodeURIComponent(searchTerm)}`;
            
            console.log(`🔍 Searching subject param for "${searchTerm}"`);
            
            const response = await fetch(subjectUrl, {
              headers: { 'User-Agent': 'BillTracker/1.0' },
            });

            if (response.ok) {
              const data = await response.json();
              if (data.bills && data.bills.length > 0) {
                console.log(`📋 Found ${data.bills.length} candidates for "${searchTerm}" via subject param`);
                
                // Add to candidates (remove duplicates)
                data.bills.forEach((bill: CongressBill) => {
                  const key = `${bill.type}-${bill.number}`;
                  if (!candidateBills.find(b => `${b.type}-${b.number}` === key)) {
                    candidateBills.push(bill);
                  }
                });

                debugInfo.searchAttempts.push({
                  subject: `${subject} -> ${searchTerm}`,
                  method: 'subject',
                  found: data.bills.length,
                  success: true
                });
              }
            }
          } catch (error) {
            console.log(`❌ subject search failed for "${searchTerm}":`, error);
            debugInfo.searchAttempts.push({
              subject: `${subject} -> ${searchTerm}`,
              method: 'subject',
              found: 0,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
      }

      debugInfo.candidatesFromSearch = candidateBills.length;
      console.log(`📋 Total candidates from search: ${candidateBills.length}`);

      // Step 2: Fetch actual subjects for candidates and verify matches
      let verifiedBills: { bill: CongressBill, subjects: string[] }[] = [];

      for (const candidate of candidateBills.slice(0, 25)) { // Limit to prevent timeouts
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

      const response = NextResponse.json({
        bills: processedBills,
        pagination: {
          count: processedBills.length,
          offset: offset,
          hasMore: false, // We've verified all matches
          total: processedBills.length
        },
        debug: debugInfo
      });
      
      // Cache for 10 minutes since this is live data from Congress API
      response.headers.set('Cache-Control', 'public, max-age=600, s-maxage=600');
      response.headers.set('CDN-Cache-Control', 'public, max-age=600');
      return response;
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