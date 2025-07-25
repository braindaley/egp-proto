import Link from 'next/link';
import { Landmark } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-background border-b sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary">
            <Landmark className="h-6 w-6" />
            <span>Congress Bills Explorer</span>
          </Link>
          <nav>
            <ul className="flex items-center gap-6">
              <li>
                <Link href="/bills" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                  Bills
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}
