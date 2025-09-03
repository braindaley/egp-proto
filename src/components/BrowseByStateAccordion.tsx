'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { US_STATES, convertStateToSlug } from '@/lib/states';

interface BrowseByStateAccordionProps {
  policySlug: string;
  policyTitle: string;
}

export function BrowseByStateAccordion({ policySlug, policyTitle }: BrowseByStateAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Card className="cursor-pointer hover:shadow-lg transition-all duration-200">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span>Browse by State</span>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
              </CardTitle>
            </CardHeader>
          </Card>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground mb-6">
                Browse state-by-state policies and initiatives for {policyTitle.toLowerCase()}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {US_STATES.map((state) => (
                  <Link
                    key={state}
                    href={`/issues/${policySlug}/${convertStateToSlug(state)}`}
                    className="text-center p-3 rounded-lg bg-muted/50 text-foreground hover:bg-primary hover:text-primary-foreground transition-colors duration-200 ease-in-out text-sm font-medium"
                  >
                    {state}
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}