
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

function calculateImportanceScore(detailedBill: Bill, latestActionText: string): number {
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
  const title = (detailedBill.title || '').toLowerCase();
  const highPriorityTerms = ['budget', 'appropriation', 'defense', 'security', 'healthcare', 'infrastructure', 'economy', 'tax', 'climate', 'energy', 'education'];
  if (highPriorityTerms.some(term => title.includes(term))) score += 10;
  if (title.includes('bipartisan')) score += 15;
  
  // SUPPORT: Use cosponsors if available from detailed API call
  const cosponsorCount = detailedBill.cosponsors?.count || 0;
  if (cosponsorCount > 50) score += 12;
  else if (cosponsorCount > 20) score += 8;
  else if (cosponsorCount > 10) score += 5;
  
  // AGE BONUS: Recent activity gets slight boost
  if (detailedBill.latestAction?.actionDate) {
    const actionDate = new Date(detailedBill.latestAction.actionDate);
    const daysSinceAction = (Date.now() - actionDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceAction <= 7) score += 3;
  }
  
  return Math.max(0, score);
}

// Function to fetch short title for a bill
async function fetchShortTitle(congress: number, billType: string, billNumber: string, apiKey: string): Promise<string | null> {
  try {
    const titlesUrl = `https://api.congress.gov/v3/bill/${congress}/${billType}/${billNumber}/titles?api_key=${apiKey}`;
    
    const titlesRes = await fetch(titlesUrl, { 
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(5000) 
    });
    
    if (!titlesRes.ok) {
      return null;
    }
    
    const titlesData = await titlesRes.json();
    
    if (titlesData?.titles && Array.isArray(titlesData.titles)) {
      // Find a "Short Title" - often more user-friendly
      const shortTitle = titlesData.titles.find((t: any) =>
          t.titleType?.toLowerCase().includes('short title(s) as introduced')
      );
      if (shortTitle && shortTitle.title) {
          return shortTitle.title;
      }
    }
    
    return null;
  } catch (error) {
    return null;
  }
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
    const listUrl = `https://api.congress.gov/v3/bill?congress=${latestCongress}&updatedSince=${updatedSince}&limit=100&sort=updateDate+desc&api_key=${API_KEY}`;
    
    const listRes = await fetch(listUrl, { next: { revalidate: 600 } });
    if (!listRes.ok) throw new Error(`Failed to fetch bill list from Congress API: ${listRes.status}`);
    
    const listData: CongressApiResponse = await listRes.json();
    const billItems = listData.bills || [];
    if (billItems.length === 0) return NextResponse.json({ bills: [] });

    // 3. Fetch details for each bill
    const billDetailPromises = billItems.map(item => {
        const separator = item.url.includes('?') ? '&' : '?';
        const detailUrl = `${item.url}${separator}api_key=${API_KEY}&embed=sponsors`;
        return fetch(detailUrl, { next: { revalidate: 600 } }).then(res => res.ok ? res.json() : null).catch(() => null);
    });
    const detailedBillResponses = await Promise.all(billDetailPromises);

    // 4. Process and score bills with short title fetching
    const processBillPromises = detailedBillResponses.map(async (response, index) => {
      if (!response || !response.bill) return null;
      
      const billListItem = billItems[index];
      const detailedBill: Bill = response.bill;
      
      // Fetch short title for this bill (with timeout to avoid blocking)
      const shortTitle = await fetchShortTitle(
        billListItem.congress, 
        billListItem.type.toLowerCase(), 
        billListItem.number, 
        API_KEY
      );
      
      // Use short title if found, otherwise process the long title
      const displayTitle = shortTitle || processLongTitle(detailedBill.title || '');
      
      const sponsor: Sponsor | undefined = detailedBill.sponsors?.[0];
      const importanceScore = calculateImportanceScore(detailedBill, detailedBill.latestAction?.text);

      return {
        shortTitle: displayTitle.trim(),
        billNumber: `${billListItem.type} ${billListItem.number}`,
        congress: billListItem.congress,
        type: billListItem.type,
        number: billListItem.number,
        latestAction: detailedBill.latestAction,
        sponsorParty: sponsor?.party || 'N/A',
        sponsorFullName: sponsor?.fullName || 'N/A',
        sponsorImageUrl: sponsor?.depiction?.imageUrl || null,
        committeeName: detailedBill.policyArea?.name || 'General Policy',
        status: getBillStatus(detailedBill.latestAction?.text || ''),
        importanceScore,
      };
    });

    // Wait for all bill processing (including short title fetching) to complete
    const feedBillsWithNulls = await Promise.all(processBillPromises);
    const feedBills = feedBillsWithNulls.filter((bill): bill is FeedBill => bill !== null);

    // 5. Cache the results in Firestore
    if (feedBills.length > 0) {
        const batch = writeBatch(db);
        feedBills.forEach(bill => {
            const billId = `${bill.congress}-${bill.type}-${bill.number}`;
            const docRef = doc(cacheCollection, billId);
            batch.set(docRef, {
                billId: billId,
                billData: bill,
                importanceScore: bill.importanceScore,
                cachedAt: Timestamp.now(),
                source: 'congress_api'
            });
        });
        await batch.commit();
        console.log(`Cached ${feedBills.length} bills successfully for Congress ${latestCongress}.`);
    }

    // 6. Return sorted results
    const sortedBills = feedBills.sort((a, b) => b.importanceScore - a.importanceScore);
    return NextResponse.json({ bills: sortedBills });

  } catch (error) {
    console.error('Error in /api/feed/bills:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

    