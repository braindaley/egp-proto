
import { NextResponse, type NextRequest } from 'next/server';
import type { Bill, CongressApiResponse, FeedBill, Sponsor, Summary, Cosponsor, ApiCollection } from '@/types';
import { getFirestore, collection, getDocs, writeBatch, Timestamp, query, orderBy, limit, doc, where } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { convert } from 'html-to-text';

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
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
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
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
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
  cosponsors?: ApiCollection<Cosponsor> & { url: string };
  title?: string;
  subjects?: string[];
  summary?: string;
}> {
  try {
    const billUrl = `https://api.congress.gov/v3/bill/${congress}/${type.toLowerCase()}/${number}?api_key=${API_KEY}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    
    const response = await Promise.race([
        fetch(billUrl, { signal: controller.signal, next: { revalidate: 3600 } }),
        new Promise<Response>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 4000))
    ]);
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`Failed to fetch bill details for ${congress}/${type}/${number}: ${response.status}`);
      return { sponsors: [], subjects: ['General Legislation'], summary: undefined };
    }
    
    const data = await response.json();
    const bill = data.bill || {};
    
    // Fetch summary
    let summaryText: string | undefined = undefined;
    if (bill.summaries?.url) {
        try {
            const summaryRes = await fetch(`${bill.summaries.url}&api_key=${API_KEY}`);
            if (summaryRes.ok) {
                const summaryData = await summaryRes.json();
                if (summaryData.summaries?.length > 0) {
                    const latestSummary = summaryData.summaries.sort((a: Summary, b: Summary) => new Date(b.updateDate).getTime() - new Date(a.updateDate).getTime())[0];
                    summaryText = convert(latestSummary.text, { wordwrap: 130 });
                }
            }
        } catch (summaryError) {
            console.warn(`Could not fetch summary for ${bill.number}:`, summaryError);
        }
    }

    // Extract subjects
    let subjects: string[] = [];
    try {
      if (bill.subjects?.policyArea?.name) {
        subjects.push(bill.subjects.policyArea.name);
      }
      if (bill.subjects?.legislativeSubjects && Array.isArray(bill.subjects.legislativeSubjects)) {
        const legSubjects = bill.subjects.legislativeSubjects
          .map((s: any) => s?.name)
          .filter(Boolean)
          .slice(0, 3);
        subjects.push(...legSubjects);
      }
    } catch (subjectError) {
      console.warn('Error parsing subjects:', subjectError);
    }
    
    if (subjects.length === 0) {
      subjects = ['General Legislation'];
    }
    
    return {
      sponsors: bill.sponsors || [],
      cosponsors: bill.cosponsors,
      title: bill.title,
      subjects,
      summary: summaryText,
    };
  } catch (error: unknown) {
    if (error instanceof Error && (error.name === 'AbortError' || error.message === 'Timeout')) {
      console.warn(`Request timeout for bill ${congress}/${type}/${number}`);
    } else {
      console.warn(`Error fetching bill details for ${congress}/${type}/${number}:`, error);
    }
    return { sponsors: [], subjects: ['General Legislation'], summary: undefined };
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
    const overallTimeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Operation timeout')), 25000)
    );
    
    const processData = async () => {
      const latestCongress = '119';

      const q = query(cacheCollection, orderBy('cachedAt', 'desc'), limit(1));
      const cacheSnapshot = await getDocs(q);
      const latestDoc = cacheSnapshot.docs[0];

      if (latestDoc && latestDoc.data().cachedAt > sixtyMinutesAgo) {
          const allCachedQuery = query(
            cacheCollection, 
            orderBy('importanceScore', 'desc'),
            limit(50)
          );
          const allDocsSnapshot = await getDocs(allCachedQuery);
          const cachedBillsForCongress = allDocsSnapshot.docs
            .map(doc => doc.data().billData as FeedBill)
            .filter(bill => bill.congress === 119 && bill.status !== 'Became Law');

          if (cachedBillsForCongress.length > 0) {
             console.log(`Serving ${cachedBillsForCongress.length} bills for Congress ${latestCongress} from fresh Firestore cache.`);
             return NextResponse.json({ bills: cachedBillsForCongress });
          }
      }

      console.log(`Cache is stale or empty for Congress ${latestCongress}. Fetching new data from Congress API.`);

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

      const feedBills: FeedBill[] = [];
      const batchSize = 15;
      
      for (let i = 0; i < billItems.length; i += batchSize) {
        const batch = billItems.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (bill): Promise<FeedBill | null> => {
          if (!bill || !bill.latestAction) return null;

          const status = getBillStatus(bill.latestAction.text);
          if (status === 'Became Law') return null;

          let billDetails;
          try {
            billDetails = await fetchBillDetails(bill.congress, bill.type, parseInt(bill.number, 10), API_KEY);
          } catch (error) {
            console.warn(`Failed to fetch details for bill ${bill.type} ${bill.number}:`, error);
            billDetails = { sponsors: [], subjects: ['General Legislation'], summary: '' };
          }
          
          let sponsorImageUrl: string | null = null;
          let sponsorFullName = 'Sponsor information unavailable';
          let sponsorParty = 'N/A';
          const primarySponsor = billDetails.sponsors[0];
          
          if (primarySponsor) {
            sponsorFullName = primarySponsor.fullName || 'Unknown';
            sponsorParty = primarySponsor.party || 'N/A';
            if (primarySponsor.bioguideId) {
              try {
                const memberDetails = await fetchMemberDetails(primarySponsor.bioguideId, API_KEY);
                sponsorImageUrl = memberDetails.imageUrl;
              } catch (imageError) {
                console.warn(`Failed to fetch image for ${primarySponsor.bioguideId}:`, imageError);
              }
            }
          }

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
              status: status,
              importanceScore,
              summary: billDetails.summary,
          };
        });

        try {
          const batchResults = await Promise.allSettled(batchPromises);
          const validResults = batchResults
            .filter((result): result is PromiseFulfilledResult<FeedBill | null> => 
              result.status === 'fulfilled' && result.value !== null)
            .map(result => result.value as FeedBill);
          
          feedBills.push(...validResults);
          
          if (i + batchSize < billItems.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        } catch (batchError) {
          console.warn(`Batch ${i} failed:`, batchError);
        }
      }
      
      console.log(`Processed ${feedBills.length} bills with detailed sponsor information.`);
      
      if (feedBills.length > 0) {
          console.log('💾 Starting to cache', feedBills.length, 'bills to Firestore...');
          try {
            const batch = writeBatch(db);
            feedBills.forEach((bill, index) => {
                const billId = `${bill.congress}-${bill.type}-${bill.number}`;
                const docRef = doc(cacheCollection, billId);
                console.log(`📝 Adding bill ${index + 1}/${feedBills.length} to cache: ${billId}`);
                // Sanitize bill data to remove undefined values
                const sanitizedBill = {
                    ...bill,
                    summary: bill.summary || '',
                    sponsorImageUrl: bill.sponsorImageUrl || null,
                    sponsorFullName: bill.sponsorFullName || 'Unknown',
                    sponsorParty: bill.sponsorParty || 'N/A',
                    committeeName: bill.committeeName || 'General Legislation'
                };
                
                batch.set(docRef, {
                    billId: billId,
                    billData: sanitizedBill,
                    importanceScore: bill.importanceScore,
                    cachedAt: Timestamp.now(),
                    source: 'congress_api'
                });
            });
            await batch.commit();
            console.log(`✅ Successfully cached ${feedBills.length} bills to Firestore collection 'cached_bills'.`);
          } catch (cacheError) {
            console.error('🚨 Error caching bills to Firestore:', cacheError);
          }
      } else {
        console.log('⚠️ No bills to cache');
      }

      const sortedBills = feedBills.sort((a, b) => b.importanceScore - a.importanceScore);
      return NextResponse.json({ bills: sortedBills });
    };

    return await Promise.race([processData(), overallTimeout]);

  } catch (error) {
    console.error('Error in /api/feed/bills:', error);
    
    if (error instanceof Error && error.message === 'Operation timeout') {
      console.log('Operation timed out, checking for older cached data...');
      try {
        const oldCacheQuery = query(
          cacheCollection, 
          orderBy('importanceScore', 'desc'),
          limit(50)
        );
        const oldCacheSnapshot = await getDocs(oldCacheQuery);
        
        if (!oldCacheSnapshot.empty) {
          const bills = oldCacheSnapshot.docs
            .map(doc => doc.data().billData as FeedBill)
            .filter(bill => bill.congress === 119 && bill.status !== 'Became Law');
          console.log(`Serving ${bills.length} bills from older cache due to timeout.`);
          return NextResponse.json({ bills });
        }
      } catch (cacheError) {
        console.error('Failed to retrieve old cache:', cacheError);
      }
    }
    
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
