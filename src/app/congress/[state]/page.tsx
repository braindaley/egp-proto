
import { notFound } from 'next/navigation';

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

export default async function StateCongressPage({ params }: { params: Promise<{ state: string }> }) {
  const { state } = await params;
  const stateName = states[state.toLowerCase()];

  if (!stateName) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="text-center mb-12">
        <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-2">
          Members of Congress for {stateName}
        </h1>
        <p className="text-lg text-muted-foreground">
           Senators and Representatives for {state.toUpperCase()}
        </p>
      </header>
      
      {/* Placeholder for member list */}
      <div className="text-center py-10 px-6 bg-card rounded-lg shadow-md">
        <p className="text-xl font-semibold">Coming Soon</p>
        <p className="text-muted-foreground mt-2">
          Member data will be displayed here in the next step.
        </p>
      </div>

    </div>
  );
}
