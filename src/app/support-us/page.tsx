
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import Link from 'next/link';

export default function SupportUsPage() {
  return (
    <div className="bg-background min-h-screen">
        <div className="container mx-auto px-4 py-8 md:py-12">
            <div className="max-w-2xl mx-auto">
                <Card className="text-center shadow-lg">
                    <CardHeader className="items-center">
                        <div className="mx-auto bg-primary text-primary-foreground rounded-full h-16 w-16 flex items-center justify-center mb-4">
                        <Heart className="h-8 w-8" />
                        </div>
                        <CardTitle className="text-3xl font-bold">Support Our Mission</CardTitle>
                        <CardDescription className="text-lg text-muted-foreground pt-2">
                        Your contribution helps us keep voters informed and amplify their voices.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <p className="text-muted-foreground px-4">
                            eGp is dedicated to providing transparent, accessible information about the legislative process. By supporting us, you help maintain this platform, develop new features, and ensure that every citizen has the tools they need to engage with their government effectively.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button size="lg" disabled>
                                Donate Once
                            </Button>
                            <Button size="lg" variant="outline" disabled>
                                Become a Monthly Supporter
                            </Button>
                        </div>
                         <p className="text-xs text-muted-foreground pt-4">
                            Donation processing is not yet enabled.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
        <footer className="text-center py-6 text-sm text-muted-foreground">
            <p>Thank you for your support.</p>
        </footer>
    </div>
  );
}
