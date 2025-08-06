'use client';

import BillsFeed from '@/components/BillsFeed';

export default function Home() {
  return (
    <div className="bg-secondary/30 flex-1">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-2xl mx-auto">
          <BillsFeed />
        </div>
      </div>
    </div>
  );
}