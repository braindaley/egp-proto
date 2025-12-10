'use client';

import { Button } from '@/components/ui/button';
import { useWatchedGroups } from '@/hooks/use-watched-groups';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface WatchButtonProps {
  groupSlug: string;
  groupName?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function WatchButton({ 
  groupSlug, 
  groupName, 
  variant = 'outline', 
  size = 'default',
  className 
}: WatchButtonProps) {
  const { isWatched, toggleWatch } = useWatchedGroups();
  const { user } = useAuth();
  const router = useRouter();
  const watched = isWatched(groupSlug);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      // Redirect to login with return URL
      const currentUrl = window.location.pathname;
      router.push(`/login?returnTo=${encodeURIComponent(currentUrl)}`);
      return;
    }
    
    console.log('WatchButton clicked for:', groupSlug, 'current watched state:', watched);
    toggleWatch(groupSlug);
    console.log('toggleWatch called');
  };

  return (
    <Button
      variant={watched ? 'secondary' : variant}
      size={size}
      onClick={handleClick}
      className={cn(
        'flex items-center gap-2',
        watched && 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
        className
      )}
    >
{watched ? 'Unwatch' : 'Watch'}
    </Button>
  );
}