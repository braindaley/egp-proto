import { notFound } from 'next/navigation';
import { SITE_ISSUE_CATEGORIES } from '@/lib/policy-area-mapping';
import PolicyHomepage from '@/components/policy-homepage';

function convertTitleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function convertSlugToTitle(slug: string): string {
  const categoryMap = SITE_ISSUE_CATEGORIES.reduce((acc, category) => {
    acc[convertTitleToSlug(category)] = category;
    return acc;
  }, {} as Record<string, string>);

  return categoryMap[slug] || null;
}

export default async function PolicyHomepagePage({ params }: { params: Promise<{ policy: string }> }) {
  const { policy } = await params;
  const policyTitle = convertSlugToTitle(policy);

  if (!policyTitle) {
    notFound();
  }

  return <PolicyHomepage policyCategory={policyTitle} />;
}

export async function generateStaticParams() {
  return SITE_ISSUE_CATEGORIES.map((category) => ({
    policy: convertTitleToSlug(category),
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ policy: string }> }) {
  const { policy } = await params;
  const policyTitle = convertSlugToTitle(policy);

  if (!policyTitle) {
    return {
      title: 'Policy Not Found',
    };
  }

  return {
    title: `${policyTitle} News & Action | eGutenberg Press`,
    description: `Stay informed about ${policyTitle.toLowerCase()} legislation and policy developments. Track bills, connect with advocacy groups, and make your voice heard.`,
  };
}