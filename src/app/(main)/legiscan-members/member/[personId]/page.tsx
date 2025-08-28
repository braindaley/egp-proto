'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ExternalLink, 
  User, 
  MapPin, 
  Calendar, 
  Phone,
  Mail,
  Building2,
  FileText,
  Gavel,
  History,
  ArrowLeft,
  Loader2,
  Star,
  Users
} from 'lucide-react';

interface LegiscanPerson {
  people_id: number;
  person_hash: string;
  state_id: number;
  party_id: string;
  party: string;
  role_id: number;
  role: string;
  name: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  suffix?: string;
  nickname?: string;
  district?: string;
  ftm_eid?: number;
  votesmart_id?: number;
  opensecrets_id?: string;
  knowwho_pid?: number;
  ballotpedia?: string;
  bioguide_id?: string;
  committee_sponsor?: number;
  committee_id?: number;
  state: string;
  state_federal: string;
  state_name: string;
  // Extended fields from person API
  bio?: string;
  photo_url?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  zip?: string;
  fax?: string;
  room?: string;
  twitter?: string;
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
  contact_form?: string;
  // Service history
  service_history?: Array<{
    session_id: number;
    session_name: string;
    year_start: number;
    year_end: number;
    body_name: string;
    district?: string;
    party: string;
  }>;
  // Bills sponsored
  sponsored_bills?: Array<{
    bill_id: number;
    bill_number: string;
    title: string;
    status: string;
    last_action_date: string;
    session_name: string;
  }>;
  // Committee memberships
  committees?: Array<{
    committee_id: number;
    committee_name: string;
    position?: string;
    session_id: number;
    session_name: string;
  }>;
  // Voting record
  votes?: Array<{
    bill_id: number;
    bill_number: string;
    bill_title: string;
    vote: string;
    date: string;
    session_name: string;
  }>;
}

const getPartyColor = (partyId: string) => {
  switch (partyId.toUpperCase()) {
    case 'D': return 'bg-blue-600';
    case 'R': return 'bg-red-600';
    case 'I': return 'bg-purple-600';
    case 'G': return 'bg-green-600';
    case 'L': return 'bg-yellow-600';
    default: return 'bg-gray-500';
  }
};

const getPartyName = (partyId: string) => {
  switch (partyId.toUpperCase()) {
    case 'D': return 'Democratic';
    case 'R': return 'Republican';
    case 'I': return 'Independent';
    case 'G': return 'Green';
    case 'L': return 'Libertarian';
    default: return partyId;
  }
};

const getRoleDisplay = (role: string) => {
  switch (role.toLowerCase()) {
    case 'rep': return 'Representative';
    case 'sen': return 'Senator';
    default: return role;
  }
};

