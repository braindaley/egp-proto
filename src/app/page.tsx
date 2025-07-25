import { BillCard } from '@/components/bill-card';
import type { Bill, CongressApiResponse } from '@/types';

async function getBills(): Promise<Bill[]> {
  const API_KEY = process.env.CONGRESS_API_KEY || 'DEMO_KEY';
  
  try {
    // 1. Fetch the list of recent bills
    const listUrl = `https://api.congress.gov/v3/bill?api_key=${API_KEY}&limit=11&sort=updateDate+desc`;
    const listRes = await fetch(listUrl, { next: { revalidate: 3600 } });
    if (!listRes.ok) {
      console.error(`API list request failed: ${listRes.status}`);
      throw new Error(`Failed to fetch bill list: ${listRes.statusText}`);
    }
    const listData: CongressApiResponse = await listRes.json();
    const recentBills = listData.bills;

    // 2. Fetch the specific large bill (H.R. 1 from 118th Congress)
    // Assuming H.R.1 from 118th Congress as a test case.
    let specialBill: Bill | null = null;
    try {
      const specialBillUrl = `https://api.congress.gov/v3/bill/118/hr/1?api_key=${API_KEY}`;
      const specialBillRes = await fetch(specialBillUrl, { next: { revalidate: 3600 } });
      if (specialBillRes.ok) {
        const specialBillData = await specialBillRes.json();
        specialBill = specialBillData.bill;
      } else {
        console.warn(`Could not fetch special bill H.R. 1: ${specialBillRes.status}`);
      }
    } catch (error) {
       console.warn("Error fetching special bill H.R. 1:", error);
    }
    
    // 3. Combine the lists, with the special bill at the beginning
    const allBills = specialBill ? [specialBill, ...recentBills] : recentBills;

    // Ensure we don't have duplicates if H.R. 1 was already in recent bills
    const uniqueBills = Array.from(new Map(allBills.map(bill => [`${bill.congress}-${bill.type}-${bill.number}`, bill])).values());
    
    return uniqueBills;

  } catch (error) {
    console.error("Error fetching bills:", error);
    return []; // Return empty array on error
  }
}

export default async function Home() {
  const bills = await getBills();

  return (
    <div className="bg-background min-h-screen">
      <main className="container mx-auto px-4 py-8 md:py-12">
        <header className="text-center mb-12">
          <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-2">
            Recent updates
          </h1>
        </header>

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
              There was an issue fetching data from the Congress API. Please try again later.
            </p>
          </div>
        )}
      </main>
      <footer className="text-center py-6 text-sm text-muted-foreground">
        <p>Data provided by the <a href="https://www.congress.gov/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">U.S. Congress</a> via <a href="https://api.congress.gov/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">api.congress.gov</a>.</p>
      </footer>
    </div>
  );
}
