'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type FeedTab = 'foryou' | 'following';

interface FeedNavigationProps {
  className?: string;
}

export function FeedNavigation({ className }: FeedNavigationProps) {
  const pathname = usePathname();
  
  const tabs: { href: string; label: string }[] = [
    { href: '/', label: 'For you' },
    { href: '/following', label: 'Following' },
  ];

  return (
    <nav className={cn('', className)}>
      <div className="flex h-full" role="tablist">
        {tabs.map((tab) => (
          <Link
            href={tab.href}
            key={tab.href}
            role="tab"
            aria-selected={pathname === tab.href}
            className={cn(
              'flex-1 py-3 px-4 text-center font-medium text-sm transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              pathname === tab.href
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
