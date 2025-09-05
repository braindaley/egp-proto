import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SITE_ISSUE_CATEGORIES } from '@/lib/policy-area-mapping';
import USMap from '@/components/USMap';
import { BrowseByStateAccordion } from '@/components/BrowseByStateAccordion';
import { UserStateBills } from '@/components/UserStateBills';

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

export default async function PolicyPage({ params }: { params: Promise<{ policy: string }> }) {
  const { policy } = await params;
  const policyTitle = convertSlugToTitle(policy);
  
  if (!policyTitle) {
    notFound();
  }

  return (
    <div className="bg-secondary/30 flex-1">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-4xl font-bold mb-2 text-center">{policyTitle}</h1>
      <p className="text-center text-muted-foreground mb-8">
        Browse pending {policyTitle.toLowerCase()} legislation
      </p>
      
      <div className="mb-12">
        <USMap />
      </div>

      <div className="mb-12">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle>Federal Level</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Explore federal policies and legislation related to {policyTitle.toLowerCase()}.
            </p>
            <Link 
              href={`/issues/${policy}/federal`}
              className="inline-flex items-center text-primary hover:underline font-medium"
            >
              View Federal Policies →
            </Link>
          </CardContent>
        </Card>
      </div>

      <div id="states">
        <h2 className="text-2xl font-bold mb-6">State Level</h2>
        <UserStateBills 
          policySlug={policy}
          policyTitle={policyTitle}
        />
        <div className="mt-8">
          <BrowseByStateAccordion 
            policySlug={policy} 
            policyTitle={policyTitle}
          />
        </div>
      </div>
    </div>
    </div>
  );
}

export async function generateStaticParams() {
  return SITE_ISSUE_CATEGORIES.map((category) => ({
    policy: convertTitleToSlug(category),
  }));
}