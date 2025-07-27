
export default async function PopularBillsPage({ params }: { params: { congress: string } }) {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="text-center mb-12">
        <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-2">
          Popular Bills in the {params.congress}th Congress
        </h1>
        <p className="text-lg text-muted-foreground">
          This feature is coming soon.
        </p>
      </header>
    </div>
  );
}
