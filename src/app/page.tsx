
import { BillFeedCard } from '@/components/bill-feed-card';
import type { Bill, CongressApiResponse } from '@/types';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

async function getBills(congress: string): Promise<Bill[]> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
  const url = `${baseUrl}/api/bills/${congress}`;

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    
    if (!res.ok) {
      console.error(`Internal API request for bills failed: ${res.status}`);
      throw new Error(`Failed to fetch bill list: ${res.statusText}`);
    }
    
    const data: CongressApiResponse = await res.json();
    return data.bills || [];

  } catch (error) {
    console.error(`Error fetching bills for congress ${congress}:`, error);
    return [];
  }
}


async function BillFeed() {
  // We'll get the latest congress from the auth hook context eventually, for now let's hardcode
  const bills = await getBills('118');

  return (
    <div className="space-y-6">
      {bills.length > 0 ? (
        bills.map((bill) => (
          <BillFeedCard key={`${bill.type}-${bill.number}`} bill={bill} />
        ))
      ) : (
        <div className="text-center py-10 px-6 bg-card rounded-lg shadow-md">
          <p className="text-xl font-semibold text-destructive">Could Not Load Bill Feed</p>
          <p className="text-muted-foreground mt-2">
            There was an issue fetching the latest bills. Please try again later.
          </p>
        </div>
      )}
    </div>
  );
}


export default function Home() {
  return (
    <div className="bg-background min-h-screen">
      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-2xl mx-auto">
            <header className="text-center mb-12">
                <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary">
                    Legislative Feed
                </h1>
                <p className="text-lg text-muted-foreground mt-2">
                    The latest updates from the U.S. Congress
                </p>
            </header>
            <Suspense fallback={
              <div className="flex justify-center items-center py-20">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
            }>
              <BillFeed />
            </Suspense>
        </div>
      </main>
    </div>
  );
}

