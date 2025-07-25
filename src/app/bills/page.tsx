import { BillCard } from '@/components/bill-card';
import type { Bill, CongressApiResponse } from '@/types';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

async function getBills(congress: string): Promise<Bill[]> {
  const API_KEY = process.env.CONGRESS_API_KEY || 'DEMO_KEY';
  const congressNumber = congress || '119'; // Default to 119 if not provided
  
  try {
    const listUrl = `https://api.congress.gov/v3/bill/${congressNumber}?api_key=${API_KEY}&limit=20&sort=updateDate+desc`;
    const listRes = await fetch(listUrl, { next: { revalidate: 3600 } });
    
    if (!listRes.ok) {
      console.error(`API list request failed: ${listRes.status}`);
      throw new Error(`Failed to fetch bill list: ${listRes.statusText}`);
    }
    
    const listData: CongressApiResponse = await listRes.json();
    return listData.bills || [];

  } catch (error) {
    console.error(`Error fetching bills for congress ${congressNumber}:`, error);
    return []; // Return empty array on error
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
            There was an issue fetching data from the Congress API for this session. Please try another session or check back later.
          </p>
        </div>
      )}
    </>
  );
}


export default function BillsPage({ searchParams }: { searchParams?: { congress?: string } }) {
  const congress = searchParams?.congress ?? '119';

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <header className="text-center mb-12">
          <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-2">
            Bills from the {congress}th Congress
          </h1>
          <p className="text-lg text-muted-foreground">
            Showing the latest updated bills for the selected session.
          </p>
        </header>
        
        <Suspense fallback={
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        }>
          <BillList congress={congress} />
        </Suspense>

      </div>
      <footer className="text-center py-6 text-sm text-muted-foreground">
        <p>Data provided by the <a href="https://www.congress.gov/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">U.S. Congress</a> via <a href="https://api.congress.gov/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">api.congress.gov</a>.</p>
      </footer>
    </div>
  );
}
