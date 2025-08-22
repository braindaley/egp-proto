import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Bill } from '@/types';

const imgThumbsDown = "http://localhost:3845/assets/a86be980a3f2023a25e13e8650d8b8d4e9dd37a2.svg";

interface ProgressProps {
  property1?: "Introduced" | "Passed house" | "Passed senate" | "Singed" | "To sign";
}

function Progress({ property1 = "Introduced" }: ProgressProps) {
  const element = <div className="bg-[#222222] rounded shrink-0 size-2" />;
  const element1 = <div className="bg-[#d9d9d9] rounded shrink-0 size-2" />;
  
  if (property1 === "Passed senate") {
    return (
      <div className="content-stretch flex gap-0.5 items-center justify-start relative size-full">
        {element}
        <div className="bg-[#222222] rounded shrink-0 size-2" />
        <div className="bg-[#222222] rounded shrink-0 size-2" />
        {element1}
        {element1}
      </div>
    );
  }
  
  return (
    <div className="content-stretch flex gap-0.5 items-center justify-start relative size-full">
      {element}
      <div className="bg-[#d9d9d9] rounded shrink-0 size-2" />
      <div className="bg-[#d9d9d9] rounded shrink-0 size-2" />
      {element1}
      {element1}
    </div>
  );
}

interface VoteProps {
  property1?: "Thumbsdown" | "Thumbsup" | "Voted thumbsdown" | "voted thumbs up";
}

function Vote({ property1 = "Thumbsdown" }: VoteProps) {
  return (
    <div className="content-stretch flex gap-1 items-end justify-start relative size-full">
      <div className="relative shrink-0 size-6">
        <img alt="" className="block max-w-none size-full" src={imgThumbsDown} />
      </div>
      <div className="font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[#222222] text-[16px] text-nowrap">
        <p className="leading-[28px] whitespace-pre">60%</p>
      </div>
    </div>
  );
}

interface BillRowProps {
  bill: Bill;
}

function BillRow({ bill }: BillRowProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <Link href={`/bill/${bill.congress}/${bill.type.toLowerCase()}/${bill.number}`} className="block">
      <div className="box-border content-stretch flex flex-col items-start justify-center px-0 py-1 relative size-full hover:bg-gray-50 transition-colors">
        <div aria-hidden="true" className="absolute border-[0px_0px_1px] border-gray-200 border-solid inset-0 pointer-events-none" />
        <div className="content-stretch flex gap-2 items-center justify-start relative shrink-0 w-full">
          <div className="box-border content-stretch flex gap-2.5 items-center justify-center px-2.5 py-0.5 relative rounded-xl shrink-0">
            <div aria-hidden="true" className="absolute border border-gray-600 border-solid inset-0 pointer-events-none rounded-xl" />
            <div className="font-['Inter:Medium',_sans-serif] font-medium leading-[0] not-italic relative shrink-0 text-[#222222] text-[12px] text-nowrap">
              <p className="leading-[20px] whitespace-pre">{bill.type} {bill.number}</p>
            </div>
          </div>
          <div className="basis-0 font-['Inter:Regular',_sans-serif] font-normal grow leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#222222] text-[16px]">
            <p className="leading-[28px]">{bill.title}</p>
          </div>
          <div className="content-stretch flex gap-0.5 items-center justify-start relative shrink-0">
            <Progress />
          </div>
        </div>
        <div className="content-stretch flex gap-2 items-center justify-start relative shrink-0 w-full">
          <div className="basis-0 font-['Inter:Medium',_sans-serif] font-medium grow leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#222222] text-[0px]">
            <p className="leading-[20px] text-[12px]">
              <span className="font-['Inter:Bold',_sans-serif] font-medium not-italic">Latest Action:</span>
              <span className=""> {formatDate(bill.latestAction.actionDate)} - {bill.latestAction.text.substring(0, 60)}...</span>
            </p>
          </div>
          <div className="content-stretch flex gap-1 items-end justify-start relative shrink-0">
            <Vote />
          </div>
        </div>
      </div>
    </Link>
  );
}

interface IssueCardProps {
  issueTitle: string;
  bills: Bill[];
}

export default function IssueCard({ issueTitle, bills }: IssueCardProps) {
  const sortedBills = [...bills].sort((a, b) => {
    const dateA = new Date(a.latestAction.actionDate);
    const dateB = new Date(b.latestAction.actionDate);
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <div className="bg-[#ffffff] box-border content-stretch flex flex-col gap-3.5 items-start justify-start p-[20px] relative rounded-xl size-full">
      <div aria-hidden="true" className="absolute border border-gray-200 border-solid inset-0 pointer-events-none rounded-xl" />
      <div className="font-['Inter_Tight:Bold',_sans-serif] leading-[0] not-italic relative shrink-0 text-[#222222] text-[24px] w-full">
        <p className="leading-[32px]">{issueTitle}</p>
      </div>
      <div className="content-stretch flex flex-col gap-1 items-start justify-start relative shrink-0 w-full">
        {sortedBills.slice(0, 10).map((bill, index) => (
          <div key={`${bill.type}-${bill.number}`} className="box-border content-stretch flex flex-col items-start justify-center px-0 py-1 relative shrink-0 w-full">
            <BillRow bill={bill} />
          </div>
        ))}
      </div>
    </div>
  );
}