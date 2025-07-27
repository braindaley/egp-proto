
import { notFound } from 'next/navigation';
import type { Bill } from '@/types';
import { BillDetailClient } from '@/components/bill-detail-client';

async function getBillDetails(congress: string, billType: string, billNumber: string): Promise<Bill | null> {
  // This assumes the app is running on localhost, which is fine for dev.
  // In a real deployment, you'd use a relative URL or an env var for the base URL.
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
  const url = `${baseUrl}/api/bill?congress=${congress}&billType=${billType}&billNumber=${billNumber}`;
  
  try {
    const res = await fetch(url, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      console.error(`Failed to fetch bill from internal API: ${res.status}`);
      return null;
    }

    return await res.json();
    
  } catch (error) {
    console.error("=== ERROR IN getBillDetails ===");
    console.error('Error:', error);
    return null; 
  }
}

export default async function BillDetailPage({ params }: { params: { congress: string; billType: string; billNumber: string } }) {
  // Await the params before using them in Next.js 15+
  const { congress, billType, billNumber } = params;
  
  const bill = await getBillDetails(congress, billType, billNumber);

  if (!bill) {
    notFound();
  }
  
  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <BillDetailClient bill={bill} />
    </div>
  );
}
