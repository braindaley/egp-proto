
import { NextResponse, type NextRequest } from 'next/server';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase';

const db = getFirestore(app);

async function fetchBillFromApi(congress: string, billType: string, billNumber: string) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const apiUrl = `${baseUrl}/api/bill?congress=${congress}&billType=${billType}&billNumber=${billNumber}`;
    
    try {
        const response = await fetch(apiUrl, { next: { revalidate: 0 } }); // No caching for internal fetches
        if (!response.ok) {
            console.error(`Failed to fetch from internal API: ${response.status}`);
            return null;
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching from internal API:', error);
        return null;
    }
}

async function sendNotification(userId: string, message: string) {
    console.log(`NOTIFY ${userId}: ${message}`);
    // In a real app, this would integrate with an email or push notification service
    // For now, we'll log to the console and maybe store in a 'notifications' collection
    const notificationsRef = doc(db, `users/${userId}/notifications/${Date.now()}`);
    // await setDoc(notificationsRef, { message, read: false, createdAt: new Date() });
}

export async function POST(req: NextRequest) {
    // Secure this endpoint with a secret or by checking user roles
    const authToken = req.headers.get('Authorization')?.split('Bearer ')[1];
    if (authToken !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { billId } = await req.json(); // e.g., "118-hr-123"
    if (!billId) {
        return NextResponse.json({ error: 'billId is required' }, { status: 400 });
    }

    const [congress, billType, billNumber] = billId.split('-');
    
    const billRef = doc(db, 'tracked_bills', billId);
    const billDoc = await getDoc(billRef);

    if (!billDoc.exists()) {
        return NextResponse.json({ error: 'Bill not found in tracked_bills' }, { status: 404 });
    }

    const oldBillData = billDoc.data();
    const newBillData = await fetchBillFromApi(congress, billType, billNumber);

    if (!newBillData) {
        return NextResponse.json({ error: 'Failed to fetch updated bill data' }, { status: 500 });
    }

    const updates: Record<string, any> = {};
    const notifications: string[] = [];

    // Compare latest action
    const oldAction = oldBillData.latestAction?.text;
    const newAction = newBillData.latestAction?.text;
    if (oldAction !== newAction) {
        updates['latestAction.text'] = newAction;
        notifications.push(`New action on ${newBillData.title}: "${newAction}"`);
    }

    // Compare cosponsor count
    const oldCosponsors = oldBillData.cosponsors?.count;
    const newCosponsors = newBillData.cosponsors?.count;
    if (oldCosponsors !== newCosponsors) {
        updates['cosponsors.count'] = newCosponsors;
        notifications.push(`${newBillData.title} now has ${newCosponsors} cosponsors (was ${oldCosponsors}).`);
    }
    
    // If there are updates, write them to Firestore
    if (Object.keys(updates).length > 0) {
        updates.lastUpdated = new Date();
        await updateDoc(billRef, updates);
        
        // Send notifications to users who have subscribed to this bill
        const subscribers = oldBillData.subscribers || []; // Assume subscribers is an array of user IDs
        for (const userId of subscribers) {
            for (const message of notifications) {
                await sendNotification(userId, message);
            }
        }

        return NextResponse.json({ success: true, changes: updates });
    }

    return NextResponse.json({ success: true, message: 'No changes detected.' });
}
