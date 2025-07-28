'use client';

import Link from 'next/link';
import { Landmark, LogOut, User } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from './ui/button';

export function Footer() {
  const { user, loading, logout, selectedCongress } = useAuth();

  const billsHref = selectedCongress ? `/bill/${selectedCongress}` : '/bills';
  const congressHref = selectedCongress ? `/congress/${selectedCongress}` : '/congress';

  return (
    <footer className="bg-card text-card-foreground border-t">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Branding */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary mb-2">
              <Landmark className="h-6 w-6" />
              <span>eGp Prototype</span>
            </Link>
            <p className="text-xs text-muted-foreground">
              Advanced Technology Amplifying Voter Intent
            </p>
          </div>

          {/* Navigation Links */}
          <div>
            <h4 className="font-semibold mb-3">Explore</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href={congressHref} className="text-muted-foreground hover:text-primary transition-colors">
                  Congress
                </Link>
              </li>
              <li>
                <Link href="/support-us" className="text-muted-foreground hover:text-primary transition-colors">
                  Support Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Bill Links */}
          <div>
            <h4 className="font-semibold mb-3">Bills</h4>
            <ul className="space-y-2 text-sm">
               <li>
                <Link href={`${billsHref}/recent`} className="text-muted-foreground hover:text-primary transition-colors">
                    Recent Updates
                </Link>
              </li>
              <li>
                <Link href={`${billsHref}/popular`} className="text-muted-foreground hover:text-primary transition-colors">
                    Popular Bills
                </Link>
              </li>
              <li>
                <Link href={`${billsHref}/issues`} className="text-muted-foreground hover:text-primary transition-colors">
                    Browse by Issue
                </Link>
              </li>
            </ul>
          </div>

          {/* User/Auth Links */}
          <div>
            <h4 className="font-semibold mb-3">Account</h4>
            <ul className="space-y-2 text-sm">
              {loading ? (
                <li><span className="text-muted-foreground">Loading...</span></li>
              ) : user ? (
                <>
                  <li>
                    <Link href="/dashboard" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                        <User className="h-4 w-4" /> Dashboard
                    </Link>
                  </li>
                  <li>
                    <button onClick={logout} className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                      <LogOut className="h-4 w-4" /> Logout
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link href="/login" className="text-muted-foreground hover:text-primary transition-colors">
                        Login
                    </Link>
                  </li>
                  <li>
                    <Link href="/signup" className="text-muted-foreground hover:text-primary transition-colors">
                        Sign Up
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
        <div className="text-center pt-8 mt-8 border-t">
            <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} eGp Prototype. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}
