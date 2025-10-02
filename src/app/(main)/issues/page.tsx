import Link from 'next/link';
import { SITE_ISSUE_CATEGORIES } from '@/lib/policy-area-mapping';

function convertTitleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function IssuesPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-2xl">
      <header className="text-center mb-12">
        <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-2">Policy Issues</h1>
        <p className="text-lg text-muted-foreground">
          Explore policy issues and legislation
        </p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SITE_ISSUE_CATEGORIES.map((category) => {
          const slug = convertTitleToSlug(category);

          return (
            <Link
              key={category}
              href={`/issues/${slug}`}
              className="text-center p-4 rounded-lg bg-card text-card-foreground shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors duration-200 ease-in-out"
            >
              <span className="font-medium">{category}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Policy Issues | eGutenberg Press',
  description: 'Explore policy issues and legislation across various categories.',
};
