import React from 'react';

export type BillProgressStage = 'introduced' | 'in-committee' | 'passed-house' | 'passed-senate' | 'to-sign' | 'signed';

interface BillProgressProps {
  stage?: BillProgressStage;
  className?: string;
}

export function BillProgress({ stage = 'introduced', className = '' }: BillProgressProps) {
  const stages: BillProgressStage[] = ['in-committee', 'passed-house', 'passed-senate', 'to-sign', 'signed'];
  const stageLabels = ['In Committee', 'Passed House', 'Passed Senate', 'To President', 'Signed'];

  // Map 'introduced' to 'in-committee' for backward compatibility
  const normalizedStage = stage === 'introduced' ? 'in-committee' : stage;
  const currentStageIndex = stages.indexOf(normalizedStage);

  return (
    <div className={`flex gap-2 items-center ${className}`}>
      {stages.map((s, index) => (
        <React.Fragment key={s}>
          <div className="flex flex-col items-center">
            <div
              className={`rounded-full h-3 w-3 transition-all ${
                index <= currentStageIndex
                  ? 'bg-black'
                  : 'bg-gray-300'
              }`}
              aria-label={`Stage ${index + 1}: ${stageLabels[index]}`}
            />
            <span className={`text-[10px] mt-1 whitespace-nowrap ${
              index <= currentStageIndex ? 'text-black font-medium' : 'text-gray-400'
            }`}>
              {stageLabels[index]}
            </span>
          </div>
          {index < stages.length - 1 && (
            <div className={`h-[1px] w-8 -mt-3 ${
              index < currentStageIndex ? 'bg-black' : 'bg-gray-300'
            }`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export default BillProgress;