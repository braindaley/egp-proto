import React from 'react';

export type BillProgressStage = 'introduced' | 'passed-house' | 'passed-senate' | 'to-sign' | 'signed';

interface BillProgressProps {
  stage?: BillProgressStage;
  className?: string;
}

export function BillProgress({ stage = 'introduced', className = '' }: BillProgressProps) {
  const stages: BillProgressStage[] = ['introduced', 'passed-house', 'passed-senate', 'to-sign', 'signed'];
  const currentStageIndex = stages.indexOf(stage);
  
  return (
    <div className={`flex gap-0.5 items-center ${className}`}>
      {stages.map((s, index) => (
        <div
          key={s}
          className={`rounded-full h-2 w-2 ${
            index <= currentStageIndex ? 'bg-foreground' : 'bg-muted'
          }`}
          aria-label={`Stage ${index + 1}: ${s.replace('-', ' ')}`}
        />
      ))}
    </div>
  );
}

export default BillProgress;