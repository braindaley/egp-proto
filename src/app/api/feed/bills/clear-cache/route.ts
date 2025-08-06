
import { NextResponse } from 'next/server';
import { getFirestore, collection, getDocs, writeBatch } from 'firebase/firestore';
import { app } from '@/lib/firebase';

async function clearCachedBills() {
    const db = getFirestore(app);
    const cacheCollection = collection(db, 'cached_bills');
    
    try {
        const snapshot = await getDocs(cacheCollection);
        if (snapshot.empty) {
            return { success: true, message: 'Cache is already empty.', deletedCount: 0 };
        }

        // Firestore limits batch writes to 500 documents.
        // We'll process in chunks if there are more.
        const chunks = [];
        for (let i = 0; i < snapshot.docs.length; i += 500) {
            chunks.push(snapshot.docs.slice(i, i + 500));
        }

        for (const chunk of chunks) {
            const batch = writeBatch(db);
            chunk.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
        }
        
        return { success: true, message: `Successfully deleted ${snapshot.size} cached bills.`, deletedCount: snapshot.size };
    } catch (error) {
        console.error("Error clearing Firestore cache:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, message: `Failed to clear cache: ${errorMessage}`, deletedCount: 0 };
    }
}


export async function GET() {
  console.log("Attempting to clear Firestore cache...");
  const result = await clearCachedBills();
  
  if (result.success) {
    return NextResponse.json(result);
  } else {
    return NextResponse.json(result, { status: 500 });
  }
}
