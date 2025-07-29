
export default async function SubcommitteeDetailPage({ params }: { params: { congress: string, committeeId: string, subcommitteeId: string } }) {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="text-center mb-12">
        <p className="text-lg text-muted-foreground font-medium mb-1">{params.congress}th Congress</p>
        <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-2">
          Subcommittee: {params.subcommitteeId}
        </h1>
        <p className="text-lg text-muted-foreground">
          Parent Committee: {params.committeeId}
        </p>
        <p className="text-lg text-muted-foreground mt-4">
          This feature is coming soon.
        </p>
      </header>
    </div>
  );
}
