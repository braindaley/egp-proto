'use client';

import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface MessageActivity {
  id: string;
  userId: string;
  billNumber: string;
  billType: string;
  congress: string;
  billShortTitle: string;
  userStance: 'support' | 'oppose';
  sentAt: any;
}

const RecentMessages: React.FC = () => {
  const { user } = useAuth();
  const [recentMessages, setRecentMessages] = useState<MessageActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentMessages = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      const db = getFirestore(app);
      
      try {
        const messagesQuery = query(
          collection(db, 'user_messages'),
          where('userId', '==', user.uid)
        );
        
        const querySnapshot = await getDocs(messagesQuery);
        const messagesData = querySnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        })) as MessageActivity[];
        
        // Sort by sentAt date and take last 5
        messagesData.sort((a, b) => {
          const timeA = a.sentAt?.seconds || 0;
          const timeB = b.sentAt?.seconds || 0;
          return timeB - timeA;
        });
        
        setRecentMessages(messagesData.slice(0, 5));
      } catch (error) {
        console.error('Error fetching recent messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentMessages();
  }, [user]);

  if (!user) {
    return null;
  }

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Recent Messages</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : recentMessages.length === 0 ? (
          <p className="text-sm text-muted-foreground">No messages sent yet</p>
        ) : (
          <>
            {recentMessages.map((message) => {
              const truncatedTitle = message.billShortTitle.length > 45 
                ? `${message.billShortTitle.substring(0, 45)}...` 
                : message.billShortTitle;
              
              return (
                <div key={message.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {message.billType} {message.billNumber}
                    </span>
                    <Badge 
                      variant={message.userStance === 'support' ? 'default' : 'destructive'} 
                      className="text-xs px-2 py-0.5"
                    >
                      {message.userStance === 'support' ? 'Support' : 'Oppose'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {truncatedTitle}
                  </p>
                </div>
              );
            })}
            
            <Link 
              href="/dashboard" 
              className="flex items-center justify-between text-sm text-primary hover:text-primary/80 pt-2 border-t"
            >
              <span>My Messages</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentMessages;