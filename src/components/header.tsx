
import Link from 'next/link';
import { Landmark } from 'lucide-react';
import { CongressSelector } from './congress-selector';
import type { Congress } from '@/types';

async function getCongresses(): Promise<Congress[]> {
  const API_KEY = process.env.CONGRESS_API_KEY || 'DEMO_KEY';
  const url = `https://api.congress.gov/v3/congress?limit=250&api_key=${API_KEY}`;
  
  try {
    const res = await fetch(url, { next: { revalidate: 3600 * 24 } }); // Cache for a day
    if (!res.ok) {
      console.error(`Failed to fetch congresses: ${res.status}`);
      return [];
    }
    const data = await res.json();
    // Reverse to show latest first and filter out any bad data
    return (data.congresses || []).filter(Boolean).reverse();
  } catch (error) {
    console.error('Error fetching congresses:', error);
    return [];
  }
}


export async function Header() {
  const congresses = await getCongresses();
  
  return (
    <header className="bg-background border-b sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary">
            <Landmark className="h-6 w-6" />
            <span>Congress Bills Explorer</span>
          </Link>
          <nav>
            <ul className="flex items-center gap-4 md:gap-6">
              <li>
                <CongressSelector congresses={congresses} />
              </li>
              <li>
                <Link href="/bills" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                  Bills
                </Link>
              </li>
              <li>
                <Link href="/congress" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                  Congress
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}
