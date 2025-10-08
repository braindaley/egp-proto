import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { app } from '@/lib/firebase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ congress: string; type: string; number: string }> }
) {
  try {
    const { congress, type, number } = await params;

    if (!congress || !type || !number) {
      return NextResponse.json(
        { error: 'Missing required parameters: congress, type, or number' },
        { status: 400 }
      );
    }

    const db = getFirestore(app);
    const messagesRef = collection(db, 'user_messages');

    // Query all messages for this specific bill
    const billQuery = query(
      messagesRef,
      where('congress', '==', congress),
      where('billType', '==', type.toUpperCase()),
      where('billNumber', '==', number)
    );

    const querySnapshot = await getDocs(billQuery);

    // Count support vs oppose messages
    let supportCount = 0;
    let opposeCount = 0;

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.userStance === 'support') {
        supportCount++;
      } else if (data.userStance === 'oppose') {
        opposeCount++;
      }
    });

    return NextResponse.json({
      supportCount,
      opposeCount,
      totalCount: supportCount + opposeCount,
      billId: `${congress}-${type}-${number}`
    });

  } catch (error) {
    console.error('Error fetching bill support counts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch support counts', supportCount: 0, opposeCount: 0 },
      { status: 500 }
    );
  }
}
