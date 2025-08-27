
export default async function BillIssueDetailPage({ params }: { params: { congress: string, issueKey: string } }) {
  const { issueKey } = await params;
  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-2xl">
      <header className="text-center mb-12">
        <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-2">
          Bills on: {issueKey}
        </h1>
        <p className="text-lg text-muted-foreground">
          This feature is coming soon.
        </p>
      </header>
    </div>
  );
}
