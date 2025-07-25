'use client';

import type { Member } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, MapPin, Phone, Building2, User, Clock } from 'lucide-react';

interface MemberCardProps {
  member: Member;
  congress: string;
}

function calculateYearsOfService(firstTermStartYear: number): number {
  const currentYear = new Date().getFullYear();
  return Math.max(1, currentYear - firstTermStartYear);
}

function getCurrentTerm(member: Member) {
  if (!member.terms?.item) return null;
  // Sort by startYear descending to get the most recent term
  const sortedTerms = [...member.terms.item].sort((a, b) => b.startYear - a.startYear);
  return sortedTerms[0];
}

function getFirstTerm(member: Member) {
  if (!member.terms?.item) return null;
  // Sort by startYear ascending to get the earliest term
  const sortedTerms = [...member.terms.item].sort((a, b) => a.startYear - b.startYear);
  return sortedTerms[0];
}

function isCurrentlyServing(member: Member): boolean {
  const currentTerm = getCurrentTerm(member);
  if (!currentTerm) return false;
  
  const currentYear = new Date().getFullYear();
  return !member.deathDate && (!currentTerm.endYear || currentTerm.endYear >= currentYear);
}

function getLeadershipPosition(member: Member): string | null {
  // Note: Leadership positions aren't directly in the API data
  // You might need to maintain a separate mapping or get this from additional API calls
  const name = member.name?.toLowerCase() || '';
  
  // Example mapping - you'd need to update this based on current leadership
  if (name.includes('mccarthy') || name.includes('johnson, mike')) return 'Speaker of the House';
  if (name.includes('mcconnell')) return 'Senate Minority Leader';
  if (name.includes('schumer')) return 'Senate Majority Leader';
  if (name.includes('jeffries')) return 'House Minority Leader';
  
  return null;
}

export function MemberCard({ member, congress }: MemberCardProps) {
  const currentTerm = getCurrentTerm(member);
  const firstTerm = getFirstTerm(member);
  const yearsOfService = firstTerm ? calculateYearsOfService(firstTerm.startYear) : 0;
  const currentlyServing = isCurrentlyServing(member);
  const leadershipPosition = getLeadershipPosition(member);
  
  const partyColor = member.partyName === 'Democratic' || member.partyName === 'Democrat'
    ? 'bg-blue-600' 
    : member.partyName === 'Republican' 
    ? 'bg-red-600' 
    : 'bg-gray-500';

  const chamberDisplay = currentTerm?.chamber === 'Senate' ? 'Senator' : 'Representative';
  const locationDisplay = `${member.state}${member.district ? ` (District ${member.district})` : ''}`;

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-6">
        {/* Header with Photo and Basic Info */}
        <div className="flex items-start gap-4 mb-4">
          <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200 flex-shrink-0">
            <Image
              src={member.depiction?.imageUrl || 'https://placehold.co/300x300.png'}
              alt={member.name}
              fill
              sizes="64px"
              className="object-cover"
              data-ai-hint="portrait person"
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-gray-900 truncate mb-1">
              <Link href={`/congress/${congress}/member/${member.bioguideId}`} className="hover:underline">
                {member.name}
              </Link>
            </h3>
            
            <div className="flex items-center gap-2 mb-2">
              <Badge className={`text-white text-xs ${partyColor}`}>
                {member.partyName === 'Democratic' || member.partyName === 'Democrat' ? 'D' : member.partyName === 'Republican' ? 'R' : member.partyName?.charAt(0)}
              </Badge>
              <span className="text-sm text-gray-600">{chamberDisplay}</span>
            </div>
            
            <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
              <MapPin className="w-3 h-3" />
              <span>{locationDisplay}</span>
            </div>
          </div>
        </div>

        {/* Leadership Position (if any) */}
        {leadershipPosition && (
          <div className="mb-3">
            <Badge variant="outline" className="text-xs font-medium text-purple-700 border-purple-200">
              {leadershipPosition}
            </Badge>
          </div>
        )}

        {/* Service Information */}
        <div className="space-y-2 mb-4">
          {/* Current Term */}
          {currentTerm && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Calendar className="w-3 h-3" />
              <span className="font-medium">Current Term:</span>
              <span>{currentTerm.startYear}{currentTerm.endYear ? ` - ${currentTerm.endYear}` : ' - Present'}</span>
            </div>
          )}
          
          {/* Years of Service */}
          {yearsOfService > 0 && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Clock className="w-3 h-3" />
              <span className="font-medium">Service:</span>
              <span>{yearsOfService} year{yearsOfService !== 1 ? 's' : ''}</span>
            </div>
          )}
          
          {/* Service Status */}
          <div className="flex items-center gap-1 text-sm">
            <User className="w-3 h-3" />
            <span className="font-medium">Status:</span>
            <Badge 
              variant={currentlyServing ? "default" : "secondary"} 
              className="text-xs"
            >
              {currentlyServing ? 'Currently Serving' : 'Former Member'}
            </Badge>
          </div>
        </div>

        {/* Contact Information */}
        {(currentTerm?.phone || currentTerm?.office) && (
          <div className="border-t pt-3 mb-4 space-y-1">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Contact</h4>
            
            {currentTerm.office && (
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Building2 className="w-3 h-3" />
                <span className="truncate">{currentTerm.office}</span>
              </div>
            )}
            
            {currentTerm.phone && (
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Phone className="w-3 h-3" />
                <span>{currentTerm.phone}</span>
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <Button asChild className="w-full" size="sm">
          <Link href={`/congress/${congress}/member/${member.bioguideId}`}>
            View Details
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