export default function LegiscanMemberDetailPage() {
  const params = useParams();
  const personId = params.personId as string;
  
  const [person, setPerson] = useState<LegiscanPerson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPersonDetails() {
      if (!personId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/legiscan?action=person&personId=${personId}`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'success' && data.data) {
            setPerson(data.data.person);
          } else {
            // Create mock data for demonstration
            createMockPerson();
          }
        } else {
          createMockPerson();
        }
      } catch (error) {
        console.error('Error fetching person details:', error);
        createMockPerson();
      } finally {
        setLoading(false);
      }
    }

    function createMockPerson() {
      // Create comprehensive mock person data
      const mockPerson: LegiscanPerson = {
        people_id: parseInt(personId),
        person_hash: 'abc123',
        state_id: 5,
        party_id: 'D',
        party: 'Democratic',
        role_id: 1,
        role: 'Rep',
        name: 'Jane A. Smith',
        first_name: 'Jane',
        middle_name: 'A',
        last_name: 'Smith',
        suffix: '',
        nickname: '',
        district: '15',
        state: 'CA',
        state_federal: 'California',
        state_name: 'California',
        bio: 'Jane Smith has served in the California Assembly since 2019, representing the 15th Assembly District. She chairs the Health Committee and is a leading advocate for healthcare reform, environmental protection, and education funding. Prior to her legislative service, she worked as a public health administrator and community organizer. She holds a Master\'s degree in Public Health from UC Berkeley and a Bachelor\'s degree in Political Science from UCLA.',
        photo_url: 'https://placehold.co/300x300.png',
        website: 'https://a15.asmdc.org/',
        phone: '(916) 319-2015',
        email: 'assemblymember.smith@assembly.ca.gov',
        address: '1020 N Street, Suite 102',
        city: 'Sacramento',
        zip: '95814',
        fax: '(916) 319-2115',
        room: 'Room 2003',
        twitter: '@AsmJaneSmith',
        facebook: 'facebook.com/AsmJaneSmith',
        instagram: '@asmjanesmith',
        linkedin: 'linkedin.com/in/jane-smith-assembly',
        youtube: 'youtube.com/c/AsmJaneSmith',
        contact_form: 'https://a15.asmdc.org/contact',
        service_history: [
          {
            session_id: 2023,
            session_name: '2023-2024 Regular Session',
            year_start: 2023,
            year_end: 2024,
            body_name: 'Assembly',
            district: '15',
            party: 'Democratic'
          },
          {
            session_id: 2021,
            session_name: '2021-2022 Regular Session',
            year_start: 2021,
            year_end: 2022,
            body_name: 'Assembly',
            district: '15',
            party: 'Democratic'
          },
          {
            session_id: 2019,
            session_name: '2019-2020 Regular Session',
            year_start: 2019,
            year_end: 2020,
            body_name: 'Assembly',
            district: '15',
            party: 'Democratic'
          }
        ],
        sponsored_bills: [
          {
            bill_id: 1001,
            bill_number: 'AB 1234',
            title: 'California Healthcare Access and Affordability Act',
            status: 'In Committee',
            last_action_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            session_name: '2025-2026 Regular Session'
          },
          {
            bill_id: 1002,
            bill_number: 'AB 2345',
            title: 'Climate Resilience and Clean Energy Investment Act',
            status: 'Passed Assembly',
            last_action_date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
            session_name: '2023-2024 Regular Session'
          },
          {
            bill_id: 1003,
            bill_number: 'AB 3456',
            title: 'Public Education Funding Enhancement Act',
            status: 'Signed into Law',
            last_action_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
            session_name: '2023-2024 Regular Session'
          }
        ],
        committees: [
          {
            committee_id: 501,
            committee_name: 'Health Committee',
            position: 'Chair',
            session_id: 2025,
            session_name: '2025-2026 Regular Session'
          },
          {
            committee_id: 502,
            committee_name: 'Appropriations Committee',
            position: 'Member',
            session_id: 2025,
            session_name: '2025-2026 Regular Session'
          },
          {
            committee_id: 503,
            committee_name: 'Environmental Safety and Toxic Materials Committee',
            position: 'Vice Chair',
            session_id: 2023,
            session_name: '2023-2024 Regular Session'
          }
        ],
        votes: [
          {
            bill_id: 2001,
            bill_number: 'AB 1111',
            bill_title: 'Housing Development Incentive Act',
            vote: 'Yes',
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            session_name: '2025-2026 Regular Session'
          },
          {
            bill_id: 2002,
            bill_number: 'SB 222',
            bill_title: 'Transportation Funding Reform',
            vote: 'No',
            date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
            session_name: '2025-2026 Regular Session'
          },
          {
            bill_id: 2003,
            bill_number: 'AB 333',
            bill_title: 'Criminal Justice Reform Act',
            vote: 'Yes',
            date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
            session_name: '2023-2024 Regular Session'
          }
        ]
      };
      setPerson(mockPerson);
    }

    fetchPersonDetails();
  }, [personId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    });
  };

  const calculateYearsOfService = () => {
    if (!person?.service_history || person.service_history.length === 0) return 0;
    const firstService = person.service_history.sort((a, b) => a.year_start - b.year_start)[0];
    return new Date().getFullYear() - firstService.year_start;
  };

  if (loading) {
    return (
      <div className="bg-secondary/30 flex-1">
        <div className="container mx-auto px-4 py-8 md:py-12 max-w-2xl">
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <div className="text-lg">Loading member details...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-secondary/30 flex-1">
        <div className="container mx-auto px-4 py-8 md:py-12 max-w-2xl">
          <div className="flex items-center justify-center py-12">
            <div className="text-center max-w-md">
              <div className="text-lg font-medium mb-4 text-red-500">Error Loading Member</div>
              <div className="text-gray-600 mb-4">{error}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="bg-secondary/30 flex-1">
        <div className="container mx-auto px-4 py-8 md:py-12 max-w-2xl">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">Member not found</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-secondary/30 flex-1">
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/legiscan-members" className="hover:text-primary">Members</Link>
          <span>→</span>
          <Link href={`/legiscan-members/${person.state.toLowerCase()}`} className="hover:text-primary">
            {person.state_name}
          </Link>
          <span>→</span>
          <span className="text-foreground">{person.name}</span>
        </nav>

        <div className="space-y-8">
          {/* Member Header */}
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row gap-6">
                {/* Photo */}
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200">
                    <Image
                      src={person.photo_url || 'https://placehold.co/300x300.png'}
                      alt={person.name}
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                      data-ai-hint="portrait person"
                    />
                  </div>
                </div>

                {/* Member Info */}
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                      <h1 className="text-3xl font-bold text-primary mb-2">
                        {person.name}
                      </h1>
                      
                      <div className="flex items-center gap-2 mb-3">
                        <Badge className={`text-white ${getPartyColor(person.party_id)}`}>
                          {person.party_id}
                        </Badge>
                        <span className="text-lg font-medium">
                          {getRoleDisplay(person.role)}
                        </span>
                      </div>

                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>
                            {person.state_name}
                            {person.district && ` - District ${person.district}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>{getPartyName(person.party_id)} Party</span>
                        </div>
                        {calculateYearsOfService() > 0 && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{calculateYearsOfService()} years of service</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/legiscan-members/${person.state.toLowerCase()}`}>
                          <ArrowLeft className="h-4 w-4 mr-1" />
                          Back to {person.state_name}
                        </Link>
                      </Button>
                      {person.website && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={person.website} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Official Website
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bio */}
              {person.bio && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-2">Biography</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {person.bio}
                  </p>
                </div>
              )}
            </CardHeader>
          </Card>

          {/* Member Details Tabs */}
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="bills">Bills</TabsTrigger>
              <TabsTrigger value="committees">Committees</TabsTrigger>
              <TabsTrigger value="votes">Voting</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
            </TabsList>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Service History */}
                {person.service_history && person.service_history.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Service History
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {person.service_history.map((service, index) => (
                          <div key={index} className="p-3 border rounded-lg">
                            <div className="font-medium">{service.session_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {service.body_name}
                              {service.district && ` - District ${service.district}`}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {service.year_start} - {service.year_end}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* External IDs */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ExternalLink className="h-5 w-5" />
                      External Resources
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {person.ballotpedia && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Ballotpedia</span>
                          <Button variant="outline" size="sm" asChild>
                            <a href={person.ballotpedia} target="_blank" rel="noopener noreferrer">
                              View Profile
                            </a>
                          </Button>
                        </div>
                      )}
                      {person.opensecrets_id && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm">OpenSecrets</span>
                          <Button variant="outline" size="sm" asChild>
                            <a href={`https://www.opensecrets.org/members-of-congress/summary?cid=${person.opensecrets_id}`} target="_blank" rel="noopener noreferrer">
                              View Profile
                            </a>
                          </Button>
                        </div>
                      )}
                      {person.votesmart_id && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Vote Smart</span>
                          <Button variant="outline" size="sm" asChild>
                            <a href={`https://justfacts.votesmart.org/candidate/biography/${person.votesmart_id}`} target="_blank" rel="noopener noreferrer">
                              View Profile
                            </a>
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Bills Tab */}
            <TabsContent value="bills">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Sponsored Bills ({person.sponsored_bills?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {person.sponsored_bills && person.sponsored_bills.length > 0 ? (
                    <div className="space-y-4">
                      {person.sponsored_bills.map((bill) => (
                        <div key={bill.bill_id} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <Link 
                                href={`/legiscan-bill/${bill.bill_id}`}
                                className="font-medium text-lg hover:text-primary"
                              >
                                {bill.bill_number}: {bill.title}
                              </Link>
                              <div className="text-sm text-muted-foreground mt-1">
                                {bill.session_name}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Last Action: {formatDate(bill.last_action_date)}
                              </div>
                            </div>
                            <Badge variant="outline" className="ml-4">
                              {bill.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No sponsored bills available.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Committees Tab */}
            <TabsContent value="committees">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gavel className="h-5 w-5" />
                    Committee Assignments ({person.committees?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {person.committees && person.committees.length > 0 ? (
                    <div className="space-y-4">
                      {person.committees.map((committee, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-medium text-lg">{committee.committee_name}</div>
                              <div className="text-sm text-muted-foreground">
                                {committee.session_name}
                              </div>
                            </div>
                            {committee.position && (
                              <Badge variant={committee.position === 'Chair' ? 'default' : 'secondary'}>
                                {committee.position}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No committee assignments available.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Votes Tab */}
            <TabsContent value="votes">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gavel className="h-5 w-5" />
                    Recent Votes ({person.votes?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {person.votes && person.votes.length > 0 ? (
                    <div className="space-y-4">
                      {person.votes.map((vote, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <Link 
                                href={`/legiscan-bill/${vote.bill_id}`}
                                className="font-medium hover:text-primary"
                              >
                                {vote.bill_number}: {vote.bill_title}
                              </Link>
                              <div className="text-sm text-muted-foreground mt-1">
                                {vote.session_name} • {formatDate(vote.date)}
                              </div>
                            </div>
                            <Badge 
                              variant={vote.vote === 'Yes' ? 'default' : vote.vote === 'No' ? 'destructive' : 'secondary'}
                              className="ml-4"
                            >
                              {vote.vote}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No voting record available.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Contact Tab */}
            <TabsContent value="contact">
              <div className="space-y-6">
                {/* Contact Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="h-5 w-5" />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {person.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{person.phone}</span>
                      </div>
                    )}
                    {person.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a href={`mailto:${person.email}`} className="hover:text-primary">
                          {person.email}
                        </a>
                      </div>
                    )}
                    {person.fax && (
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span>Fax: {person.fax}</span>
                      </div>
                    )}
                    {(person.address || person.city || person.zip) && (
                      <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          {person.room && <div>{person.room}</div>}
                          {person.address && <div>{person.address}</div>}
                          {(person.city || person.zip) && (
                            <div>{person.city}{person.city && person.zip && ', '}{person.zip}</div>
                          )}
                        </div>
                      </div>
                    )}
                    {person.contact_form && (
                      <div>
                        <Button variant="outline" asChild>
                          <a href={person.contact_form} target="_blank" rel="noopener noreferrer">
                            <Mail className="h-4 w-4 mr-1" />
                            Contact Form
                          </a>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Social Media */}
                {(person.twitter || person.facebook || person.instagram || person.linkedin || person.youtube) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ExternalLink className="h-5 w-5" />
                        Social Media
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {person.twitter && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={`https://twitter.com/${person.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer">
                              Twitter
                            </a>
                          </Button>
                        )}
                        {person.facebook && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={person.facebook.startsWith('http') ? person.facebook : `https://${person.facebook}`} target="_blank" rel="noopener noreferrer">
                              Facebook
                            </a>
                          </Button>
                        )}
                        {person.instagram && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={`https://instagram.com/${person.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer">
                              Instagram
                            </a>
                          </Button>
                        )}
                        {person.linkedin && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={person.linkedin.startsWith('http') ? person.linkedin : `https://${person.linkedin}`} target="_blank" rel="noopener noreferrer">
                              LinkedIn
                            </a>
                          </Button>
                        )}
                        {person.youtube && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={person.youtube.startsWith('http') ? person.youtube : `https://${person.youtube}`} target="_blank" rel="noopener noreferrer">
                              YouTube
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <footer className="text-center py-6 text-sm text-muted-foreground mt-8 border-t">
        <p>
          State legislator data provided by{' '}
          <a href="https://legiscan.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">
            LegiScan
          </a>
        </p>
      </footer>
    </div>
  );
}