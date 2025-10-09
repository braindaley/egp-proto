'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  Crown,
  MessageSquare,
  Megaphone,
  Building2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Download
} from 'lucide-react';

// Mock data for the dashboard
const platformStats = {
  totalUsers: 12847,
  newUsers30Days: 1235,
  newUsersChange: 18.2,
  premiumSubscribers: 2156,
  premiumChange: 12.5,
  churnRate: 2.3,
  totalMessages: 45678,
  messages30Days: 5432,
  messagesChange: 23.1,
  activeCampaigns: 156,
  campaignsChange: 8.7,
  activeOrganizations: 27,
  orgsChange: 3.8,
  mrr: 12936, // Monthly Recurring Revenue in dollars
  mrrChange: 15.3,
};


export default function AdminDashboardPage() {
  const handleExport = () => {
    alert('Export functionality would download CSV report of all metrics');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Platform overview and key metrics
          </p>
        </div>
        <Button onClick={handleExport} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{platformStats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              +{platformStats.newUsers30Days.toLocaleString()} in last 30 days
            </p>
            <div className="flex items-center mt-2 text-xs">
              <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              <span className="text-green-600">+{platformStats.newUsersChange}%</span>
              <span className="text-muted-foreground ml-1">vs last month</span>
            </div>
          </CardContent>
        </Card>

        {/* Premium Subscribers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Premium Subscribers</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{platformStats.premiumSubscribers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {((platformStats.premiumSubscribers / platformStats.totalUsers) * 100).toFixed(1)}% conversion rate
            </p>
            <div className="flex items-center mt-2 text-xs">
              <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              <span className="text-green-600">+{platformStats.premiumChange}%</span>
              <span className="text-muted-foreground ml-1">growth</span>
              <span className="text-muted-foreground ml-2">• {platformStats.churnRate}% churn</span>
            </div>
          </CardContent>
        </Card>

        {/* MRR */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${platformStats.mrr.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              ${(platformStats.mrr * 12).toLocaleString()} annual run rate
            </p>
            <div className="flex items-center mt-2 text-xs">
              <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              <span className="text-green-600">+{platformStats.mrrChange}%</span>
              <span className="text-muted-foreground ml-1">vs last month</span>
            </div>
          </CardContent>
        </Card>

        {/* Messages Sent */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{platformStats.totalMessages.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {platformStats.messages30Days.toLocaleString()} in last 30 days
            </p>
            <div className="flex items-center mt-2 text-xs">
              <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              <span className="text-green-600">+{platformStats.messagesChange}%</span>
              <span className="text-muted-foreground ml-1">vs last month</span>
            </div>
          </CardContent>
        </Card>

        {/* Active Campaigns */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{platformStats.activeCampaigns}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {platformStats.activeOrganizations} organizations
            </p>
            <div className="flex items-center mt-2 text-xs">
              <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              <span className="text-green-600">+{platformStats.campaignsChange}%</span>
              <span className="text-muted-foreground ml-1">vs last month</span>
            </div>
          </CardContent>
        </Card>

        {/* Active Organizations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{platformStats.activeOrganizations}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active advocacy organizations
            </p>
            <div className="flex items-center mt-2 text-xs">
              <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              <span className="text-green-600">+{platformStats.orgsChange}%</span>
              <span className="text-muted-foreground ml-1">growth</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
              <a href="/admin/users">
                <Users className="h-5 w-5" />
                <span className="text-sm">Manage Users</span>
              </a>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
              <a href="/admin/organizations">
                <Building2 className="h-5 w-5" />
                <span className="text-sm">Organizations</span>
              </a>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
              <a href="/admin/campaigns">
                <Megaphone className="h-5 w-5" />
                <span className="text-sm">View Campaigns</span>
              </a>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
              <a href="/admin/settings">
                <TrendingUp className="h-5 w-5" />
                <span className="text-sm">Settings</span>
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
