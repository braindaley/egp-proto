import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { app } from '@/lib/firebase';

// Public endpoint to get campaigns for homepage and group pages
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const groupSlug = searchParams.get('groupSlug');
    const limitNum = parseInt(searchParams.get('limit') || '20');

    const db = getFirestore(app);
    let campaignsQuery;

    if (groupSlug) {
      // Get campaigns for specific group (without orderBy to avoid composite index requirement)
      campaignsQuery = query(
        collection(db, 'campaigns'),
        where('groupSlug', '==', groupSlug),
        limit(limitNum)
      );
    } else {
      // Get all campaigns for homepage
      campaignsQuery = query(
        collection(db, 'campaigns'),
        orderBy('updatedAt', 'desc'),
        limit(limitNum)
      );
    }

    const querySnapshot = await getDocs(campaignsQuery);
    const campaigns = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Convert Firestore timestamps to ISO strings
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt
    }));

    return NextResponse.json({ campaigns });

  } catch (error) {
    console.error('Error fetching public campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}