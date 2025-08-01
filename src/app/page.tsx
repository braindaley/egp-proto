
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Library, Landmark, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="bg-background flex flex-col items-center justify-center pt-16 pb-8">
      <div className="container mx-auto px-4 py-8 md:py-12 text-center">
        <header className="mb-12">
          <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-2">
            Welcome to eGp Prototype
          </h1>
          <p className="text-lg text-muted-foreground">
            Advanced Technology Amplifying Voter Intent
          </p>
        </header>

        <div className="flex justify-center">
          <Button asChild size="lg">
            <Link href="/signup">
              Get Started for Free
            </Link>
          </Button>
        </div>

        {/* New Navigation Section */}
        <section className="mt-16 md:mt-24 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Link href="/congress">
                    <Card className="h-full hover:shadow-xl transition-shadow duration-300 cursor-pointer text-left">
                        <CardHeader>
                            <div className="flex items-center gap-4">
                                <div className="bg-primary/10 p-3 rounded-full">
                                    <Landmark className="h-6 w-6 text-primary" />
                                </div>
                                <CardTitle className="text-2xl">Congress</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <CardDescription>
                                Explore members of Congress, view their profiles, committee assignments, and legislative activity.
                            </CardDescription>
                        </CardContent>
                        <div className="p-6 pt-0 flex justify-end">
                             <Button variant="ghost">
                                Explore Congress <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </Card>
                </Link>
                 <Link href="/bills">
                    <Card className="h-full hover:shadow-xl transition-shadow duration-300 cursor-pointer text-left">
                        <CardHeader>
                            <div className="flex items-center gap-4">
                                <div className="bg-primary/10 p-3 rounded-full">
                                    <Library className="h-6 w-6 text-primary" />
                                </div>
                                <CardTitle className="text-2xl">Legislation</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <CardDescription>
                                Browse popular and recent bills, search by issue, and track the progress of legislation.
                            </CardDescription>
                        </CardContent>
                         <div className="p-6 pt-0 flex justify-end">
                            <Button variant="ghost">
                                Explore Bills <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </Card>
                </Link>
            </div>
        </section>

      </div>
      <footer className="text-center py-6 text-sm text-muted-foreground w-full mt-12 border-t">
        <p>Data provided by the <a href="https://www.congress.gov/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">U.S. Congress</a> via <a href="https://api.congress.gov/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">api.congress.gov</a>.</p>
      </footer>
    </div>
  );
}
