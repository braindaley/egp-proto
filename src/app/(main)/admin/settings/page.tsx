'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Key,
  Database,
  Mail,
  FileText,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Download,
  Search
} from 'lucide-react';
import { format } from 'date-fns';

// Mock API integrations
const apiIntegrations = [
  {
    name: 'Congress.gov API',
    key: 'cgov_1234567890abcdef',
    status: 'connected',
    lastTested: new Date('2025-01-08'),
    usage: { current: 8234, limit: 10000 },
  },
  {
    name: 'LegiScan API',
    key: 'lscan_abcdef1234567890',
    status: 'connected',
    lastTested: new Date('2025-01-07'),
    usage: { current: 456, limit: 1000 },
  },
  {
    name: 'Stripe',
    key: 'sk_live_xxxxxxxxxxxxx',
    status: 'connected',
    lastTested: new Date('2025-01-08'),
    usage: null,
  },
  {
    name: 'L2 Political',
    key: 'l2_xxxxxxxxxxxxx',
    status: 'disconnected',
    lastTested: null,
    usage: null,
  },
  {
    name: 'SendGrid',
    key: 'sg_xxxxxxxxxxxxx',
    status: 'connected',
    lastTested: new Date('2025-01-08'),
    usage: { current: 2345, limit: 100000 },
  },
];

// Mock system logs
const systemLogs = Array.from({ length: 50 }, (_, i) => ({
  id: `log-${i + 1}`,
  timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
  level: Math.random() > 0.9 ? 'error' : Math.random() > 0.7 ? 'warning' : 'info',
  message: [
    'Database connection timeout',
    'API rate limit approaching',
    'User authentication failed',
    'Payment processing error',
    'Email delivery failed',
    'Cache clear completed',
    'Backup completed successfully',
    'Scheduled job executed',
  ][Math.floor(Math.random() * 8)],
  source: ['api', 'database', 'email', 'payment', 'auth'][Math.floor(Math.random() * 5)],
}));

// Mock email templates
const emailTemplates = [
  {
    id: 'welcome',
    name: 'Welcome Email',
    subject: 'Welcome to Civic Engagement Platform',
    lastModified: new Date('2024-12-15'),
    version: 3,
  },
  {
    id: 'password-reset',
    name: 'Password Reset',
    subject: 'Reset Your Password',
    lastModified: new Date('2024-11-20'),
    version: 2,
  },
  {
    id: 'premium-welcome',
    name: 'Premium Upgrade Confirmation',
    subject: 'Welcome to Premium Membership',
    lastModified: new Date('2024-12-01'),
    version: 4,
  },
  {
    id: 'bill-digest',
    name: 'Weekly Bill Digest',
    subject: 'Your Weekly Legislation Update',
    lastModified: new Date('2024-12-28'),
    version: 5,
  },
  {
    id: 'campaign-update',
    name: 'Campaign Update Notification',
    subject: 'New Activity on Campaigns You Follow',
    lastModified: new Date('2024-12-10'),
    version: 2,
  },
];

// Mock audit log
const auditLog = Array.from({ length: 30 }, (_, i) => ({
  id: `audit-${i + 1}`,
  timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
  admin: ['admin@platform.com', 'superadmin@platform.com'][Math.floor(Math.random() * 2)],
  action: [
    'User suspended',
    'Organization approved',
    'Subscription refunded',
    'API key rotated',
    'Email template updated',
    'Campaign flagged',
    'Settings updated',
  ][Math.floor(Math.random() * 7)],
  target: [
    'user-123',
    'org-456',
    'sub-789',
    'api-integration',
    'email-template',
    'campaign-001',
    'system-config',
  ][Math.floor(Math.random() * 7)],
  details: 'Action completed successfully',
}));

