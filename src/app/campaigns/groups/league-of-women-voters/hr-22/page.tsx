'use client';

import Image from 'next/image';
import AdvocacyBillCard from '@/components/advocacy-bill-card';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function HR22DetailPage() {
  const billData = {
    bill: {
      number: '22',
      type: 'HR',
      congress: 119,
      title: 'SAVE Act'
    },
    position: 'Oppose',
    actionButtonText: 'Voice your opinion',
    reasoning: `
      <h3>Why LWV Opposes the SAVE Act (H.R. 22)</h3>
      <ul>
        <li><strong>It creates unnecessary barriers to voting.</strong> Although voters are already required to affirm citizenship when registering, the SAVE Act adds redundant requirements, such as presenting documentary proof of U.S. citizenship in person every time you update your registration. This puts an unfair burden on many eligible voters.</li>
        <li><strong>It disproportionately impacts marginalized groups.</strong> The League highlights how the SAVE Act harms rural voters, voters of color, military families who move frequently, those recovering from disasters, and especially married women who've changed their names and may struggle to match documentation.</li>
        <li><strong>It addresses a problem that doesn't exist.</strong> Noncitizen voting is already illegal and extremely rare. The League warns that the SAVE Act is rooted in fear, misinformation, and divisive rhetoric—not real threats to democracy.</li>
        <li><strong>It undermines voter access and overloads election infrastructure.</strong> Requiring in-person registrations and strict document checks could overwhelm local election offices and undermine the League's century-long mission of encouraging broad participation.</li>
      </ul>
    `,
    supportCount: 3100,
    opposeCount: 15600,
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-2xl">
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
              League of Women Voters urges you to oppose H.R. 22
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