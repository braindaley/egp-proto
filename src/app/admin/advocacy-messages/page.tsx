
'use client';

import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const AdvocacyMessagesAdminPage = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    deliveryMethod: 'all',
    status: 'all',
  });

  const db = getFirestore(app);

  const fetchMessages = async () => {
    setLoading(true);
    let messagesQuery = query(collection(db, 'user_messages'));

    if (filters.dateFrom) {
      messagesQuery = query(messagesQuery, where('sentAt', '>=', Timestamp.fromDate(new Date(filters.dateFrom))));
    }
    if (filters.dateTo) {
      messagesQuery = query(messagesQuery, where('sentAt', '<=', Timestamp.fromDate(new Date(filters.dateTo))));
    }
    if (filters.deliveryMethod !== 'all') {
      messagesQuery = query(messagesQuery, where('deliveryMethods', 'array-contains', filters.deliveryMethod));
    }
    if (filters.status !== 'all') {
      messagesQuery = query(messagesQuery, where('status', '==', filters.status));
    }

    const querySnapshot = await getDocs(messagesQuery);
    const messagesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setMessages(messagesData);
    setLoading(false);
  };

  useEffect(() => {
    fetchMessages();
  }, [filters]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement> | string, name: string) => {
    const value = typeof e === 'string' ? e : e.target.value;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Advocacy Messages</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            type="date"
            placeholder="From"
            value={filters.dateFrom}
            onChange={(e) => handleFilterChange(e, 'dateFrom')}
          />
          <Input
            type="date"
            placeholder="To"
            value={filters.dateTo}
            onChange={(e) => handleFilterChange(e, 'dateTo')}
          />
          <Select value={filters.deliveryMethod} onValueChange={(v) => handleFilterChange(v, 'deliveryMethod')}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Delivery Methods</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="postal">Postal</SelectItem>
              </SelectContent>
          </Select>
           <Select value={filters.status} onValueChange={(v) => handleFilterChange(v, 'status')}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                 <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
          </Select>
        </CardContent>
      </Card>
      
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bill Title</TableHead>
              <TableHead>Recipients</TableHead>
              <TableHead>Date Sent</TableHead>
              <TableHead>Delivery Methods</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center">Loading messages...</TableCell></TableRow>
            ) : messages.map((msg) => (
              <TableRow key={msg.id}>
                <TableCell>{msg.billTitle}</TableCell>
                <TableCell>{msg.recipientContactIds.length}</TableCell>
                <TableCell>{format(msg.sentAt.toDate(), 'PPP p')}</TableCell>
                <TableCell>{msg.deliveryMethods.join(', ')}</TableCell>
                <TableCell><Badge>{msg.status}</Badge></TableCell>
                <TableCell>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline">View Details</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      <DialogHeader>
                        <DialogTitle>Message Details</DialogTitle>
                      </DialogHeader>
                      <div>
                        <p><strong>Message:</strong></p>
                        <p className="whitespace-pre-wrap bg-gray-100 p-2 rounded">{msg.messageContent}</p>
                         <p className="mt-4"><strong>Recipients:</strong> {msg.recipientContactIds.join(', ')}</p>
                         <p className="mt-2"><strong>Confirmation:</strong> {msg.confirmationNumbers?.email || msg.confirmationNumbers?.postal}</p>
                      </div>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default AdvocacyMessagesAdminPage;
