
'use client';

import type { Member } from '@/types';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, MapPin, Phone, Building2, User, Clock, ExternalLink } from 'lucide-react';

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
  const currentYear = new Date().getFullYear();
  // Find a term that is currently active.
  const activeTerm = member.terms.item.find(term => term.startYear <= currentYear && term.endYear >= currentYear);
  if (activeTerm) return activeTerm;
  // Fallback to the most recent term if no strictly active one is found
  return [...member.terms.item].sort((a, b) => b.startYear - a.startYear)[0];
}

function getFirstTerm(member: Member) {
  if (!member.terms?.item || member.terms.item.length === 0) return null;
  // Sort by startYear ascending to get the earliest term
  return [...member.terms.item].sort((a, b) => a.startYear - b.startYear)[0];
}

function isCurrentlyServing(member: Member): boolean {
    // If member has died, they're not currently serving
    if (member.deathDate) return false;
    
    // Handle different terms data structures
    let termsArray: any[] = [];
    if (Array.isArray(member.terms)) {
        termsArray = member.terms;
    } else if (member.terms?.item && Array.isArray(member.terms.item)) {
        termsArray = member.terms.item;
    } else {
        return false;
    }
    
    if (termsArray.length === 0) return false;
    
    const currentYear = new Date().getFullYear();
    
    // Check if any term indicates current service
    return termsArray.some(term => {
        const hasStarted = term.startYear <= currentYear;
        // A member is currently serving if their term has no end date OR the end date is in the future.
        // If the end year is the current year, they are considered a former member.
        const stillServing = !term.endYear || 
                           term.endYear === null || 
                           term.endYear === undefined || 
                           term.endYear > currentYear;
        return hasStarted && stillServing;
    });
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
  const detailUrl = `/congress/${congress}/member/${member.bioguideId}`;
  
  const partyColor = member.partyName === 'Democratic' || member.partyName === 'Democrat'
    ? 'bg-blue-600' 
    : member.partyName === 'Republican' 
    ? 'bg-red-600' 
    : 'bg-gray-500';

  const chamberDisplay = currentTerm?.chamber === 'Senate' ? 'Senator' : 'Representative';
  const locationDisplay = `${member.state}${member.district ? ` (District ${member.district})` : ''}`;

  return (
    <Link href={detailUrl} className="flex h-full">
    <Card className="flex flex-col w-full hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-6 flex-grow">
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
                {member.name}
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
          <div className="border-t pt-3 space-y-1">
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
      </CardContent>

       {/* Footer */}
        <CardFooter className="mt-auto flex justify-end items-center text-xs text-muted-foreground pt-4 border-t">
            <div className="flex items-center gap-1 font-semibold text-primary">
                <span>Read More</span>
                <ExternalLink className="h-3.5 w-3.5" />
            </div>
        </CardFooter>
    </Card>
    </Link>
  );
}
