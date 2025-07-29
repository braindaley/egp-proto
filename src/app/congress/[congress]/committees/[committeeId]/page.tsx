
export default async function CommitteeDetailPage({ params }: { params: { congress: string, committeeId: string } }) {
  const { congress, committeeId } = await params;
  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="text-center mb-12">
         <p className="text-lg text-muted-foreground font-medium mb-1">{congress}th Congress</p>
        <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-2">
          Committee: {committeeId.toUpperCase()}
        </h1>
        <p className="text-lg text-muted-foreground">
          This feature is coming soon.
        </p>
      </header>
    </div>
  );
}
