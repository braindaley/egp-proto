'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fragment } from 'react';
import { ChevronRight } from 'lucide-react';
import { HomeIcon } from '@/components/icons';

// A list of path segments to exclude from the breadcrumbs
const HIDDEN_SEGMENTS = ['bill', 'congress'];

export function Breadcrumbs() {
  const pathname = usePathname();
  if (pathname === '/') {
    return null;
  }

  // Filter out any segment that is purely numeric (like a congress number)
  const segments = pathname.split('/').filter(segment => segment && isNaN(Number(segment)));

  const breadcrumbs = segments.map((segment, index) => {
    // We need to reconstruct the href carefully from the original, unfiltered path
    const originalSegments = pathname.split('/').filter(Boolean);
    const originalSegmentIndex = originalSegments.indexOf(segment);
    const href = '/' + originalSegments.slice(0, originalSegmentIndex + 1).join('/');
    
    const isLast = index === segments.length - 1;
    
    // Capitalize the first letter and replace dashes with spaces for display
    const title = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');

    // Skip rendering for hidden segments
    if (HIDDEN_SEGMENTS.includes(segment.toLowerCase())) {
        return null;
    }

    return (
      <Fragment key={href}>
        <li className="flex items-center">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <Link
            href={href}
            className={`ml-2 text-sm font-medium ${
              isLast ? 'text-foreground pointer-events-none' : 'text-muted-foreground hover:text-foreground'
            }`}
            aria-current={isLast ? 'page' : undefined}
          >
            {title}
          </Link>
        </li>
      </Fragment>
    );
  }).filter(Boolean); // remove null entries

  // Return null if no breadcrumbs are generated after filtering
  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav className="container mx-auto px-4 pt-4">
      <ol className="flex items-center space-x-2 bg-secondary/50 p-2 rounded-md">
        <li>
          <Link href="/" className="text-muted-foreground hover:text-foreground">
            <HomeIcon className="h-4 w-4" />
            <span className="sr-only">Home</span>
          </Link>
        </li>
        {breadcrumbs}
      </ol>
    </nav>
  );
}