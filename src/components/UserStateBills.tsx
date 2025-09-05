'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, FileText, Users, Calendar } from 'lucide-react';
import { useZipCode } from '@/hooks/use-zip-code';
import Link from 'next/link';

interface UserStateBillsProps {
  policySlug: string;
  policyTitle: string;
}

interface Bill {
  bill_id: number;
  number: string;
  title: string;
  description?: string;
  status: string;
  last_action?: string;
  last_action_date?: string;
  sponsors?: Array<{ name: string; party: string }>;
  subjects?: string[];
}

// Helper to get state from zip code prefix
function getStateFromZip(zipCode: string): { state: string, stateCode: string } | null {
  const prefix = zipCode.substring(0, 3);
  const statesByPrefix: Record<string, { state: string, stateCode: string }> = {
    // California ranges
    '900': { state: 'California', stateCode: 'CA' },
    '901': { state: 'California', stateCode: 'CA' },
    '902': { state: 'California', stateCode: 'CA' },
    '903': { state: 'California', stateCode: 'CA' },
    '904': { state: 'California', stateCode: 'CA' },
    '905': { state: 'California', stateCode: 'CA' },
    '906': { state: 'California', stateCode: 'CA' },
    '907': { state: 'California', stateCode: 'CA' },
    '908': { state: 'California', stateCode: 'CA' },
    '910': { state: 'California', stateCode: 'CA' },
    '911': { state: 'California', stateCode: 'CA' },
    '912': { state: 'California', stateCode: 'CA' },
    '913': { state: 'California', stateCode: 'CA' },
    '914': { state: 'California', stateCode: 'CA' },
    '915': { state: 'California', stateCode: 'CA' },
    '916': { state: 'California', stateCode: 'CA' },
    '917': { state: 'California', stateCode: 'CA' },
    '918': { state: 'California', stateCode: 'CA' },
    '919': { state: 'California', stateCode: 'CA' },
    '920': { state: 'California', stateCode: 'CA' },
    '921': { state: 'California', stateCode: 'CA' },
    '922': { state: 'California', stateCode: 'CA' },
    '923': { state: 'California', stateCode: 'CA' },
    '924': { state: 'California', stateCode: 'CA' },
    '925': { state: 'California', stateCode: 'CA' },
    '926': { state: 'California', stateCode: 'CA' },
    '927': { state: 'California', stateCode: 'CA' },
    '928': { state: 'California', stateCode: 'CA' },
    '930': { state: 'California', stateCode: 'CA' },
    '931': { state: 'California', stateCode: 'CA' },
    '932': { state: 'California', stateCode: 'CA' },
    '933': { state: 'California', stateCode: 'CA' },
    '934': { state: 'California', stateCode: 'CA' },
    '935': { state: 'California', stateCode: 'CA' },
    '936': { state: 'California', stateCode: 'CA' },
    '937': { state: 'California', stateCode: 'CA' },
    '938': { state: 'California', stateCode: 'CA' },
    '939': { state: 'California', stateCode: 'CA' },
    '940': { state: 'California', stateCode: 'CA' },
    '941': { state: 'California', stateCode: 'CA' },
    '942': { state: 'California', stateCode: 'CA' },
    '943': { state: 'California', stateCode: 'CA' },
    '944': { state: 'California', stateCode: 'CA' },
    '945': { state: 'California', stateCode: 'CA' },
    '946': { state: 'California', stateCode: 'CA' },
    '947': { state: 'California', stateCode: 'CA' },
    '948': { state: 'California', stateCode: 'CA' },
    '949': { state: 'California', stateCode: 'CA' },
    '950': { state: 'California', stateCode: 'CA' },
    '951': { state: 'California', stateCode: 'CA' },
    '952': { state: 'California', stateCode: 'CA' },
    '953': { state: 'California', stateCode: 'CA' },
    '954': { state: 'California', stateCode: 'CA' },
    '955': { state: 'California', stateCode: 'CA' },
    '956': { state: 'California', stateCode: 'CA' },
    '957': { state: 'California', stateCode: 'CA' },
    '958': { state: 'California', stateCode: 'CA' },
    '959': { state: 'California', stateCode: 'CA' },
    '960': { state: 'California', stateCode: 'CA' },
    '961': { state: 'California', stateCode: 'CA' },
    // New York ranges
    '100': { state: 'New York', stateCode: 'NY' },
    '101': { state: 'New York', stateCode: 'NY' },
    '102': { state: 'New York', stateCode: 'NY' },
    '103': { state: 'New York', stateCode: 'NY' },
    '104': { state: 'New York', stateCode: 'NY' },
    '105': { state: 'New York', stateCode: 'NY' },
    '106': { state: 'New York', stateCode: 'NY' },
    '107': { state: 'New York', stateCode: 'NY' },
    '108': { state: 'New York', stateCode: 'NY' },
    '109': { state: 'New York', stateCode: 'NY' },
    '110': { state: 'New York', stateCode: 'NY' },
    '111': { state: 'New York', stateCode: 'NY' },
    '112': { state: 'New York', stateCode: 'NY' },
    '113': { state: 'New York', stateCode: 'NY' },
    '114': { state: 'New York', stateCode: 'NY' },
    '115': { state: 'New York', stateCode: 'NY' },
    '116': { state: 'New York', stateCode: 'NY' },
    '117': { state: 'New York', stateCode: 'NY' },
    '118': { state: 'New York', stateCode: 'NY' },
    '119': { state: 'New York', stateCode: 'NY' },
    // Texas ranges
    '750': { state: 'Texas', stateCode: 'TX' },
    '751': { state: 'Texas', stateCode: 'TX' },
    '752': { state: 'Texas', stateCode: 'TX' },
    '753': { state: 'Texas', stateCode: 'TX' },
    '754': { state: 'Texas', stateCode: 'TX' },
    '755': { state: 'Texas', stateCode: 'TX' },
    '756': { state: 'Texas', stateCode: 'TX' },
    '757': { state: 'Texas', stateCode: 'TX' },
    '758': { state: 'Texas', stateCode: 'TX' },
    '759': { state: 'Texas', stateCode: 'TX' },
    '760': { state: 'Texas', stateCode: 'TX' },
    '761': { state: 'Texas', stateCode: 'TX' },
    '762': { state: 'Texas', stateCode: 'TX' },
    '763': { state: 'Texas', stateCode: 'TX' },
    '764': { state: 'Texas', stateCode: 'TX' },
    '765': { state: 'Texas', stateCode: 'TX' },
    '766': { state: 'Texas', stateCode: 'TX' },
    '767': { state: 'Texas', stateCode: 'TX' },
    '768': { state: 'Texas', stateCode: 'TX' },
    '769': { state: 'Texas', stateCode: 'TX' },
    '770': { state: 'Texas', stateCode: 'TX' },
    '771': { state: 'Texas', stateCode: 'TX' },
    '772': { state: 'Texas', stateCode: 'TX' },
    '773': { state: 'Texas', stateCode: 'TX' },
    '774': { state: 'Texas', stateCode: 'TX' },
    '775': { state: 'Texas', stateCode: 'TX' },
    '776': { state: 'Texas', stateCode: 'TX' },
    '777': { state: 'Texas', stateCode: 'TX' },
    '778': { state: 'Texas', stateCode: 'TX' },
    '779': { state: 'Texas', stateCode: 'TX' },
    '780': { state: 'Texas', stateCode: 'TX' },
    '781': { state: 'Texas', stateCode: 'TX' },
    '782': { state: 'Texas', stateCode: 'TX' },
    '783': { state: 'Texas', stateCode: 'TX' },
    '784': { state: 'Texas', stateCode: 'TX' },
    '785': { state: 'Texas', stateCode: 'TX' },
    '786': { state: 'Texas', stateCode: 'TX' },
    '787': { state: 'Texas', stateCode: 'TX' },
    '788': { state: 'Texas', stateCode: 'TX' },
    '789': { state: 'Texas', stateCode: 'TX' },
    '790': { state: 'Texas', stateCode: 'TX' },
    '791': { state: 'Texas', stateCode: 'TX' },
    '792': { state: 'Texas', stateCode: 'TX' },
    '793': { state: 'Texas', stateCode: 'TX' },
    '794': { state: 'Texas', stateCode: 'TX' },
    '795': { state: 'Texas', stateCode: 'TX' },
    '796': { state: 'Texas', stateCode: 'TX' },
    '797': { state: 'Texas', stateCode: 'TX' },
    '798': { state: 'Texas', stateCode: 'TX' },
    '799': { state: 'Texas', stateCode: 'TX' },
    // Florida ranges
    '320': { state: 'Florida', stateCode: 'FL' },
    '321': { state: 'Florida', stateCode: 'FL' },
    '322': { state: 'Florida', stateCode: 'FL' },
    '323': { state: 'Florida', stateCode: 'FL' },
    '324': { state: 'Florida', stateCode: 'FL' },
    '325': { state: 'Florida', stateCode: 'FL' },
    '326': { state: 'Florida', stateCode: 'FL' },
    '327': { state: 'Florida', stateCode: 'FL' },
    '328': { state: 'Florida', stateCode: 'FL' },
    '329': { state: 'Florida', stateCode: 'FL' },
    '330': { state: 'Florida', stateCode: 'FL' },
    '331': { state: 'Florida', stateCode: 'FL' },
    '332': { state: 'Florida', stateCode: 'FL' },
    '333': { state: 'Florida', stateCode: 'FL' },
    '334': { state: 'Florida', stateCode: 'FL' },
    '335': { state: 'Florida', stateCode: 'FL' },
    '336': { state: 'Florida', stateCode: 'FL' },
    '337': { state: 'Florida', stateCode: 'FL' },
    '338': { state: 'Florida', stateCode: 'FL' },
    '339': { state: 'Florida', stateCode: 'FL' },
  };
  
  return statesByPrefix[prefix] || null;
}

