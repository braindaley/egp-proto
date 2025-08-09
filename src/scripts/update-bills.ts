
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { app } from '../lib/firebase'; // Adjust path as needed

const db = getFirestore(app);

const updateAllTrackedBills = async () => {
    console.log('Starting bill update process...');

    const billsSnapshot = await getDocs(collection(db, 'tracked_bills'));
    if (billsSnapshot.empty) {
        console.log('No bills are currently being tracked.');
        return;
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const updateUrl = `${baseUrl}/api/bills/update`;
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
        console.error('CRON_SECRET is not set. Cannot proceed.');
        return;
    }

    for (const doc of billsSnapshot.docs) {
        const billId = doc.id;
        console.log(`- Updating bill: ${billId}`);

        try {
            const response = await fetch(updateUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${cronSecret}`,
                },
                body: JSON.stringify({ billId }),
            });

            const result = await response.json();

            if (!response.ok) {
                console.error(`  Error updating ${billId}: ${result.error || 'Unknown error'}`);
            } else {
                console.log(`  Success: ${result.message || JSON.stringify(result.changes)}`);
            }
        } catch (error) {
            console.error(`  Failed to send request for ${billId}:`, error);
        }
    }

    console.log('Bill update process finished.');
};

updateAllTrackedBills();
