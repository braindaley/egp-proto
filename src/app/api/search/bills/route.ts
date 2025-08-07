import { NextResponse, type NextRequest } from 'next/server';
import type { FeedBill } from '@/types';
import { getFirestore, collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { app } from '@/lib/firebase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const searchTerm = searchParams.get('q');
  const debug = searchParams.get('debug') === 'true';

  console.log('🔍 Search API called with term:', searchTerm);

  if (debug) {
    const db = getFirestore(app);
    const cacheCollection = collection(db, 'cached_bills');
    try {
      const q = query(
        cacheCollection,
        where('billData.congress', '==', 119),
        orderBy('cachedAt', 'desc'),
        limit(200)
      );
      const snapshot = await getDocs(q);
      const allBills = snapshot.docs.map(doc => doc.data().billData as FeedBill);
      
      return NextResponse.json({
        debug: true,
        totalCached: allBills.length,
        billNumbers: allBills.map(bill => bill.billNumber),
        sponsors: allBills.map(bill => bill.sponsorFullName),
        subjects: allBills.map(bill => bill.committeeName),
        sampleTitles: allBills.slice(0, 10).map(bill => ({
          billNumber: bill.billNumber,
          title: bill.shortTitle,
          sponsor: bill.sponsorFullName,
          subjects: bill.committeeName
        }))
      });
    } catch (error) {
      return NextResponse.json({ error: 'Debug failed', details: error.message });
    }
  }

  if (!searchTerm || searchTerm.trim().length < 2) {
    return NextResponse.json({ error: 'Search term must be at least 2 characters' }, { status: 400 });
  }

  const db = getFirestore(app);
  const cacheCollection = collection(db, 'cached_bills');

  try {
    console.log('📊 Querying Firestore for cached bills...');
    const q = query(
      cacheCollection,
      where('billData.congress', '==', 119),
      orderBy('cachedAt', 'desc'),
      limit(500)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return NextResponse.json({ bills: [] });
    }

    const allBills = snapshot.docs.map(doc => doc.data().billData as FeedBill);
    const searchTermLower = searchTerm.toLowerCase();

    const matchedBills = allBills.filter(bill => {
      // Ensure bill and its properties are not null
      if (!bill) return false;
      const titleMatch = bill.shortTitle?.toLowerCase().includes(searchTermLower) || false;
      const sponsorMatch = bill.sponsorFullName?.toLowerCase().includes(searchTermLower) || false;
      const subjectMatch = bill.committeeName?.toLowerCase().includes(searchTermLower) || false;
      const billNumberMatch = bill.billNumber?.toLowerCase().includes(searchTermLower) || false;
      const actionMatch = bill.latestAction?.text?.toLowerCase().includes(searchTermLower) || false;
      
      return titleMatch || sponsorMatch || subjectMatch || billNumberMatch || actionMatch;
    });

    console.log(`✅ Found ${matchedBills.length} matching bills for term: "${searchTerm}"`);
    
    const sortedResults = matchedBills.sort((a, b) => (b.importanceScore || 0) - (a.importanceScore || 0));
    const limitedResults = sortedResults.slice(0, 100);

    const response = { 
      bills: limitedResults,
      total: matchedBills.length,
      searched: allBills.length 
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('🚨 Error in search API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Search failed';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
