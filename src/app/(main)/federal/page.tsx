import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function FederalPage() {
  return (
    <div className="bg-secondary/30 flex-1">
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <header className="text-center mb-12">
          <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-4">
            Federal Government
          </h1>
          <p className="text-lg text-muted-foreground">
            Explore federal legislative information and congressional data
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-8">
          <Link href="/federal/congress" className="block">
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="text-2xl text-primary">Congress</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Access information about congressional members, committees, and legislative activities from current and past sessions.
                </p>
                <div className="text-sm text-primary font-medium">
                  View Congress →
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/federal/bill/119" className="block">
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="text-2xl text-primary">Bills (119th Congress)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Browse and search through bills from the 119th Congress, organized by policy issues and legislative status.
                </p>
                <div className="text-sm text-primary font-medium">
                  View Bills →
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <footer className="text-center py-6 text-sm text-muted-foreground mt-12">
          <p>Data provided by the <a href="https://www.congress.gov/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">U.S. Congress</a> via <a href="https://api.congress.gov/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">api.congress.gov</a>.</p>
        </footer>
      </div>
    </div>
  );
}