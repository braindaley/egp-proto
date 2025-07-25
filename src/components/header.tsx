
'use client';

import Link from 'next/link';
import { Landmark, LogOut, User, Loader2 } from 'lucide-react';
import { CongressSelector } from './congress-selector';
import type { Congress } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { Button } from './ui/button';
import { useEffect, useState } from 'react';

// Cache for the congress data to avoid repeated API calls
let congressCache: Congress[] | null = null;
let cacheExpiry: number = 0;

// Fallback data in case the API fails
function getFallbackCongresses(): Congress[] {
  return [
    { name: '119th Congress', number: 119, startYear: '2025', endYear: '2027' },
    { name: '118th Congress', number: 118, startYear: '2023', endYear: '2025' },
    { name: '117th Congress', number: 117, startYear: '2021', endYear: '2023' },
    { name: '116th Congress', number: 116, startYear: '2019', endYear: '2021' },
    { name: '115th Congress', number: 115, startYear: '2017', endYear: '2019' },
  ].sort((a, b) => b.number - a.number);
}

async function getCongresses(): Promise<Congress[]> {
  const now = Date.now();
  if (congressCache && now < cacheExpiry) {
    return congressCache;
  }
  
  const API_KEY = process.env.NEXT_PUBLIC_CONGRESS_API_KEY || 'DEMO_KEY';
  const url = `https://api.congress.gov/v3/congress?limit=250&api_key=${API_KEY}`;
  
  try {
    const res = await fetch(url);
    
    if (res.status === 429) {
      if (congressCache) {
        console.warn('Rate limit exceeded, using cached data');
        return congressCache;
      }
      return getFallbackCongresses();
    }
    
    if (!res.ok) {
      console.error(`Failed to fetch congresses: ${res.status}`);
      return getFallbackCongresses();
    }
    
    const data = await res.json();
    
    const result = (data.congresses || [])
      .filter(Boolean)
      .map(congress => ({
        ...congress,
        number: parseInt(congress.name.match(/(\d+)/)?.[1] || '0', 10)
      }))
      .sort((a, b) => b.number - a.number);
      
    // Cache the result for 1 hour
    congressCache = result;
    cacheExpiry = now + (60 * 60 * 1000);

    return result;

  } catch (error) {
    console.error('Error fetching congresses:', error);
    return getFallbackCongresses();
  }
}


export function Header() {
  const { user, loading, logout } = useAuth();
  const [congresses, setCongresses] = useState<Congress[]>([]);

  useEffect(() => {
    getCongresses().then(setCongresses);
  }, []);

  return (
    <header className="bg-background border-b sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary">
            <Landmark className="h-6 w-6" />
            <span>eGp pType</span>
          </Link>
          <nav>
            <ul className="flex items-center gap-2 md:gap-4">
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
              <li className="flex items-center gap-2">
                {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                ) : user ? (
                    <>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/dashboard">
                                <User className="mr-2 h-4 w-4" />
                                Dashboard
                            </Link>
                        </Button>
                        <Button variant="outline" size="sm" onClick={logout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            Logout
                        </Button>
                    </>
                ) : (
                    <>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/login">Login</Link>
                        </Button>
                        <Button size="sm" asChild>
                             <Link href="/signup">Sign Up</Link>
                        </Button>
                    </>
                )}
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}
