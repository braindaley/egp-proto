
'use client';

import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

interface MessageHistoryProps {
  userId: string;
}

const MessageHistory: React.FC<MessageHistoryProps> = ({ userId }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      const db = getFirestore(app);
      // In a real app, you'd filter by userId. For now, we fetch all.
      const messagesQuery = query(collection(db, 'user_messages'));
      const querySnapshot = await getDocs(messagesQuery);
      const messagesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(messagesData);
      setLoading(false);
    };

    fetchMessages();
  }, [userId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Sent Messages</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Loading your message history...</p>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {messages.map((message) => (
              <AccordionItem key={message.id} value={message.id}>
                <AccordionTrigger>
                  <div className="flex justify-between w-full pr-4">
                    <span>{message.billTitle || 'N/A'}</span>
                    <span className="text-sm text-gray-500">{format(message.sentAt.toDate(), 'PPP')}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="mb-4 whitespace-pre-wrap">{message.messageContent}</p>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Recipient</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Delivery Method</TableHead>
                          <TableHead>Response</TableHead>
                          <TableHead>Cost</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {message.recipientContactIds.map((recipientId: string) => (
                          <TableRow key={recipientId}>
                            <TableCell>{recipientId}</TableCell>
                            <TableCell><Badge>Delivered</Badge></TableCell>
                            <TableCell>{message.deliveryMethods.join(', ')}</TableCell>
                            <TableCell><Badge variant="outline">No Reply</Badge></TableCell>
                            <TableCell>
                              {message.deliveryMethods.includes('postal') ? `$${(message.deliveryCosts / message.recipientContactIds.length).toFixed(2)}` : 'N/A'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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
