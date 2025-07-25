
import { notFound } from 'next/navigation';
import { getCongressMembers } from '@/ai/flows/get-congress-members-flow';
import { MemberCard } from '@/components/member-card';
import type { Member } from '@/types';

const states: Record<string, string> = {
  al: 'Alabama', ak: 'Alaska', az: 'Arizona', ar: 'Arkansas', ca: 'California',
  co: 'Colorado', ct: 'Connecticut', de: 'Delaware', fl: 'Florida', ga: 'Georgia',
  hi: 'Hawaii', id: 'Idaho', il: 'Illinois', in: 'Indiana', ia: 'Iowa',
  ks: 'Kansas', ky: 'Kentucky', la: 'Louisiana', me: 'Maine', md: 'Maryland',
  ma: 'Massachusetts', mi: 'Michigan', mn: 'Minnesota', ms: 'Mississippi', mo: 'Missouri',
  mt: 'Montana', ne: 'Nebraska', nv: 'Nevada', nh: 'New Hampshire', nj: 'New Jersey',
  nm: 'New Mexico', ny: 'New York', nc: 'North Carolina', nd: 'North Dakota', oh: 'Ohio',
  ok: 'Oklahoma', or: 'Oregon', pa: 'Pennsylvania', ri: 'Rhode Island', sc: 'South Carolina',
  sd: 'South Dakota', tn: 'Tennessee', tx: 'Texas', ut: 'Utah', vt: 'Vermont',
  va: 'Virginia', wa: 'Washington', wv: 'West Virginia', wi: 'Wisconsin', wy: 'Wyoming'
};

export default async function StateCongressPage({ params }: { params: { congress: string, state: string } }) {
  const { congress, state } = params;
  const stateName = states[state.toLowerCase()];

  if (!stateName) {
    notFound();
  }

  const memberData = await getCongressMembers({ congress, state });

  const senators = memberData?.senators || [];
  const representatives = memberData?.representatives || [];

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="text-center mb-12">
        <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-2">
          {congress}th Congress: {stateName}
        </h1>
        <p className="text-lg text-muted-foreground">
           Senators and Representatives for {state.toUpperCase()}
        </p>
      </header>
      
      <section>
        <h2 className="font-headline text-3xl font-bold text-primary mb-6 border-b pb-3">Senate</h2>
        {senators.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {senators.map((senator, index) => (
              <MemberCard key={senator.bioguideId || index} member={senator} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">Could not load senators at this time.</p>
        )}
      </section>

      <section className="mt-12">
        <h2 className="font-headline text-3xl font-bold text-primary mb-6 border-b pb-3">House of Representatives</h2>
        {representatives.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {representatives.map((rep, index) => (
              <MemberCard key={rep.bioguideId || index} member={rep} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">Could not load representatives at this time.</p>
        )}
      </section>
    </div>
  );
}
