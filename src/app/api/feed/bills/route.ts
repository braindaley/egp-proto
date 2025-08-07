import { NextResponse, type NextRequest } from 'next/server';
import type { Bill, CongressApiResponse, FeedBill, Sponsor } from '@/types';
import { getFirestore, collection, getDocs, writeBatch, Timestamp, query, orderBy, limit, doc, where } from 'firebase/firestore';
import { app } from '@/lib/firebase';

// This function determines a simplified status of the bill
function getBillStatus(latestActionText: string): string {
    const lowerCaseAction = latestActionText.toLowerCase();

    if (lowerCaseAction.includes('became public law')) {
        return 'Became Law';
    }
    if (lowerCaseAction.includes('presented to president')) {
        return 'To President';
    }
    if (lowerCaseAction.includes('passed house') || lowerCaseAction.includes('passed/agreed to in house')) {
        return 'Passed House';
    }
     if (lowerCaseAction.includes('passed senate') || lowerCaseAction.includes('passed/agreed to in senate')) {
        return 'Passed Senate';
    }
    if (lowerCaseAction.includes('committee')) {
        return 'In Committee';
    }
    return 'Introduced';
}

function calculateImportanceScore(bill: Bill, latestActionText: string): number {
  let score = 0;
  const actionText = (latestActionText || '').toLowerCase();
  
  // HIGH PRIORITY: Advanced legislative stages
  if (actionText.includes('became public law')) score += 50;
  if (actionText.includes('presented to president')) score += 40;
  if (actionText.includes('passed house') && actionText.includes('passed senate')) score += 35;
  if (actionText.includes('passed house') || actionText.includes('passed senate')) score += 25;
  if (actionText.includes('floor vote') || actionText.includes('scheduled for vote')) score += 30;
  if (actionText.includes('reported by committee') || actionText.includes('committee reported')) score += 15;
  
  // MEDIUM PRIORITY: Committee activity vs just introduced  
  if (actionText.includes('committee') && !actionText.includes('referred to')) score += 8;
  if (actionText.includes('referred to the committee')) score += 2;
  
  // TOPIC PRIORITY: High-impact subjects
  const title = (bill.title || '').toLowerCase();
  const highPriorityTerms = ['budget', 'appropriation', 'defense', 'security', 'healthcare', 'infrastructure', 'economy', 'tax', 'climate', 'energy', 'education'];
  if (highPriorityTerms.some(term => title.includes(term))) score += 10;
  if (title.includes('bipartisan')) score += 15;
  
  // SUPPORT: Use cosponsors if available from detailed API call
  const cosponsorCount = bill.cosponsors?.count || 0;
  if (cosponsorCount > 50) score += 12;
  else if (cosponsorCount > 20) score += 8;
  else if (cosponsorCount > 10) score += 5;
  
  // AGE BONUS: Recent activity gets slight boost
  if (bill.latestAction?.actionDate) {
    const actionDate = new Date(bill.latestAction.actionDate);
    const daysSinceAction = (Date.now() - actionDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceAction <= 7) score += 3;
  }
  
  return Math.max(0, score);
}

// Function to process long title into shorter version
function processLongTitle(fullTitle: string): string {
  if (!fullTitle) return 'No title';
  
  // If it's already reasonably short (under 80 chars), keep it
  if (fullTitle.length <= 80) {
    return fullTitle;
  }
  
  // Try to find a shorter version by splitting on common separators
  const parts = fullTitle.split(/[;,]|\s+-\s+/);
  const firstPart = parts[0]?.trim();
  
  // If the first part is reasonable length and doesn't contain "official title", use it
  if (firstPart && firstPart.length <= 80 && !firstPart.toLowerCase().includes('official title')) {
    return firstPart;
  }
  
  // Otherwise, truncate intelligently
  if (fullTitle.length > 100) {
    const truncated = fullTitle.substring(0, 100);
    const lastSpace = truncated.lastIndexOf(' ');
    return lastSpace > 50 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
  }
  
  return fullTitle;
}

// Function to fetch member details including image
async function fetchMemberDetails(bioguideId: string, API_KEY: string): Promise<{imageUrl: string | null}> {
  try {
    const memberUrl = `https://api.congress.gov/v3/member/${bioguideId}?api_key=${API_KEY}`;
    
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(memberUrl, { 
      signal: controller.signal,
      next: { revalidate: 86400 } // Cache member images for 24 hours
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.warn(`Failed to fetch member details for ${bioguideId}: ${response.status}`);
      return { imageUrl: null };
    }
    
    const data = await response.json();
    const imageUrl = data.member?.depiction?.imageUrl || null;
    
    return { imageUrl };
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn(`Member request timeout for ${bioguideId}`);
    } else {
      console.warn(`Error fetching member details for ${bioguideId}:`, error);
    }
    return { imageUrl: null };
  }
}

