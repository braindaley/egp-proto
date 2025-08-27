import Link from 'next/link';
import { SITE_ISSUE_CATEGORIES } from '@/lib/policy-area-mapping';

function convertTitleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

const issueCategories = SITE_ISSUE_CATEGORIES.map(category => ({
  name: category,
  slug: convertTitleToSlug(category)
}));

export default function IssuesPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-2xl">
      <header className="text-center mb-12">
        <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-2">
          Explore Issues
        </h1>
        <p className="text-lg text-muted-foreground">
          Browse legislation and policy initiatives by issue category.
        </p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {issueCategories.map((category) => (
          <Link
            href={`/issues/${category.slug}`}
            key={category.slug}
            className="text-center p-4 rounded-lg bg-card text-card-foreground shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors duration-200 ease-in-out"
          >
            <span className="font-medium">{category.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}