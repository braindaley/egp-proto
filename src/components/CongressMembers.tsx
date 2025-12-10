'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useMembersByZip } from '@/hooks/useMembersByZip';
import { useZipCode } from '@/hooks/use-zip-code';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface MemberWithImage {
  name: string;
  party: string;
  officeTitle: string;
  districtNumber?: number;
  bioguideId?: string;
  imageUrl?: string;
}

const CongressMembers: React.FC = () => {
  const { user } = useAuth();
  const { zipCode } = useZipCode();
  const { representatives, isLoading } = useMembersByZip(user?.zipCode || zipCode);
  const [membersWithImages, setMembersWithImages] = useState<MemberWithImage[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);

  useEffect(() => {
    const fetchMemberImages = async () => {
      if (!representatives || representatives.length === 0) {
        setMembersWithImages([]);
        return;
      }

      setLoadingImages(true);
      const updatedMembers = await Promise.all(
        representatives.map(async (rep) => {
          if (rep.bioguideId) {
            try {
              const response = await fetch(`/api/congress/member/${rep.bioguideId}`);
              if (response.ok) {
                const memberData = await response.json();
                return {
                  ...rep,
                  imageUrl: memberData.depiction?.imageUrl
                };
              }
            } catch (error) {
              console.error(`Failed to fetch image for ${rep.bioguideId}:`, error);
            }
          }
          return { ...rep, imageUrl: undefined };
        })
      );
      setMembersWithImages(updatedMembers);
      setLoadingImages(false);
    };

    fetchMemberImages();
  }, [representatives]);

  if (!user && !zipCode) {
    return null;
  }

  const getPartyColor = (party: string) => {
    if (party === 'Democrat' || party === 'Democratic' || party === 'D') {
      return 'bg-blue-600';
    } else if (party === 'Republican' || party === 'R') {
      return 'bg-red-600';
    }
    return 'bg-gray-600';
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ').filter(p => p.length > 0);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getPartyAbbreviation = (party: string) => {
    if (party === 'Democrat' || party === 'Democratic') return 'D';
    if (party === 'Republican') return 'R';
    return party.charAt(0).toUpperCase();
  };

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">My Congress Members</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading || loadingImages ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : !user?.zipCode && !zipCode ? (
          <p className="text-sm text-muted-foreground">Add your zip code to see your representatives</p>
        ) : membersWithImages.length === 0 ? (
          <p className="text-sm text-muted-foreground">No representatives found for your area</p>
        ) : (
          <>
            {membersWithImages.map((member, index) => {
              const title = member.officeTitle.includes('Senate') ? 'Senator' : 
                           member.officeTitle.includes('Representative') ? `Rep. - District ${member.districtNumber}` : 
                           member.officeTitle;
              
              return (
                <div key={`${member.bioguideId || index}`} className="flex items-center justify-between space-x-3">
                  <div className="flex items-center space-x-3 flex-1">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.imageUrl} alt={member.name} />
                      <AvatarFallback className="text-xs">
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{member.name}</p>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          className={`${getPartyColor(member.party)} text-white text-xs px-1.5 py-0`}
                        >
                          {getPartyAbbreviation(member.party)}
                        </Badge>
                        <span className="text-xs text-muted-foreground truncate">
                          {title}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default CongressMembers;