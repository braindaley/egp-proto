'use client';

import { Lock, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface PremiumUpgradeCTAProps {
  /** Title text - defaults to "Upgrade to Premium" */
  title?: string;
  /** Description text explaining the premium benefit */
  description?: string;
  /** Additional CSS classes */
  className?: string;
  /** Variant for different display contexts */
  variant?: 'default' | 'compact' | 'card' | 'full-page';
}

/**
 * Premium upgrade call-to-action component.
 * Displays a lock icon, title, description, and upgrade button.
 * Used to replace content that is restricted to premium members.
 */
export function PremiumUpgradeCTA({
  title = 'Upgrade to Premium',
  description = 'Access state legislation, local representatives, and more with a premium membership.',
  className,
  variant = 'default',
}: PremiumUpgradeCTAProps) {
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-3 p-3 bg-muted/50 rounded-lg border', className)}>
        <Lock className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground truncate">{description}</p>
        </div>
        <Button asChild size="sm" variant="default">
          <Link href="/dashboard/membership">
            <Crown className="h-3 w-3 mr-1" />
            Upgrade
          </Link>
        </Button>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={cn('p-6 bg-card rounded-lg border text-center', className)}>
        <Lock className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">{description}</p>
        <Button asChild variant="default">
          <Link href="/dashboard/membership">
            <Crown className="h-4 w-4 mr-2" />
            Upgrade Now
          </Link>
        </Button>
      </div>
    );
  }

  if (variant === 'full-page') {
    return (
      <div className={cn('bg-secondary/30 flex-1', className)}>
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-card rounded-lg border p-8">
              <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-3">{title}</h1>
              <p className="text-muted-foreground mb-6">{description}</p>
              <Button asChild size="lg" variant="default">
                <Link href="/dashboard/membership">
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade Now
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn('flex flex-col items-center py-6 px-4 text-center', className)}>
      <Lock className="h-8 w-8 text-muted-foreground mb-3" />
      <h3 className="text-base font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-xs">{description}</p>
      <Button asChild variant="default" size="sm">
        <Link href="/dashboard/membership">
          <Crown className="h-4 w-4 mr-2" />
          Upgrade Now
        </Link>
      </Button>
    </div>
  );
}
