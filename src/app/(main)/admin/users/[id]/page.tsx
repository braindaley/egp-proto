'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  BarChart3,
  Phone,
  CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';

// Mock user data generator - based on actual L2 data fields
const getMockUser = (id: string) => ({
  id,
  firstName: 'Julie',
  lastName: 'Munley',
  email: 'julie.munley@example.com',
  phone: '(302) 555-1234',
  address: '731 Edgemoor Rd',
  city: 'Wilmington',
  state: 'DE',
  zipCode: '19809',
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
    // L2 Core IDs
    lalVoterId: 'LALDE503272020',
    lalHouseId: '673240969',
    votersStateVoterId: '150209913',
    votersCountyVoterId: '003',

    // Voter Registration
    votersActive: 'Active',
    votersCalculatedRegDate: new Date('2016-01-12'),
    votersOfficialRegDate: new Date('2016-01-12'),
    partiesDescription: 'Democratic',

    // Location/Districts
    state: 'DE',
    county: 'NEW CASTLE',
    precinct: '06 ED 05-06',
    usCongressionalDistrict: '00', // DE is at-large
    stateSenateDistrict: '06',
    stateHouseDistrict: '02',
    unifiedSchoolDistrict: 'BRANDYWINE SD',

    // Vote History (EG = General, EP = Primary)
    voteHistory: {
      'EG_2024': '0',
      'EG_2022': '0',
      'EG_2020': '1',
      'EG_2018': '0',
      'EG_2016': '1',
      'EP_2024': '0',
      'EP_2022': '0',
      'EP_2020': '0',
      'EP_2018': '0',
      'EP_2016': '0',
    },
    votingPerformanceEvenYearGeneral: '40%',
    votingPerformanceEvenYearPrimary: '20%',
    votingPerformanceEvenYearGeneralAndPrimary: '0%',
    voteFrequency: 2,

    // Demographics
    votersBirthDate: new Date('2000-01-01'),
    votersAge: 25,
    votersAgeRange: '25 to 29',
    votersGender: 'F',
    votersMiddleName: 'Michelle',
    ethnicDescription: 'European',
    ethnicGroupsEthnicGroup1Desc: 'English/Welsh',

    // Residence Address
    residenceAddressLine: '731 Edgemoor Rd',
    residenceCity: 'Wilmington',
    residenceState: 'DE',
    residenceZip: '19809',
    residenceZipPlus4: '3425',
    residenceLatitude: 39.755260,
    residenceLongitude: -75.506700,
    residenceLatLongAccuracy: 'GeoMatchRooftop',
    residenceCensusTract: '010704',
    residenceCensusBlock: '2021',
    residenceDensity: '11,001-15,000',

    // Household
    residenceFamilyId: 'R002152329',
    residenceHHVotersCount: 3,
    residenceHHGenderDescription: 'Mixed Gender Household',
    residenceHHPartiesDescription: 'Democratic & Independent',

    // Consumer Data - Demographics
    consumerDataDwellingType: 'Single Family Dwelling Unit',
    consumerDataHomeownerProbabilityModel: 'Owner',
    consumerDataHomeEstCurrentValueCode: '$300,000 - $349,999',
    consumerDataLengthOfResidenceCode: '5',
    consumerDataNumberOfAdultsInHH: 6,
    consumerDataNumberOfChildrenInHH: 0,
    consumerDataNumberOfPersonsInHH: 6,
    consumerDataPresenceOfChildrenInHH: 'No',

    // Consumer Data - Socioeconomic
    consumerDataEducationOfPerson: 'Completed College Likely',
    consumerDataEstimatedIncomeRange: '$75,000-$99,999',
    consumerDataEstimatedIncomeAmount: 87500,
    consumerDataOccupationGroup: 'Other',
    consumerDataLanguageCode: 'English',
    consumerDataMaritalStatus: null,

    // Consumer Data - Political Scores
    consumerDataConservativeRepublicanScore: null,
    consumerDataForLiberalDemocratsScore: null,
    consumerDataModerateRepublicanScore: null,
    consumerDataModerateDemocratScore: null,
    consumerDataProgressiveDemocratScore: null,

    // Consumer Data - Geographic
    consumerDataCBSA: 'Philadelphia-Camden-Wilmington (PA-NJ-DE-MD)',
    consumerDataCBSACode: '37980',
    consumerDataCSA: 'Philadelphia-Reading-Camden (PA-NJ-DE-MD)',
    consumerDataMSA: 'PHILADELPHIA-CAMDEN-WILMINGTON, PA-NJ-DE-MD',
    consumerDataMSACode: '37980',
    consumerDataTimeZone: 'Eastern Time Zone',
    consumerDataRUSCode: 'Suburban',
    designatedMarketAreaDMA: 'PHILADELPHIA DMA',
    radioMarketArea: 'PHILADELPHIA RADIO MKT AREA|WILMINGTON DE RADIO MKT AREA',

    // Consumer Data - Property
    consumerDataHomeSwimmingPool: 'No Pool Present',
    consumerDataBedroomsCount: null,
    consumerDataRoomsCount: 7,
    consumerDataTaxAssessedValueTotal: 66400,
    residencePropertyHomeSquareFootage: '0-2,000',
    residencePropertyLandSquareFootage: '8,001-9,000',
    residencePropertyType: 'Residential',

    // Consumer Data - Household Composition
    consumerDataGenerationsInHH: 2,
    consumerDataSeniorAdultInHH: 'Yes',
    consumerDataVeteranInHH: 'Yes',

    // Contact Data
    cellPhoneNumberAvailable: 'Yes',
    landlinePhoneNumberAvailable: 'Yes',
    voterTelephonesCellPhoneFormatted: null, // Actual number redacted
    voterTelephonesLandlineFormatted: null, // Actual number redacted
    voterTelephonesCellConfidenceCode: null,
    voterTelephonesLandlineConfidenceCode: null,

    // Consumer Data - Interests (from sample)
    consumerDataCurrentAffairsPolitics: 'Yes',
    consumerDataDonorPoliticalLiberal: null,
    consumerDataDonorPoliticalConservative: null,
    consumerDataDonorEnvironmental: 'Yes',
    consumerDataDonorCharitableCauses: 'Yes',
    consumerDataReligionCode: 'Protestant',

    // Data Timestamp
    lastUpdated: new Date('2024-12-01'),
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

// US States for member selection
const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming'
];

// Helper to convert state name to abbreviation
const getStateAbbreviation = (stateName: string): string => {
  const stateMap: { [key: string]: string } = {
    'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
    'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
    'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
    'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
    'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
    'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
    'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
    'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
    'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
    'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY'
  };
  return stateMap[stateName] || '';
};

interface SimpleMember {
  bioguideId: string;
  name: string;
  state: string;
  district?: string;
  party?: string;
}

type UserType = 'organization' | 'member';

export default function UserDetailsPage() {
  const params = useParams();
  const userId = params?.id as string;
  const user = getMockUser(userId);

  const [actionInProgress, setActionInProgress] = useState(false);

  // Assignment state
  const [userType, setUserType] = useState<UserType>('organization');
  const [selectedOrganization, setSelectedOrganization] = useState<string>('');
  const [assignedOrganization, setAssignedOrganization] = useState<string | null>(null);

  // Member assignment state
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedMember, setSelectedMember] = useState<SimpleMember | null>(null);
  const [assignedMember, setAssignedMember] = useState<SimpleMember | null>(null);
  const [members, setMembers] = useState<SimpleMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Fetch members when state is selected
  useEffect(() => {
    const fetchMembers = async () => {
      if (userType !== 'member' || !selectedState) {
        setMembers([]);
        return;
      }

      setLoadingMembers(true);
      try {
        const stateAbbr = getStateAbbreviation(selectedState);
        const response = await fetch(`/api/congress/members?congress=119&state=${stateAbbr}`);
        const data = await response.json();

        if (response.ok && data) {
          const allMembers: SimpleMember[] = [];
          const seenBioguideIds = new Set<string>();

          // Process senators
          if (data.senators) {
            data.senators.forEach((member: any) => {
              if (!seenBioguideIds.has(member.bioguideId)) {
                seenBioguideIds.add(member.bioguideId);
                allMembers.push({
                  bioguideId: member.bioguideId,
                  name: `${member.name} (Sen.)`,
                  state: selectedState,
                  party: member.partyName
                });
              }
            });
          }

          // Process representatives
          if (data.representatives) {
            data.representatives.forEach((member: any) => {
              if (!seenBioguideIds.has(member.bioguideId)) {
                seenBioguideIds.add(member.bioguideId);
                const district = member.district ? `-${member.district}` : '';
                allMembers.push({
                  bioguideId: member.bioguideId,
                  name: `${member.name} (Rep.${district})`,
                  state: selectedState,
                  district: member.district,
                  party: member.partyName
                });
              }
            });
          }

          // Sort by name
          allMembers.sort((a, b) => a.name.localeCompare(b.name));
          setMembers(allMembers);
        }
      } catch (error) {
        console.error('Error fetching members:', error);
        setMembers([]);
      } finally {
        setLoadingMembers(false);
      }
    };

    fetchMembers();
  }, [userType, selectedState]);

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

  const handleAssignMember = () => {
    if (!selectedMember) {
      alert('Please select a member');
      return;
    }
    setActionInProgress(true);
    setTimeout(() => {
      setAssignedMember(selectedMember);
      alert(`${user.firstName} ${user.lastName} has been assigned to manage ${selectedMember.name}. They now have member staff access.`);
      setActionInProgress(false);
    }, 500);
  };

  const handleRemoveFromMember = () => {
    setActionInProgress(true);
    setTimeout(() => {
      alert(`${user.firstName} ${user.lastName} has been removed from ${assignedMember?.name}.`);
      setAssignedMember(null);
      setSelectedMember(null);
      setSelectedState('');
      setActionInProgress(false);
    }, 500);
  };

  const currentOrg = assignedOrganization ? mockOrganizations.find(o => o.id === assignedOrganization) : null;
  const hasAssignment = currentOrg || assignedMember;

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
                Voter file data provided by L2 Political. Last updated {format(user.l2Data.lastUpdated, 'MMM d, yyyy')}.
                <span className="block text-xs mt-1 font-mono text-muted-foreground">
                  LALVOTERID: {user.l2Data.lalVoterId} | LALHOUSEID: {user.l2Data.lalHouseId}
                </span>
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
                        {user.l2Data.votersActive}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Registration Date</p>
                      <p className="text-sm mt-1">{format(user.l2Data.votersCalculatedRegDate, 'MMM d, yyyy')}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Party</p>
                      <p className="text-sm mt-1">{user.l2Data.partiesDescription}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">State Voter ID</p>
                      <p className="text-sm mt-1 font-mono">{user.l2Data.votersStateVoterId}</p>
                    </div>
                  </div>
                </div>

                {/* Districts */}
                <div className="border-t pt-6 space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Districts</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">State</p>
                      <p className="text-sm mt-1">{user.l2Data.state}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">County</p>
                      <p className="text-sm mt-1">{user.l2Data.county}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Precinct</p>
                      <p className="text-sm mt-1 font-mono">{user.l2Data.precinct}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Congressional District</p>
                      <p className="text-sm mt-1">{user.l2Data.usCongressionalDistrict === '00' ? 'At-Large' : `CD-${user.l2Data.usCongressionalDistrict}`}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">State Senate District</p>
                      <p className="text-sm mt-1">SD-{user.l2Data.stateSenateDistrict}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">State House District</p>
                      <p className="text-sm mt-1">HD-{user.l2Data.stateHouseDistrict}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">School District</p>
                      <p className="text-sm mt-1">{user.l2Data.unifiedSchoolDistrict}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">DMA</p>
                      <p className="text-sm mt-1">{user.l2Data.designatedMarketAreaDMA}</p>
                    </div>
                  </div>
                </div>

                {/* Vote History */}
                <div className="border-t pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Vote History</h3>
                    <div className="ml-auto flex gap-2">
                      <Badge variant="outline">
                        General: {user.l2Data.votingPerformanceEvenYearGeneral}
                      </Badge>
                      <Badge variant="outline">
                        Primary: {user.l2Data.votingPerformanceEvenYearPrimary}
                      </Badge>
                    </div>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Election</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Voted</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(user.l2Data.voteHistory).map(([election, status]) => {
                        const [type, year] = election.split('_');
                        const electionType = type === 'EG' ? 'General' : 'Primary';
                        return (
                          <TableRow key={election}>
                            <TableCell className="font-medium">{year}</TableCell>
                            <TableCell>{electionType}</TableCell>
                            <TableCell>
                              {status === '1' ? (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  Yes
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                                  No
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
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
                      <p className="text-sm mt-1">{user.l2Data.votersAge}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Age Range</p>
                      <p className="text-sm mt-1">{user.l2Data.votersAgeRange}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Birth Date</p>
                      <p className="text-sm mt-1">{format(user.l2Data.votersBirthDate, 'MMM d, yyyy')}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Gender</p>
                      <p className="text-sm mt-1">{user.l2Data.votersGender === 'F' ? 'Female' : user.l2Data.votersGender === 'M' ? 'Male' : user.l2Data.votersGender}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Ethnicity</p>
                      <p className="text-sm mt-1">{user.l2Data.ethnicDescription}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Ethnic Group</p>
                      <p className="text-sm mt-1">{user.l2Data.ethnicGroupsEthnicGroup1Desc}</p>
                    </div>
                  </div>
                </div>

                {/* Consumer Data - Socioeconomic */}
                <div className="border-t pt-6 space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Consumer Data - Socioeconomic</h3>
                    <Badge variant="outline" className="ml-auto text-xs">Modeled</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Education</p>
                      <p className="text-sm mt-1">{user.l2Data.consumerDataEducationOfPerson || 'Not available'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Est. Income Range</p>
                      <p className="text-sm mt-1">{user.l2Data.consumerDataEstimatedIncomeRange || 'Not available'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Occupation Group</p>
                      <p className="text-sm mt-1">{user.l2Data.consumerDataOccupationGroup || 'Not available'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Language</p>
                      <p className="text-sm mt-1">{user.l2Data.consumerDataLanguageCode || 'Not available'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Religion</p>
                      <p className="text-sm mt-1">{user.l2Data.consumerDataReligionCode || 'Not available'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Time Zone</p>
                      <p className="text-sm mt-1">{user.l2Data.consumerDataTimeZone || 'Not available'}</p>
                    </div>
                  </div>
                </div>

                {/* Household */}
                <div className="border-t pt-6 space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Home className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Household & Residence</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Family ID</p>
                      <p className="text-sm mt-1 font-mono">{user.l2Data.residenceFamilyId}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Voters in Household</p>
                      <p className="text-sm mt-1">{user.l2Data.residenceHHVotersCount}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">HH Gender Composition</p>
                      <p className="text-sm mt-1">{user.l2Data.residenceHHGenderDescription}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">HH Party Composition</p>
                      <p className="text-sm mt-1">{user.l2Data.residenceHHPartiesDescription}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Persons in HH</p>
                      <p className="text-sm mt-1">{user.l2Data.consumerDataNumberOfPersonsInHH}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Adults in HH</p>
                      <p className="text-sm mt-1">{user.l2Data.consumerDataNumberOfAdultsInHH}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Children in HH</p>
                      <p className="text-sm mt-1">{user.l2Data.consumerDataPresenceOfChildrenInHH}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Generations in HH</p>
                      <p className="text-sm mt-1">{user.l2Data.consumerDataGenerationsInHH}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Senior in HH</p>
                      <p className="text-sm mt-1">{user.l2Data.consumerDataSeniorAdultInHH}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Veteran in HH</p>
                      <p className="text-sm mt-1">{user.l2Data.consumerDataVeteranInHH}</p>
                    </div>
                  </div>
                </div>

                {/* Property Data */}
                <div className="border-t pt-6 space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Building2 className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Property Data</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Dwelling Type</p>
                      <p className="text-sm mt-1">{user.l2Data.consumerDataDwellingType}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Homeowner Status</p>
                      <p className="text-sm mt-1">{user.l2Data.consumerDataHomeownerProbabilityModel}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Est. Home Value</p>
                      <p className="text-sm mt-1">{user.l2Data.consumerDataHomeEstCurrentValueCode}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Length of Residence</p>
                      <p className="text-sm mt-1">{user.l2Data.consumerDataLengthOfResidenceCode} years</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Tax Assessed Value</p>
                      <p className="text-sm mt-1">${user.l2Data.consumerDataTaxAssessedValueTotal?.toLocaleString() || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Home Square Footage</p>
                      <p className="text-sm mt-1">{user.l2Data.residencePropertyHomeSquareFootage}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Land Square Footage</p>
                      <p className="text-sm mt-1">{user.l2Data.residencePropertyLandSquareFootage}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Property Type</p>
                      <p className="text-sm mt-1">{user.l2Data.residencePropertyType}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Rooms</p>
                      <p className="text-sm mt-1">{user.l2Data.consumerDataRoomsCount || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Swimming Pool</p>
                      <p className="text-sm mt-1">{user.l2Data.consumerDataHomeSwimmingPool}</p>
                    </div>
                  </div>
                </div>

                {/* Geographic Data */}
                <div className="border-t pt-6 space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Geographic Data</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Address</p>
                      <p className="text-sm mt-1">{user.l2Data.residenceAddressLine}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">City, State ZIP</p>
                      <p className="text-sm mt-1">{user.l2Data.residenceCity}, {user.l2Data.residenceState} {user.l2Data.residenceZip}-{user.l2Data.residenceZipPlus4}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Latitude</p>
                      <p className="text-sm mt-1 font-mono">{user.l2Data.residenceLatitude}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Longitude</p>
                      <p className="text-sm mt-1 font-mono">{user.l2Data.residenceLongitude}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Geocode Accuracy</p>
                      <p className="text-sm mt-1">{user.l2Data.residenceLatLongAccuracy}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Census Tract</p>
                      <p className="text-sm mt-1 font-mono">{user.l2Data.residenceCensusTract}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Census Block</p>
                      <p className="text-sm mt-1 font-mono">{user.l2Data.residenceCensusBlock}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Population Density</p>
                      <p className="text-sm mt-1">{user.l2Data.residenceDensity}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Urban/Suburban/Rural</p>
                      <p className="text-sm mt-1">{user.l2Data.consumerDataRUSCode}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">CBSA</p>
                      <p className="text-sm mt-1 text-xs">{user.l2Data.consumerDataCBSA}</p>
                    </div>
                  </div>
                </div>

                {/* Consumer Interests */}
                <div className="border-t pt-6 space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Consumer Interests</h3>
                    <Badge variant="outline" className="ml-auto text-xs">Modeled</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Current Affairs/Politics</p>
                      <p className="text-sm mt-1">{user.l2Data.consumerDataCurrentAffairsPolitics || 'No'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Environmental Donor</p>
                      <p className="text-sm mt-1">{user.l2Data.consumerDataDonorEnvironmental || 'No'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Charitable Donor</p>
                      <p className="text-sm mt-1">{user.l2Data.consumerDataDonorCharitableCauses || 'No'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Liberal Political Donor</p>
                      <p className="text-sm mt-1">{user.l2Data.consumerDataDonorPoliticalLiberal || 'No'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Conservative Political Donor</p>
                      <p className="text-sm mt-1">{user.l2Data.consumerDataDonorPoliticalConservative || 'No'}</p>
                    </div>
                  </div>
                </div>

                {/* Contact Data */}
                <div className="border-t pt-6 space-y-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Phone className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Contact Data Availability</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Cell Phone Available</p>
                      <Badge variant="outline" className={user.l2Data.cellPhoneNumberAvailable === 'Yes' ? 'mt-1 bg-green-50 text-green-700 border-green-200' : 'mt-1'}>
                        {user.l2Data.cellPhoneNumberAvailable}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Landline Available</p>
                      <Badge variant="outline" className={user.l2Data.landlinePhoneNumberAvailable === 'Yes' ? 'mt-1 bg-green-50 text-green-700 border-green-200' : 'mt-1'}>
                        {user.l2Data.landlinePhoneNumberAvailable}
                      </Badge>
                    </div>
                  </div>
                </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Stats & Actions */}
        <div className="space-y-6">
          {/* Campaign Management */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign Management</CardTitle>
              <CardDescription>Assign this user to manage an organization or member</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Show current assignment if exists */}
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
              ) : assignedMember ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{assignedMember.name}</p>
                      <p className="text-xs text-muted-foreground">Member Staff</p>
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full" disabled={actionInProgress}>
                        Remove from Member
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove from Member</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to remove {user.firstName} {user.lastName} from {assignedMember.name}? They will lose staff access.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRemoveFromMember}>
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* User Type Selection */}
                  <div className="space-y-2">
                    <Label>Select User Type</Label>
                    <Select
                      value={userType}
                      onValueChange={(value: UserType) => {
                        setUserType(value);
                        // Reset selections when changing type
                        setSelectedOrganization('');
                        setSelectedState('');
                        setSelectedMember(null);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select user type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="organization">Organization</SelectItem>
                        <SelectItem value="member">Member of Congress</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Organization Selection */}
                  {userType === 'organization' && (
                    <>
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
                    </>
                  )}

                  {/* Member Selection */}
                  {userType === 'member' && (
                    <>
                      {/* State Selection */}
                      <div className="space-y-2">
                        <Label>Select State</Label>
                        <Select
                          value={selectedState}
                          onValueChange={(value) => {
                            setSelectedState(value);
                            setSelectedMember(null);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a state" />
                          </SelectTrigger>
                          <SelectContent>
                            {US_STATES.map((state) => (
                              <SelectItem key={state} value={state}>
                                {state}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Member Selection - only show if state is selected */}
                      {selectedState && (
                        <div className="space-y-2">
                          <Label>Select Member</Label>
                          {loadingMembers ? (
                            <div className="text-sm text-muted-foreground py-2">Loading members...</div>
                          ) : (
                            <Select
                              value={selectedMember?.bioguideId || ''}
                              onValueChange={(value) => {
                                const member = members.find(m => m.bioguideId === value);
                                setSelectedMember(member || null);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a member" />
                              </SelectTrigger>
                              <SelectContent>
                                {members.map((member) => (
                                  <SelectItem key={member.bioguideId} value={member.bioguideId}>
                                    {member.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      )}

                      <Button
                        onClick={handleAssignMember}
                        disabled={!selectedMember || actionInProgress}
                        className="w-full"
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Assign to Member
                      </Button>
                    </>
                  )}
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
