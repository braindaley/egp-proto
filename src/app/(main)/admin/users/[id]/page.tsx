'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Crown,
  Mail,
  MapPin,
  Calendar,
  Clock,
  MessageSquare,
  Eye,
  Building2,
  Ban,
  Trash2,
  Key,
  TrendingUp,
  Vote,
  Users,
  Home,
  ShoppingBag,
  Target,
  BarChart3,
  Phone,
  CheckCircle2,
  UserCircle2
} from 'lucide-react';
import { format } from 'date-fns';

// Mock user data generator
const getMockUser = (id: string) => ({
  id,
  firstName: 'Sarah',
  lastName: 'Johnson',
  email: 'sarah.johnson@example.com',
  phone: '(555) 123-4567',
  address: '123 Main St',
  city: 'San Francisco',
  state: 'CA',
  zipCode: '94102',
  membershipTier: 'premium',
  subscriptionStatus: 'active',
  subscriptionStartDate: new Date('2024-06-15'),
  nextBillingDate: new Date('2025-01-15'),
  registrationDate: new Date('2024-06-15'),
  lastLogin: new Date('2025-01-08'),
  status: 'active',
  messageCount: 23,
  billsFollowed: 12,
  orgsFollowed: 3,
  policyInterests: ['Voting Rights', 'Climate Change', 'Healthcare'],
  l2Data: {
    // Voter Registration
    voterRegistrationStatus: 'Active',
    voterRegistrationDate: new Date('2006-09-15'),
    partyAffiliation: 'Democratic',
    registeredPrecinct: 'SF-0847',
    congressionalDistrict: 'CA-11',
    stateSenateDistrict: 'SD-11',
    stateHouseDistrict: 'AD-17',

    // Vote History (Last 10 elections)
    voteHistory: {
      '2024_General': 'Voted',
      '2024_Primary': 'Voted',
      '2022_General': 'Voted',
      '2022_Primary': 'Voted',
      '2020_General': 'Voted',
      '2020_Primary': 'Voted',
      '2018_General': 'Voted',
      '2018_Primary': 'Did Not Vote',
      '2016_General': 'Voted',
      '2016_Primary': 'Voted',
    },
    voterParticipationScore: 92,

    // Demographics
    age: 42,
    dateOfBirth: new Date('1982-04-15'),
    gender: 'Female',
    ethnicity: 'White/Caucasian',
    maritalStatus: 'Married',
    householdIncome: '$100,000 - $149,999',
    education: 'Graduate Degree',
    occupation: 'Healthcare Professional',
    language: 'English',

    // Household
    householdSize: 4,
    numberOfChildren: 2,
    childrenAges: '8, 12',
    homeOwnership: 'Owner',
    homeValue: '$850,000',
    lengthOfResidence: 16,
    dwellingType: 'Single Family',

    // Consumer Data
    consumerSegment: 'Affluent Professionals',
    lifestyleCluster: 'Urban Achievers',
    netWorth: '$500,000 - $999,999',
    vehicleOwnership: 'Yes (2)',
    vehicleTypes: 'Tesla Model Y, Honda CR-V',

    // Political Engagement
    donorHistory: 'Active Donor',
    donorFrequency: 'Regular (2-4x/year)',
    averageDonationAmount: '$150',
    totalLifetimeDonations: '$3,600',
    issueInterests: ['Healthcare', 'Education', 'Climate Change', 'Voting Rights'],
    advocacyEngagement: 'High',
    volunteerLikelihood: 'Very Likely',

    // Propensity Scores (0-100)
    turnoutPropensity2024: 98,
    turnoutPropensity2026: 85,
    democraticSupport: 88,
    republicanSupport: 12,
    persuadability: 15,

    // Contact Preferences
    phoneType: 'Mobile',
    emailOptIn: 'Yes',
    smsOptIn: 'Yes',
    mailOptIn: 'Yes',
    doNotContact: 'No',

    // Data Quality
    l2Confidence: 'High',
    lastVerified: new Date('2024-12-01'),
    recordMatchQuality: 'Exact Match',
  }
});


