// src/app/bill/[congress]/popular/page.tsx
'use client';
import { BillCard } from '@/components/bill-card';
import type { Bill } from '@/types';
import { useEffect, useState } from 'react';

interface PopularBillResponse {
    bills: Bill[];
    debug: any;
}

// Client component to render the list and handle logging
function PopularBillList({ bills, debug }: PopularBillResponse) {
    useEffect(() => {
        console.log("Popular Bills API Debug Info:", debug);
    }, [debug]);

    if (!bills || bills.length === 0) {
        return (
            <div className="text-center py-10 px-6 bg-card rounded-lg shadow-md">
                <p className="text-xl font-semibold text-destructive">Could Not Load Popular Bills</p>
                <p className="text-muted-foreground mt-2">There was an issue fetching the most-viewed bills.</p>
                {debug && (
                    <pre className="mt-4 text-xs text-left bg-secondary p-4 rounded-md overflow-auto">
                        {JSON.stringify(debug, null, 2)}
                    </pre>
                )}
            </div>
        );
    }
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
            {bills.map(bill => (
              <BillCard key={`${bill.type}-${bill.number}-${bill.congress}`} bill={bill} />
            ))}
        </div>
    );
}

// Server component to fetch data
async function getPopularBills(): Promise<PopularBillResponse> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
    const url = `${baseUrl}/api/bills/popular`;
    console.log('🔗 Fetching popular bills from:', url);

    try {
        const res = await fetch(url, { next: { revalidate: 3600 } });
        console.log('🔗 Response status:', res.status);

        if (!res.ok) {
            const errorText = await res.text();
            console.error('🔗 Popular bills API fetch failed:', errorText);
            return { bills: [], debug: { error: `API responded with ${res.status}`, body: errorText } };
        }
        
        const data: PopularBillResponse = await res.json();
        console.log('🔗 Fetched bills array length:', data.bills?.length);
        return data;

    } catch (error) {
        console.error('🔗 Client-side fetch error:', error);
        return { bills: [], debug: { error: error instanceof Error ? error.message : 'Unknown client fetch error' } };
    }
}

interface PopularBillsPageProps {
  params: { congress: string };
}

export default function PopularBillsPage({ params }: PopularBillsPageProps) {
    const [data, setData] = useState<PopularBillResponse | null>(null);

    useEffect(() => {
        getPopularBills().then(setData);
    }, []);

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
            
            {data ? (
                <PopularBillList bills={data.bills} debug={data.debug} />
            ) : (
                <div className="text-center py-10">
                    <p className="text-muted-foreground">Loading popular bills...</p>
                </div>
            )}

          </div>
          <footer className="text-center py-6 text-sm text-muted-foreground">
            <p>
              Data courtesy of{' '}
              <a href="https://www.congress.gov" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">
                Congress.gov RSS
              </a>.
            </p>
          </footer>
        </div>
    );
}
