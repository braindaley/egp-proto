'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Representative {
    id: string;
    name: string;
    title: string;
    party: 'Democrat' | 'Republican' | 'Independent';
    imageUrl?: string;
    district?: string;
    state?: string;
}

// Mock data for representatives - from the screenshot
const representatives: Representative[] = [
    {
        id: '1',
        name: 'Ami Bera',
        title: 'Representative',
        party: 'Democrat',
        district: 'CA-06',
        state: 'California'
    },
    {
        id: '2',
        name: 'Julia Brownley',
        title: 'Representative',
        party: 'Democrat',
        district: 'CA-26',
        state: 'California'
    },
    {
        id: '3',
        name: 'Salud Carbajal',
        title: 'Representative',
        party: 'Democrat',
        district: 'CA-24',
        state: 'California'
    },
    {
        id: '4',
        name: 'Judy Chu',
        title: 'Representative',
        party: 'Democrat',
        district: 'CA-28',
        state: 'California'
    },
    {
        id: '5',
        name: 'Lou Correa',
        title: 'Representative',
        party: 'Democrat',
        district: 'CA-46',
        state: 'California'
    },
    {
        id: '6',
        name: 'Jim Costa',
        title: 'Representative',
        party: 'Democrat',
        district: 'CA-21',
        state: 'California'
    },
    {
        id: '7',
        name: 'Mark DeSaulnier',
        title: 'Representative',
        party: 'Democrat',
        district: 'CA-10',
        state: 'California'
    },
    {
        id: '8',
        name: 'Anna Eshoo',
        title: 'Representative',
        party: 'Democrat',
        district: 'CA-16',
        state: 'California'
    },
    {
        id: '9',
        name: 'John Garamendi',
        title: 'Representative',
        party: 'Democrat',
        district: 'CA-08',
        state: 'California'
    },
    {
        id: '10',
        name: 'Robert Garcia',
        title: 'Representative',
        party: 'Democrat',
        district: 'CA-42',
        state: 'California'
    },
    {
        id: '11',
        name: 'Jimmy Gomez',
        title: 'Representative',
        party: 'Democrat',
        district: 'CA-34',
        state: 'California'
    },
    {
        id: '12',
        name: 'Josh Harder',
        title: 'Representative',
        party: 'Democrat',
        district: 'CA-09',
        state: 'California'
    },
    {
        id: '13',
        name: 'Jared Huffman',
        title: 'Representative',
        party: 'Democrat',
        district: 'CA-02',
        state: 'California'
    },
    {
        id: '14',
        name: 'Sara Jacobs',
        title: 'Representative',
        party: 'Democrat',
        district: 'CA-51',
        state: 'California'
    },
    {
        id: '15',
        name: 'Sydney Kamlager-Dove',
        title: 'Representative',
        party: 'Democrat',
        district: 'CA-37',
        state: 'California'
    },
    {
        id: '16',
        name: 'Ro Khanna',
        title: 'Representative',
        party: 'Democrat',
        district: 'CA-17',
        state: 'California'
    },
    {
        id: '17',
        name: 'Young Kim',
        title: 'Representative',
        party: 'Republican',
        district: 'CA-40',
        state: 'California'
    },
    {
        id: '18',
        name: 'Doug LaMalfa',
        title: 'Representative',
        party: 'Republican',
        district: 'CA-01',
        state: 'California'
    },
    {
        id: '19',
        name: 'Barbara Lee',
        title: 'Representative',
        party: 'Democrat',
        district: 'CA-12',
        state: 'California'
    },
    {
        id: '20',
        name: 'Mike Levin',
        title: 'Representative',
        party: 'Democrat',
        district: 'CA-49',
        state: 'California'
    },
    {
        id: '21',
        name: 'Ted Lieu',
        title: 'Representative',
        party: 'Democrat',
        district: 'CA-36',
        state: 'California'
    },
    {
        id: '22',
        name: 'Zoe Lofgren',
        title: 'Representative',
        party: 'Democrat',
        district: 'CA-18',
        state: 'California'
    },
    {
        id: '23',
        name: 'Doris Matsui',
        title: 'Representative',
        party: 'Democrat',
        district: 'CA-07',
        state: 'California'
    },
    {
        id: '24',
        name: 'Kevin McCarthy',
        title: 'Representative',
        party: 'Republican',
        district: 'CA-20',
        state: 'California'
    },
    {
        id: '25',
        name: 'Tom McClintock',
        title: 'Representative',
        party: 'Republican',
        district: 'CA-05',
        state: 'California'
    },
    {
        id: '26',
        name: 'Mark Takano',
        title: 'Representative',
        party: 'Democrat',
        district: 'CA-39',
        state: 'California'
    },
    {
        id: '27',
        name: 'Grace Napolitano',
        title: 'Representative',
        party: 'Democrat',
        district: 'CA-31',
        state: 'California'
    },
    {
        id: '28',
        name: 'Jay Obernolte',
        title: 'Representative',
        party: 'Republican',
        district: 'CA-23',
        state: 'California'
    },
    {
        id: '29',
        name: 'Jimmy Panetta',
        title: 'Representative',
        party: 'Democrat',
        district: 'CA-19',
        state: 'California'
    },
    {
        id: '30',
        name: 'Nancy Pelosi',
        title: 'Representative',
        party: 'Democrat',
        district: 'CA-11',
        state: 'California'
    },
    {
        id: '31',
        name: 'Scott Peters',
        title: 'Representative',
        party: 'Democrat',
        district: 'CA-50',
        state: 'California'
    },
    {
        id: '32',
        name: 'Katie Porter',
        title: 'Representative',
        party: 'Democrat',
        district: 'CA-47',
        state: 'California'
    },
    {
        id: '33',
        name: 'Raul Ruiz',
        title: 'Representative',
        party: 'Democrat',
        district: 'CA-25',
        state: 'California'
    },
    {
        id: '34',
        name: 'Linda Sanchez',
        title: 'Representative',
        party: 'Democrat',
        district: 'CA-38',
        state: 'California'
    },
    {
        id: '35',
        name: 'Adam Schiff',
        title: 'Representative',
        party: 'Democrat',
        district: 'CA-30',
        state: 'California'
    },
    {
        id: '36',
        name: 'Brad Sherman',
        title: 'Representative',
        party: 'Democrat',
        district: 'CA-32',
        state: 'California'
    },
    {
        id: '37',
        name: 'Michelle Steel',
        title: 'Representative',
        party: 'Republican',
        district: 'CA-45',
        state: 'California'
    },
    {
        id: '38',
        name: 'Eric Swalwell',
        title: 'Representative',
        party: 'Democrat',
        district: 'CA-14',
        state: 'California'
    },
    {
        id: '39',
        name: 'Mark Takano',
        title: 'Representative',
        party: 'Democrat',
        district: 'CA-39',
        state: 'California'
    },
    {
        id: '40',
        name: 'Mike Thompson',
        title: 'Representative',
        party: 'Democrat',
        district: 'CA-04',
        state: 'California'
    },
    {
        id: '41',
        name: 'Norma Torres',
        title: 'Representative',
        party: 'Democrat',
        district: 'CA-35',
        state: 'California'
    },
    {
        id: '42',
        name: 'David Valadao',
        title: 'Representative',
        party: 'Republican',
        district: 'CA-22',
        state: 'California'
    },
    {
        id: '43',
        name: 'Juan Vargas',
        title: 'Representative',
        party: 'Democrat',
        district: 'CA-52',
        state: 'California'
    },
    {
        id: '44',
        name: 'Maxine Waters',
        title: 'Representative',
        party: 'Democrat',
        district: 'CA-43',
        state: 'California'
    },
];

