'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users, FileText } from 'lucide-react';
import { usePremiumAccess } from '@/hooks/use-premium-access';
import { PremiumUpgradeCTA } from '@/components/premium-upgrade-cta';

const states = [
  { name: 'Alabama', abbr: 'AL', capital: 'Montgomery' }, 
  { name: 'Alaska', abbr: 'AK', capital: 'Juneau' },
  { name: 'Arizona', abbr: 'AZ', capital: 'Phoenix' }, 
  { name: 'Arkansas', abbr: 'AR', capital: 'Little Rock' },
  { name: 'California', abbr: 'CA', capital: 'Sacramento' }, 
  { name: 'Colorado', abbr: 'CO', capital: 'Denver' },
  { name: 'Connecticut', abbr: 'CT', capital: 'Hartford' }, 
  { name: 'Delaware', abbr: 'DE', capital: 'Dover' },
  { name: 'Florida', abbr: 'FL', capital: 'Tallahassee' }, 
  { name: 'Georgia', abbr: 'GA', capital: 'Atlanta' },
  { name: 'Hawaii', abbr: 'HI', capital: 'Honolulu' }, 
  { name: 'Idaho', abbr: 'ID', capital: 'Boise' },
  { name: 'Illinois', abbr: 'IL', capital: 'Springfield' }, 
  { name: 'Indiana', abbr: 'IN', capital: 'Indianapolis' },
  { name: 'Iowa', abbr: 'IA', capital: 'Des Moines' }, 
  { name: 'Kansas', abbr: 'KS', capital: 'Topeka' },
  { name: 'Kentucky', abbr: 'KY', capital: 'Frankfort' }, 
  { name: 'Louisiana', abbr: 'LA', capital: 'Baton Rouge' },
  { name: 'Maine', abbr: 'ME', capital: 'Augusta' }, 
  { name: 'Maryland', abbr: 'MD', capital: 'Annapolis' },
  { name: 'Massachusetts', abbr: 'MA', capital: 'Boston' }, 
  { name: 'Michigan', abbr: 'MI', capital: 'Lansing' },
  { name: 'Minnesota', abbr: 'MN', capital: 'Saint Paul' }, 
  { name: 'Mississippi', abbr: 'MS', capital: 'Jackson' },
  { name: 'Missouri', abbr: 'MO', capital: 'Jefferson City' }, 
  { name: 'Montana', abbr: 'MT', capital: 'Helena' },
  { name: 'Nebraska', abbr: 'NE', capital: 'Lincoln' }, 
  { name: 'Nevada', abbr: 'NV', capital: 'Carson City' },
  { name: 'New Hampshire', abbr: 'NH', capital: 'Concord' }, 
  { name: 'New Jersey', abbr: 'NJ', capital: 'Trenton' },
  { name: 'New Mexico', abbr: 'NM', capital: 'Santa Fe' }, 
  { name: 'New York', abbr: 'NY', capital: 'Albany' },
  { name: 'North Carolina', abbr: 'NC', capital: 'Raleigh' }, 
  { name: 'North Dakota', abbr: 'ND', capital: 'Bismarck' },
  { name: 'Ohio', abbr: 'OH', capital: 'Columbus' }, 
  { name: 'Oklahoma', abbr: 'OK', capital: 'Oklahoma City' },
  { name: 'Oregon', abbr: 'OR', capital: 'Salem' }, 
  { name: 'Pennsylvania', abbr: 'PA', capital: 'Harrisburg' },
  { name: 'Rhode Island', abbr: 'RI', capital: 'Providence' }, 
  { name: 'South Carolina', abbr: 'SC', capital: 'Columbia' },
  { name: 'South Dakota', abbr: 'SD', capital: 'Pierre' }, 
  { name: 'Tennessee', abbr: 'TN', capital: 'Nashville' },
  { name: 'Texas', abbr: 'TX', capital: 'Austin' }, 
  { name: 'Utah', abbr: 'UT', capital: 'Salt Lake City' },
  { name: 'Vermont', abbr: 'VT', capital: 'Montpelier' }, 
  { name: 'Virginia', abbr: 'VA', capital: 'Richmond' },
  { name: 'Washington', abbr: 'WA', capital: 'Olympia' }, 
  { name: 'West Virginia', abbr: 'WV', capital: 'Charleston' },
  { name: 'Wisconsin', abbr: 'WI', capital: 'Madison' }, 
  { name: 'Wyoming', abbr: 'WY', capital: 'Cheyenne' }
];

export default function StateListingPage() {
  const { isPremium, isLoading } = usePremiumAccess();
  const searchParams = useSearchParams();
  const filterParam = searchParams.get('filter');

  // Show loading state briefly
  if (isLoading) {
    return (
      <div className="bg-secondary/30 flex-1">
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show premium upgrade CTA for non-premium users
  if (!isPremium) {
    return (
      <PremiumUpgradeCTA
        variant="full-page"
        title="State Legislation"
        description="Access state bills, legislators, and legislative sessions with a premium membership."
      />
    );
  }

  return (
    <div className="bg-secondary/30 flex-1">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <header className="text-center mb-12">
          <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-4">
            State Legislatures
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore state bills, legislators, and legislative sessions from across the United States.
            Select a session from the header to view data from any legislative period.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {states.map((state) => (
            <Link
              key={state.abbr}
              href={`/state/${state.abbr.toLowerCase()}${filterParam ? `?filter=${encodeURIComponent(filterParam)}` : ''}`}
              className="block"
            >
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer hover:border-primary/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-primary">
                      {state.name}
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {state.abbr}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>{state.capital}</span>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <FileText className="h-3 w-3" />
                      <span>Bills</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>Members</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <footer className="text-center mt-16 py-6 text-sm text-muted-foreground border-t">
          <p>
            State legislature data provided by{' '}
            <a 
              href="https://legiscan.com/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="underline hover:text-primary"
            >
              LegiScan
            </a>
            . Select a session from the header dropdown to view data from specific legislative periods.
          </p>
        </footer>
      </div>
    </div>
  );
}