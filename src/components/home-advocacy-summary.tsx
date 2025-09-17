'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { BarChart3, ThumbsUp, ThumbsDown, MessageSquare, ArrowRight } from 'lucide-react';
import { useMessageCount } from '@/hooks/use-message-count';
import { useUserActivity } from '@/hooks/use-user-activity';

export function HomeAdvocacySummary() {
  const { messageCount, loading: messageCountLoading } = useMessageCount();
  const { activityStats, loading: activityLoading } = useUserActivity();

  return (
    <Card className="h-full border-none shadow-none">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Your Advocacy Impact
        </CardTitle>
        <CardDescription>
          Track your engagement and make your voice heard on issues that matter to you.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {activityLoading || messageCountLoading ? (
          <div className="text-muted-foreground py-8 text-center">Loading your advocacy statistics...</div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-secondary/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-foreground mb-1">
                  {messageCount}
                </div>
                <div className="text-sm text-muted-foreground">Messages Sent</div>
              </div>

              <div className="bg-secondary/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-foreground mb-1">
                  {activityStats.totalCount}
                </div>
                <div className="text-sm text-muted-foreground">Bills Engaged</div>
              </div>

              <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600 mb-1 flex items-center justify-center gap-1">
                  <ThumbsUp className="h-4 w-4" />
                  {activityStats.supportedCount}
                </div>
                <div className="text-sm text-muted-foreground">Supported</div>
              </div>

              <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-600 mb-1 flex items-center justify-center gap-1">
                  <ThumbsDown className="h-4 w-4" />
                  {activityStats.opposedCount}
                </div>
                <div className="text-sm text-muted-foreground">Opposed</div>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">View your message history</span>
                </div>
                <Link href="/dashboard/messages">
                  <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
                    View
                  </Badge>
                </Link>
              </div>

              <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">See detailed activity</span>
                </div>
                <Link href="/dashboard/activity">
                  <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
                    View
                  </Badge>
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button asChild className="w-full">
                <Link href="/dashboard" className="flex items-center justify-center gap-2">
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}