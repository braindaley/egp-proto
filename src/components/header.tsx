
'use client';

import Link from 'next/link';
import { Landmark, LogOut, User, Loader2, Menu, Rss, Star } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from './ui/separator';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { CongressSelector } from './congress-selector';

export function Header() {
  const { user, loading, logout, selectedCongress } = useAuth();
  const pathname = usePathname();

  const billsHref = selectedCongress ? `/bill/${selectedCongress}` : '/bills';
  const congressHref = selectedCongress ? `/congress/${selectedCongress}` : '/congress';

  const navLinks = [
    { href: '/', label: 'For you', icon: Rss },
    { href: '/following', label: 'Following', icon: Star },
  ];

  return (
    <header className="bg-background border-b sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center">
          {/* Left Section - Logo */}
          <div className="flex-1 md:flex-none">
             <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary">
                <Landmark className="h-6 w-6" />
                <span>eGp Prototype</span>
            </Link>
          </div>
          
          {/* Spacer to push auth/menu to the right */}
          <div className="flex-grow" />

          {/* Right Section - Auth and Menu */}
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2">
                <CongressSelector />
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
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Congress Session</label>
                      <CongressSelector />
                    </div>
                    
                    <Separator />
                    
                    {navLinks.map(link => (
                        <SheetClose key={link.href} asChild>
                            <Link 
                                href={link.href} 
                                className={cn("flex items-center gap-2 w-full text-left p-2 rounded-md hover:bg-accent",
                                pathname === link.href ? "bg-accent" : "")}
                            >
                                <link.icon className="h-4 w-4" />
                                {link.label}
                            </Link>
                        </SheetClose>
                    ))}

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
                      <Link href="/support-us" className="block w-full text-left p-2 rounded-md hover:bg-accent">
                          Support Us
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
