
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight } from 'lucide-react';

const advocacyGroups = [
  { name: 'League of Women Voters', slug: 'league-of-women-voters' },
  { name: 'Brennan Center for Justice', slug: 'brennan-center-for-justice' },
  { name: 'Common Cause', slug: 'common-cause' },
  { name: 'Fair Elections Center', slug: 'fair-elections-center' },
  { name: 'FairVote', slug: 'fairvote' },
  { name: 'Vote Smart', slug: 'vote-smart' },
  { name: 'VoteRiders', slug: 'voteriders' },
  { name: 'Rock the Vote', slug: 'rock-the-vote' },
  { name: 'Mi Familia Vota', slug: 'mi-familia-vota' },
  { name: 'Black Voters Matter', slug: 'black-voters-matter' },
  { name: 'When We All Vote', slug: 'when-we-all-vote' },
  { name: 'Fair Fight Action', slug: 'fair-fight-action' },
  { name: 'Campaign Legal Center', slug: 'campaign-legal-center' },
  { name: 'BallotReady', slug: 'ballotready' },
  { name: 'Democracy Works (TurboVote)', slug: 'democracy-works-turbovote' },
  { name: 'HeadCount', slug: 'headcount' },
  { name: 'State Voices', slug: 'state-voices' },
  { name: 'Asian Americans Advancing Justice', slug: 'asian-americans-advancing-justice' },
  { name: 'NAACP Legal Defense Fund', slug: 'naacp-legal-defense-fund' },
  { name: 'Voto Latino', slug: 'voto-latino' },
  { name: 'Alliance for Youth Action', slug: 'alliance-for-youth-action' },
  { name: 'National Vote at Home Institute', slug: 'national-vote-at-home-institute' },
  { name: 'National Voter Registration Day', slug: 'national-voter-registration-day' },
  { name: 'Democracy NC', slug: 'democracy-nc' },
  { name: 'The Civics Center', slug: 'the-civics-center' },
];

export default function VoterAdvocacyGroupsPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">Voter Advocacy Groups</CardTitle>
          <CardDescription className="text-lg text-muted-foreground mt-2">
            Explore organizations dedicated to strengthening democracy and voter participation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {advocacyGroups.map((group) => (
              <Button asChild key={group.slug} variant="outline" className="justify-start">
                <Link href={`/groups/${group.slug}`} className="flex items-center justify-between">
                  <span>{group.name}</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
