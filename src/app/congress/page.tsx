
import { redirect } from 'next/navigation';
import type { Congress } from '@/types';

async function getCongresses(): Promise<Congress[]> {
  const API_KEY = process.env.CONGRESS_API_KEY || 'DEMO_KEY';
  const url = `https://api.congress.gov/v3/congress?limit=250&api_key=${API_KEY}`;

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) {
      console.error(`Failed to fetch congresses: ${res.status}`);
      return [];
    }
    const data = await res.json();
    return data.congresses || [];
  } catch (error) {
    console.error('Error fetching congresses:', error);
    return [];
  }
}

// This page now handles redirecting from the old /congress route
// to the new congress-specific route, e.g., /congress/119
export default async function CongressRedirectPage() {
  const congresses = await getCongresses();
  
  const sortedCongresses = (congresses || [])
    .filter(Boolean)
    .map(congress => ({
      ...congress,
      number: parseInt(congress.name.match(/(\d+)/)?.[1] || '0', 10)
    }))
    .sort((a, b) => b.number - a.number);

  // Default to 119 if the API fails
  const latestCongress = sortedCongresses[0]?.number.toString() || '119';

  redirect(`/congress/${latestCongress}`);
}
