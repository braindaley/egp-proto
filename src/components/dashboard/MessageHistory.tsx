
'use client';

import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Reply } from 'lucide-react';

interface MessageReply {
  id: string;
  from: string;
  fromTitle?: string;
  receivedAt: any;
  content: string;
  isRead?: boolean;
}

interface MessageActivity {
  id: string;
  userId: string;
  billNumber?: string;
  billType?: string;
  congress?: string;
  billShortTitle?: string;
  billCurrentStatus?: string;
  userStance: 'support' | 'oppose';
  messageContent: string;
  recipients: Array<{
    name: string;
    bioguideId: string;
    email: string;
    party?: string;
    role?: string;
  }>;
  sentAt: any;
  deliveryStatus: string;
  personalDataIncluded?: any;
  verifiedUserInfo?: {
    fullName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    constituentDescription?: string;
  };
  userInfo?: any;
  isGeneralAdvocacy?: boolean;
  topic?: string;
  replies?: MessageReply[];
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
          // For general advocacy messages (member contact), create a unique key
          const billKey = message.isGeneralAdvocacy || (!message.billNumber && !message.billType)
            ? `general-${message.id}`
            : `${message.congress}-${message.billType}-${message.billNumber}`;

          if (!groupedData[billKey]) {
            groupedData[billKey] = {
              billKey,
              billNumber: message.billNumber || '',
              billType: message.billType?.toUpperCase() || '',
              congress: message.congress || '',
              billShortTitle: message.billShortTitle || (message.isGeneralAdvocacy ? message.topic || 'General Advocacy' : ''),
              billCurrentStatus: message.billCurrentStatus || '',
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
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Table Header */}
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
              <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
                <div className="col-span-4">Recipients</div>
                <div className="col-span-4">Subject</div>
                <div className="col-span-2">Date</div>
                <div className="col-span-2">Status</div>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-200">
              {groupedMessages.map((group) =>
                group.activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => window.location.href = `/letter/${activity.id}`}
                  >
                    <div className="grid grid-cols-12 gap-4 items-center">
                      {/* Recipients */}
                      <div className="col-span-4">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {activity.recipients.map(r => r.name).join(', ')}
                        </div>
                      </div>

                      {/* Subject */}
                      <div className="col-span-4">
                        <div className="text-sm text-gray-900 truncate">
                          {activity.isGeneralAdvocacy || (!activity.billNumber && !activity.billType) ?
                            `${activity.topic || 'General Advocacy'} - ${activity.recipients.map(r => r.name).join(', ')}` :
                            group.billShortTitle ?
                              `RE: ${group.billType} ${group.billNumber} - ${group.billShortTitle}` :
                              'General Advocacy Message'
                          }
                        </div>
                      </div>

                      {/* Date */}
                      <div className="col-span-2">
                        <div className="text-sm text-gray-500">
                          {format(activity.sentAt?.toDate() || new Date(), 'MMM d, yyyy')}
                        </div>
                      </div>

                      {/* Status */}
                      <div className="col-span-2 flex items-center gap-2">
                        {activity.replies && activity.replies.length > 0 ? (
                          <div className="flex items-center gap-1.5">
                            <Reply className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-600">
                              {activity.replies.length} {activity.replies.length === 1 ? 'Reply' : 'Replies'}
                            </span>
                            {activity.replies.some(r => !r.isRead) && (
                              <span className="h-2 w-2 bg-blue-600 rounded-full" />
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Sent</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MessageHistory;
