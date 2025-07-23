import { notFound } from 'next/navigation';
import type { Bill, CongressApiResponse } from '@/types';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Landmark, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';

async function getBillDetails(congress: string, billType: string, billNumber: string): Promise<Bill | null> {
  const API_KEY = process.env.CONGRESS_API_KEY || 'DEMO_KEY';
  const url = `https://api.congress.gov/v3/bill/${congress}/${billType}/${billNumber}?api_key=${API_KEY}`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 3600 },
    });

    if (res.status === 404) {
      return null;
    }

    if (!res.ok) {
      console.error(`API request failed with status: ${res.status}`);
      const errorText = await res.text();
      console.error(`Error details: ${errorText}`);
      throw new Error(`Failed to fetch data: ${res.statusText}`);
    }
    
    // The detail endpoint returns a single bill inside a 'bill' property
    const data = await res.json();
    return data.bill;
  } catch (error) {
    console.error("Error fetching bill details:", error);
    return null; 
  }
}

function formatDate(dateString: string) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
}
  
function constructBillUrl(bill: Bill): string {
    const chamber = bill.originChamber.toLowerCase();
    return `https://www.congress.gov/bill/${bill.congress}th-congress/${chamber}-bill/${bill.number}`;
}


export default async function BillDetailPage({ params }: { params: { congress: string; billType: string; billNumber: string } }) {
  const bill = await getBillDetails(params.congress, params.billType, params.billNumber);

  if (!bill) {
    notFound();
  }

  return (
    <div className="bg-background min-h-screen">
      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          <header className="mb-8">
            <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary mb-3">
              {bill.title}
            </h1>
            <p className="text-xl text-muted-foreground font-medium">{bill.number}</p>
          </header>

          <div className="bg-card p-6 md:p-8 rounded-lg shadow-sm border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                <div>
                    <h2 className="font-headline text-lg font-semibold mb-2">Details</h2>
                    <div className="space-y-3 text-sm">
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="font-semibold">{bill.type}</Badge>
                            <Badge variant="outline" className="flex items-center gap-1.5">
                                <Landmark className="h-3 w-3" />
                                {bill.originChamber}
                            </Badge>
                        </div>
                         <div className="flex items-center gap-2 text-muted-foreground">
                            <CalendarDays className="h-4 w-4" />
                            <span>Updated: {formatDate(bill.updateDate)}</span>
                        </div>
                    </div>
                </div>
                 <div>
                    <h2 className="font-headline text-lg font-semibold mb-2">Latest Action</h2>
                    <div className="text-sm space-y-1">
                        <p className="font-bold">{formatDate(bill.latestAction.actionDate)}</p>
                        <p className="text-muted-foreground">{bill.latestAction.text}</p>
                    </div>
                </div>
            </div>

            <div className="mt-8 pt-6 border-t">
                 <Button asChild>
                    <a href={constructBillUrl(bill)} target="_blank" rel="noopener noreferrer">
                        View on Congress.gov <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                </Button>
            </div>
          </div>
        </div>
      </main>
      <footer className="text-center py-6 text-sm text-muted-foreground">
        <p>Data provided by the <a href="https://www.congress.gov/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">U.S. Congress</a> via <a href="https://api.congress.gov/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">api.congress.gov</a>.</p>
      </footer>
    </div>
  );
}