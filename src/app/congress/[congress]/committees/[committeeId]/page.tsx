import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ExternalLink, Building, Globe, Phone, Users, Calendar, FileText, User, Crown, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

interface CommitteeMember {
  bioguideId: string;
  name: string;
  party: string;
  state: string;
  district?: string;
  rank?: number;
  title?: string;
  url: string;
}

interface Subcommittee {
  name: string;
  systemCode: string;
  url: string;
  chair?: CommitteeMember;
  rankingMember?: CommitteeMember;
  members?: CommitteeMember[];
}

interface CommitteeMeeting {
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

interface CommitteeReport {
  citation: string;
  title: string;
  type: string;
  url: string;
  date: string;
}

interface EnhancedCommitteeInfo {
  name: string;
  systemCode: string;
  chamber: string;
  committeeType: string;
  url?: string;
  phone?: string;
  office?: string;
  jurisdiction?: string;
  chair?: CommitteeMember;
  rankingMember?: CommitteeMember;
  members: CommitteeMember[];
  subcommittees: Subcommittee[];
  recentMeetings: CommitteeMeeting[];
  recentReports: CommitteeReport[];
  membershipStats: {
    totalMembers: number;
    majorityMembers: number;
    minorityMembers: number;
  };
}

interface CommitteeDetailResponse {
  committee: EnhancedCommitteeInfo;
}

async function getCommitteeDetails(congress: string, committeeId: string): Promise<EnhancedCommitteeInfo | null> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
  const url = `${baseUrl}/api/congress/committee/${committeeId}?congress=${congress}`;

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) {
      console.error(`Failed to fetch committee details from internal API: ${res.status}`);
      return null;
    }
    const data: CommitteeDetailResponse = await res.json();
    return data.committee;
  } catch (error) {
    console.error("Error fetching committee details:", error);
    return null;
  }
}

function MemberCard({ member, showTitle = true }: { member: CommitteeMember; showTitle?: boolean }) {
  const partyColor = member.party === 'Republican' ? 'bg-red-100 text-red-800' : 
                   member.party === 'Democratic' ? 'bg-blue-100 text-blue-800' : 
                   'bg-gray-100 text-gray-800';

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <h4 className="font-semibold text-sm">{member.name}</h4>
            <p className="text-sm text-muted-foreground">
              {member.state}{member.district ? `-${member.district}` : ''}
            </p>
            {showTitle && member.title && (
              <div className="flex items-center gap-1 mt-1">
                {member.title.toLowerCase().includes('chair') && <Crown className="h-3 w-3 text-yellow-600" />}
                {member.title.toLowerCase().includes('ranking') && <Award className="h-3 w-3 text-gray-600" />}
                <span className="text-xs font-medium text-primary">{member.title}</span>
              </div>
            )}
          </div>
          <Badge variant="outline" className={partyColor}>
            {member.party.charAt(0)}
          </Badge>
        </div>
      </div>
    </div>
  );
}

function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
}

