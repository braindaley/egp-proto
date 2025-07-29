import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ExternalLink, Building, Globe, Phone, Users, Calendar, FileText, Crown, Award, ChevronRight } from 'lucide-react';
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
    const res = await fetch(url, { 
      next: { revalidate: 3600 },
      cache: 'force-cache'
    });
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

function MemberCard({ member, showTitle = true, congress }: { member: CommitteeMember; showTitle?: boolean; congress?: string }) {
  const partyColor = member.party === 'Republican' || member.party === 'R' ? 'bg-red-100 text-red-800' : 
                   member.party === 'Democratic' || member.party === 'Democrat' || member.party === 'D' ? 'bg-blue-100 text-blue-800' : 
                   'bg-gray-100 text-gray-800';

  // Generate internal member link
  const memberLink = congress && member.bioguideId && member.state ? 
    `/congress/${congress}/states/${member.state}/${member.bioguideId}` : 
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

// Default jurisdiction text for common committees
function getDefaultJurisdiction(committeeName: string): string {
  const name = committeeName.toLowerCase();
  
  if (name.includes('oversight') && name.includes('government reform')) {
    return "The Committee on Oversight and Government Reform has jurisdiction over federal government operations, efficiency, and accountability. It conducts investigations and oversight of executive branch agencies, federal regulations, and government waste, fraud, and abuse.";
  }
  if (name.includes('judiciary')) {
    return "The Committee on the Judiciary has jurisdiction over federal courts, administrative proceedings, immigration policy, bankruptcy, patents, copyrights, and constitutional amendments.";
  }
  if (name.includes('appropriations')) {
    return "The Committee on Appropriations has jurisdiction over discretionary spending and the federal budget process, reviewing and approving funding for government operations and programs.";
  }
  if (name.includes('armed services') || name.includes('defense')) {
    return "The Committee on Armed Services has jurisdiction over the Department of Defense, military operations, defense authorization, and national security matters.";
  }
  if (name.includes('foreign')) {
    return "The Committee on Foreign Affairs has jurisdiction over foreign policy, international relations, diplomatic operations, and foreign aid programs.";
  }
  
  return "The committee's jurisdiction and responsibilities include oversight and legislation within its designated policy areas.";
}

export default async function CommitteeDetailPage({ params }: { params: { congress: string, committeeId: string } }) {
  const { congress, committeeId } = await params;
  const committee = await getCommitteeDetails(congress, committeeId);

  if (!committee) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Committee Not Found</h2>
            <p className="text-muted-foreground">
              The requested committee could not be found or may no longer exist.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const chamber = committee.chamber;
  const office = committee.office;
  const phone = committee.phone;
  const website = committee.url;

  // Organize members by party
  const majorityMembers = (committee.members || []).filter(m => 
    m.party === 'Republican' || m.party === 'R'
  ).sort((a, b) => (a.rank || 999) - (b.rank || 999));
  
  const minorityMembers = (committee.members || []).filter(m => 
    m.party === 'Democratic' || m.party === 'Democrat' || m.party === 'D'
  ).sort((a, b) => (a.rank || 999) - (b.rank || 999));

  // Use committee jurisdiction or generate default
  const jurisdictionText = committee.jurisdiction || getDefaultJurisdiction(committee.name);

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-12">
        <p className="text-lg text-muted-foreground font-medium mb-1">{congress}th Congress</p>
        <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-2">
          {committee.name}
        </h1>
        <div className="flex flex-wrap gap-2 mt-4">
          <Badge variant="secondary" className="capitalize">{chamber}</Badge>
          <Badge variant="outline">{committee.committeeType} Committee</Badge>
          {committee.membershipStats && committee.membershipStats.totalMembers > 0 && (
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
              <p className="text-muted-foreground mb-4">
                {jurisdictionText}
              </p>
              
              {/* Leadership */}
              {(committee.chair || committee.rankingMember) && (
                <div className="mt-6">
                  <h4 className="font-semibold mb-3">Leadership</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {committee.chair && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-muted-foreground">Chair</h5>
                        <MemberCard member={committee.chair} showTitle={false} congress={congress} />
                      </div>
                    )}
                    {committee.rankingMember && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-muted-foreground">Ranking Member</h5>
                        <MemberCard member={committee.rankingMember} showTitle={false} congress={congress} />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {website && (
                <Button variant="outline" className="mt-4" asChild>
                  <a href={website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2">
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
                    <div key={subcommittee.systemCode || index} className="space-y-3">
                      {index > 0 && <Separator />}
                      <div>
                        <h4 className="font-semibold text-lg">{subcommittee.name}</h4>
                        
                        {/* Subcommittee Leadership */}
                        {(subcommittee.chair || subcommittee.rankingMember) && (
                          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {subcommittee.chair && (
                              <div className="space-y-2">
                                <h5 className="text-sm font-medium text-muted-foreground">Chair</h5>
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
                        )}
                        
                        {/* Member count */}
                        {subcommittee.members && subcommittee.members.length > 0 && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {subcommittee.members.length} member{subcommittee.members.length !== 1 ? 's' : ''}
                          </p>
                        )}

                        {/* Link to subcommittee if available */}
                        <div className="flex gap-2 mt-2">
                          <a 
                            href={`/congress/${congress}/committees/${committee.systemCode}/subcommittees/${subcommittee.systemCode}`}
                            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                          >
                            View Subcommittee <ChevronRight className="h-3 w-3" />
                          </a>
                          {subcommittee.url && (
                            <a 
                              href={subcommittee.url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
                            >
                              Official Page <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Activity */}
          {((committee.recentMeetings && committee.recentMeetings.length > 0) || (committee.recentReports && committee.recentReports.length > 0)) && (
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
                      {committee.recentMeetings.slice(0, 3).map((meeting, index) => (
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
                )}

                {/* Recent Reports */}
                {committee.recentReports && committee.recentReports.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Recent Reports
                    </h4>
                    <div className="space-y-3">
                      {committee.recentReports.slice(0, 3).map((report, index) => (
                        <div key={report.citation || index} className="border-l-2 border-primary/20 pl-4 space-y-1">
                          <h5 className="font-medium text-sm">
                            {report.url ? (
                              <a href={report.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                {report.title}
                              </a>
                            ) : (
                              report.title
                            )}
                          </h5>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            {report.citation && <span>{report.citation}</span>}
                            {report.date && <span>{formatDate(report.date)}</span>}
                            {report.type && <Badge variant="outline" className="text-xs">{report.type}</Badge>}
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
                <div className="flex items-start gap-3">
                  <Building className="h-5 w-5 text-muted-foreground mt-1" />
                  <div>
                    <h4 className="font-semibold">Office</h4>
                    <p className="text-muted-foreground">
                      Contact information available on the official committee website
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
          {committee.members && committee.members.length > 0 && committee.membershipStats && (
            <Card>
              <CardHeader>
                <CardTitle>Committee Membership</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-red-600">{committee.membershipStats.majorityMembers}</p>
                    <p className="text-sm text-muted-foreground">Majority (Republican)</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-blue-600">{committee.membershipStats.minorityMembers}</p>
                    <p className="text-sm text-muted-foreground">Minority (Democratic)</p>
                  </div>
                </div>

                <Separator />

                {/* Member Lists */}
                <div className="space-y-4">
                  {majorityMembers.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 text-red-700">Majority Members</h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {majorityMembers.map((member, index) => (
                          <MemberCard key={member.bioguideId || index} member={member} congress={congress} />
                        ))}
                      </div>
                    </div>
                  )}

                  {minorityMembers.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 text-blue-700">Minority Members</h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
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