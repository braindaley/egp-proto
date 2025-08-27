
'use client';

import Link from 'next/link';
import { Landmark, LogOut, User, Loader2, Menu } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from './ui/separator';
import { CongressSelector } from './congress-selector';
import { ZipCodeChanger } from './ZipCodeManager';
import { useState, useEffect } from 'react';
import type { Congress } from '@/types';

function getFallbackCongresses(): Congress[] {
  console.warn('Using fallback congress data.');
  return [
    { name: '119th Congress', number: 119, startYear: '2025', endYear: '2027' },
    { name: '118th Congress', number: 118, startYear: '2023', endYear: '2025' },
    { name: '117th Congress', number: 117, startYear: '2021', endYear: '2023' },
    { name: '116th Congress', number: 116, startYear: '2019', endYear: '2021' },
    { name: '115th Congress', number: 115, startYear: '2017', endYear: '2019' },
  ].sort((a, b) => b.number - a.number) as Congress[];
}

export function Header({ congresses: initialCongresses }: { congresses: Congress[] }) {
  const { user, loading, logout } = useAuth();
  const [congresses, setCongresses] = useState<Congress[]>(initialCongresses.length > 0 ? initialCongresses : getFallbackCongresses());
  const [selectedCongress, setSelectedCongress] = useState<string>('');

  useEffect(() => {
    if (congresses.length > 0) {
      const storedCongress = localStorage.getItem('selectedCongress');
      if (storedCongress && congresses.some(c => c.number.toString() === storedCongress)) {
        setSelectedCongress(storedCongress);
      } else {
        setSelectedCongress(congresses[0].number.toString());
      }
    }
  }, [congresses]);

  const handleSetSelectedCongress = (congress: string) => {
    setSelectedCongress(congress);
    localStorage.setItem('selectedCongress', congress);
  };

  const billsHref = selectedCongress ? `/bill/${selectedCongress}` : '/bills';
  const congressHref = selectedCongress ? `/congress/${selectedCongress}` : '/congress';

  const renderAuthContent = () => {
    if (loading) {
      return <div className="h-9 w-[140px] flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>;
    }
    
    if (user) {
        return (
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
        );
    }
    
    return (
        <>
            <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Login</Link>
            </Button>
            <Button size="sm" asChild>
                <Link href="/signup">Sign Up</Link>
            </Button>
        </>
    );
  }

  return (
    <header className="bg-background border-b sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="relative flex h-16 items-center justify-between">
          {/* Left Section - Logo */}
          <div className="flex items-center gap-6">
             <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary">
                <Landmark className="h-6 w-6" />
                <span className="hidden sm:inline">eGp Prototype</span>
            </Link>
          </div>
          

          {/* Right Section - Auth and Menu */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
                {renderAuthContent()}
            </div>

            {/* Hamburger Menu (visible on all screens) */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle className="sr-only">Main Navigation</SheetTitle>
                </SheetHeader>
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-4">Navigation</h3>
                  <div className="space-y-4">
                    {!user && (
                      <>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Your Location</label>
                          <ZipCodeChanger />
                        </div>
                        <Separator />
                      </>
                    )}
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Congress Session</label>
                      <CongressSelector 
                          congresses={congresses}
                          selectedCongress={selectedCongress}
                          setSelectedCongress={handleSetSelectedCongress}
                      />
                    </div>
                    
                    <Separator />

                    <SheetClose asChild>
                      <Link href="/for-you" className="block w-full text-left p-2 rounded-md hover:bg-accent">
                          For You
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link href="/following" className="block w-full text-left p-2 rounded-md hover:bg-accent">
                          Following
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link href="/issues" className="block w-full text-left p-2 rounded-md hover:bg-accent">
                          Issues
                      </Link>
                    </SheetClose>
                    
                    <Separator />
                    
                    <SheetClose asChild>
                      <Link href={billsHref} className="block w-full text-left p-2 rounded-md hover:bg-accent">
                          Bills
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link href={congressHref} className="block w-full text-left p-2 rounded-md hover:bg-accent">
                          Congress
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link href="/groups" className="block w-full text-left p-2 rounded-md hover:bg-accent">
                        Groups
                      </Link>
                    </SheetClose>

                    <Separator />
                    
                    <div className="space-y-2">
                         {loading ? (
                            <div className="flex justify-center p-2"><Loader2 className="h-5 w-5 animate-spin" /></div>
                        ) : user ? (
                            <>
                                <SheetClose asChild>
                                    <Button variant="ghost" className="w-full justify-start" asChild>
                                        <Link href="/dashboard">
                                            <User className="mr-2 h-4 w-4" />
                                            Dashboard
                                        </Link>
                                    </Button>
                                </SheetClose>
                                <SheetClose asChild>
                                    <Button variant="outline" className="w-full justify-start" onClick={logout}>
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Logout
                                    </Button>
                                </SheetClose>
                            </>
                        ) : (
                            <>
                                <SheetClose asChild>
                                    <Button variant="ghost" className="w-full justify-start" asChild>
                                        <Link href="/login">Login</Link>
                                    </Button>
                                </SheetClose>
                                <SheetClose asChild>
                                     <Button className="w-full justify-start" asChild>
                                         <Link href="/signup">Sign Up</Link>
                                    </Button>
                                </SheetClose>
                            </>
                        )}
                    </div>

                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
