import { NextResponse, type NextRequest } from 'next/server';
import type { Bill, CongressApiResponse, FeedBill, Sponsor, Congress } from '@/types';
import { getFirestore, collection, getDocs, writeBatch, Timestamp, query, orderBy, limit, doc, where } from 'firebase/firestore';
import { app } from '@/lib/firebase'; // Import your Firebase app instance

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

// Function to get the latest congress number
async function getLatestCongress(apiKey: string): Promise<string> {
  try {
    const url = `https://api.congress.gov/v3/congress?limit=1&api_key=${apiKey}`;
    const res = await fetch(url, { next: { revalidate: 86400 } }); // Cache for a day
    if (!res.ok) return '118'; // Fallback
    const data = await res.json();
    const congressNumber = data.congresses?.[0]?.number;
    return congressNumber ? String(congressNumber) : '118';
  } catch (error) {
    console.error('Failed to fetch latest congress, using fallback:', error);
    return '118'; // Fallback
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
    // Determine the latest congress dynamically
    const latestCongress = await getLatestCongress(API_KEY);

    // 1. Check for fresh cache for the latest congress
    const q = query(
      cacheCollection, 
      where('billData.congress', '==', parseInt(latestCongress)),
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

    // 2. Fetch new data from Congress API for the latest congress
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const updatedSince = thirtyDaysAgo.toISOString().split('T')[0];
    const listUrl = `https://api.congress.gov/v3/bill?congress=${latestCongress}&updatedSince=${updatedSince}&limit=500&sort=updateDate+desc&api_key=${API_KEY}`;
    
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

    // 4. Process and score bills
    const feedBills: FeedBill[] = detailedBillResponses
      .map((response, index) => {
        if (!response || !response.bill) return null;
        
        const billListItem = billItems[index];
        const detailedBill: Bill = response.bill;
        
        const shortTitle = detailedBill.title?.split(';').find((t: string) => !t.toLowerCase().includes('official title')) || detailedBill.title || 'No title';
        const sponsor: Sponsor | undefined = detailedBill.sponsors?.[0];

        const importanceScore = calculateImportanceScore(detailedBill, detailedBill.latestAction?.text);

        return {
          shortTitle: shortTitle.trim(),
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
      })
      .filter((bill): bill is FeedBill => bill !== null);

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
