import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    // Get cache metadata
    const metadataDoc = await adminDb.collection('cache_metadata').doc('bills').get();
    const metadata = metadataDoc.exists ? metadataDoc.data() : null;

    // Count total cached bills
    const billsSnapshot = await adminDb.collection('cached_bills').count().get();
    const totalCachedBills = billsSnapshot.data().count;

    // Get sample of recent bills
    const recentBillsSnapshot = await adminDb
      .collection('cached_bills')
      .orderBy('updateDate', 'desc')
      .limit(5)
      .get();

    const recentBills = recentBillsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: data.id,
        title: data.title.substring(0, 80) + '...',
        subjects: data.subjects,
        updateDate: data.updateDate,
        lastCached: data.lastCached
      };
    });

    return NextResponse.json({
      metadata: metadata,
      totalCachedBills: totalCachedBills,
      recentBills: recentBills,
      status: metadata ? 'active' : 'not_initialized'
    });

  } catch (error) {
    console.error('Error fetching cache status:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({
      error: errorMessage,
      status: 'error'
    }, { status: 500 });
  }
}