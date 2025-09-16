'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { SITE_ISSUE_CATEGORIES, getUserInterestForCategory } from '@/lib/policy-area-mapping';
import { useAuth } from '@/hooks/use-auth';

function convertTitleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const issueCategories = SITE_ISSUE_CATEGORIES.map(category => ({
  name: category,
  slug: convertTitleToSlug(category)
}));

export default function IssuesPage() {
  const { user, loading, refreshUserData } = useAuth();

  // Refresh user data on mount to ensure we have the latest policy interests
  useEffect(() => {
    if (user && !loading) {
      refreshUserData();
    }
  }, [user?.uid, loading, refreshUserData]);

  // Sort categories alphabetically
  const sortedCategories = issueCategories.sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-2xl">
      <header className="text-center mb-12">
        <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-2">
          Explore Issues
        </h1>
        <p className="text-lg text-muted-foreground">
          Browse legislation and policy initiatives by issue category.
        </p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sortedCategories.map((category) => {
          const userInterest = user && user.policyInterests ? getUserInterestForCategory(user.policyInterests, category.name) : 2;
          const isHighInterest = userInterest >= 4; // Only "High" (index 4)
          const isLowInterest = userInterest <= 1;  // "None" (0) and "Low" (1)
          
          return (
            <Link
              href={`/issues/${category.slug}`}
              key={category.slug}
              className={`text-center p-4 rounded-lg shadow-sm transition-colors duration-200 ease-in-out ${
                isHighInterest 
                  ? 'bg-blue-50 border-2 border-blue-200 text-blue-900 hover:bg-blue-100' 
                  : isLowInterest 
                  ? 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  : 'bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <span className="font-medium">{category.name}</span>
                {isHighInterest && (
                  <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">High Interest</span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}