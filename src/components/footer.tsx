import { Landmark, Building2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function Footer() {
  return (
    <footer className="bg-card text-card-foreground border-t">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-2 font-bold text-lg text-primary mb-2">
            <Landmark className="h-6 w-6" />
            <span>eGp Prototype</span>
          </div>
          <p className="text-xs text-muted-foreground mb-8">
            Advanced Technology Amplifying Voter Intent
          </p>
        </div>

        {/* CTA for Organizations */}
        <div className="max-w-2xl mx-auto mb-8">
          <Card className="bg-primary/5 border-primary/20 p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-start gap-3 text-left">
                <Building2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">
                    Are you an advocacy organization?
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Join our platform to create campaigns and mobilize supporters for the causes you care about.
                  </p>
                </div>
              </div>
              <Button asChild className="flex-shrink-0 w-full sm:w-auto">
                <Link href="/organizations/apply" className="flex items-center gap-2">
                  Apply Now
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </Card>
        </div>

        <div className="text-center pt-8 mt-8 border-t">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} eGp Prototype. All Rights Reserved.
              {' '}&middot;{' '}
              <Link href="/admin" className="hover:text-foreground transition-colors">
                Admin
              </Link>
            </p>
        </div>
      </div>
    </footer>
  );
}
