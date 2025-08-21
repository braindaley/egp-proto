'use client';

import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { useWatchedGroups } from '@/hooks/use-watched-groups';
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
  const watched = isWatched(groupSlug);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWatch(groupSlug);
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
{watched ? (
        <>
          <EyeOff className="h-4 w-4" />
          Unwatch
        </>
      ) : (
        <>
          <Eye className="h-4 w-4" />
          Watch
        </>
      )}
    </Button>
  );
}