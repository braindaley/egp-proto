
import Link from 'next/link';

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
  { name: 'No Labels', slug: 'no-labels' },
].sort((a, b) => a.name.localeCompare(b.name));

export default function VoterAdvocacyGroupsPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="text-center mb-12">
          <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-2">Voter Advocacy Groups</h1>
          <p className="text-lg text-muted-foreground">
            Explore organizations dedicated to strengthening democracy and voter participation.
          </p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {advocacyGroups.map((group) => (
          <Link
            href={`/groups/${group.slug}`}
            key={group.slug}
            className="text-center p-4 rounded-lg bg-card text-card-foreground shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors duration-200 ease-in-out"
          >
            <span className="font-medium">{group.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
