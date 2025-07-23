import { BillCard } from '@/components/bill-card';
import type { Bill, CongressApiResponse } from '@/types';

async function getBills(): Promise<Bill[]> {
  // Using the DEMO_KEY provided by the API documentation for demonstration purposes.
  // For a production application, you should get your own key from https://api.congress.gov/
  // and store it in an environment variable.
  const API_KEY = process.env.CONGRESS_API_KEY || 'DEMO_KEY';
  const url = `https://api.congress.gov/v3/bill?api_key=${API_KEY}&limit=12&sort=updateDate+desc`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 3600 }, // Revalidate every hour
    });

    if (!res.ok) {
      console.error(`API request failed with status: ${res.status}`);
      const errorText = await res.text();
      console.error(`Error details: ${errorText}`);
      throw new Error(`Failed to fetch data: ${res.statusText}`);
    }

    const data: CongressApiResponse = await res.json();
    return data.bills;
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
            Congress Bills Explorer
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Stay informed with real-time data on the latest legislative developments from the U.S. Congress.
          </p>
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
