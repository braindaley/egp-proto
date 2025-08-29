
import { Landmark } from 'lucide-react';

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
        <div className="text-center pt-8 mt-8 border-t">
            <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} eGp Prototype. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}
