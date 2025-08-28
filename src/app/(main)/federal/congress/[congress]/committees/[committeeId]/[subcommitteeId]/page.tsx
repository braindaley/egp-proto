import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ExternalLink, Building, Globe, Phone, Users, Calendar, Crown, Award, ChevronRight, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

interface SubcommitteeMember {
  bioguideId: string;
  name: string;
  party: string;
  state: string;
  district?: string;
  rank?: number;
  title?: string;
  url: string;
}

interface SubcommitteeMeeting {
  eventId: string;
  title: string;
  date: string;
  chamber: string;
  meetingType: string;
  location?: {
    building?: string;
    room?: string;
  };
  url: string;
}

interface ParentCommittee {
  name: string;
  systemCode: string;
  url: string;
}

interface EnhancedSubcommitteeInfo {
  name: string;
  systemCode: string;
  chamber: string;
  url?: string;
  phone?: string;
  office?: string;
  jurisdiction?: string;
  chair?: SubcommitteeMember;
  rankingMember?: SubcommitteeMember;
  members: SubcommitteeMember[];
  recentMeetings: SubcommitteeMeeting[];
  parentCommittee: ParentCommittee;
  membershipStats: {
    totalMembers: number;
    majorityMembers: number;
    minorityMembers: number;
  };
}

interface SubcommitteeDetailResponse {
  subcommittee: EnhancedSubcommitteeInfo;
}