// Function to fetch detailed bill information
async function fetchBillDetails(congress: number, type: string, number: number, API_KEY: string): Promise<{
  sponsors: any[];
  cosponsors?: { count: number };
  title?: string;
  subjects?: string[];
}> {
  try {
    const billUrl = `https://api.congress.gov/v3/bill/${congress}/${type.toLowerCase()}/${number}?api_key=${API_KEY}`;
    
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    const response = await fetch(billUrl, { 
      signal: controller.signal,
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.warn(`Failed to fetch bill details for ${congress}/${type}/${number}: ${response.status}`);
      return { sponsors: [], subjects: ['General Legislation'] };
    }
    
    const data = await response.json();
    
    // Extract subjects more safely
    let subjects: string[] = [];
    try {
      if (data.bill?.subjects?.policyArea?.name) {
        subjects.push(data.bill.subjects.policyArea.name);
      }
      if (data.bill?.subjects?.legislativeSubjects && Array.isArray(data.bill.subjects.legislativeSubjects)) {
        const legSubjects = data.bill.subjects.legislativeSubjects
          .map((s: any) => s?.name)
          .filter(Boolean)
          .slice(0, 3); // Limit to first 3 to avoid too long strings
        subjects.push(...legSubjects);
      }
    } catch (subjectError) {
      console.warn('Error parsing subjects:', subjectError);
    }
    
    if (subjects.length === 0) {
      subjects = ['General Legislation'];
    }
    
    return {
      sponsors: data.bill?.sponsors || [],
      cosponsors: data.bill?.cosponsors,
      title: data.bill?.title,
      subjects
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn(`Request timeout for bill ${congress}/${type}/${number}`);
    } else {
      console.warn(`Error fetching bill details for ${congress}/${type}/${number}:`, error);
    }
    return { sponsors: [], subjects: ['General Legislation'] };
  }
}

export async function GET(req: NextRequest) {
  const API_KEY = process.env.CONGRESS_API_KEY;

  if (!API_KEY || API_KEY === 'your_congress_api_key_here') {
    console.error('Missing CONGRESS_API_KEY environment variable');
    return NextResponse.json({ error: 'Server configuration error: Congress API key is missing or not set.' }, { status: 500 });
  }

  const db = getFirestore(app);
  const cacheCollection = collection(db, 'cached_bills');
  const sixtyMinutesAgo = Timestamp.fromMillis(Date.now() - 60 * 60 * 1000);

  try {
    // Set overall timeout for the entire operation
    const overallTimeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Operation timeout')), 25000) // 25 seconds max
    );
    
    const processData = async () => {
      // Use current congress (119) - hardcoded for prototype
      const latestCongress = '119';

      // 1. Check for fresh cache for congress 119
      const q = query(
        cacheCollection, 
        where('billData.congress', '==', 119),
        where('cachedAt', '>', sixtyMinutesAgo), 
        orderBy('cachedAt', 'desc'), 
        limit(500)
      );
      const cacheSnapshot = await getDocs(q);
      
      if (!cacheSnapshot.empty) {
          const bills = cacheSnapshot.docs.map(doc => doc.data().billData as FeedBill);
          if (bills.length > 0) {
              console.log(`Serving ${bills.length} bills for Congress ${latestCongress} from fresh Firestore cache.`);
              const sortedBills = bills.sort((a, b) => b.importanceScore - a.importanceScore);
              return NextResponse.json({ bills: sortedBills });
          }
      }

      console.log(`Cache is stale or empty for Congress ${latestCongress}. Fetching new data from Congress API.`);

      // 2. Fetch new data from Congress API for congress 119
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const updatedSince = thirtyDaysAgo.toISOString().split('T')[0];
      const listUrl = `https://api.congress.gov/v3/bill/${latestCongress}?updatedSince=${updatedSince}&limit=50&sort=updateDate+desc&api_key=${API_KEY}`;
      
      const listRes = await fetch(listUrl, { next: { revalidate: 600 } });
      if (!listRes.ok) throw new Error(`Failed to fetch bill list from Congress API: ${listRes.status}`);
      
      const listData: CongressApiResponse = await listRes.json();
      const billItems: Bill[] = listData.bills || [];
      if (billItems.length === 0) return NextResponse.json({ bills: [] });

      console.log(`Fetched ${billItems.length} bills from Congress API. Now fetching detailed information...`);

      // 3. Process bills WITH detailed sponsor information (optimized)
      const feedBills: FeedBill[] = [];
      
      // Process bills in smaller batches with better error handling
      const batchSize = 5;
      const maxRetries = 2;
      
      for (let i = 0; i < billItems.length; i += batchSize) {
        const batch = billItems.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (bill): Promise<FeedBill | null> => {
          if (!bill || !bill.latestAction) return null;

          let billDetails = { sponsors: [], subjects: ['General Legislation'] };
          let sponsorImageUrl: string | null = null;
          let sponsorFullName = 'Sponsor information unavailable';
          let sponsorParty = 'N/A';
          
          try {
            // Fetch detailed bill information with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
            
            billDetails = await Promise.race([
              fetchBillDetails(bill.congress, bill.type, bill.number, API_KEY),
              new Promise<any>((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), 5000)
              )
            ]);
            clearTimeout(timeoutId);
            
            // Get primary sponsor info
            const primarySponsor = billDetails.sponsors[0];
            if (primarySponsor) {
              sponsorFullName = primarySponsor.fullName || 'Unknown';
              sponsorParty = primarySponsor.party || 'N/A';
              
              // Fetch sponsor image for all bills with bioguideId
              if (primarySponsor.bioguideId) {
                try {
                  const memberDetails = await fetchMemberDetails(primarySponsor.bioguideId, API_KEY);
                  sponsorImageUrl = memberDetails.imageUrl;
                } catch (imageError) {
                  console.warn(`Failed to fetch image for ${primarySponsor.bioguideId}:`, imageError);
                  // Continue without image
                }
              }
            }
          } catch (error) {
            console.warn(`Failed to fetch details for bill ${bill.type} ${bill.number}:`, error);
            // Continue with basic information
          }

          // Use detailed bill title if available, otherwise fall back to list title
          const billTitle = billDetails.title || bill.title;
          const importanceScore = calculateImportanceScore({
            ...bill,
            cosponsors: billDetails.cosponsors
          }, bill.latestAction.text);

          return {
              shortTitle: processLongTitle(billTitle).trim(),
              billNumber: `${bill.type} ${bill.number}`,
              congress: bill.congress,
              type: bill.type,
              number: bill.number,
              latestAction: bill.latestAction,
              sponsorParty,
              sponsorFullName,
              sponsorImageUrl,
              committeeName: Array.isArray(billDetails.subjects) ? billDetails.subjects.join(', ') : 'General Legislation',
              status: getBillStatus(bill.latestAction.text),
              importanceScore,
          };
        });

        try {
          const batchResults = await Promise.allSettled(batchPromises);
          const validResults = batchResults
            .filter((result): result is PromiseFulfilledResult<FeedBill | null> => 
              result.status === 'fulfilled' && result.value !== null)
            .map(result => result.value as FeedBill);
          
          feedBills.push(...validResults);
          
          // Add a delay between batches to respect API limits
          if (i + batchSize < billItems.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        } catch (batchError) {
          console.warn(`Batch ${i} failed:`, batchError);
          // Continue with next batch
        }
      }
      
      console.log(`Processed ${feedBills.length} bills with detailed sponsor information.`);
      
      // 4. Cache the results in Firestore
      if (feedBills.length > 0) {
          console.log('💾 Starting to cache', feedBills.length, 'bills to Firestore...'); // Debug log
          try {
            const batch = writeBatch(db);
            feedBills.forEach((bill, index) => {
                const billId = `${bill.congress}-${bill.type}-${bill.number}`;
                const docRef = doc(cacheCollection, billId);
                console.log(`📝 Adding bill ${index + 1}/${feedBills.length} to cache: ${billId}`); // Debug log
                batch.set(docRef, {
                    billId: billId,
                    billData: bill,
                    importanceScore: bill.importanceScore,
                    cachedAt: Timestamp.now(),
                    source: 'congress_api'
                });
            });
            await batch.commit();
            console.log(`✅ Successfully cached ${feedBills.length} bills to Firestore collection 'cached_bills'.`);
          } catch (cacheError) {
            console.error('🚨 Error caching bills to Firestore:', cacheError);
            // Continue without caching - don't fail the whole request
          }
      } else {
        console.log('⚠️ No bills to cache');
      }

      // 5. Return sorted results
      const sortedBills = feedBills.sort((a, b) => b.importanceScore - a.importanceScore);
      return NextResponse.json({ bills: sortedBills });
    };

    // Race between processing and timeout
    return await Promise.race([processData(), overallTimeout]);

  } catch (error) {
    console.error('Error in /api/feed/bills:', error);
    
    // If operation timed out, try to return cached data even if older
    if (error instanceof Error && error.message === 'Operation timeout') {
      console.log('Operation timed out, checking for older cached data...');
      try {
        const oldCacheQuery = query(
          cacheCollection, 
          where('billData.congress', '==', 119),
          orderBy('cachedAt', 'desc'), 
          limit(100)
        );
        const oldCacheSnapshot = await getDocs(oldCacheQuery);
        
        if (!oldCacheSnapshot.empty) {
          const bills = oldCacheSnapshot.docs.map(doc => doc.data().billData as FeedBill);
          console.log(`Serving ${bills.length} bills from older cache due to timeout.`);
          const sortedBills = bills.sort((a, b) => b.importanceScore - a.importanceScore);
          return NextResponse.json({ bills: sortedBills });
        }
      } catch (cacheError) {
        console.error('Failed to retrieve old cache:', cacheError);
      }
    }
    
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}