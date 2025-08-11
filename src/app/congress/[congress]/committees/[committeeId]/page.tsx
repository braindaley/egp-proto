
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { use } from 'react';

interface CommitteeMember {
  bioguideId: string;
  name: string;
  party: string;
  state: string;
  district?: string;
  rank?: number;
  title?: string;
  url?: string;
}

interface Subcommittee {
  name: string;
  systemCode: string;
  url: string;
}

interface EnhancedCommitteeInfo {
  name: string;
  chamber: string;
  url?: string;
  chair?: CommitteeMember;
  rankingMember?: CommitteeMember;
  members: CommitteeMember[];
  subcommittees: Subcommittee[];
}

async function fetchCommitteeDetails(committeeId: string): Promise<EnhancedCommitteeInfo | null> {
  try {
    const res = await fetch(`/api/congress/committee/${committeeId}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch: ${res.status}`);
    }
    const data = await res.json();
    return data.committee;
  } catch (error) {
    console.error("Failed to fetch committee details:", error);
    return null;
  }
}

const CommitteeDetailPage = ({ params }: { params: { committeeId: string } }) => {
  const { committeeId } = params;
  const [committee, setCommittee] = useState<EnhancedCommitteeInfo | null>(null);

  useEffect(() => {
    fetchCommitteeDetails(committeeId).then(setCommittee);
  }, [committeeId]);

  if (!committee) {
    return <div className="container mx-auto p-4">Loading committee details...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{committee.name}</h1>
        <p className="text-lg text-gray-600">{committee.chamber} Committee</p>
        {committee.url && (
          <Button asChild variant="link" className="p-0">
            <a href={committee.url} target="_blank" rel="noopener noreferrer">Official Website</a>
          </Button>
        )}
      </div>

      <Separator className="my-6" />

      {/* Leadership */}
      <h2 className="text-2xl font-semibold mb-4">Leadership</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {committee.chair && <LeadershipCard member={committee.chair} title="Chairman" />}
        {committee.rankingMember && <LeadershipCard member={committee.rankingMember} title="Ranking Member" />}
      </div>

      <Separator className="my-6" />
      
      {/* Members */}
      <h2 className="text-2xl font-semibold mb-4">Members</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {committee.members?.filter(m => m.bioguideId).map(member => (
          <MemberCard key={member.bioguideId} member={member} />
        ))}
      </div>

      <Separator className="my-6" />

      {/* Subcommittees */}
      <h2 className="text-2xl font-semibold mb-4">Subcommittees</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {committee.subcommittees?.map(sub => (
            <Card key={sub.systemCode}>
                <CardHeader>
                    <CardTitle className="text-lg">{sub.name}</CardTitle>
                </CardHeader>
            </Card>
        ))}
      </div>
    </div>
  );
};

const LeadershipCard: React.FC<{ member: CommitteeMember; title: string }> = ({ member, title }) => (
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
                <Link href={`/congress/member/${member.bioguideId}`}>
                    <p className="text-xl font-bold hover:underline">{member.name}</p>
                </Link>
                <p className="text-xs text-gray-500">{member.party === 'R' ? 'Republican' : 'Democrat'}, {member.state}</p>
            </div>
        </div>
      </CardContent>
    </Card>
);

const MemberCard: React.FC<{ member: CommitteeMember }> = ({ member }) => (
    <Card className="flex items-center p-3">
      <Avatar className="h-12 w-12">
        <AvatarImage src={`https://www.congress.gov/img/member/${member.bioguideId?.toLowerCase()}_200.jpg`} />
        <AvatarFallback>{member.name?.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="ml-4">
        <Link href={`/congress/member/${member.bioguideId}`}>
          <p className="font-semibold text-sm hover:underline">{member.name}</p>
        </Link>
        <p className="text-xs text-gray-500">{member.party === 'R' ? 'Republican' : 'Democrat'}, {member.state} {member.district && `- ${member.district}`}</p>
      </div>
    </Card>
);

export default CommitteeDetailPage;
