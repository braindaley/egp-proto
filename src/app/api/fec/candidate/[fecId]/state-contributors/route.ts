import { NextResponse, type NextRequest } from 'next/server';

interface StateContributorResponse {
    state: string;
    total: number;
}

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
        const currentYear = new Date().getFullYear();
        const cycles = [2024, 2022, 2020];

        // Try each FEC ID and cycle combination until we find data
        for (const id of fecIds) {
            for (const cycle of cycles) {
                const stateUrl = `https://api.open.fec.gov/v1/schedules/schedule_a/by_state/by_candidate/?api_key=${API_KEY}&candidate_id=${id}&cycle=${cycle}&sort=-total&per_page=5`;

                const stateRes = await fetch(stateUrl);

                if (!stateRes.ok) {
                    continue; // Try next combination
                }

                const stateData = await stateRes.json();

                if (stateData.results && stateData.results.length > 0) {
                    const stateContributors: StateContributorResponse[] = stateData.results.map((result: any) => ({
                        state: result.state || result.state_full || 'Unknown',
                        total: result.total || 0
                    }));

                    return NextResponse.json({
                        fec_id: id,
                        cycle,
                        state_totals: stateContributors
                    });
                }
            }
        }

        // No data found for any FEC ID/cycle combination
        return NextResponse.json({
            fec_id: fecIds[0],
            cycle: 2024,
            state_totals: []
        });

    } catch (error) {
        console.error('Error fetching state contributors:', error);
        return NextResponse.json({ error: 'Internal server error while fetching state contributors' }, { status: 500 });
    }
}
