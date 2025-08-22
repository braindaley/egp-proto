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
    color: 'bg-yellow-100 text-yellow-700 border-yellow-300'
  },
  'passed-house': {
    label: 'Passed House',
    color: 'bg-blue-100 text-blue-700 border-blue-300'
  },
  'passed-senate': {
    label: 'Passed Senate',
    color: 'bg-indigo-100 text-indigo-700 border-indigo-300'
  },
  'enacted': {
    label: 'Enacted',
    color: 'bg-green-100 text-green-700 border-green-300'
  },
  'failed': {
    label: 'Failed',
    color: 'bg-red-100 text-red-700 border-red-300'
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