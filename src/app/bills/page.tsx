
import { redirect } from 'next/navigation';
import type { Congress } from '@/types';

async function getCongresses(): Promise<Congress[]> {
    // This assumes the app is running on localhost, which is fine for dev.
    // In a real deployment, you'd use a relative URL or an env var for the base URL.
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
    const url = `${baseUrl}/api/congresses`;

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

// This page now handles redirecting from the old /bills route
// to the new congress-specific route, e.g., /bill/119
export default async function BillsRedirectPage() {
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

  redirect(`/bill/${latestCongress}`);
}
