'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowRight, Users } from 'lucide-react';
import { useWatchedGroups } from '@/hooks/use-watched-groups';
import { getAdvocacyGroupData } from '@/lib/advocacy-groups';

const WatchedGroups: React.FC = () => {
  const { watchedGroups } = useWatchedGroups();
  
  // Get the details for each watched group
  const groups = watchedGroups.map(slug => {
    const groupData = getAdvocacyGroupData(slug);
    if (groupData) {
      return {
        slug,
        name: groupData.name,
        url: `/campaigns/${slug}`
      };
    }
    return null;
  }).filter(Boolean) as { slug: string; name: string; url: string; }[];

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Watched Groups</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {groups.length === 0 ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">No groups watched yet</p>
            <Link 
              href="/campaigns" 
              className="text-sm text-primary hover:text-primary/80 inline-flex items-center gap-1"
            >
              Browse advocacy groups
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        ) : (
          <>
            {groups.map((group) => (
              <div key={group.slug} className="space-y-1">
                <Link
                  href={group.url}
                  className="group flex items-start space-x-2 hover:bg-accent rounded-md p-2 -m-2 transition-colors"
                >
                  <div className="pt-0.5">
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                      {group.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Advocacy Group
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
                </Link>
              </div>
            ))}
            
            <Link 
              href="/campaigns" 
              className="flex items-center justify-between text-sm text-primary hover:text-primary/80 pt-2 border-t"
            >
              <span>Browse all groups</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default WatchedGroups;