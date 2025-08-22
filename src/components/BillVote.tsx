import React from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

export type VoteType = 'support' | 'oppose' | 'voted-support' | 'voted-oppose';

interface BillVoteProps {
  type?: VoteType;
  percentage?: number;
  className?: string;
}

export function BillVote({ type = 'support', percentage = 50, className = '' }: BillVoteProps) {
  const isSupport = type === 'support' || type === 'voted-support';
  const isVoted = type === 'voted-support' || type === 'voted-oppose';
  
  const Icon = isSupport ? ThumbsUp : ThumbsDown;
  
  return (
    <div className={`flex items-end gap-1 ${className}`}>
      <Icon 
        className={`h-6 w-6 ${isVoted ? 'fill-current' : ''}`}
        fill={isVoted ? 'currentColor' : 'none'}
      />
      <span className="text-base leading-7 font-normal">
        {percentage}%
      </span>
    </div>
  );
}

export default BillVote;