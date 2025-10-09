'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  DialogFooter,
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
import { Search, Download, ExternalLink, DollarSign, CreditCard, XCircle, Gift } from 'lucide-react';
import { format } from 'date-fns';

// Mock subscription data
const mockSubscriptions = [
  {
    id: 'sub-1',
    userId: 'user-123',
    userEmail: 'sarah.johnson@example.com',
    userName: 'Sarah Johnson',
    status: 'active',
    plan: 'Premium',
    amount: 24,
    interval: 'year',
    currentPeriodStart: new Date('2024-06-15'),
    currentPeriodEnd: new Date('2025-06-15'),
    nextBillingDate: new Date('2025-06-15'),
    cancelAtPeriodEnd: false,
    stripeCustomerId: 'cus_abc123',
    stripeSubscriptionId: 'sub_xyz789',
  },
  {
    id: 'sub-2',
    userId: 'user-456',
    userEmail: 'michael.chen@example.com',
    userName: 'Michael Chen',
    status: 'past_due',
    plan: 'Premium',
    amount: 24,
    interval: 'year',
    currentPeriodStart: new Date('2024-03-10'),
    currentPeriodEnd: new Date('2025-03-10'),
    nextBillingDate: new Date('2025-03-10'),
    cancelAtPeriodEnd: false,
    stripeCustomerId: 'cus_def456',
    stripeSubscriptionId: 'sub_uvw456',
  },
  {
    id: 'sub-3',
    userId: 'user-789',
    userEmail: 'emily.rodriguez@example.com',
    userName: 'Emily Rodriguez',
    status: 'active',
    plan: 'Premium',
    amount: 24,
    interval: 'year',
    currentPeriodStart: new Date('2024-08-20'),
    currentPeriodEnd: new Date('2025-08-20'),
    nextBillingDate: new Date('2025-08-20'),
    cancelAtPeriodEnd: true,
    stripeCustomerId: 'cus_ghi789',
    stripeSubscriptionId: 'sub_rst123',
  },
  {
    id: 'sub-4',
    userId: 'user-101',
    userEmail: 'james.wilson@example.com',
    userName: 'James Wilson',
    status: 'canceled',
    plan: 'Premium',
    amount: 24,
    interval: 'year',
    currentPeriodStart: new Date('2024-01-05'),
    currentPeriodEnd: new Date('2025-01-05'),
    nextBillingDate: null,
    cancelAtPeriodEnd: false,
    stripeCustomerId: 'cus_jkl012',
    stripeSubscriptionId: 'sub_opq789',
  },
];

