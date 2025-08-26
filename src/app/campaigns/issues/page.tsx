import Link from 'next/link';
import { ALLOWED_SUBJECTS } from '@/lib/subjects';

function convertTitleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export default function CampaignsIssuesPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="text-center mb-12">
        <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-2">
          Policy Issues
        </h1>
        <p className="text-lg text-muted-foreground">
          Explore legislation by issue category
        </p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ALLOWED_SUBJECTS.map((subject) => (
          <Link
            href={`/campaigns/issues/${convertTitleToSlug(subject)}`}
            key={subject}
            className="text-center p-6 rounded-lg bg-card text-card-foreground shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors duration-200 ease-in-out"
          >
            <span className="font-medium text-lg">{subject}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}