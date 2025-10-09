'use client';

import { useState } from 'react';
import Link from 'next/link';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Search, Download, Check, X, Ban, TrendingUp, FileText } from 'lucide-react';
import { format } from 'date-fns';

// Mock organization data
const mockOrganizations = [
  {
    id: 'org-1',
    name: 'League of Women Voters',
    slug: 'league-of-women-voters',
    status: 'active',
    createdDate: new Date('2024-01-15'),
    memberCount: 3,
    campaignCount: 8,
    totalMessages: 3456,
    lastActive: new Date('2025-01-08'),
  },
  {
    id: 'org-2',
    name: 'Common Cause',
    slug: 'common-cause',
    status: 'active',
    createdDate: new Date('2024-02-20'),
    memberCount: 2,
    campaignCount: 5,
    totalMessages: 2341,
    lastActive: new Date('2025-01-07'),
  },
  {
    id: 'org-3',
    name: 'Sunrise Movement',
    slug: 'sunrise-movement',
    status: 'pending',
    createdDate: new Date('2025-01-05'),
    memberCount: 1,
    campaignCount: 0,
    totalMessages: 0,
    lastActive: new Date('2025-01-05'),
    application: {
      organizationType: '501c4',
      taxId: '12-3456789',
      yearsActive: '7',
      memberCount: '15,000',
      missionStatement: 'Sunrise is a movement to stop climate change and create millions of good jobs in the process. We\'re building an army of young people to make climate change an urgent priority across America, end the corrupting influence of fossil fuel executives on our politics, and elect leaders who stand up for the health and wellbeing of all people.',
      focusAreas: 'Climate justice, environmental policy, green jobs, youth activism',
      contactName: 'Maria Rodriguez',
      contactEmail: 'maria@sunrisemovement.org',
      contactPhone: '(555) 234-5678',
      website: 'https://www.sunrisemovement.org',
      address: '1234 Climate Way',
      city: 'Oakland',
      state: 'CA',
      zipCode: '94612',
    },
  },
  {
    id: 'org-4',
    name: 'Fair Fight Action',
    slug: 'fair-fight-action',
    status: 'active',
    createdDate: new Date('2024-03-10'),
    memberCount: 4,
    campaignCount: 6,
    totalMessages: 1876,
    lastActive: new Date('2025-01-06'),
  },
  {
    id: 'org-5',
    name: 'American Promise',
    slug: 'american-promise',
    status: 'pending',
    createdDate: new Date('2025-01-03'),
    memberCount: 1,
    campaignCount: 0,
    totalMessages: 0,
    lastActive: new Date('2025-01-03'),
    application: {
      organizationType: '501c3',
      taxId: '98-7654321',
      yearsActive: '12',
      memberCount: '800,000',
      missionStatement: 'American Promise is empowering Americans to pass the 28th Amendment to the U.S. Constitution to ensure We the People—not big money, not corporations, not unions, not special interests—govern the United States of America.',
      focusAreas: 'Campaign finance reform, constitutional amendment, democracy, voting rights',
      contactName: 'Jeff Clements',
      contactEmail: 'jeff@americanpromise.net',
      contactPhone: '(555) 987-6543',
      website: 'https://www.americanpromise.net',
      address: '5678 Democracy Lane',
      city: 'Boston',
      state: 'MA',
      zipCode: '02108',
    },
  },
  {
    id: 'org-6',
    name: 'Mi Familia Vota',
    slug: 'mi-familia-vota',
    status: 'active',
    createdDate: new Date('2024-04-01'),
    memberCount: 2,
    campaignCount: 4,
    totalMessages: 1654,
    lastActive: new Date('2025-01-05'),
  },
  {
    id: 'org-7',
    name: 'Voter Empowerment Project',
    slug: 'voter-empowerment-project',
    status: 'suspended',
    createdDate: new Date('2024-05-15'),
    memberCount: 1,
    campaignCount: 2,
    totalMessages: 234,
    lastActive: new Date('2024-12-10'),
  },
];

