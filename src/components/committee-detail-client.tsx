
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ExternalLink, Building, Phone, Calendar, Users, FileText, MessageSquare, ChevronRight, Youtube } from 'lucide-react';
import type { EnhancedCommitteeInfo, CommitteeMember } from '@/types';

const LeadershipCard: React.FC<{ member: CommitteeMember; title: string; congress?: string }> = ({ member, title, congress }) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center">
            <Avatar className="h-16 w-16">
                <AvatarImage src={`https://www.congress.gov/img/member/${member.bioguideId?.toLowerCase()}_200.jpg`} />
                <AvatarFallback>{member.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="ml-4">
                <Link href={congress && member.state ? `/federal/congress/${congress}/states/${member.state.toLowerCase()}/${member.bioguideId}` : `/federal/congress/member/${member.bioguideId}`}>
                    <p className="text-xl font-bold hover:underline">{member.name}</p>
                </Link>
                <p className="text-xs text-gray-500">{member.party === 'R' ? 'Republican' : 'Democrat'}, {member.state}</p>
            </div>
        </div>
      </CardContent>
    </Card>
);

const MemberCard: React.FC<{ member: CommitteeMember; congress?: string; chamber?: string }> = ({ member, congress, chamber }) => {
  const partyColor = member.party === 'Republican' || member.party === 'R' ? 'bg-red-100 text-red-800' : 
                     member.party === 'Democratic' || member.party === 'Democrat' || member.party === 'D' ? 'bg-blue-100 text-blue-800' : 
                     'bg-gray-100 text-gray-800';
  
  const partyAbbr = member.party === 'Republican' || member.party === 'R' ? 'R' : 
                    member.party === 'Democratic' || member.party === 'Democrat' || member.party === 'D' ? 'D' : 
                    member.party?.charAt(0) || '?';

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <h4 className="font-semibold text-sm">
              <Link href={congress && member.state ? `/congress/${congress}/states/${member.state.toLowerCase()}/${member.bioguideId}` : `/congress/member/${member.bioguideId}`} 
                    className="text-primary hover:underline">
                {member.name}
              </Link>
            </h4>
            <p className="text-sm text-muted-foreground">{member.state}{member.district ? ` - District ${member.district}` : ''}</p>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs font-medium text-primary">{member.title || (chamber === 'Senate' ? 'Senator' : 'Representative')}</span>
            </div>
          </div>
          <Badge className={`${partyColor}`}>
            {partyAbbr}
          </Badge>
        </div>
      </div>
    </div>
  );
};

