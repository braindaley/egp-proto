'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type FeedTab = 'foryou' | 'following';

interface FeedNavigationProps {
  activeTab: FeedTab;
  onTabChange: (tab: FeedTab) => void;
  className?: string;
}

export function FeedNavigation({ activeTab, onTabChange, className }: FeedNavigationProps) {
  const tabs: { id: FeedTab; label: string }[] = [
    { id: 'foryou', label: 'For you' },
    { id: 'following', label: 'Following' },
  ];

  return (
    <nav className={cn('border-b', className)}>
      <div className="flex h-full" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex-1 py-3 px-4 text-center font-medium text-sm transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              activeTab === tab.id
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