export default function OrganizationsManagementPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [organizations, setOrganizations] = useState(mockOrganizations);

  // Filter organizations
  const filteredOrgs = organizations.filter((org) => {
    const matchesSearch =
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.slug.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || org.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const activeCount = filteredOrgs.filter(o => o.status === 'active').length;
  const pendingCount = filteredOrgs.filter(o => o.status === 'pending').length;
  const suspendedCount = filteredOrgs.filter(o => o.status === 'suspended').length;

  const handleApprove = (orgId: string, orgName: string) => {
    setOrganizations(orgs =>
      orgs.map(org => org.id === orgId ? { ...org, status: 'active' as const } : org)
    );
    alert(`${orgName} has been approved and is now active.`);
  };

  const handleReject = (orgId: string, orgName: string) => {
    setOrganizations(orgs => orgs.filter(org => org.id !== orgId));
    alert(`${orgName} has been rejected and removed from the platform.`);
  };

  const handleSuspend = (orgId: string, orgName: string) => {
    setOrganizations(orgs =>
      orgs.map(org => org.id === orgId ? { ...org, status: 'suspended' as const } : org)
    );
    alert(`${orgName} has been suspended.`);
  };

  const handleReinstate = (orgId: string, orgName: string) => {
    setOrganizations(orgs =>
      orgs.map(org => org.id === orgId ? { ...org, status: 'active' as const } : org)
    );
    alert(`${orgName} has been reinstated and is now active.`);
  };

  const handleExport = () => {
    alert(`Export functionality would download CSV of ${filteredOrgs.length} organizations`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Organization Management</h1>
          <p className="text-muted-foreground mt-1">
            {filteredOrgs.length} organizations
            {activeCount > 0 && ` • ${activeCount} active`}
            {pendingCount > 0 && ` • ${pendingCount} pending approval`}
            {suspendedCount > 0 && ` • ${suspendedCount} suspended`}
          </p>
        </div>
        <Button onClick={handleExport} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Pending Approvals Alert */}
      {pendingCount > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-4">
            <p className="text-sm font-medium text-amber-900">
              {pendingCount} organization{pendingCount !== 1 ? 's' : ''} pending approval
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
                placeholder="Search by name..."
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
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Organizations Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Campaigns</TableHead>
                  <TableHead>Messages</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrgs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No organizations found matching your filters
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrgs.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell className="font-medium">
                        <Link href={`/organizations/${org.slug}`} className="hover:underline">
                          {org.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {org.status === 'active' ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Active
                          </Badge>
                        ) : org.status === 'pending' ? (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                            Pending
                          </Badge>
                        ) : (
                          <Badge variant="destructive">Suspended</Badge>
                        )}
                      </TableCell>
                      <TableCell>{org.memberCount}</TableCell>
                      <TableCell>{org.campaignCount}</TableCell>
                      <TableCell>{org.totalMessages.toLocaleString()}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(org.createdDate, 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(org.lastActive, 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {org.status === 'pending' ? (
                            <>
                              {/* View Application */}
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="gap-1">
                                    <FileText className="h-3 w-3" />
                                    View Application
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>{org.name} - Application</DialogTitle>
                                    <DialogDescription>
                                      Submitted on {format(org.createdDate, 'MMMM d, yyyy')}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-6 mt-4">
                                    {/* Organization Information */}
                                    <div>
                                      <h3 className="font-semibold text-sm mb-3">Organization Information</h3>
                                      <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                          <p className="text-muted-foreground">Organization Type</p>
                                          <p className="font-medium mt-1">{org.application?.organizationType}</p>
                                        </div>
                                        <div>
                                          <p className="text-muted-foreground">Tax ID / EIN</p>
                                          <p className="font-medium mt-1">{org.application?.taxId}</p>
                                        </div>
                                        <div>
                                          <p className="text-muted-foreground">Years Active</p>
                                          <p className="font-medium mt-1">{org.application?.yearsActive}</p>
                                        </div>
                                        <div>
                                          <p className="text-muted-foreground">Member Count</p>
                                          <p className="font-medium mt-1">{org.application?.memberCount}</p>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Mission Statement */}
                                    <div>
                                      <h3 className="font-semibold text-sm mb-2">Mission Statement</h3>
                                      <p className="text-sm text-muted-foreground leading-relaxed">
                                        {org.application?.missionStatement}
                                      </p>
                                    </div>

                                    {/* Focus Areas */}
                                    <div>
                                      <h3 className="font-semibold text-sm mb-2">Policy Focus Areas</h3>
                                      <p className="text-sm text-muted-foreground">
                                        {org.application?.focusAreas}
                                      </p>
                                    </div>

                                    {/* Contact Information */}
                                    <div>
                                      <h3 className="font-semibold text-sm mb-3">Contact Information</h3>
                                      <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                          <p className="text-muted-foreground">Contact Name</p>
                                          <p className="font-medium mt-1">{org.application?.contactName}</p>
                                        </div>
                                        <div>
                                          <p className="text-muted-foreground">Email</p>
                                          <p className="font-medium mt-1">{org.application?.contactEmail}</p>
                                        </div>
                                        <div>
                                          <p className="text-muted-foreground">Phone</p>
                                          <p className="font-medium mt-1">{org.application?.contactPhone}</p>
                                        </div>
                                        <div>
                                          <p className="text-muted-foreground">Website</p>
                                          <p className="font-medium mt-1">
                                            <a href={org.application?.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                              {org.application?.website}
                                            </a>
                                          </p>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Address */}
                                    <div>
                                      <h3 className="font-semibold text-sm mb-2">Address</h3>
                                      <div className="text-sm text-muted-foreground">
                                        <p>{org.application?.address}</p>
                                        <p>{org.application?.city}, {org.application?.state} {org.application?.zipCode}</p>
                                      </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2 pt-4 border-t">
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button variant="default" className="gap-1 flex-1">
                                            <Check className="h-4 w-4" />
                                            Approve Application
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Approve Organization</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Are you sure you want to approve {org.name}? They will be able to create campaigns and manage their organization page.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleApprove(org.id, org.name)}>
                                              Approve
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>

                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button variant="outline" className="gap-1 flex-1">
                                            <X className="h-4 w-4" />
                                            Reject Application
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Reject Organization</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Are you sure you want to reject {org.name}? This will permanently remove their application from the system.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                              onClick={() => handleReject(org.id, org.name)}
                                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            >
                                              Reject
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="gap-1">
                                    <Check className="h-3 w-3" />
                                    Approve
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Approve Organization</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to approve {org.name}? They will be able to create campaigns and manage their organization page.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleApprove(org.id, org.name)}>
                                      Approve
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="gap-1">
                                    <X className="h-3 w-3" />
                                    Reject
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Reject Organization</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to reject {org.name}? This will permanently remove their application from the system.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleReject(org.id, org.name)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Reject
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          ) : org.status === 'active' ? (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-1">
                                  <Ban className="h-3 w-3" />
                                  Suspend
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Suspend Organization</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to suspend {org.name}? Their campaigns will be hidden and members won't be able to create new campaigns.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleSuspend(org.id, org.name)}>
                                    Suspend
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          ) : (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-1">
                                  <TrendingUp className="h-3 w-3" />
                                  Reinstate
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Reinstate Organization</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to reinstate {org.name}? They will be able to create campaigns and manage their organization again.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleReinstate(org.id, org.name)}>
                                    Reinstate
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/organizations/${org.slug}`}>View</Link>
                          </Button>
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
