
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
        <div className="container mx-auto px-4 py-8 md:py-12">
            <div className="max-w-2xl mx-auto">
                <Card>
                    <CardHeader className="flex flex-row items-center gap-4">
                        <Skeleton className="h-16 w-16 rounded-full" />
                        <div className="space-y-2">
                           <Skeleton className="h-6 w-48" />
                           <Skeleton className="h-4 w-64" />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                    </CardContent>
                </Card>
            </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarImage src={user.photoURL ?? ''} alt="User profile picture" />
                            <AvatarFallback>{user.email?.[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-2xl">Welcome!</CardTitle>
                            <CardDescription>This is your personal dashboard.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <p>
                        <strong>Email:</strong> {user.email}
                    </p>
                    <p>
                        <strong>User ID:</strong> {user.uid}
                    </p>
                    <p>
                        <strong>Email Verified:</strong> {user.emailVerified ? 'Yes' : 'No'}
                    </p>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
