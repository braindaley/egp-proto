'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Search, Download, Flag, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

// Mock message data
const generateMockMessages = () => {
  const bills = [
    'HR-1 - For the People Act',
    'HR-22 - Voting Rights Act',
    'S-854 - Climate Action Now',
    'HR-14 - Election Reform Act',
    'HR-3838 - Healthcare Access Act',
  ];
  const users = [
    'sarah.johnson@example.com',
    'michael.chen@example.com',
    'emily.rodriguez@example.com',
    'james.wilson@example.com',
    'maria.garcia@example.com',
  ];

  return Array.from({ length: 156 }, (_, i) => ({
    id: `msg-${i + 1}`,
    userEmail: users[Math.floor(Math.random() * users.length)],
    bill: bills[Math.floor(Math.random() * bills.length)],
    recipients: Math.floor(Math.random() * 3) + 1,
    deliveryMethod: Math.random() > 0.5 ? 'email' : 'postal',
    status: Math.random() > 0.95 ? 'failed' : Math.random() > 0.85 ? 'pending' : 'delivered',
    sentAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    flagged: Math.random() > 0.95,
    messageContent: `Dear Representative,\n\nI am writing to express my strong support for this important legislation. As a constituent, I believe this bill represents a critical step forward for our democracy.\n\nThis legislation addresses key issues that matter to me and my community. I urge you to support this bill and work towards its passage.\n\nThank you for your consideration.\n\nSincerely,\n[Constituent Name]`,
  }));
};

const allMessages = generateMockMessages();

export default function MessagesAnalyticsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deliveryFilter, setDeliveryFilter] = useState('all');
  const [flaggedFilter, setFlaggedFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const messagesPerPage = 50;

  // Filter messages
  let filteredMessages = allMessages.filter((msg) => {
    const matchesSearch =
      msg.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.bill.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || msg.status === statusFilter;
    const matchesDelivery = deliveryFilter === 'all' || msg.deliveryMethod === deliveryFilter;
    const matchesFlagged = flaggedFilter === 'all' ||
      (flaggedFilter === 'flagged' && msg.flagged) ||
      (flaggedFilter === 'not-flagged' && !msg.flagged);

    const matchesDateFrom = !dateFrom || msg.sentAt >= new Date(dateFrom);
    const matchesDateTo = !dateTo || msg.sentAt <= new Date(dateTo);

    return matchesSearch && matchesStatus && matchesDelivery && matchesFlagged && matchesDateFrom && matchesDateTo;
  });

  // Pagination
  const totalPages = Math.ceil(filteredMessages.length / messagesPerPage);
  const startIndex = (currentPage - 1) * messagesPerPage;
  const endIndex = startIndex + messagesPerPage;
  const currentMessages = filteredMessages.slice(startIndex, endIndex);

  const deliveredCount = filteredMessages.filter(m => m.status === 'delivered').length;
  const pendingCount = filteredMessages.filter(m => m.status === 'pending').length;
  const failedCount = filteredMessages.filter(m => m.status === 'failed').length;
  const flaggedCount = filteredMessages.filter(m => m.flagged).length;

  const handleFlag = (messageId: string) => {
    alert(`Message ${messageId} has been flagged for review. In production, this would update the database and notify moderators.`);
  };

  const handleExport = () => {
    alert(`Export functionality would download CSV of ${filteredMessages.length} messages`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Message Analytics</h1>
          <p className="text-muted-foreground mt-1">
            {filteredMessages.length.toLocaleString()} messages
            {deliveredCount > 0 && ` • ${deliveredCount} delivered`}
            {failedCount > 0 && ` • ${failedCount} failed`}
            {flaggedCount > 0 && ` • ${flaggedCount} flagged`}
          </p>
        </div>
        <Button onClick={handleExport} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Flagged Messages Alert */}
      {flaggedCount > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-4">
            <p className="text-sm font-medium text-amber-900">
              {flaggedCount} message{flaggedCount !== 1 ? 's' : ''} flagged for review
            </p>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative md:col-span-3">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email or bill number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Date From */}
            <div>
              <Input
                type="date"
                placeholder="From date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            {/* Date To */}
            <div>
              <Input
                type="date"
                placeholder="To date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            {/* Delivery Method Filter */}
            <Select value={deliveryFilter} onValueChange={setDeliveryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All delivery methods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Delivery Methods</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="postal">Postal</SelectItem>
              </SelectContent>
            </Select>

            {/* Flagged Filter */}
            <Select value={flaggedFilter} onValueChange={setFlaggedFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All messages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Messages</SelectItem>
                <SelectItem value="flagged">Flagged Only</SelectItem>
                <SelectItem value="not-flagged">Not Flagged</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Messages Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Bill</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Date Sent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentMessages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No messages found matching your filters
                    </TableCell>
                  </TableRow>
                ) : (
                  currentMessages.map((msg) => (
                    <TableRow key={msg.id} className={msg.flagged ? 'bg-amber-50/50' : ''}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {msg.flagged && <Flag className="h-3 w-3 text-amber-600" />}
                          <span className="text-sm">{msg.userEmail}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{msg.bill}</TableCell>
                      <TableCell>{msg.recipients}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{msg.deliveryMethod}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(msg.sentAt, 'MMM d, yyyy h:mm a')}
                      </TableCell>
                      <TableCell>
                        {msg.status === 'delivered' ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Delivered
                          </Badge>
                        ) : msg.status === 'pending' ? (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            Pending
                          </Badge>
                        ) : (
                          <Badge variant="destructive">Failed</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Message Details</DialogTitle>
                                <DialogDescription>
                                  Sent by {msg.userEmail} on {format(msg.sentAt, 'MMM d, yyyy')}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <p className="text-sm font-medium mb-1">Bill</p>
                                  <p className="text-sm text-muted-foreground">{msg.bill}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium mb-1">Recipients</p>
                                  <p className="text-sm text-muted-foreground">{msg.recipients} representative(s)</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium mb-1">Message Content</p>
                                  <div className="whitespace-pre-wrap bg-muted p-4 rounded-md text-sm">
                                    {msg.messageContent}
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>

                          {!msg.flagged && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Flag className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Flag Message</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to flag this message for review? This will mark it as potentially inappropriate or spam.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleFlag(msg.id)}>
                                    Flag Message
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredMessages.length)} of {filteredMessages.length} messages
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
