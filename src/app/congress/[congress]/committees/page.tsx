
export default async function CommitteesPage({ params }: { params: { congress: string } }) {
  const { congress } = params;

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <header className="text-center mb-12">
          <p className="text-lg text-muted-foreground font-medium mb-1">{congress}th Congress</p>
          <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-2">
            Committees
          </h1>
          <p className="text-lg text-muted-foreground">
            Information about congressional committees is coming soon.
          </p>
        </header>
      </div>
    </div>
  );
}
