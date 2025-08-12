
'use client';

import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface MessageActivity {
  id: string;
  userId: string;
  billNumber: string;
  billType: string;
  congress: string;
  billShortTitle: string;
  billCurrentStatus: string;
  userStance: 'support' | 'oppose';
  messageContent: string;
  recipients: Array<{
    name: string;
    bioguideId: string;
    email: string;
    party: string;
    role: string;
  }>;
  sentAt: any;
  deliveryStatus: string;
}

interface GroupedMessages {
  billKey: string;
  billNumber: string;
  billType: string;
  congress: string;
  billShortTitle: string;
  billCurrentStatus: string;
  activities: MessageActivity[];
}

const MessageHistory: React.FC = () => {
  const { user } = useAuth();
  const [groupedMessages, setGroupedMessages] = useState<GroupedMessages[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      const db = getFirestore(app);
      
      try {
        // Query messages for current user (without orderBy to avoid composite index requirement)
        const messagesQuery = query(
          collection(db, 'user_messages'),
          where('userId', '==', user.uid)
        );
        
        const querySnapshot = await getDocs(messagesQuery);
        const messagesData = querySnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        })) as MessageActivity[];
        
        // Sort messages by sentAt date in JavaScript (client-side)
        messagesData.sort((a, b) => {
          const timeA = a.sentAt?.seconds || 0;
          const timeB = b.sentAt?.seconds || 0;
          return timeB - timeA; // desc order (newest first)
        });
        
        // Group messages by bill
        const groupedData: { [key: string]: GroupedMessages } = {};
        
        messagesData.forEach(message => {
          const billKey = `${message.congress}-${message.billType}-${message.billNumber}`;
          
          if (!groupedData[billKey]) {
            groupedData[billKey] = {
              billKey,
              billNumber: message.billNumber,
              billType: message.billType?.toUpperCase(),
              congress: message.congress,
              billShortTitle: message.billShortTitle,
              billCurrentStatus: message.billCurrentStatus,
              activities: []
            };
          }
          
          groupedData[billKey].activities.push(message);
        });
        
        // Convert to array and sort by most recent activity
        const groupedArray = Object.values(groupedData).sort((a, b) => {
          const latestA = Math.max(...a.activities.map(act => act.sentAt?.seconds || 0));
          const latestB = Math.max(...b.activities.map(act => act.sentAt?.seconds || 0));
          return latestB - latestA;
        });
        
        setGroupedMessages(groupedArray);
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [user]);

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Sent Messages</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Please log in to view your message history.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Sent Messages</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Loading your message history...</p>
        ) : groupedMessages.length === 0 ? (
          <p>No messages sent yet. Start by advocating for a bill!</p>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {groupedMessages.map((group) => (
              <AccordionItem key={group.billKey} value={group.billKey}>
                <AccordionTrigger>
                  <div className="flex flex-col items-start w-full pr-4 text-left">
                    <div className="font-semibold">
                      {group.billType} {group.billNumber}: {group.billShortTitle}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Current Status: {group.billCurrentStatus}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {group.activities.length} message{group.activities.length !== 1 ? 's' : ''} sent
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    {group.activities.map((activity) => (
                      <div key={activity.id} className="border rounded-lg p-4 bg-muted/30">
                        <div className="flex justify-between items-start mb-3">
                          <Badge variant={activity.userStance === 'support' ? 'default' : 'destructive'}>
                            {activity.userStance === 'support' ? 'Support' : 'Oppose'}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {format(activity.sentAt?.toDate() || new Date(), 'PPp')}
                          </span>
                        </div>
                        
                        {/* Recipients list */}
                        <div className="space-y-2 mb-3">
                          {activity.recipients.map((recipient, index) => (
                            <div key={index} className="text-sm">
                              <span className="font-medium">To:</span> {recipient.name}
                              <span className="ml-2 text-muted-foreground">
                                ({recipient.party})
                              </span>
                              <div className="text-xs text-muted-foreground ml-6">
                                {activity.userStance === 'support' ? 'Support' : 'Oppose'} • {format(activity.sentAt?.toDate() || new Date(), 'MM/dd/yyyy')}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Message preview */}
                        <details className="text-sm">
                          <summary className="cursor-pointer text-primary hover:underline">
                            View message content
                          </summary>
                          <div className="mt-2 p-3 bg-background rounded border">
                            <p className="whitespace-pre-wrap">{activity.messageContent}</p>
                          </div>
                        </details>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
};

export default MessageHistory;
