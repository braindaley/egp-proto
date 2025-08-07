import { NextResponse, type NextRequest } from 'next/server';
import type { FeedBill } from '@/types';
import { getFirestore, collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { app } from '@/lib/firebase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const searchTerm = searchParams.get('q');
  const debug = searchParams.get('debug') === 'true';

  console.log('🔍 Search API called with term:', searchTerm); // Debug log

  // If debug mode, return all cached bills for inspection
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
    console.log('❌ Search term too short'); // Debug log
    return NextResponse.json({ error: 'Search term must be at least 2 characters' }, { status: 400 });
  }

  const db = getFirestore(app);
  const cacheCollection = collection(db, 'cached_bills');

  try {
    console.log('📊 Querying Firestore for cached bills...'); // Debug log
    
    // Search through ALL cached bills from Congress 119
    const q = query(
      cacheCollection,
      where('billData.congress', '==', 119),
      orderBy('cachedAt', 'desc'),
      limit(500) // Search through up to 500 cached bills
    );

    const snapshot = await getDocs(q);
    console.log('📦 Found', snapshot.size, 'cached bills in Firestore'); // Debug log
    
    if (snapshot.empty) {
      console.log('⚠️ No cached bills found'); // Debug log
      return NextResponse.json({ bills: [] });
    }

    const allBills = snapshot.docs.map(doc => doc.data().billData as FeedBill);
    console.log('💾 Loaded', allBills.length, 'bills from cache'); // Debug log
    
    // Filter bills based on search term (case-insensitive)
    const searchTermLower = searchTerm.toLowerCase();
    const matchedBills = allBills.filter(bill => {
      const titleMatch = bill.shortTitle.toLowerCase().includes(searchTermLower);
      const sponsorMatch = bill.sponsorFullName.toLowerCase().includes(searchTermLower);
      const subjectMatch = bill.committeeName.toLowerCase().includes(searchTermLower);
      const billNumberMatch = bill.billNumber.toLowerCase().includes(searchTermLower);
      const actionMatch = bill.latestAction.text.toLowerCase().includes(searchTermLower);
      
      return titleMatch || sponsorMatch || subjectMatch || billNumberMatch || actionMatch;
    });

    console.log('✅ Found', matchedBills.length, 'matching bills for term:', searchTerm); // Debug log
    
    // Log what was searched to help debug
    console.log('🔍 Search details:', {
      searchTerm,
      totalBillsSearched: allBills.length,
      matchedBills: matchedBills.length,
      sampleMatched: matchedBills.slice(0, 3).map(bill => bill.billNumber)
    });

    // Sort by importance score
    const sortedResults = matchedBills.sort((a, b) => b.importanceScore - a.importanceScore);
    
    // Limit results to prevent overwhelming the UI
    const limitedResults = sortedResults.slice(0, 100);

    const response = { 
      bills: limitedResults,
      total: matchedBills.length,
      searched: allBills.length 
    };

    console.log('📤 Returning search results:', {
      foundBills: limitedResults.length,
      totalMatches: matchedBills.length,
      totalSearched: allBills.length
    }); // Debug log

    return NextResponse.json(response);

  } catch (error) {
    console.error('🚨 Error in search API:', error); // Debug log
    const errorMessage = error instanceof Error ? error.message : 'Search failed';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}