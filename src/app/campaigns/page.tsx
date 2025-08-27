import Link from 'next/link';

export default function CampaignsPage() {
  return (
    <div className="bg-secondary/30 flex-1">
      <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="text-center mb-12">
        <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-2">
          Campaigns
        </h1>
        <p className="text-lg text-muted-foreground">
          Explore advocacy groups and policy issues
        </p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
        <Link
          href="/campaigns/groups"
          className="group p-8 rounded-lg bg-card text-card-foreground shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors duration-200 ease-in-out text-center"
        >
          <div className="mb-4">
            <h2 className="text-2xl font-semibold mb-2">Groups</h2>
            <p className="text-muted-foreground group-hover:text-accent-foreground">
              Discover voter advocacy organizations working to strengthen democracy
            </p>
          </div>
        </Link>
        
        <Link
          href="/campaigns/issues"
          className="group p-8 rounded-lg bg-card text-card-foreground shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors duration-200 ease-in-out text-center"
        >
          <div className="mb-4">
            <h2 className="text-2xl font-semibold mb-2">Issues</h2>
            <p className="text-muted-foreground group-hover:text-accent-foreground">
              Explore policy issues and related legislation by category
            </p>
          </div>
        </Link>
        </div>
      </div>
    </div>
  );
}