export default function SubscriptionsManagementPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [creditDialogOpen, setCreditDialogOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<typeof mockSubscriptions[0] | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [creditAmount, setCreditAmount] = useState('');
  const [creditReason, setCreditReason] = useState('');

  // Filter subscriptions
  const filteredSubscriptions = mockSubscriptions.filter((sub) => {
    const matchesSearch =
      sub.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.userName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const activeCount = filteredSubscriptions.filter(s => s.status === 'active').length;
  const pastDueCount = filteredSubscriptions.filter(s => s.status === 'past_due').length;
  const canceledCount = filteredSubscriptions.filter(s => s.status === 'canceled').length;
  const totalMRR = filteredSubscriptions
    .filter(s => s.status === 'active')
    .reduce((sum, sub) => sum + (sub.interval === 'year' ? sub.amount / 12 : sub.amount), 0);

  const handleRefund = () => {
    if (!selectedSubscription || !refundReason) {
      alert('Please provide a reason for the refund');
      return;
    }
    alert(`Refund issued for ${selectedSubscription.userEmail}\nAmount: $${selectedSubscription.amount}\nReason: ${refundReason}\n\nIn production, this would process through Stripe.`);
    setRefundDialogOpen(false);
    setRefundReason('');
    setSelectedSubscription(null);
  };

  const handleCredit = () => {
    if (!selectedSubscription || !creditAmount || !creditReason) {
      alert('Please provide both amount and reason for the credit');
      return;
    }
    alert(`Credit applied for ${selectedSubscription.userEmail}\nAmount: $${creditAmount}\nReason: ${creditReason}\n\nIn production, this would create a Stripe credit.`);
    setCreditDialogOpen(false);
    setCreditAmount('');
    setCreditReason('');
    setSelectedSubscription(null);
  };

  const handleCancel = (sub: typeof mockSubscriptions[0]) => {
    alert(`Subscription canceled for ${sub.userEmail}\n\nIn production, this would cancel through Stripe.`);
  };

  const handleExport = () => {
    alert(`Export functionality would download CSV of ${filteredSubscriptions.length} subscriptions`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Subscriptions & Payments</h1>
          <p className="text-muted-foreground mt-1">
            {filteredSubscriptions.length} subscriptions
            {activeCount > 0 && ` • ${activeCount} active`}
            {pastDueCount > 0 && ` • ${pastDueCount} past due`}
            {canceledCount > 0 && ` • ${canceledCount} canceled`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Stripe Dashboard
            </a>
          </Button>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Revenue Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently paying
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${Math.round(totalMRR).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Monthly recurring revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Past Due</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{pastDueCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Payment failed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Canceled</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{canceledCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              No longer active
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Past Due Alert */}
      {pastDueCount > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-4">
            <p className="text-sm font-medium text-amber-900">
              {pastDueCount} subscription{pastDueCount !== 1 ? 's' : ''} past due - payment failed
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="past_due">Past Due</SelectItem>
                <SelectItem value="canceled">Canceled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Next Billing</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscriptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No subscriptions found matching your filters
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubscriptions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{sub.userName}</p>
                          <p className="text-sm text-muted-foreground">{sub.userEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {sub.status === 'active' ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            {sub.cancelAtPeriodEnd ? 'Canceling' : 'Active'}
                          </Badge>
                        ) : sub.status === 'past_due' ? (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                            Past Due
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                            Canceled
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{sub.plan}</TableCell>
                      <TableCell className="font-medium">
                        ${sub.amount}/{sub.interval === 'year' ? 'yr' : 'mo'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(sub.currentPeriodStart, 'MMM d')} - {format(sub.currentPeriodEnd, 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {sub.nextBillingDate ? format(sub.nextBillingDate, 'MMM d, yyyy') : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Dialog open={refundDialogOpen && selectedSubscription?.id === sub.id} onOpenChange={(open) => {
                            setRefundDialogOpen(open);
                            if (open) setSelectedSubscription(sub);
                            else setSelectedSubscription(null);
                          }}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" disabled={sub.status === 'canceled'}>
                                Refund
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Issue Refund</DialogTitle>
                                <DialogDescription>
                                  Refund ${sub.amount} to {sub.userEmail}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="refund-reason">Reason for Refund *</Label>
                                  <Textarea
                                    id="refund-reason"
                                    placeholder="e.g., Billing error, customer request, service issue"
                                    value={refundReason}
                                    onChange={(e) => setRefundReason(e.target.value)}
                                    rows={3}
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => {
                                  setRefundDialogOpen(false);
                                  setRefundReason('');
                                }}>
                                  Cancel
                                </Button>
                                <Button onClick={handleRefund}>
                                  Issue Refund
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          <Dialog open={creditDialogOpen && selectedSubscription?.id === sub.id} onOpenChange={(open) => {
                            setCreditDialogOpen(open);
                            if (open) setSelectedSubscription(sub);
                            else setSelectedSubscription(null);
                          }}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" disabled={sub.status === 'canceled'}>
                                <Gift className="h-3 w-3 mr-1" />
                                Credit
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Apply Credit</DialogTitle>
                                <DialogDescription>
                                  Add account credit for {sub.userEmail}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="credit-amount">Credit Amount *</Label>
                                  <Input
                                    id="credit-amount"
                                    type="number"
                                    placeholder="24.00"
                                    value={creditAmount}
                                    onChange={(e) => setCreditAmount(e.target.value)}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="credit-reason">Reason for Credit *</Label>
                                  <Textarea
                                    id="credit-reason"
                                    placeholder="e.g., Compensation for downtime, promotional credit"
                                    value={creditReason}
                                    onChange={(e) => setCreditReason(e.target.value)}
                                    rows={3}
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => {
                                  setCreditDialogOpen(false);
                                  setCreditAmount('');
                                  setCreditReason('');
                                }}>
                                  Cancel
                                </Button>
                                <Button onClick={handleCredit}>
                                  Apply Credit
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          {sub.status === 'active' && !sub.cancelAtPeriodEnd && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  Cancel
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to cancel the subscription for {sub.userEmail}? They will lose access at the end of their current billing period.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleCancel(sub)}>
                                    Cancel Subscription
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
    </div>
  );
}
