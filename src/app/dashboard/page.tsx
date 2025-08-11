
'use client';

import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import BillStatusTracker from '@/components/dashboard/BillStatusTracker';
import MessageHistory from '@/components/dashboard/MessageHistory';
import ProfileManager from '@/components/ProfileManager';

export default function DashboardPage() {
    const { user, loading, logout } = useAuth();

    if (loading) {
        return <p>Loading...</p>;
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Card className="w-full max-w-md p-8 text-center">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold">Access Restricted</CardTitle>
                        <CardDescription>Please log in to view your dashboard.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild>
                            <Link href="/login">Log In</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    return (
        <div className="container mx-auto p-4 md:p-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold font-headline">
                        Welcome, {user.firstName || user.email}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Here is an overview of your advocacy efforts and tools.
                    </p>
                </div>
                <Button onClick={logout} variant="outline" className="mt-4 md:mt-0">
                    Log Out
                </Button>
            </header>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <main className="lg:col-span-3 space-y-8">
                    <ProfileManager />
                    <BillStatusTracker />
                    <MessageHistory />
                </main>
            </div>
        </div>
    );
}
