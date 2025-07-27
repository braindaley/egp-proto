
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Newspaper, Flame, Library } from 'lucide-react';

export default async function BillsOverviewPage({ params }: { params: { congress: string } }) {
  const { congress } = params;

  const features = [
    {
      title: 'Recent Bills',
      description: 'View the most recently updated bills for this session.',
      href: `/bill/${congress}/recent`,
      icon: <Newspaper className="h-8 w-8 text-primary" />,
    },
    {
      title: 'Popular Bills',
      description: 'See which bills are getting the most attention.',
      href: `/bill/${congress}/popular`,
      icon: <Flame className="h-8 w-8 text-primary" />,
    },
    {
      title: 'Bills by Issue',
      description: 'Browse bills by policy area and subject.',
      href: `/bill/${congress}/issues`,
      icon: <Library className="h-8 w-8 text-primary" />,
    },
  ];

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <header className="text-center mb-12">
          <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-2">
            Bills in the {congress}th Congress
          </h1>
          <p className="text-lg text-muted-foreground">
            Explore legislation from the selected session.
          </p>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {features.map((feature) => (
            <Link href={feature.href} key={feature.title}>
                <Card className="h-full hover:shadow-lg transition-shadow duration-200 cursor-pointer flex flex-col items-center text-center">
                    <CardHeader className="items-center">
                        {feature.icon}
                        <CardTitle className="mt-4">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">{feature.description}</p>
                    </CardContent>
                </Card>
            </Link>
          ))}
        </div>
      </div>
      <footer className="text-center py-6 text-sm text-muted-foreground">
        <p>Data provided by the <a href="https://www.congress.gov/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">U.S. Congress</a> via <a href="https://api.congress.gov/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">api.congress.gov</a>.</p>
      </footer>
    </div>
  );
}