function getPartyColor(party: string) {
    switch (party) {
        case 'Democrat':
            return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'Republican':
            return 'bg-red-100 text-red-800 border-red-200';
        case 'Independent':
            return 'bg-purple-100 text-purple-800 border-purple-200';
        default:
            return 'bg-gray-100 text-gray-800 border-gray-200';
    }
}

function getInitials(name: string) {
    const parts = name.split(' ');
    if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

function RepresentativeCard({ rep }: { rep: Representative }) {
    return (
        <Card className="overflow-hidden hover:shadow-md transition-shadow border">
            <CardContent className="p-4">
                <div className="flex items-start gap-4">
                    {/* Avatar on the left */}
                    <Avatar className="h-16 w-16 flex-shrink-0">
                        <AvatarImage src={rep.imageUrl} alt={rep.name} />
                        <AvatarFallback className="text-lg bg-muted">
                            {getInitials(rep.name)}
                        </AvatarFallback>
                    </Avatar>

                    {/* Info on the right */}
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base mb-1 truncate">{rep.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{rep.title}</p>

                        {/* Party Badge */}
                        <Badge variant="outline" className={`${getPartyColor(rep.party)} text-xs`}>
                            {rep.party.charAt(0)}
                        </Badge>

                        {/* District/State info */}
                        <div className="mt-2 text-xs text-muted-foreground">
                            {rep.district ? rep.district : rep.state}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default function ElectedOfficialsPage() {
    return (
        <div className="bg-background flex-1">
            <div className="container mx-auto px-4 py-6 md:py-12 max-w-7xl">
                {/* Header */}
                <header className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold mb-2">
                        Elected Officials
                    </h1>
                    <p className="text-muted-foreground">
                        Browse representatives and senators from across the country
                    </p>
                </header>

                {/* Representatives Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {representatives.map((rep) => (
                        <RepresentativeCard key={rep.id} rep={rep} />
                    ))}
                </div>
            </div>
        </div>
    );
}
