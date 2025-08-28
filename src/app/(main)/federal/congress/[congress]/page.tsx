
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Landmark, Library } from 'lucide-react';

export default async function CongressOverviewPage({ params }: { params: { congress: string } }) {
  const { congress } = await params;

  const features = [
    {
      title: 'Members by State',
      description: 'View senators and representatives for each state.',
      href: `/federal/congress/${congress}/states`,
      icon: <Users className="h-8 w-8 text-primary" />,
    },
    {
      title: 'Committees',
      description: 'Explore the committees for this congressional session.',
      href: `/federal/congress/${congress}/committees`,
      icon: <Library className="h-8 w-8 text-primary" />,
    },
  ];

  return (
    <div className="bg-secondary/30 flex-1">
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-2xl">
        <header className="text-center mb-12">
           <p className="text-lg text-muted-foreground font-medium mb-1">{congress}th Congress</p>
           <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-2">
            Congress
          </h1>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
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
