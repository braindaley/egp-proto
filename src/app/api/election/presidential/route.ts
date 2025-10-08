import { NextResponse, type NextRequest } from 'next/server';

// State name to State ID mapping
const STATE_ID_MAP: Record<string, string> = {
    'Alabama': '04000US01',
    'Alaska': '04000US02',
    'Arizona': '04000US04',
    'Arkansas': '04000US05',
    'California': '04000US06',
    'Colorado': '04000US08',
    'Connecticut': '04000US09',
    'Delaware': '04000US10',
    'Florida': '04000US12',
    'Georgia': '04000US13',
    'Hawaii': '04000US15',
    'Idaho': '04000US16',
    'Illinois': '04000US17',
    'Indiana': '04000US18',
    'Iowa': '04000US19',
    'Kansas': '04000US20',
    'Kentucky': '04000US21',
    'Louisiana': '04000US22',
    'Maine': '04000US23',
    'Maryland': '04000US24',
    'Massachusetts': '04000US25',
    'Michigan': '04000US26',
    'Minnesota': '04000US27',
    'Mississippi': '04000US28',
    'Missouri': '04000US29',
    'Montana': '04000US30',
    'Nebraska': '04000US31',
    'Nevada': '04000US32',
    'New Hampshire': '04000US33',
    'New Jersey': '04000US34',
    'New Mexico': '04000US35',
    'New York': '04000US36',
    'North Carolina': '04000US37',
    'North Dakota': '04000US38',
    'Ohio': '04000US39',
    'Oklahoma': '04000US40',
    'Oregon': '04000US41',
    'Pennsylvania': '04000US42',
    'Rhode Island': '04000US44',
    'South Carolina': '04000US45',
    'South Dakota': '04000US46',
    'Tennessee': '04000US47',
    'Texas': '04000US48',
    'Utah': '04000US49',
    'Vermont': '04000US50',
    'Virginia': '04000US51',
    'Washington': '04000US53',
    'West Virginia': '04000US54',
    'Wisconsin': '04000US55',
    'Wyoming': '04000US56',
};

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const state = searchParams.get('state');

    if (!state) {
        return NextResponse.json({ error: 'State parameter is required' }, { status: 400 });
    }

    const stateId = STATE_ID_MAP[state];
    if (!stateId) {
        return NextResponse.json({ error: 'Invalid state name' }, { status: 400 });
    }

    try {
        const url = `https://honolulu-api.datausa.io/tesseract/data.jsonrecords?cube=Data_USA_President_election&drilldowns=State,Year,Party&measures=Candidate+Votes,Total+Votes&State=${stateId}`;

        const response = await fetch(url);

        if (!response.ok) {
            return NextResponse.json({ error: 'Failed to fetch election data' }, { status: 502 });
        }

        const data = await response.json();

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching election data:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
