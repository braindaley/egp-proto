import { notFound } from 'next/navigation';
import { SITE_ISSUE_CATEGORIES } from '@/lib/policy-area-mapping';
import { US_STATES, convertStateToSlug } from '@/lib/states';

function convertTitleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

function convertSlugToTitle(slug: string): string {
  const categoryMap = SITE_ISSUE_CATEGORIES.reduce((acc, category) => {
    acc[convertTitleToSlug(category)] = category;
    return acc;
  }, {} as Record<string, string>);
  
  return categoryMap[slug] || null;
}

function convertSlugToState(slug: string): string {
  const stateMap = US_STATES.reduce((acc, state) => {
    acc[convertStateToSlug(state)] = state;
    return acc;
  }, {} as Record<string, string>);
  
  return stateMap[slug] || null;
}

export default async function StatePolicyPage({ 
  params 
}: { 
  params: Promise<{ policy: string; state: string }> 
}) {
  const { policy, state } = await params;
  const policyTitle = convertSlugToTitle(policy);
  const stateName = convertSlugToState(state);
  
  if (!policyTitle || !stateName) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">
        {stateName} - {policyTitle} Policies
      </h1>
    </div>
  );
}

export async function generateStaticParams() {
  const params = [];
  
  for (const category of SITE_ISSUE_CATEGORIES) {
    for (const state of US_STATES) {
      params.push({
        policy: convertTitleToSlug(category),
        state: convertStateToSlug(state),
      });
    }
  }
  
  return params;
}