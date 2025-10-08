import { NextResponse, type NextRequest } from 'next/server';

interface IndividualContributorResponse {
    employer: string;
    total: number;
}

const EXCLUDE_EMPLOYERS = new Set([
    'RETIRED',
    'RETRIED',
    'SELF-EMPLOYED',
    'UNEMPLOYED',
    'HOMEMAKER',
    'NONE',
    'NULL',
    'N/A',
    'NOT EMPLOYED',
    'SELF',
]);

export async function GET(req: NextRequest, { params }: { params: { fecId: string } }) {
    const { fecId } = await params;
    const API_KEY = process.env.FEC_API_KEY;

    if (!fecId) {
        return NextResponse.json({ error: 'FEC Candidate ID is required' }, { status: 400 });
    }

    if (!API_KEY) {
        console.error('FEC_API_KEY is not set in environment variables.');
        return NextResponse.json({ error: 'Server configuration error: FEC API key not found' }, { status: 500 });
    }

    try {
        // Support multiple FEC IDs separated by comma
        const fecIds = fecId.split(',').map(id => id.trim()).filter(id => id);

        // Try multiple cycles: 2024, 2022, 2020
        const cycles = [2024, 2022, 2020];

        // Try each FEC ID and cycle combination until we find data
        for (const id of fecIds) {
            for (const cycle of cycles) {
                // Fetch top contributors by employer for this candidate
                const contributorsUrl = `https://api.open.fec.gov/v1/schedules/schedule_a/by_employer/?api_key=${API_KEY}&candidate_id=${id}&cycle=${cycle}&sort=-total&per_page=50`;

                const contributorsRes = await fetch(contributorsUrl);

                if (!contributorsRes.ok) {
                    continue; // Try next combination
                }

                const contributorsData = await contributorsRes.json();

                if (contributorsData.results && contributorsData.results.length > 0) {
                    // Filter out excluded employers
                    const filteredContributors: IndividualContributorResponse[] = [];

                    for (const result of contributorsData.results) {
                        const employer = (result.employer || '').trim().toUpperCase();

                        // Skip if employer is empty or in exclude list
                        if (!employer || EXCLUDE_EMPLOYERS.has(employer)) {
                            continue;
                        }

                        filteredContributors.push({
                            employer: result.employer,
                            total: result.total || 0
                        });

                        // Stop once we have 10
                        if (filteredContributors.length >= 10) {
                            break;
                        }
                    }

                    if (filteredContributors.length > 0) {
                        return NextResponse.json({
                            fec_id: id,
                            cycle,
                            top_contributors: filteredContributors
                        });
                    }
                }
            }
        }

        // No data found for any FEC ID/cycle combination
        return NextResponse.json({
            fec_id: fecIds[0],
            cycle: 2024,
            top_contributors: []
        });

    } catch (error) {
        console.error('Error fetching individual contributors:', error);
        return NextResponse.json({ error: 'Internal server error while fetching individual contributors' }, { status: 500 });
    }
}
