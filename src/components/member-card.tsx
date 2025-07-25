
import type { Member } from '@/types';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { User, Building, MapPin } from 'lucide-react';

export function MemberCard({ member, congress }: { member: Member, congress: string }) {
  const partyColor = member.partyName === 'Democrat' 
    ? 'bg-blue-600' 
    : member.partyName === 'Republican' 
    ? 'bg-red-600' 
    : 'bg-gray-500';

  const memberDetailUrl = `/congress/${congress}/member/${member.bioguideId}`;

  return (
    <Card className="flex flex-col overflow-hidden transition-shadow hover:shadow-lg">
      <CardHeader className="flex-row gap-4 items-start p-4 bg-muted/30">
        <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-primary/20 shrink-0">
          <Image
            src={member.depiction?.imageUrl || 'https://placehold.co/150x150.png'}
            alt={`Portrait of ${member.name}`}
            fill
            sizes="100px"
            className="object-cover"
            data-ai-hint="portrait person"
          />
        </div>
        <div className="flex-1">
          <CardTitle className="font-headline text-xl">
            <Link href={memberDetailUrl} className="hover:underline">
              {member.name}
            </Link>
          </CardTitle>
          <CardDescription className="text-sm">
            {member.partyName} - {member.state} {member.district ? `(District ${member.district})` : ''}
          </CardDescription>
           <Badge className={`mt-2 text-white ${partyColor}`}>{member.partyName}</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow space-y-3 text-sm">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Building className="h-4 w-4" />
          <span className="font-medium">{member.chamber}</span>
        </div>
        {member.terms.current && (
           <div className="flex items-center gap-3 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Serving since {new Date(member.terms.current.startYear).getFullYear()}</span>
            </div>
        )}
      </CardContent>
       <CardFooter className="p-4 bg-muted/30 border-t">
        <Link href={memberDetailUrl} className="text-sm font-semibold text-primary hover:underline">
          View Details
        </Link>
      </CardFooter>
    </Card>
  );
}
