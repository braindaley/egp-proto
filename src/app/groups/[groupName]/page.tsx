
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function formatGroupName(slug: string): string {
    return slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

export default async function GroupDetailPage({ params }: { params: { groupName: string } }) {
    const { groupName } = await params;
    const formattedName = formatGroupName(groupName);

    return (
        <div className="container mx-auto px-4 py-8 md:py-12">
            <header className="mb-8">
                <Link href="/groups" className="inline-flex items-center gap-2 text-primary hover:underline mb-4">
                    <ArrowLeft className="w-4 h-4" />
                    Back to All Groups
                </Link>
                <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary">
                    {formattedName}
                </h1>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>Information Coming Soon</CardTitle>
                    <CardDescription>
                        Details for {formattedName} will be available shortly.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        This page is a placeholder for content about this voter advocacy group.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
