'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface Bill {
  congress: number;
  number: string;
  type: string;
  title: string;
  shortTitle?: string;
  url: string;
}

interface PopularBillsResponse {
  bills: Bill[];
  debug?: any;
}

export function PopularBills() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBills = async () => {
      try {
        const response = await fetch('/api/bills/popular');
        const data: PopularBillsResponse = await response.json();
        setBills(data.bills || []);
      } catch (error) {
        console.error('Failed to fetch popular bills:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBills();
  }, []);

  if (loading) {
    return (
      <div className="w-full bg-muted/30 border-b">
        <div className="max-w-[1280px] mx-auto px-4">
          <div className="py-4">
            <div className="animate-pulse">
              <div className="h-6 bg-muted rounded w-32 mb-3"></div>
              <div className="flex gap-4 overflow-hidden">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex-shrink-0 w-[314px]">
                    <div className="h-20 bg-muted rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!bills.length) {
    return null;
  }

  return (
    <div className="w-full bg-muted/30 border-b">
      <div className="max-w-[1280px] mx-auto px-4">
        {/* Desktop - Horizontal scrolling with static title */}
        <div className="hidden md:flex items-center gap-4 py-2">
          <h2 className="text-sm font-semibold text-muted-foreground flex-shrink-0">Popular Bills in Congress</h2>
          <div className="flex gap-3 overflow-x-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent flex-1">
            {bills.map((bill) => (
              <Link
                key={`${bill.type}-${bill.number}`}
                href={bill.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 group"
                style={{ maxWidth: '314px' }}
              >
                <div className="flex items-center gap-2 py-1.5 px-1.5 rounded-lg hover:bg-muted/50 transition-colors">
                  <Badge variant="outline" className="flex-shrink-0">
                    {bill.type} {bill.number}
                  </Badge>
                  <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors truncate">
                    {bill.title}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Mobile - Stacked list with title on top */}
        <div className="md:hidden py-2">
          <h2 className="text-sm font-semibold text-muted-foreground mb-1.5">Popular Bills in Congress</h2>
          <div className="space-y-1">
            {bills.map((bill) => (
              <Link
                key={`${bill.type}-${bill.number}`}
                href={bill.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block group"
              >
                <div className="flex items-center gap-2 py-1.5 px-1.5 rounded-lg hover:bg-muted/50 transition-colors">
                  <Badge variant="outline" className="flex-shrink-0">
                    {bill.type} {bill.number}
                  </Badge>
                  <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors truncate">
                    {bill.title}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}