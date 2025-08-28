'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ChevronRight, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getBillTypeSlug } from '@/lib/utils';
import type { Bill } from '@/types';

interface PopularBillResponse {
  bills: Bill[];
  debug?: any;
}

export function PopularBillsNav({ congress }: { congress: string }) {
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPopularBills = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/bills/popular', {
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch popular bills');
        }

        const data: PopularBillResponse = await response.json();
        
        // Take only the top 10 bills
        setBills(data.bills.slice(0, 10));
      } catch (err) {
        console.error('Error fetching popular bills:', err);
        setError(err instanceof Error ? err.message : 'Failed to load popular bills');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPopularBills();
  }, []);

  return (
    <aside className="hidden lg:block w-64 flex-shrink-0">
      <div className="sticky top-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Popular Bills</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="px-4 py-3 text-sm text-muted-foreground">
                Failed to load bills
              </div>
            ) : bills.length === 0 ? (
              <div className="px-4 py-3 text-sm text-muted-foreground">
                No bills available
              </div>
            ) : (
              <nav className="space-y-1">
                {bills.map((bill, index) => {
                  const billTypeSlug = getBillTypeSlug(bill.type);
                  const billNumber = `${bill.type.toUpperCase()} ${bill.number}`;
                  const billTitle = bill.title || `${bill.type.toUpperCase()} ${bill.number}`;
                  
                  return (
                    <Link
                      key={`${bill.congress}-${bill.type}-${bill.number}`}
                      href={`/federal/bill/${bill.congress}/${billTypeSlug}/${bill.number}`}
                      className="flex items-start justify-between px-4 py-2.5 hover:bg-muted transition-colors group"
                    >
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs px-1.5 py-0 font-medium">
                            {billNumber}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground group-hover:text-foreground truncate">
                          {billTitle}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground mt-1 flex-shrink-0" />
                    </Link>
                  );
                })}
              </nav>
            )}
          </CardContent>
        </Card>
      </div>
    </aside>
  );
}