async function getSubcommitteeDetails(congress: string, committeeId: string, subcommitteeId: string): Promise<EnhancedSubcommitteeInfo | null> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const url = `${baseUrl}/api/congress/committee/${committeeId}/subcommittee/${subcommitteeId}?congress=${congress}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`Failed to fetch subcommittee details from internal API: ${res.status}`);
      return null;
    }
    const data: SubcommitteeDetailResponse = await res.json();
    return data.subcommittee;
  } catch (error) {
    console.error("Error fetching subcommittee details:", error);
    return null;
  }
}

function MemberCard({ member, showTitle = true, congress }: { member: SubcommitteeMember; showTitle?: boolean; congress?: string }) {
  const partyColor = member.party === 'Republican' || member.party === 'R' ? 'bg-red-100 text-red-800' : 
                   member.party === 'Democratic' || member.party === 'Democrat' || member.party === 'D' ? 'bg-blue-100 text-blue-800' : 
                   'bg-gray-100 text-gray-800';

  // Generate internal member link
  const memberLink = congress && member.bioguideId && member.state ? 
    `/federal/congress/${congress}/states/${member.state}/${member.bioguideId}` : 
    null;

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <h4 className="font-semibold text-sm">
              {memberLink ? (
                <a href={memberLink} className="text-primary hover:underline">
                  {member.name}
                </a>
              ) : (
                member.name
              )}
            </h4>
            <p className="text-sm text-muted-foreground">
              {member.state.charAt(0).toUpperCase() + member.state.slice(1).replace('-', ' ')}{member.district ? `-${member.district}` : ''}
            </p>
            {showTitle && member.title && (
              <div className="flex items-center gap-1 mt-1">
                {member.title.toLowerCase().includes('chair') && !member.title.toLowerCase().includes('ranking') && <Crown className="h-3 w-3 text-yellow-600" />}
                {member.title.toLowerCase().includes('ranking') && <Award className="h-3 w-3 text-gray-600" />}
                <span className="text-xs font-medium text-primary">{member.title}</span>
              </div>
            )}
          </div>
          <Badge variant="outline" className={partyColor}>
            {member.party === 'Republican' || member.party === 'R' ? 'R' : 
             member.party === 'Democratic' || member.party === 'Democrat' || member.party === 'D' ? 'D' : 
             member.party.charAt(0)}
          </Badge>
        </div>
      </div>
    </div>
  );
}

function formatDate(dateString: string): string {
  try {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
}

export default async function SubcommitteeDetailPage({ params }: { params: { congress: string, committeeId: string, subcommitteeId: string } }) {
  const { congress, committeeId, subcommitteeId } = await params;
  const subcommittee = await getSubcommitteeDetails(congress, committeeId, subcommitteeId);

  if (!subcommittee) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Subcommittee Not Found</h2>
            <p className="text-muted-foreground">
              The requested subcommittee could not be found or may no longer exist.
            </p>
            <Button variant="outline" className="mt-4" asChild>
              <a href={`/federal/congress/${congress}/committees/${committeeId}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Committee
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const chamber = subcommittee.chamber;
  const office = subcommittee.office;
  const phone = subcommittee.phone;
  const website = subcommittee.url;

  // Organize members by party
  const majorityMembers = (subcommittee.members || []).filter(m => 
    m.party === 'Republican' || m.party === 'R'
  ).sort((a, b) => (a.rank || 999) - (b.rank || 999));
  
  const minorityMembers = (subcommittee.members || []).filter(m => 
    m.party === 'Democratic' || m.party === 'Democrat' || m.party === 'D'
  ).sort((a, b) => (a.rank || 999) - (b.rank || 999));

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">

      <header className="mb-12">
        <p className="text-lg text-muted-foreground font-medium mb-1">{congress}th Congress</p>
        <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary mb-2">
          {subcommittee.name}
        </h1>
        <p className="text-lg text-muted-foreground mb-4">
          Subcommittee of the {subcommittee.parentCommittee.name}
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="capitalize">{chamber}</Badge>
          <Badge variant="outline">Subcommittee</Badge>
          {subcommittee.membershipStats && subcommittee.membershipStats.totalMembers > 0 && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {subcommittee.membershipStats.totalMembers} Members
            </Badge>
          )}
        </div>
      </header>

      <div className="space-y-8 max-w-4xl mx-auto">
          {/* Back to Parent Committee Button */}
          <Card>
            <CardContent className="pt-6">
              <Button variant="outline" asChild>
                <a href={subcommittee.parentCommittee.url}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to {subcommittee.parentCommittee.name}
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* About Section */}
          <Card>
            <CardHeader>
              <CardTitle>About This Subcommittee</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                {subcommittee.jurisdiction || "Subcommittee jurisdiction and responsibilities information."}
              </p>
              
              {/* Leadership */}
              {(subcommittee.chair || subcommittee.rankingMember) && (
                <div className="mt-6">
                  <h4 className="font-semibold mb-3">Leadership</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {subcommittee.chair && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-muted-foreground">Subcommittee Chair</h5>
                        <MemberCard member={subcommittee.chair} showTitle={false} congress={congress} />
                      </div>
                    )}
                    {subcommittee.rankingMember && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-muted-foreground">Ranking Member</h5>
                        <MemberCard member={subcommittee.rankingMember} showTitle={false} congress={congress} />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {website && (
                <Button variant="outline" className="mt-4" asChild>
                  <a href={website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2">
                    Visit Subcommittee Page <ExternalLink className="h-4 w-4"/>
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          {subcommittee.recentMeetings && subcommittee.recentMeetings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Recent Meetings
                  </h4>
                  <div className="space-y-3">
                    {subcommittee.recentMeetings.slice(0, 3).map((meeting, index) => (
                      <div key={meeting.eventId || index} className="border-l-2 border-primary/20 pl-4 space-y-1">
                        <h5 className="font-medium text-sm">
                          {meeting.url ? (
                            <a href={meeting.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                              {meeting.title}
                            </a>
                          ) : (
                            meeting.title
                          )}
                        </h5>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          {meeting.date && <span>{formatDate(meeting.date)}</span>}
                          {meeting.meetingType && <Badge variant="outline" className="text-xs">{meeting.meetingType}</Badge>}
                          {meeting.location?.room && (
                            <span>{meeting.location.building} {meeting.location.room}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {office ? (
                <div className="flex items-start gap-3">
                  <Building className="h-5 w-5 text-muted-foreground mt-1" />
                  <div>
                    <h4 className="font-semibold">Office</h4>
                    <p className="text-muted-foreground">{office}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <Building className="h-5 w-5 text-muted-foreground mt-1" />
                  <div>
                    <h4 className="font-semibold">Office</h4>
                    <p className="text-muted-foreground">
                      Contact information available on the committee website
                    </p>
                  </div>
                </div>
              )}
              {phone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground mt-1" />
                  <div>
                    <h4 className="font-semibold">Phone</h4>
                    <p className="text-muted-foreground">{phone}</p>
                  </div>
                </div>
              )}
              {website && (
                <div className="flex items-start gap-3">
                  <Globe className="h-5 w-5 text-muted-foreground mt-1" />
                  <div>
                    <h4 className="font-semibold">Website</h4>
                    <a href={website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">{website}</a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Membership Overview */}
          {subcommittee.members && subcommittee.members.length > 0 && subcommittee.membershipStats && (
            <Card>
              <CardHeader>
                <CardTitle>Subcommittee Membership</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-red-600">{subcommittee.membershipStats.majorityMembers}</p>
                    <p className="text-sm text-muted-foreground">Majority (Republican)</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-blue-600">{subcommittee.membershipStats.minorityMembers}</p>
                    <p className="text-sm text-muted-foreground">Minority (Democratic)</p>
                  </div>
                </div>

                <Separator />

                {/* Member Lists */}
                <div className="space-y-4">
                  {majorityMembers.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 text-red-700">Majority Members</h4>
                      <div className="space-y-2">
                        {majorityMembers.map((member, index) => (
                          <MemberCard key={member.bioguideId || index} member={member} congress={congress} />
                        ))}
                      </div>
                    </div>
                  )}

                  {minorityMembers.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 text-blue-700">Minority Members</h4>
                      <div className="space-y-2">
                        {minorityMembers.map((member, index) => (
                          <MemberCard key={member.bioguideId || index} member={member} congress={congress} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
      </div>
    </div>
  );
}