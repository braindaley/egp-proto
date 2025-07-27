
'use client';

import { BillCard } from '@/components/bill-card';
import type { Bill } from '@/types';
import { Suspense, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface PopularBillsResponse {
  bills: Bill[];
  debug?: {
    rssItems: number;
    contentLength: number;
    parsedCount: number;
  };
}

async function getPopularBillsData(): Promise<PopularBillsResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
  const url = `${baseUrl}/api/bills/popular`;

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });

    if (!res.ok) {
      console.error(`Internal API request for popular bills failed: ${res.status}`);
      throw new Error(`Failed to fetch popular bill list: ${res.statusText}`);
    }

    return await res.json();

  } catch (error) {
    console.error(`Error fetching popular bills:`, error);
    return { bills: [] };
  }
}

function PopularBillList({ data }: { data: PopularBillsResponse }) {
  useEffect(() => {
    if (data.debug) {
      console.log('Popular Bills API Debug Info:', data.debug);
    }
  }, [data.debug]);

  const bills = data.bills || [];

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
          <p className="text-xl font-semibold text-destructive">Could Not Load Popular Bills</p>
          <p className="text-muted-foreground mt-2">
            There was an issue fetching the most-viewed bills, or none were found. Please try again later.
          </p>
        </div>
      )}
    </>
  );
}


function PopularBillsPageContent() {
    const [data, setData] = useState<PopularBillsResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getPopularBillsData().then(data => {
            setData(data);
            setLoading(false);
        });
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        )
    }

    return <PopularBillList data={data!} />;
}


export default function PopularBillsPage() {
    return (
        <div className="bg-background min-h-screen">
            <div className="container mx-auto px-4 py-8 md:py-12">
                <header className="text-center mb-12">
                    <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-2">
                        Most-Viewed Bills This Week
                    </h1>
                    <p className="text-lg text-muted-foreground">
                        Based on traffic to Congress.gov.
                    </p>
                </header>
                
                 <Suspense fallback={
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    </div>
                }>
                    <PopularBillsPageContent />
                </Suspense>

            </div>
            <footer className="text-center py-6 text-sm text-muted-foreground">
                <p>Data provided by the <a href="https://www.congress.gov/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">U.S. Congress</a> via <a href="https://www.congress.gov/rss/most-viewed-bills.xml" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">Most-Viewed Bills RSS</a>.</p>
            </footer>
        </div>
    );
}
