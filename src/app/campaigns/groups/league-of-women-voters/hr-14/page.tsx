'use client';

import Image from 'next/image';
import AdvocacyBillCard from '@/components/advocacy-bill-card';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function HR14DetailPage() {
  const billData = {
    bill: {
      number: '14',
      type: 'HR',
      congress: 119,
      title: 'John R. Lewis Voting Rights Advancement Act'
    },
    position: 'Support',
    actionButtonText: 'Voice your opinion',
    reasoning: `
      <h3>Why LWV Supports the John R. Lewis Voting Rights Advancement Act</h3>
      <ul>
        <li><strong>It restores protections weakened by court decisions.</strong> After the 2013 <em>Shelby County v. Holder</em> ruling gutted key provisions of the Voting Rights Act, this legislation is seen as essential to reestablish federal oversight and guard against discriminatory changes in voting laws.</li>
        <li><strong>It defends democracy and honors the VRA's legacy.</strong> Named for civil rights hero John Lewis, the bill is framed as much-needed defense of voting rights—particularly amid renewed state-level attacks on fair representation and redistricting.</li>
        <li><strong>It aligns with LWV's mission.</strong> The League has a long history of fighting to make elections fair, inclusive, and accessible. This act fits squarely within that mission by preventing racial discrimination and ensuring every voter is heard.</li>
      </ul>
    `,
    supportCount: 9850,
    opposeCount: 1520,
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="max-w-3xl mx-auto space-y-6">
        <Card>
          <CardHeader className="text-center pb-4">
            <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center mx-auto mb-4">
              <Image 
                src="https://placehold.co/100x100.png" 
                alt="League of Women Voters logo" 
                width={100} 
                height={100}
              />
            </div>
            <h1 className="text-3xl font-bold font-headline text-primary">
              You've been invited to voice your opinion
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              League of Women Voters urges you to support H.R. 14
            </p>
          </CardHeader>
        </Card>
        
        <AdvocacyBillCard 
          bill={billData.bill}
          position={billData.position}
          reasoning={billData.reasoning}
          actionButtonText={billData.actionButtonText}
          supportCount={billData.supportCount}
          opposeCount={billData.opposeCount}
        />
      </div>
    </div>
  );
}