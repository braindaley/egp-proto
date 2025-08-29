
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Check, Dot } from 'lucide-react';
import { HouseIcon, SenateIcon, PresidentIcon, LawIcon, BillIcon } from '@/components/icons';
import type { Bill } from '@/types';

type Step = 'Introduced' | 'Passed House' | 'Passed Senate' | 'To President' | 'Became Law';
type StepState = 'done' | 'active' | 'pending';

const ALL_STEPS: Step[] = [
  'Introduced',
  'Passed House',
  'Passed Senate',
  'To President',
  'Became Law',
];

interface TrackerStep {
  label: Step;
  state: StepState;
  date?: string;
}

// Helper to format date consistently
function formatDate(dateString: string) {
    if (!dateString) return '';
    // Use UTC to prevent hydration errors from timezone differences
    return new Date(dateString).toLocaleDateString('en-US', { timeZone: 'UTC' });
}


const getStepStatus = (latestActionText: string, originChamber: string): { currentIndex: number, currentDate?: string } => {
  const lowerCaseAction = latestActionText.toLowerCase();

  if (lowerCaseAction.includes('became public law') || 
      lowerCaseAction.includes('signed by president') ||
      lowerCaseAction.includes('signed into law') ||
      lowerCaseAction.includes('public law no')) {
    return { currentIndex: 4 };
  }
  if (lowerCaseAction.includes('presented to president')) {
    return { currentIndex: 3 };
  }
  
  const passedHouse = lowerCaseAction.includes('passed house') || lowerCaseAction.includes('passed/agreed to in house');
  const passedSenate = lowerCaseAction.includes('passed senate') || lowerCaseAction.includes('passed/agreed to in senate');

  if (passedHouse && passedSenate) {
      // If it passed both, but not yet to president, we set the active step to the *other* chamber's pass.
      return { currentIndex: originChamber === 'House' ? 2 : 1 };
  }

  if (passedSenate) {
    return { currentIndex: 2 };
  }
  if (passedHouse) {
    return { currentIndex: 1 };
  }
  if (lowerCaseAction.includes('introduced')) {
    return { currentIndex: 0 };
  }

  // Default to introduced if no other status matches
  return { currentIndex: 0 };
};

const StepIcon = ({ step, state }: { step: Step, state: StepState }) => {
    const iconProps = {
        className: cn(
            "h-6 w-6",
            state === 'done' && 'text-primary',
            state === 'active' && 'text-primary',
            state === 'pending' && 'text-muted-foreground'
        )
    };

    if (state === 'done') {
        return <Check {...iconProps} />;
    }

    switch(step) {
        case 'Introduced': return <BillIcon {...iconProps} />;
        case 'Passed House': return <HouseIcon {...iconProps} />;
        case 'Passed Senate': return <SenateIcon {...iconProps} />;
        case 'To President': return <PresidentIcon {...iconProps} />;
        case 'Became Law': return <LawIcon {...iconProps} />;
        default: return <Dot {...iconProps} />;
    }
}

export function BillTracker({ latestAction, originChamber }: { latestAction: Bill['latestAction'], originChamber: Bill['originChamber'] }) {
  const trackerSteps = useMemo((): TrackerStep[] => {
    const { currentIndex } = getStepStatus(latestAction.text, originChamber);

    return ALL_STEPS.map((label, idx) => {
        let state: StepState;
        if (idx < currentIndex) {
            state = 'done';
        } else if (idx === currentIndex) {
            state = 'active';
        } else {
            state = 'pending';
        }
        return {
            label,
            state,
            date: state === 'active' ? latestAction.actionDate : undefined
        };
    });
  }, [latestAction, originChamber]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bill Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          {trackerSteps.map((step, index) => (
            <div key={step.label} className="flex flex-col items-center text-center flex-1">
                <div className={cn(
                    "flex items-center justify-center w-12 h-12 rounded-full border-2",
                    step.state === 'done' && 'bg-primary/10 border-primary text-primary',
                    step.state === 'active' && 'bg-primary/10 border-primary animate-pulse',
                    step.state === 'pending' && 'bg-muted border-border'
                )}>
                   <StepIcon step={step.label} state={step.state} />
                </div>
                <p className={cn(
                    "text-xs font-semibold mt-2",
                    step.state !== 'pending' && 'text-primary',
                    step.state === 'pending' && 'text-muted-foreground',
                )}>
                    {step.label}
                </p>
                {step.date && <p className="text-xs text-muted-foreground">{formatDate(step.date)}</p>}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

    