
import { BillCard } from '@/components/bill-card';
import type { Bill, CongressApiResponse } from '@/types';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { notFound } from 'next/navigation';

// Use ISR with 1 hour revalidation
export const revalidate = 3600; // revalidate every hour

async function getBills(congress: string): Promise<Bill[]> {
  // For server components, we can use the cache directly
  const { fetchBillsWithCache } = await import('@/lib/bills-cache');
  
  try {
    const { bills, fromCache, cacheAge } = await fetchBillsWithCache(congress, {
      limit: 20,
      sort: 'updateDate+desc'
    });
    
    console.log(`[Recent Bills Page] Congress ${congress} - Cache: ${fromCache ? 'HIT' : 'MISS'}, Age: ${cacheAge}s`);
    
    return bills;
  } catch (error) {
    console.error(`Error fetching bills for congress ${congress}:`, error);
    // Return empty array on error to prevent crashes, the UI will show a message.
    return [];
  }
}

async function BillList({ congress }: { congress: string }) {
  const bills = await getBills(congress);

  return (
    <>
      {bills.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
          {bills.map((bill) => (
            <BillCard key={`${bill.type}-${bill.number}-${bill.congress}`} bill={bill} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 px-6 bg-card rounded-lg shadow-md">
          <p className="text-xl font-semibold text-destructive">Could Not Load Bills</p>
          <p className="text-muted-foreground mt-2">
            There was an issue fetching data for this session. Please try another session or check back later.
          </p>
        </div>
      )}
    </>
  );
}


export default async function RecentBillsPage({ params }: { params: { congress: string } }) {
  const { congress } = await params;

  // Since we are awaiting params, we need to convert the congress number to a string if it's not already.
  const congressNumber = congress.toString();

  // Basic validation to ensure congress is a number.
  if (isNaN(parseInt(congressNumber))) {
    notFound();
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <header className="text-center mb-12">
          <p className="text-lg text-muted-foreground font-medium mb-1">{congressNumber}th Congress</p>
          <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary">
            Recently Updated Bills
          </h1>
        </header>
        
        <Suspense fallback={
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        }>
          <BillList congress={congressNumber} />
        </Suspense>

      </div>
      <footer className="text-center py-6 text-sm text-muted-foreground">
        <p>Data provided by the <a href="https://www.congress.gov/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">U.S. Congress</a> via <a href="https://api.congress.gov/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">api.congress.gov</a>.</p>
      </footer>
    </div>
  );
}
