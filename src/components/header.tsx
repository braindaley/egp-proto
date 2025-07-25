
'use client';

import Link from 'next/link';
import { Landmark, LogOut, User, Loader2 } from 'lucide-react';
import { CongressSelector } from './congress-selector';
import type { Congress } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { Button } from './ui/button';
import { useEffect, useState } from 'react';

async function getCongresses(): Promise<Congress[]> {
  console.log('🔍 Starting getCongresses...');
  
  const API_KEY = process.env.NEXT_PUBLIC_CONGRESS_API_KEY || 'DEMO_KEY';
  console.log('🔍 API Key:', API_KEY === 'DEMO_KEY' ? 'Using DEMO_KEY' : 'Using custom key');
  
  const url = `https://api.congress.gov/v3/congress?limit=250&api_key=${API_KEY}`;
  console.log('🔍 Fetch URL:', url);
  
  try {
    console.log('🔍 Making fetch request...');
    const res = await fetch(url); // Remove the cache option
    
    console.log('🔍 Response status:', res.status);
    console.log('🔍 Response ok:', res.ok);
    
    if (!res.ok) {
      console.error(`Failed to fetch congresses: ${res.status}`);
      return [];
    }
    
    const data = await res.json();
    console.log('🔍 Raw API response:', data);
    console.log('🔍 Congresses array:', data.congresses);
    
    const result = (data.congresses || []).filter(Boolean).reverse();
    console.log('🔍 Final processed result:', result);
    
    return result;
  } catch (error) {
    console.error('🔍 Error fetching congresses:', error);
    return [];
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
            <span>eG Prototype</span>
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
