import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SimpleBillStatusProps {
  status: 'introduced' | 'in-committee' | 'passed-house' | 'passed-senate' | 'enacted' | 'failed';
  chamber?: 'house' | 'senate' | 'both';
  date?: string;
  className?: string;
}

const statusConfig = {
  'introduced': {
    label: 'Introduced',
    color: 'bg-gray-100 text-gray-700 border-gray-300'
  },
  'in-committee': {
    label: 'In Committee',
    color: 'bg-stone-100 text-stone-700 border-stone-300'
  },
  'passed-house': {
    label: 'Passed House',
    color: 'bg-slate-100 text-slate-700 border-slate-300'
  },
  'passed-senate': {
    label: 'Passed Senate',
    color: 'bg-zinc-100 text-zinc-700 border-zinc-300'
  },
  'enacted': {
    label: 'Enacted',
    color: 'bg-stone-200 text-stone-700 border-stone-300'
  },
  'failed': {
    label: 'Failed',
    color: 'bg-amber-100 text-amber-700 border-amber-300'
  }
};

export function SimpleBillStatus({ status, chamber, date, className }: SimpleBillStatusProps) {
  const config = statusConfig[status];
  
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <div className={cn(
        "px-3 py-1 rounded-full text-sm font-medium border",
        config.color
      )}>
        {config.label}
      </div>
      {chamber && (
        <Badge variant="outline" className="text-xs">
          {chamber === 'both' ? 'House & Senate' : chamber === 'house' ? 'House' : 'Senate'}
        </Badge>
      )}
      {date && (
        <span className="text-xs text-muted-foreground">
          {new Date(date).toLocaleDateString()}
        </span>
      )}
    </div>
  );
}