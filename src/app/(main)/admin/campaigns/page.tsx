'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Search, ExternalLink, Ban, PlayCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

// Mock campaign data
const mockCampaigns = [
  {
    id: 'camp-1',
    organization: 'Common Cause',
    orgSlug: 'common-cause',
    bill: 'HR-1',
    billTitle: 'For the People Act',
    position: 'Support',
    type: 'Legislation',
    createdDate: new Date('2024-02-15'),
    totalActions: 2341,
    messagesGenerated: 1756,
    supportActions: 2341,
    opposeActions: 0,
    engagementRate: 68,
    status: 'active',
  },
  {
    id: 'camp-2',
    organization: 'League of Women Voters',
    orgSlug: 'league-of-women-voters',
    bill: 'HR-22',
    billTitle: 'Voting Rights Act',
    position: 'Support',
    type: 'Legislation',
    createdDate: new Date('2024-03-01'),
    totalActions: 1876,
    messagesGenerated: 1403,
    supportActions: 1876,
    opposeActions: 0,
    engagementRate: 72,
    status: 'active',
  },
  {
    id: 'camp-3',
    organization: 'Mi Familia Vota',
    orgSlug: 'mi-familia-vota',
    bill: 'S-854',
    billTitle: 'Climate Action Now',
    position: 'Support',
    type: 'Legislation',
    createdDate: new Date('2024-04-10'),
    totalActions: 1654,
    messagesGenerated: 1241,
    supportActions: 1654,
    opposeActions: 0,
    engagementRate: 61,
    status: 'active',
  },
  {
    id: 'camp-4',
    organization: 'Black Voters Matter',
    orgSlug: 'black-voters-matter',
    bill: 'HR-14',
    billTitle: 'Election Reform Act',
    position: 'Support',
    type: 'Legislation',
    createdDate: new Date('2024-05-20'),
    totalActions: 1432,
    messagesGenerated: 1074,
    supportActions: 1432,
    opposeActions: 0,
    engagementRate: 58,
    status: 'active',
  },
  {
    id: 'camp-5',
    organization: 'Brennan Center for Justice',
    orgSlug: 'brennan-center-for-justice',
    bill: 'HR-3838',
    billTitle: 'Healthcare Access Act',
    position: 'Support',
    type: 'Legislation',
    createdDate: new Date('2024-06-15'),
    totalActions: 1289,
    messagesGenerated: 967,
    supportActions: 1289,
    opposeActions: 0,
    engagementRate: 65,
    status: 'active',
  },
  {
    id: 'camp-6',
    organization: 'Fair Fight Action',
    orgSlug: 'fair-fight-action',
    bill: null,
    billTitle: 'Climate Justice Initiative',
    position: 'Support Action',
    type: 'Issue',
    createdDate: new Date('2024-07-01'),
    totalActions: 987,
    messagesGenerated: 740,
    supportActions: 987,
    opposeActions: 0,
    engagementRate: 55,
    status: 'active',
  },
  {
    id: 'camp-7',
    organization: 'Vote Forward',
    orgSlug: 'vote-forward',
    bill: 'S-442',
    billTitle: 'Medicare Expansion Act',
    position: 'Support',
    type: 'Legislation',
    createdDate: new Date('2024-01-10'),
    totalActions: 234,
    messagesGenerated: 176,
    supportActions: 234,
    opposeActions: 0,
    engagementRate: 42,
    status: 'archived',
  },
  {
    id: 'camp-8',
    organization: 'Sunrise Movement',
    orgSlug: 'sunrise-movement',
    bill: null,
    billTitle: 'Green New Deal Campaign',
    position: 'Support Action',
    type: 'Issue',
    createdDate: new Date('2024-08-15'),
    totalActions: 456,
    messagesGenerated: 342,
    supportActions: 456,
    opposeActions: 0,
    engagementRate: 48,
    status: 'suspended',
  },
];

