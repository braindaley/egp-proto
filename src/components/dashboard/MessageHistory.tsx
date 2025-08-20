
'use client';

import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format, formatDistanceToNow } from 'date-fns';
import { Mail, FileText, Users, Clock, CheckCircle } from 'lucide-react';

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
      <Card className="border-0 shadow-none">
        <CardHeader className="px-0">
          <CardTitle>Your Sent Messages</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <p>Please log in to view your message history.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="px-0">
        <CardTitle>Your Sent Messages</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        {loading ? (
          <p>Loading your message history...</p>
        ) : groupedMessages.length === 0 ? (
          <p>No messages sent yet. Start by advocating for a bill!</p>
        ) : (
          <Accordion type="single" collapsible className="w-full space-y-2">
            {groupedMessages.map((group) => {
              const latestActivity = group.activities[0];
              const allRecipients = latestActivity?.recipients || [];
              const lastSentDate = latestActivity?.sentAt?.toDate();
              
              // Format recipients with FirstLast format and limit display
              const formattedRecipients = allRecipients.map(r => {
                const nameParts = r.name.split(' ');
                const firstName = nameParts[0] || '';
                const lastName = nameParts[nameParts.length - 1] || '';
                return `${firstName}${lastName}`;
              });
              
              const displayRecipients = formattedRecipients.length > 2 
                ? `${formattedRecipients.slice(0, 2).join(', ')} (${formattedRecipients.length - 2} more)`
                : formattedRecipients.join(', ');
              
              return (
                <AccordionItem 
                  key={group.billKey} 
                  value={group.billKey} 
                  className="border rounded-lg transition-all hover:shadow-md bg-white border-gray-200"
                >
                  <AccordionTrigger className="hover:no-underline px-4 py-3">
                    <div className="flex items-start gap-3 w-full pr-4 text-left">
                      {/* Bill Type Avatar */}
                      <Avatar className="h-10 w-10 flex-shrink-0 mt-1">
                        <AvatarFallback className={`text-xs font-bold ${group.billType === 'HR' ? 'bg-blue-100 text-blue-700' : group.billType === 'S' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                          {group.billType}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        {/* First Line: Recipients and Bill Title */}
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm text-muted-foreground">To:</span>
                              <span className="text-sm font-medium">{displayRecipients}</span>
                              <span className="text-sm text-muted-foreground ml-2">RE:</span>
                              <span className="text-sm font-medium">{group.billShortTitle}</span>
                            </div>
                          </div>
                          <Badge 
                            variant={latestActivity?.userStance === 'support' ? 'default' : 'destructive'} 
                            className="text-xs px-2 py-0.5 flex-shrink-0"
                          >
                            {latestActivity?.userStance === 'support' ? 'Support' : 'Oppose'}
                          </Badge>
                        </div>
                        
                        {/* Second Line: Bill Number and Status */}
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-muted-foreground">
                            Status: {group.billCurrentStatus}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold">
                              {group.billType} {group.billNumber}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-4 border-t pt-4">
                    {group.activities.map((activity, index) => (
                      <div key={activity.id} className="bg-white rounded-lg border shadow-sm">
                        {/* Message Header */}
                        <div className="p-4 border-b bg-gray-50/50">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">
                                <span className="font-semibold">RE:</span> {group.billType} {group.billNumber}: {group.billShortTitle}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {format(activity.sentAt?.toDate() || new Date(), 'MMM d, yyyy \'at\' h:mm a')}
                            </div>
                          </div>
                          
                          {/* Recipients */}
                          <div className="text-sm text-muted-foreground">
                            <span className="font-medium">To:</span> {activity.recipients.map(r => r.name).join(', ')}
                          </div>
                        </div>
                        
                        {/* Message Content */}
                        <div className="p-4">
                          <div className="prose prose-sm max-w-none">
                            <p className="whitespace-pre-wrap text-gray-700 leading-relaxed mb-4">
                              {activity.messageContent}
                            </p>
                            
                            {/* Message Signature */}
                            <div className="border-t pt-4 mt-6 text-sm text-gray-600">
                              <p className="font-medium">Sincerely,</p>
                              <p className="mt-1">Your Constituent</p>
                              <div className="mt-2 text-xs text-muted-foreground italic">
                                This message was sent via the Electronic Government Platform on {format(activity.sentAt?.toDate() || new Date(), 'MMMM d, yyyy \'at\' h:mm a')}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
            })}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
};

export default MessageHistory;