export function CommitteeDetailClient({ committee, congress }: { committee: EnhancedCommitteeInfo; congress?: string }) {
  if (!committee) {
    return <div className="container mx-auto p-4">Committee details not available.</div>;
  }

  // Access congressApiData for enhanced information
  const congressData = (committee as any).congressApiData;
  const establishedDate = congressData?.establishedDate;
  const jurisdiction = congressData?.jurisdiction || (committee as any).jurisdiction;
  const phone = (committee as any).phone;
  const address = (committee as any).address;
  const minorityUrl = (committee as any).minorityUrl;
  const youtubeId = (committee as any).youtubeId;
  const billCount = congressData?.billCount;
  const reportCount = congressData?.reportCount;
  const communicationCount = congressData?.communicationCount;
  const lastUpdated = congressData?.latestUpdate?.latestUpdateDate;
  
  // Get member party breakdown
  const allMembers = committee.members || [];
  const republicans = allMembers.filter(m => m.party === 'Republican' || m.party === 'R');
  const democrats = allMembers.filter(m => m.party === 'Democratic' || m.party === 'Democrat' || m.party === 'D');
  const chamber = committee.chamber;

  // Helper function to format dates
  const formatDate = (dateString: string): string => {
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
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-12">
        <p className="text-lg text-muted-foreground font-medium mb-1">{congress}th Congress</p>
        <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary mb-2">
          {committee.name}
        </h1>
        <p className="text-lg text-muted-foreground mb-4">
          {committee.chamber} Committee
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="capitalize">{committee.chamber}</Badge>
          <Badge variant="outline">Standing Committee</Badge>
          {establishedDate && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Est. {new Date(establishedDate).getFullYear()}
            </Badge>
          )}
          {committee.members?.length > 0 && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {committee.members.length} Members
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
              {jurisdiction || "Committee jurisdiction and responsibilities information."}
            </p>
            
            {/* Leadership */}
            {(committee.chair || committee.rankingMember) && (
              <div className="mt-6">
                <h4 className="font-semibold mb-3">Leadership</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {committee.chair && (
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-muted-foreground">Committee Chair</h5>
                      <LeadershipCard member={committee.chair} title="Chairman" congress={congress} />
                    </div>
                  )}
                  {committee.rankingMember && (
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-muted-foreground">Ranking Member</h5>
                      <LeadershipCard member={committee.rankingMember} title="Ranking Member" congress={congress} />
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 mt-4">
              {committee.url && (
                <Button asChild variant="outline">
                  <a href={committee.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Official Website
                  </a>
                </Button>
              )}
              {minorityUrl && (
                <Button asChild variant="outline">
                  <a href={minorityUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Minority Website
                  </a>
                </Button>
              )}
              {youtubeId && (
                <Button asChild variant="outline">
                  <a href={`https://youtube.com/channel/${youtubeId}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2">
                    <Youtube className="h-4 w-4" />
                    YouTube
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Committee Statistics */}
        {(billCount || reportCount || communicationCount) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Committee Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {billCount && (
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary">{billCount.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Bills</p>
                  </div>
                )}
                {reportCount && (
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary">{reportCount.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Reports</p>
                  </div>
                )}
                {communicationCount && (
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary">{communicationCount.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Communications</p>
                  </div>
                )}
              </div>
              {lastUpdated && (
                <p className="text-xs text-muted-foreground text-right mt-4">
                  Last updated: {new Date(lastUpdated).toLocaleDateString()}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        {(committee.recentMeetings && committee.recentMeetings.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
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
            </CardContent>
          </Card>
        )}

        {/* Contact Information */}
        {(address || phone) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {address && (
                <div className="flex items-start gap-3">
                  <Building className="h-5 w-5 text-muted-foreground mt-1" />
                  <div>
                    <h4 className="font-semibold">Address</h4>
                    <p className="text-muted-foreground">{address}</p>
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
            </CardContent>
          </Card>
        )}

        {/* Committee Membership */}
        {allMembers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Committee Membership</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-red-600">{republicans.length}</p>
                  <p className="text-sm text-muted-foreground">Majority (Republican)</p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-blue-600">{democrats.length}</p>
                  <p className="text-sm text-muted-foreground">Minority (Democratic)</p>
                </div>
              </div>

              <Separator />

              {/* Member Lists */}
              <div className="space-y-4">
                {republicans.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 text-red-700">Majority Members</h4>
                    <div className="space-y-2">
                      {republicans.map((member, index) => (
                        <MemberCard key={member.bioguideId || index} member={member} congress={congress} chamber={committee.chamber} />
                      ))}
                    </div>
                  </div>
                )}

                {democrats.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 text-blue-700">Minority Members</h4>
                    <div className="space-y-2">
                      {democrats.map((member, index) => (
                        <MemberCard key={member.bioguideId || index} member={member} congress={congress} chamber={committee.chamber} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Subcommittees */}
        <Card>
          <CardHeader>
            <CardTitle>Subcommittees</CardTitle>
            <p className="text-sm text-muted-foreground">Click on a subcommittee to view detailed information</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {committee.subcommittees?.map(sub => (
                <Card key={sub.systemCode} className="hover:shadow-md transition-shadow cursor-pointer group">
                  <Link href={`/federal/congress/${congress}/committees/${committee.systemCode || 'hsap00'}/${sub.systemCode}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                            {sub.name}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            Subcommittee
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
            {(!committee.subcommittees || committee.subcommittees.length === 0) && (
              <p className="text-muted-foreground text-center py-8">
                No subcommittees found for this committee.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