export default async function CommitteeDetailPage({ params }: { params: { congress: string, committeeId: string } }) {
  const { congress, committeeId } = await params;
  const committee = await getCommitteeDetails(congress, committeeId);

  if (!committee) {
    notFound();
  }

  const chamber = committee.chamber;
  const office = committee.office;
  const phone = committee.phone;
  const website = committee.url ? new URL(committee.url).origin : null;

  // Organize members by party
  const majorityMembers = (committee.members || []).filter(m => 
    chamber.toLowerCase() === 'house' ? m.party === 'Republican' : m.party === 'Republican'
  ).sort((a, b) => (a.rank || 999) - (b.rank || 999));
  
  const minorityMembers = (committee.members || []).filter(m => 
    chamber.toLowerCase() === 'house' ? m.party === 'Democratic' : m.party === 'Democratic'
  ).sort((a, b) => (a.rank || 999) - (b.rank || 999));

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-12">
        <p className="text-lg text-muted-foreground font-medium mb-1">{congress}th Congress</p>
        <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-2">
          {committee.name}
        </h1>
        <div className="flex flex-wrap gap-2 mt-4">
          <Badge variant="secondary">{chamber}</Badge>
          <Badge variant="outline">{committee.committeeType} Committee</Badge>
          {committee.membershipStats && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {committee.membershipStats.totalMembers} Members
            </Badge>
          )}
        </div>
      </header>

      <div className="space-y-8 max-w-4xl mx-auto">
          {/* About Section */}
          <Card>
            <CardHeader>
              <CardTitle>About This Committee</CardTitle>
            </CardHeader>
            <CardContent>
              {committee.jurisdiction ? (
                <p className="text-muted-foreground mb-4">
                  {committee.jurisdiction}
                </p>
              ) : (
                <p className="text-muted-foreground mb-4">
                  Detailed information about the committee's jurisdiction and responsibilities.
                </p>
              )}
              
              {/* Leadership */}
              {(committee.chair || committee.rankingMember) && (
                <div className="mt-6">
                  <h4 className="font-semibold mb-3">Leadership</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {committee.chair && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-muted-foreground">Chair</h5>
                        <MemberCard member={committee.chair} showTitle={false} />
                      </div>
                    )}
                    {committee.rankingMember && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-muted-foreground">Ranking Member</h5>
                        <MemberCard member={committee.rankingMember} showTitle={false} />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {committee.url && (
                <Button variant="outline" className="mt-4" asChild>
                  <a href={committee.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2">
                    Visit Official Committee Page <ExternalLink className="h-4 w-4"/>
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Subcommittees */}
          {committee.subcommittees && committee.subcommittees.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Subcommittees</CardTitle>
                <CardDescription>
                  {committee.subcommittees.length} subcommittee{committee.subcommittees.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {committee.subcommittees.map((subcommittee, index) => (
                    <div key={subcommittee.systemCode} className="space-y-3">
                      {index > 0 && <Separator />}
                      <div>
                        <h4 className="font-semibold text-lg">{subcommittee.name}</h4>
                        
                        {/* Subcommittee Leadership */}
                        {(subcommittee.chair || subcommittee.rankingMember) && (
                          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {subcommittee.chair && (
                              <div className="space-y-2">
                                <h5 className="text-sm font-medium text-muted-foreground">Chair</h5>
                                <MemberCard member={subcommittee.chair} showTitle={false} />
                              </div>
                            )}
                            {subcommittee.rankingMember && (
                              <div className="space-y-2">
                                <h5 className="text-sm font-medium text-muted-foreground">Ranking Member</h5>
                                <MemberCard member={subcommittee.rankingMember} showTitle={false} />
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Member count */}
                        {subcommittee.members && subcommittee.members.length > 0 && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {subcommittee.members.length} member{subcommittee.members.length !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Activity */}
          {(committee.recentMeetings && committee.recentMeetings.length > 0) || (committee.recentReports && committee.recentReports.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Recent Meetings */}
                {committee.recentMeetings && committee.recentMeetings.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Recent Meetings
                    </h4>
                    <div className="space-y-3">
                      {committee.recentMeetings.slice(0, 3).map((meeting) => (
                        <div key={meeting.eventId} className="border-l-2 border-primary/20 pl-4 space-y-1">
                          <h5 className="font-medium text-sm">{meeting.title}</h5>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{formatDate(meeting.date)}</span>
                            <Badge variant="outline" className="text-xs">{meeting.meetingType}</Badge>
                            {meeting.location?.room && (
                              <span>{meeting.location.building} {meeting.location.room}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Reports */}
                {committee.recentReports && committee.recentReports.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Recent Reports
                    </h4>
                    <div className="space-y-3">
                      {committee.recentReports.slice(0, 3).map((report) => (
                        <div key={report.citation} className="border-l-2 border-primary/20 pl-4 space-y-1">
                          <h5 className="font-medium text-sm">{report.title}</h5>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{report.citation}</span>
                            <span>{formatDate(report.date)}</span>
                            <Badge variant="outline" className="text-xs">{report.type}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                <p className="text-sm text-muted-foreground">Office location not available.</p>
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
          {committee.members && committee.members.length > 0 && committee.membershipStats && (
            <Card>
              <CardHeader>
                <CardTitle>Membership Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-red-600">{committee.membershipStats.majorityMembers}</p>
                    <p className="text-sm text-muted-foreground">Majority</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-blue-600">{committee.membershipStats.minorityMembers}</p>
                    <p className="text-sm text-muted-foreground">Minority</p>
                  </div>
                </div>

                <Separator />

                {/* Member Lists */}
                <div className="space-y-4">
                  {majorityMembers.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 text-red-700">Majority Members</h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {majorityMembers.map((member) => (
                          <MemberCard key={member.bioguideId} member={member} />
                        ))}
                      </div>
                    </div>
                  )}

                  {minorityMembers.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 text-blue-700">Minority Members</h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {minorityMembers.map((member) => (
                          <MemberCard key={member.bioguideId} member={member} />
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
