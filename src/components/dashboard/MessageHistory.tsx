
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
          <Accordion type="single" collapsible className="w-full space-y-2">
            {groupedMessages.map((group) => {
              const latestActivity = group.activities[0];
              const allRecipients = latestActivity?.recipients || [];
              const messagePreview = latestActivity?.messageContent || '';
              const lastSentDate = latestActivity?.sentAt?.toDate();
              
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
                        {/* Header Row */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="font-semibold text-base">
                              {group.billType} {group.billNumber}: 
                            </span>
                            <span className="font-medium text-sm text-gray-900 truncate">
                              {group.billShortTitle}
                            </span>
                            <Badge variant="outline" className="text-xs ml-2 flex-shrink-0">
                              {group.billCurrentStatus}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground flex-shrink-0">
                            {lastSentDate && format(lastSentDate, 'MMM d, yyyy')}
                          </div>
                        </div>
                        
                        {/* Recipients */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Users className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">To: {allRecipients.map(r => r.name).join(', ')}</span>
                          <span className="mx-1">•</span>
                          <Badge 
                            variant={latestActivity?.userStance === 'support' ? 'default' : 'destructive'} 
                            className="text-xs py-0 px-1 flex-shrink-0"
                          >
                            {latestActivity?.userStance === 'support' ? 'Support' : 'Oppose'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-3 border-t pt-4">
                    {group.activities.map((activity, index) => (
                      <div key={activity.id} className={`rounded-lg p-4 ${index === 0 ? 'bg-blue-50/30 border-l-4 border-l-blue-400' : 'bg-gray-50/50 border-l-4 border-l-gray-300'}`}>
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <Badge variant={activity.userStance === 'support' ? 'default' : 'destructive'} className="text-xs">
                              {activity.userStance === 'support' ? 'Support' : 'Oppose'}
                            </Badge>
                            {index === 0 && (
                              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                                Latest
                              </Badge>
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {format(activity.sentAt?.toDate() || new Date(), 'PPp')}
                          </span>
                        </div>
                        
                        {/* Recipients list with improved styling */}
                        <div className="space-y-1 mb-4">
                          <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide">Recipients</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                            {activity.recipients.map((recipient, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-sm bg-white/60 rounded px-2 py-1">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className={`text-xs ${recipient.party === 'Republican' ? 'bg-red-100 text-red-700' : recipient.party === 'Democratic' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                                    {recipient.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-900 truncate">{recipient.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {recipient.party} • {recipient.role}
                                  </div>
                                </div>
                                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Message preview with better styling */}
                        <details className="text-sm">
                          <summary className="cursor-pointer text-primary hover:underline font-medium flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            View full message content
                          </summary>
                          <div className="mt-3 p-4 bg-white rounded-lg border shadow-sm">
                            <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">{activity.messageContent}</p>
                          </div>
                        </details>
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
