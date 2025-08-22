'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, Clock, AlertCircle, Archive, Gavel } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Bill } from '@/types';

interface BillStatusProps {
  bill: Bill;
  className?: string;
}

interface StatusStage {
  name: string;
  description: string;
  chamber?: 'House' | 'Senate' | 'Both';
  icon: React.ReactNode;
  date?: string;
}

const LEGISLATIVE_STAGES = [
  { 
    key: 'introduced', 
    label: 'Introduced', 
    description: 'Bill formally presented to Congress',
    icon: Circle
  },
  { 
    key: 'committee', 
    label: 'In Committee', 
    description: 'Under review by relevant committee(s)',
    icon: Clock
  },
  { 
    key: 'floor_debate', 
    label: 'Floor Debate', 
    description: 'Being debated on the chamber floor',
    icon: AlertCircle
  },
  { 
    key: 'passed_chamber', 
    label: 'Passed Chamber', 
    description: 'Approved by one chamber of Congress',
    icon: CheckCircle2
  },
  { 
    key: 'passed_both', 
    label: 'Passed Both Chambers', 
    description: 'Approved by House and Senate',
    icon: CheckCircle2
  },
  { 
    key: 'presidential', 
    label: 'Presidential Action', 
    description: 'Awaiting presidential signature or veto',
    icon: Gavel
  },
  { 
    key: 'enacted', 
    label: 'Enacted', 
    description: 'Signed into law',
    icon: CheckCircle2
  }
];

function getBillStageIndex(bill: Bill): number {
  const latestActionText = bill.latestAction?.text?.toLowerCase() || '';
  
  if (latestActionText.includes('became public law') || latestActionText.includes('signed by president')) {
    return 6; // Enacted
  }
  if (latestActionText.includes('presented to president') || latestActionText.includes('to president')) {
    return 5; // Presidential Action
  }
  if (latestActionText.includes('passed senate') && latestActionText.includes('passed house')) {
    return 4; // Passed Both
  }
  if (latestActionText.includes('passed') || latestActionText.includes('agreed to')) {
    return 3; // Passed Chamber
  }
  if (latestActionText.includes('debate') || latestActionText.includes('considered')) {
    return 2; // Floor Debate
  }
  if (latestActionText.includes('committee') || latestActionText.includes('referred')) {
    return 1; // In Committee
  }
  return 0; // Introduced
}

function getStatusVariant(stageIndex: number, currentStage: number): 'default' | 'secondary' | 'success' {
  if (stageIndex < currentStage) return 'success';
  if (stageIndex === currentStage) return 'default';
  return 'secondary';
}

export function BillStatus({ bill, className }: BillStatusProps) {
  const currentStageIndex = getBillStageIndex(bill);
  const progressPercentage = ((currentStageIndex + 1) / LEGISLATIVE_STAGES.length) * 100;
  
  const currentStage = LEGISLATIVE_STAGES[currentStageIndex];
  const isStalled = bill.latestAction && 
    new Date(bill.latestAction.actionDate).getTime() < Date.now() - (90 * 24 * 60 * 60 * 1000); // 90 days

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-headline">Bill Status</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={isStalled ? "destructive" : "default"}>
              {isStalled ? 'Stalled' : 'Active'}
            </Badge>
            <Badge variant="outline">
              {bill.type} {bill.number}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Status Summary */}
        <div className="rounded-lg bg-muted p-4">
          <div className="flex items-start gap-3">
            <div className={cn(
              "mt-0.5 rounded-full p-1",
              currentStageIndex >= 6 ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"
            )}>
              {React.createElement(currentStage.icon, { className: "h-5 w-5" })}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-base">{currentStage.label}</h3>
              <p className="text-sm text-muted-foreground mt-1">{currentStage.description}</p>
              {bill.latestAction && (
                <div className="mt-3 text-sm">
                  <p className="font-medium">Latest Action:</p>
                  <p className="text-muted-foreground">
                    {new Date(bill.latestAction.actionDate).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })} - {bill.latestAction.text}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Legislative Progress</span>
            <span className="text-muted-foreground">{Math.round(progressPercentage)}% Complete</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Timeline */}
        <div className="space-y-1">
          <h4 className="font-semibold text-sm mb-3">Legislative Timeline</h4>
          <div className="relative">
            {LEGISLATIVE_STAGES.map((stage, index) => {
              const isCompleted = index <= currentStageIndex;
              const isCurrent = index === currentStageIndex;
              const Icon = stage.icon;
              
              return (
                <div key={stage.key} className="relative flex items-start gap-4 pb-6 last:pb-0">
                  {/* Connector Line */}
                  {index < LEGISLATIVE_STAGES.length - 1 && (
                    <div 
                      className={cn(
                        "absolute left-[15px] top-8 h-full w-0.5",
                        isCompleted ? "bg-primary" : "bg-border"
                      )}
                    />
                  )}
                  
                  {/* Icon */}
                  <div className={cn(
                    "relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 bg-background",
                    isCompleted ? "border-primary" : "border-border",
                    isCurrent && "ring-4 ring-primary/20"
                  )}>
                    <Icon className={cn(
                      "h-4 w-4",
                      isCompleted ? "text-primary" : "text-muted-foreground"
                    )} />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 pt-0.5">
                    <div className="flex items-center gap-2">
                      <p className={cn(
                        "font-medium text-sm",
                        isCompleted ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {stage.label}
                      </p>
                      {isCurrent && (
                        <Badge variant="default" className="text-xs">
                          Current
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {stage.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chamber Progress (if applicable) */}
        {bill.originChamber && (
          <div className="border-t pt-4">
            <h4 className="font-semibold text-sm mb-3">Chamber Progress</h4>
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">House</span>
                  <Badge 
                    variant={bill.originChamber === 'House' ? 'default' : 'outline'} 
                    className="text-xs"
                  >
                    {bill.originChamber === 'House' ? 'Origin' : 'Review'}
                  </Badge>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full transition-all",
                      currentStageIndex >= 3 ? "bg-green-500 w-full" : 
                      currentStageIndex >= 1 ? "bg-blue-500 w-1/2" : "bg-gray-300 w-0"
                    )}
                  />
                </div>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Senate</span>
                  <Badge 
                    variant={bill.originChamber === 'Senate' ? 'default' : 'outline'} 
                    className="text-xs"
                  >
                    {bill.originChamber === 'Senate' ? 'Origin' : 'Review'}
                  </Badge>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full transition-all",
                      currentStageIndex >= 4 ? "bg-green-500 w-full" : 
                      bill.originChamber === 'Senate' && currentStageIndex >= 1 ? "bg-blue-500 w-1/2" : "bg-gray-300 w-0"
                    )}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Key Dates */}
        <div className="border-t pt-4">
          <h4 className="font-semibold text-sm mb-3">Key Dates</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Introduced</p>
              <p className="font-medium">
                {new Date(bill.introducedDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Last Updated</p>
              <p className="font-medium">
                {new Date(bill.updateDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}