// Mock organizations for assignment
const mockOrganizations = [
  { id: 'org-1', name: 'League of Women Voters', slug: 'league-of-women-voters' },
  { id: 'org-2', name: 'Common Cause', slug: 'common-cause' },
  { id: 'org-3', name: 'Sunrise Movement', slug: 'sunrise-movement' },
  { id: 'org-4', name: 'Fair Fight Action', slug: 'fair-fight-action' },
  { id: 'org-5', name: 'American Promise', slug: 'american-promise' },
  { id: 'org-6', name: 'Mi Familia Vota', slug: 'mi-familia-vota' },
];

export default function UserDetailsPage() {
  const params = useParams();
  const userId = params?.id as string;
  const user = getMockUser(userId);

  const [actionInProgress, setActionInProgress] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<string>('');
  const [assignedOrganization, setAssignedOrganization] = useState<string | null>(null);

  const handleSuspend = () => {
    setActionInProgress(true);
    setTimeout(() => {
      alert(`User ${user.email} has been suspended. This would update the database in production.`);
      setActionInProgress(false);
    }, 500);
  };

  const handleDelete = () => {
    setActionInProgress(true);
    setTimeout(() => {
      alert(`User ${user.email} has been deleted. This would permanently remove the user in production.`);
      setActionInProgress(false);
    }, 500);
  };

  const handleResetPassword = () => {
    setActionInProgress(true);
    setTimeout(() => {
      alert(`Password reset email sent to ${user.email}. This would trigger an email in production.`);
      setActionInProgress(false);
    }, 500);
  };

  const handleUpgrade = () => {
    setActionInProgress(true);
    setTimeout(() => {
      alert(`Manual upgrade applied to ${user.email}. This would update their subscription in production.`);
      setActionInProgress(false);
    }, 500);
  };

  const handleImpersonate = () => {
    // In production, this would set up an impersonation session
    window.location.href = '/';
  };

  const handleAssignOrganization = () => {
    if (!selectedOrganization) {
      alert('Please select an organization');
      return;
    }
    setActionInProgress(true);
    setTimeout(() => {
      const org = mockOrganizations.find(o => o.id === selectedOrganization);
      setAssignedOrganization(selectedOrganization);
      alert(`${user.firstName} ${user.lastName} has been assigned to ${org?.name}. They now have organization admin access.`);
      setActionInProgress(false);
    }, 500);
  };

  const handleRemoveFromOrganization = () => {
    setActionInProgress(true);
    setTimeout(() => {
      const org = mockOrganizations.find(o => o.id === assignedOrganization);
      setAssignedOrganization(null);
      setSelectedOrganization('');
      alert(`${user.firstName} ${user.lastName} has been removed from ${org?.name}.`);
      setActionInProgress(false);
    }, 500);
  };

  const currentOrg = assignedOrganization ? mockOrganizations.find(o => o.id === assignedOrganization) : null;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/admin/users" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Users
        </Link>
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">
            {user.firstName} {user.lastName}
          </h1>
          <p className="text-muted-foreground mt-1">{user.email}</p>
        </div>
        <div className="flex items-center gap-2">
          {user.status === 'suspended' ? (
            <Badge variant="destructive">Suspended</Badge>
          ) : (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Active
            </Badge>
          )}
          {user.membershipTier === 'premium' && (
            <Badge variant="default" className="gap-1">
              <Crown className="h-3 w-3" />
              Premium
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">{user.email}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p className="text-sm mt-1">{user.phone}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Address</p>
                  <div className="flex items-start gap-2 mt-1">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="text-sm">
                      <p>{user.address}</p>
                      <p>{user.city}, {user.state} {user.zipCode}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Registration Date</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">{format(user.registrationDate, 'MMM d, yyyy')}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Membership Info */}
          {user.membershipTier === 'premium' && (
            <Card>
              <CardHeader>
                <CardTitle>Subscription Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <Badge variant="outline" className="mt-1 bg-green-50 text-green-700 border-green-200">
                      {user.subscriptionStatus}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Plan</p>
                    <p className="text-sm mt-1">Premium - $24/year</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                    <p className="text-sm mt-1">{format(user.subscriptionStartDate, 'MMM d, yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Next Billing</p>
                    <p className="text-sm mt-1">{format(user.nextBillingDate, 'MMM d, yyyy')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* L2 Political Data Section */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>L2 Political Data</CardTitle>
              <CardDescription>
                Voter file data provided by L2 Political. Last verified {format(user.l2Data.lastVerified, 'MMM d, yyyy')}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Voter Registration */}
              <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Vote className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Voter Registration</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Status</p>
                      <Badge variant="outline" className="mt-1 bg-green-50 text-green-700 border-green-200">
                        {user.l2Data.voterRegistrationStatus}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Registration Date</p>
                      <p className="text-sm mt-1">{format(user.l2Data.voterRegistrationDate, 'MMM d, yyyy')}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Party Affiliation</p>
                      <p className="text-sm mt-1">{user.l2Data.partyAffiliation}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Precinct</p>
                      <p className="text-sm mt-1 font-mono">{user.l2Data.registeredPrecinct}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Congressional District</p>
                      <p className="text-sm mt-1">{user.l2Data.congressionalDistrict}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">State Senate District</p>
                      <p className="text-sm mt-1">{user.l2Data.stateSenateDistrict}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">State House District</p>
                      <p className="text-sm mt-1">{user.l2Data.stateHouseDistrict}</p>
                    </div>
                  </div>
                </div>

                {/* Vote History */}
                <div className="border-t pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Vote History</h3>
                    <Badge variant="outline" className="ml-auto">
                      Participation Score: {user.l2Data.voterParticipationScore}%
                    </Badge>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Election</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(user.l2Data.voteHistory).map(([election, status]) => (
                        <TableRow key={election}>
                          <TableCell className="font-medium">
                            {election.replace('_', ' ')}
                          </TableCell>
                          <TableCell>
                            {status === 'Voted' ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                {status}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                                {status}
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Demographics */}
                <div className="border-t pt-6 space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Demographics</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Age</p>
                      <p className="text-sm mt-1">{user.l2Data.age}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
                      <p className="text-sm mt-1">{format(user.l2Data.dateOfBirth, 'MMM d, yyyy')}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Gender</p>
                      <p className="text-sm mt-1">{user.l2Data.gender}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Ethnicity</p>
                      <p className="text-sm mt-1">{user.l2Data.ethnicity}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Marital Status</p>
                      <p className="text-sm mt-1">{user.l2Data.maritalStatus}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Education</p>
                      <p className="text-sm mt-1">{user.l2Data.education}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Occupation</p>
                      <p className="text-sm mt-1">{user.l2Data.occupation}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Household Income</p>
                      <p className="text-sm mt-1">{user.l2Data.householdIncome}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Language</p>
                      <p className="text-sm mt-1">{user.l2Data.language}</p>
                    </div>
                  </div>
                </div>

                {/* Household */}
                <div className="border-t pt-6 space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Home className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Household</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Household Size</p>
                      <p className="text-sm mt-1">{user.l2Data.householdSize} people</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Number of Children</p>
                      <p className="text-sm mt-1">{user.l2Data.numberOfChildren}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Children Ages</p>
                      <p className="text-sm mt-1">{user.l2Data.childrenAges}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Home Ownership</p>
                      <p className="text-sm mt-1">{user.l2Data.homeOwnership}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Home Value</p>
                      <p className="text-sm mt-1">{user.l2Data.homeValue}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Length of Residence</p>
                      <p className="text-sm mt-1">{user.l2Data.lengthOfResidence} years</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Dwelling Type</p>
                      <p className="text-sm mt-1">{user.l2Data.dwellingType}</p>
                    </div>
                  </div>
                </div>

                {/* Consumer & Lifestyle */}
                <div className="border-t pt-6 space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <ShoppingBag className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Consumer & Lifestyle</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Consumer Segment</p>
                      <p className="text-sm mt-1">{user.l2Data.consumerSegment}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Lifestyle Cluster</p>
                      <p className="text-sm mt-1">{user.l2Data.lifestyleCluster}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Net Worth</p>
                      <p className="text-sm mt-1">{user.l2Data.netWorth}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Vehicle Ownership</p>
                      <p className="text-sm mt-1">{user.l2Data.vehicleOwnership}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-muted-foreground">Vehicle Types</p>
                      <p className="text-sm mt-1">{user.l2Data.vehicleTypes}</p>
                    </div>
                  </div>
                </div>

                {/* Political Engagement */}
                <div className="border-t pt-6 space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Political Engagement</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Donor History</p>
                      <p className="text-sm mt-1">{user.l2Data.donorHistory}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Donor Frequency</p>
                      <p className="text-sm mt-1">{user.l2Data.donorFrequency}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Average Donation</p>
                      <p className="text-sm mt-1">{user.l2Data.averageDonationAmount}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Lifetime Donations</p>
                      <p className="text-sm mt-1">{user.l2Data.totalLifetimeDonations}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Advocacy Engagement</p>
                      <Badge variant="outline" className="mt-1 bg-green-50 text-green-700 border-green-200">
                        {user.l2Data.advocacyEngagement}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Volunteer Likelihood</p>
                      <p className="text-sm mt-1">{user.l2Data.volunteerLikelihood}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-muted-foreground mb-2">Issue Interests</p>
                      <div className="flex flex-wrap gap-2">
                        {user.l2Data.issueInterests.map((interest) => (
                          <Badge key={interest} variant="outline">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Propensity Scores */}
                <div className="border-t pt-6 space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Propensity Scores</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium">Turnout Propensity 2024</p>
                        <span className="text-sm font-semibold">{user.l2Data.turnoutPropensity2024}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${user.l2Data.turnoutPropensity2024}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium">Turnout Propensity 2026</p>
                        <span className="text-sm font-semibold">{user.l2Data.turnoutPropensity2026}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${user.l2Data.turnoutPropensity2026}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium">Democratic Support</p>
                        <span className="text-sm font-semibold">{user.l2Data.democraticSupport}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${user.l2Data.democraticSupport}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium">Republican Support</p>
                        <span className="text-sm font-semibold">{user.l2Data.republicanSupport}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-red-600 h-2 rounded-full"
                          style={{ width: `${user.l2Data.republicanSupport}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium">Persuadability</p>
                        <span className="text-sm font-semibold">{user.l2Data.persuadability}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{ width: `${user.l2Data.persuadability}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Preferences & Data Quality */}
                <div className="border-t pt-6 space-y-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Phone className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Contact Preferences & Data Quality</h3>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-3">Contact Preferences</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Phone Type</p>
                        <p className="text-sm mt-1">{user.l2Data.phoneType}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Email Opt-In</p>
                        <Badge
                          variant="outline"
                          className={`mt-1 ${user.l2Data.emailOptIn === 'Yes' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`}
                        >
                          {user.l2Data.emailOptIn}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">SMS Opt-In</p>
                        <Badge
                          variant="outline"
                          className={`mt-1 ${user.l2Data.smsOptIn === 'Yes' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`}
                        >
                          {user.l2Data.smsOptIn}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Mail Opt-In</p>
                        <Badge
                          variant="outline"
                          className={`mt-1 ${user.l2Data.mailOptIn === 'Yes' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`}
                        >
                          {user.l2Data.mailOptIn}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Do Not Contact</p>
                        <Badge
                          variant="outline"
                          className={`mt-1 ${user.l2Data.doNotContact === 'No' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}
                        >
                          {user.l2Data.doNotContact}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="text-sm font-semibold mb-3">Data Quality</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">L2 Confidence</p>
                        <Badge variant="outline" className="mt-1 bg-green-50 text-green-700 border-green-200">
                          {user.l2Data.l2Confidence}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Last Verified</p>
                        <p className="text-sm mt-1">{format(user.l2Data.lastVerified, 'MMM d, yyyy')}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Record Match Quality</p>
                        <Badge variant="outline" className="mt-1 bg-green-50 text-green-700 border-green-200">
                          {user.l2Data.recordMatchQuality}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Stats & Actions */}
        <div className="space-y-6">
          {/* Activity Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Messages Sent</span>
                </div>
                <span className="font-semibold">{user.messageCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Bills Followed</span>
                </div>
                <span className="font-semibold">{user.billsFollowed}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Orgs Followed</span>
                </div>
                <span className="font-semibold">{user.orgsFollowed}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Last Login</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {format(user.lastLogin, 'MMM d, yyyy')}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Policy Interests */}
          <Card>
            <CardHeader>
              <CardTitle>Policy Interests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {user.policyInterests.map((interest) => (
                  <Badge key={interest} variant="outline">
                    {interest}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Organization Assignment */}
          <Card>
            <CardHeader>
              <CardTitle>Organization Assignment</CardTitle>
              <CardDescription>Assign this user as an admin of an organization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentOrg ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{currentOrg.name}</p>
                      <p className="text-xs text-muted-foreground">Organization Admin</p>
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full" disabled={actionInProgress}>
                        Remove from Organization
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove from Organization</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to remove {user.firstName} {user.lastName} from {currentOrg.name}? They will lose admin access to this organization.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRemoveFromOrganization}>
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="organization">Select Organization</Label>
                    <Select value={selectedOrganization} onValueChange={setSelectedOrganization}>
                      <SelectTrigger id="organization">
                        <SelectValue placeholder="Choose an organization..." />
                      </SelectTrigger>
                      <SelectContent>
                        {mockOrganizations.map((org) => (
                          <SelectItem key={org.id} value={org.id}>
                            {org.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handleAssignOrganization}
                    disabled={!selectedOrganization || actionInProgress}
                    className="w-full"
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    Assign to Organization
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Admin Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Admin Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {user.status === 'active' ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start" disabled={actionInProgress}>
                      <Ban className="h-4 w-4 mr-2" />
                      Suspend User
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Suspend User</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to suspend {user.firstName} {user.lastName}? They will not be able to log in or send messages until reinstated.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleSuspend}>Suspend</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <Button variant="outline" className="w-full justify-start" onClick={handleSuspend} disabled={actionInProgress}>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Reinstate User
                </Button>
              )}

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <UserCircle2 className="h-4 w-4 mr-2" />
                    Impersonate User
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Impersonate User</AlertDialogTitle>
                    <AlertDialogDescription>
                      You are about to view the platform as {user.firstName} {user.lastName}. You will be able to see their dashboard, messages, and all account information. This action will be logged for security purposes.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleImpersonate}>
                      Start Impersonation
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button variant="outline" className="w-full justify-start" onClick={handleResetPassword} disabled={actionInProgress}>
                <Key className="h-4 w-4 mr-2" />
                Reset Password
              </Button>

              {user.membershipTier === 'free' && (
                <Button variant="outline" className="w-full justify-start" onClick={handleUpgrade} disabled={actionInProgress}>
                  <Crown className="h-4 w-4 mr-2" />
                  Manual Upgrade
                </Button>
              )}

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full justify-start" disabled={actionInProgress}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete User
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete User</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to permanently delete {user.firstName} {user.lastName}? This action cannot be undone. All user data, messages, and history will be permanently removed.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Delete Permanently
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