function convertStateToSlug(state: string): string {
  return state
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export function UserStateBills({ policySlug, policyTitle }: UserStateBillsProps) {
  const { zipCode } = useZipCode();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(false);
  const [userState, setUserState] = useState<{ state: string, stateCode: string } | null>(null);

  useEffect(() => {
    if (!zipCode) return;

    const stateInfo = getStateFromZip(zipCode);
    setUserState(stateInfo);

    if (!stateInfo) return;

    const fetchStateBills = async () => {
      setLoading(true);
      try {
        // Get sessions for the state
        const sessionsResponse = await fetch(`/api/legiscan?action=sessions&state=${stateInfo.stateCode}`);
        const sessionsData = await sessionsResponse.json();

        if (sessionsData.status === 'success' && sessionsData.data?.sessions?.length > 0) {
          // Get the most recent session
          const currentSession = sessionsData.data.sessions[0];
          
          // Get masterlist for current session
          const masterlistResponse = await fetch(`/api/legiscan?action=masterlist&sessionId=${currentSession.session_id}`);
          const masterlistData = await masterlistResponse.json();

          if (masterlistData.status === 'success' && masterlistData.data?.masterlist) {
            // Filter bills by policy keywords
            const allBills = Object.values(masterlistData.data.masterlist) as Bill[];
            const filteredBills = allBills.filter((bill: Bill) => {
              const searchText = `${bill.title} ${bill.description || ''} ${(bill.subjects || []).join(' ')}`.toLowerCase();
              
              const policyKeywords = {
                'immigration-and-migration': ['immigration', 'immigrant', 'visa', 'border', 'refugee', 'asylum', 'citizenship', 'naturalization', 'deportation', 'sanctuary'],
                'climate-energy-and-environment': ['climate', 'energy', 'environment', 'renewable', 'carbon', 'emissions', 'pollution', 'conservation', 'sustainability', 'green'],
                'economy-and-work': ['economy', 'employment', 'jobs', 'labor', 'workplace', 'minimum wage', 'worker', 'business', 'trade', 'economic'],
                'healthcare-and-public-health': ['health', 'healthcare', 'medical', 'medicare', 'medicaid', 'insurance', 'hospital', 'public health', 'mental health'],
                'education': ['education', 'school', 'student', 'teacher', 'university', 'college', 'academic', 'learning', 'curriculum'],
                'criminal-justice': ['criminal', 'justice', 'police', 'prison', 'court', 'crime', 'law enforcement', 'sentencing', 'reform'],
                'civil-rights-and-liberties': ['civil rights', 'discrimination', 'equality', 'voting', 'privacy', 'freedom', 'liberty', 'constitutional', 'rights'],
                'housing-and-development': ['housing', 'development', 'affordable', 'zoning', 'construction', 'real estate', 'urban', 'homeless'],
                'transportation': ['transportation', 'highway', 'transit', 'infrastructure', 'roads', 'public transport', 'traffic', 'automotive'],
                'agriculture-and-food': ['agriculture', 'farming', 'food', 'crop', 'livestock', 'rural', 'agricultural', 'nutrition', 'farm']
              };

              const keywords = policyKeywords[policySlug as keyof typeof policyKeywords] || [];
              return keywords.some(keyword => searchText.includes(keyword));
            });

            setBills(filteredBills.slice(0, 5)); // Show top 5 relevant bills
          }
        }
      } catch (error) {
        console.error('Error fetching state bills:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStateBills();
  }, [zipCode, policySlug]);

  if (!zipCode) {
    return (
      <div className="mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Please set your zip code to see relevant state bills for your area.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!userState) {
    return (
      <div className="mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Unable to determine your state from zip code {zipCode}.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            {policyTitle} Bills in {userState.state}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Based on your zip code ({zipCode})
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-muted-foreground">Loading bills...</p>
            </div>
          ) : bills.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No {policyTitle.toLowerCase()} bills found for {userState.state}.</p>
              <Link 
                href={`/issues/${policySlug}/${convertStateToSlug(userState.state)}`}
                className="inline-flex items-center text-primary hover:underline font-medium mt-2"
              >
                Browse all {userState.state} bills →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {bills.map((bill) => (
                <div key={bill.bill_id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-sm">{bill.number}</h4>
                    <Badge variant="outline">{bill.status}</Badge>
                  </div>
                  <h3 className="font-medium mb-2">{bill.title}</h3>
                  {bill.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {bill.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {bill.sponsors && bill.sponsors.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{bill.sponsors[0].name} ({bill.sponsors[0].party})</span>
                        {bill.sponsors.length > 1 && <span>+{bill.sponsors.length - 1} more</span>}
                      </div>
                    )}
                    {bill.last_action_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(bill.last_action_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div className="text-center pt-4">
                <Link 
                  href={`/issues/${policySlug}/${convertStateToSlug(userState.state)}`}
                  className="inline-flex items-center text-primary hover:underline font-medium"
                >
                  View all {policyTitle.toLowerCase()} bills in {userState.state} →
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}