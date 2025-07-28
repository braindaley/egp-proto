
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fragment, useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { HomeIcon } from '@/components/icons';
import { useAuth } from '@/hooks/use-auth';

// A list of path segments to exclude from the breadcrumbs
const HIDDEN_SEGMENTS = ['bill'];

export function Breadcrumbs() {
  const pathname = usePathname();
  const { selectedCongress, isInitialLoadComplete } = useAuth();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (pathname === '/') {
    return null;
  }

  const originalSegments = pathname.split('/').filter(Boolean);

  const breadcrumbs = originalSegments
    .map((segment, index) => {
      // Check if the current segment is a number (like a congress number)
      const isNumericSegment = !isNaN(Number(segment));
      
      // If it's a numeric segment, check if the previous segment was 'congress'
      if (isNumericSegment && originalSegments[index - 1] === 'congress') {
          return null; // Don't render this segment
      }

      const isLast = index === originalSegments.length - 1;
      
      // Capitalize the first letter and replace dashes with spaces for display
      const title = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');

      // Determine the href
      let href = '/' + originalSegments.slice(0, index + 1).join('/');
      // If the segment is 'congress', use the selectedCongress for the URL if available
      if (segment === 'congress' && selectedCongress) {
          href = `/congress/${selectedCongress}`;
      }
      
      // Skip rendering for explicitly hidden segments
      if (HIDDEN_SEGMENTS.includes(segment.toLowerCase())) {
          return null;
      }

      return {
        href,
        title,
        isLast,
      };
    })
    .filter(Boolean); // remove null entries

  // Return null if no breadcrumbs are generated after filtering
  if (breadcrumbs.length === 0) {
    return null;
  }

  // Only render on the client after mount to prevent hydration errors
  if (!isClient || !isInitialLoadComplete) {
    return (
        <nav className="container mx-auto px-4 pt-4">
            <ol className="flex items-center space-x-2 bg-secondary/50 p-2 rounded-md h-[36px]">
                {/* Render a placeholder or nothing on server and initial client render */}
            </ol>
        </nav>
    );
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
        {breadcrumbs.map((crumb, index) => (
            crumb && (
            <Fragment key={crumb.href}>
                <li className="flex items-center">
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <Link
                    href={crumb.href}
                    className={`ml-2 text-sm font-medium ${
                    crumb.isLast ? 'text-foreground pointer-events-none' : 'text-muted-foreground hover:text-foreground'
                    }`}
                    aria-current={crumb.isLast ? 'page' : undefined}
                >
                    {crumb.title}
                </Link>
                </li>
            </Fragment>
            )
        ))}
      </ol>
    </nav>
  );
}
