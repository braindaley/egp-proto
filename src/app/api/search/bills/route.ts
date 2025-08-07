import { NextResponse, type NextRequest } from 'next/server';
import type { FeedBill } from '@/types';
import { getFirestore, collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { app } from '@/lib/firebase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const searchTerm = searchParams.get('q');

  if (!searchTerm || searchTerm.trim().length < 2) {
    return NextResponse.json({ error: 'Search term must be at least 2 characters' }, { status: 400 });
  }

  const db = getFirestore(app);
  const cacheCollection = collection(db, 'cached_bills');

  try {
    // Search through ALL cached bills from Congress 119
    const q = query(
      cacheCollection,
      where('billData.congress', '==', 119),
      orderBy('cachedAt', 'desc'),
      limit(500) // Search through up to 500 cached bills
    );

    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return NextResponse.json({ bills: [] });
    }

    const allBills = snapshot.docs.map(doc => doc.data().billData as FeedBill);
    
    // Filter bills based on search term (case-insensitive)
    const searchTermLower = searchTerm.toLowerCase();
    const matchedBills = allBills.filter(bill => {
      return (
        bill.shortTitle.toLowerCase().includes(searchTermLower) ||
        bill.sponsorFullName.toLowerCase().includes(searchTermLower) ||
        bill.committeeName.toLowerCase().includes(searchTermLower) ||
        bill.billNumber.toLowerCase().includes(searchTermLower) ||
        bill.latestAction.text.toLowerCase().includes(searchTermLower)
      );
    });

    // Sort by importance score
    const sortedResults = matchedBills.sort((a, b) => b.importanceScore - a.importanceScore);
    
    // Limit results to prevent overwhelming the UI
    const limitedResults = sortedResults.slice(0, 100);

    return NextResponse.json({ 
      bills: limitedResults,
      total: matchedBills.length,
      searched: allBills.length 
    });

  } catch (error) {
    console.error('Error in search API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Search failed';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}