export default function SystemSettingsPage() {
  const [activeTab, setActiveTab] = useState('api');
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [logLevelFilter, setLogLevelFilter] = useState('all');
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [auditSearchQuery, setAuditSearchQuery] = useState('');

  const toggleApiKey = (name: string) => {
    setShowApiKeys(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const handleTestConnection = (name: string) => {
    alert(`Testing connection to ${name}...\nIn production, this would verify the API connection.`);
  };

  const handleRotateKey = (name: string) => {
    alert(`Rotating API key for ${name}...\nIn production, this would generate a new key.`);
  };

  const handleSaveTemplate = () => {
    alert('Email template saved successfully.\nIn production, this would update the database.');
  };

  // Filter logs
  const filteredLogs = systemLogs.filter(log => {
    const matchesLevel = logLevelFilter === 'all' || log.level === logLevelFilter;
    const matchesSearch = log.message.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
      log.source.toLowerCase().includes(logSearchQuery.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  // Filter audit log
  const filteredAudit = auditLog.filter(entry =>
    entry.admin.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
    entry.action.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
    entry.target.toLowerCase().includes(auditSearchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-headline">System Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage API integrations, system logs, email templates, and audit trail
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="api">API Integrations</TabsTrigger>
          <TabsTrigger value="logs">System Logs</TabsTrigger>
          <TabsTrigger value="email">Email Templates</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        {/* API Integrations Tab */}
        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Integrations</CardTitle>
              <CardDescription>
                Manage external API connections and monitor usage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {apiIntegrations.map((api) => (
                <div key={api.name} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{api.name}</h3>
                        {api.status === 'connected' ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Connected
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" />
                            Disconnected
                          </Badge>
                        )}
                      </div>
                      {api.lastTested && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Last tested: {format(api.lastTested, 'MMM d, yyyy h:mm a')}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>API Key</Label>
                    <div className="flex gap-2">
                      <Input
                        type={showApiKeys[api.name] ? 'text' : 'password'}
                        value={api.key}
                        readOnly
                        className="font-mono"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleApiKey(api.name)}
                      >
                        {showApiKeys[api.name] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {api.usage && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">API Usage</span>
                        <span className="font-medium">
                          {api.usage.current.toLocaleString()} / {api.usage.limit.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            api.usage.current / api.usage.limit > 0.9
                              ? 'bg-red-600'
                              : api.usage.current / api.usage.limit > 0.7
                              ? 'bg-amber-600'
                              : 'bg-green-600'
                          }`}
                          style={{ width: `${(api.usage.current / api.usage.limit) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleTestConnection(api.name)}>
                      Test Connection
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleRotateKey(api.name)}>
                      <Key className="h-3 w-3 mr-1" />
                      Rotate Key
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Logs Tab */}
        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Logs</CardTitle>
              <CardDescription>Recent system errors and events (last 1000)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search logs..."
                    value={logSearchQuery}
                    onChange={(e) => setLogSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={logLevelFilter} onValueChange={setLogLevelFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="error">Errors Only</SelectItem>
                    <SelectItem value="warning">Warnings Only</SelectItem>
                    <SelectItem value="info">Info Only</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Message</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.slice(0, 20).map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm font-mono">
                          {format(log.timestamp, 'MMM d HH:mm:ss')}
                        </TableCell>
                        <TableCell>
                          {log.level === 'error' ? (
                            <Badge variant="destructive">Error</Badge>
                          ) : log.level === 'warning' ? (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                              Warning
                            </Badge>
                          ) : (
                            <Badge variant="outline">Info</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.source}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{log.message}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Templates Tab */}
        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
              <CardDescription>
                Manage email templates and view template variables
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {emailTemplates.map((template) => (
                  <Card key={template.id}>
                    <CardHeader>
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <CardDescription>{template.subject}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Version {template.version}</span>
                        <span className="text-muted-foreground">
                          {format(template.lastModified, 'MMM d, yyyy')}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <FileText className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Eye className="h-3 w-3 mr-1" />
                          Preview
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-base">Available Template Variables</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm font-mono">
                    <code className="text-primary">{'{{user.firstName}}'}</code>
                    <code className="text-primary">{'{{user.email}}'}</code>
                    <code className="text-primary">{'{{bill.title}}'}</code>
                    <code className="text-primary">{'{{bill.number}}'}</code>
                    <code className="text-primary">{'{{campaign.name}}'}</code>
                    <code className="text-primary">{'{{date}}'}</code>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Log Tab */}
        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Audit Log</CardTitle>
              <CardDescription>All administrative actions and system changes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search audit log..."
                    value={auditSearchQuery}
                    onChange={(e) => setAuditSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Admin</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAudit.slice(0, 20).map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="text-sm font-mono">
                          {format(entry.timestamp, 'MMM d HH:mm:ss')}
                        </TableCell>
                        <TableCell className="text-sm">{entry.admin}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{entry.action}</Badge>
                        </TableCell>
                        <TableCell className="text-sm font-mono">{entry.target}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {entry.details}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