export default function CampaignsPerformancePage() {
  const [campaigns, setCampaigns] = useState(mockCampaigns);
  const [searchQuery, setSearchQuery] = useState('');
  const [orgFilter, setOrgFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const campaignsPerPage = 10;

  // Get unique organizations
  const organizations = Array.from(new Set(campaigns.map(c => c.organization))).sort();

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, orgFilter, typeFilter, statusFilter]);

  // Filter campaigns
  let filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch =
      campaign.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.billTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (campaign.bill && campaign.bill.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesOrg = orgFilter === 'all' || campaign.organization === orgFilter;
    const matchesType = typeFilter === 'all' || campaign.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;

    return matchesSearch && matchesOrg && matchesType && matchesStatus;
  });

  // Sort campaigns by date (newest first)
  filteredCampaigns = [...filteredCampaigns].sort((a, b) => {
    return b.createdDate.getTime() - a.createdDate.getTime();
  });

  // Pagination
  const totalPages = Math.ceil(filteredCampaigns.length / campaignsPerPage);
  const startIndex = (currentPage - 1) * campaignsPerPage;
  const endIndex = startIndex + campaignsPerPage;
  const currentCampaigns = filteredCampaigns.slice(startIndex, endIndex);

  const totalMessages = filteredCampaigns.reduce((sum, c) => sum + c.messagesGenerated, 0);

  const handleSuspend = (campaignId: string, campaignTitle: string) => {
    setCampaigns(camps =>
      camps.map(c => c.id === campaignId ? { ...c, status: 'suspended' as const } : c)
    );
    alert(`"${campaignTitle}" has been suspended and will no longer be visible to users.`);
  };

  const handleUnsuspend = (campaignId: string, campaignTitle: string) => {
    setCampaigns(camps =>
      camps.map(c => c.id === campaignId ? { ...c, status: 'active' as const } : c)
    );
    alert(`"${campaignTitle}" has been reactivated and is now visible to users.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-headline">Campaign Performance</h1>
        <p className="text-muted-foreground mt-1">
          {filteredCampaigns.length} campaigns • {totalMessages.toLocaleString()} messages generated
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Organization Filter */}
            <Select value={orgFilter} onValueChange={setOrgFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All organizations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Organizations</SelectItem>
                {organizations.map(org => (
                  <SelectItem key={org} value={org}>{org}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Legislation">Legislation</SelectItem>
                <SelectItem value="Issue">Issue</SelectItem>
                <SelectItem value="Candidate">Candidate</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Messages</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentCampaigns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No campaigns found matching your filters
                    </TableCell>
                  </TableRow>
                ) : (
                  currentCampaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{campaign.billTitle}</p>
                          {campaign.bill && (
                            <p className="text-sm text-muted-foreground">{campaign.bill}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{campaign.organization}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{campaign.type}</Badge>
                      </TableCell>
                      <TableCell>{campaign.messagesGenerated.toLocaleString()}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(campaign.createdDate, 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        {campaign.status === 'active' ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Active
                          </Badge>
                        ) : campaign.status === 'suspended' ? (
                          <Badge variant="destructive">Suspended</Badge>
                        ) : (
                          <Badge variant="outline">Archived</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {campaign.status === 'active' ? (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-1">
                                  <Ban className="h-3 w-3" />
                                  Suspend
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Suspend Campaign</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to suspend "{campaign.billTitle}"? This campaign will be hidden from users and no new actions can be taken.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleSuspend(campaign.id, campaign.billTitle)}>
                                    Suspend Campaign
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          ) : campaign.status === 'suspended' ? (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-1">
                                  <PlayCircle className="h-3 w-3" />
                                  Reactivate
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Reactivate Campaign</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to reactivate "{campaign.billTitle}"? This campaign will be visible to users again and they will be able to take actions.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleUnsuspend(campaign.id, campaign.billTitle)}>
                                    Reactivate Campaign
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          ) : null}

                          <Button variant="outline" size="sm" asChild>
                            <Link
                              href={campaign.type === 'Issue'
                                ? `/campaigns/${campaign.orgSlug}/issue-${campaign.billTitle.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
                                : `/campaigns/${campaign.orgSlug}/${campaign.bill?.toLowerCase()}`
                              }
                              target="_blank"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Link>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredCampaigns.length)} of {filteredCampaigns.length} campaigns
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
