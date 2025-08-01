import { NextResponse, type NextRequest } from 'next/server';

interface CandidateDetail {
    candidate_id: string;
    name: string;
    party_full: string;
    incumbent_challenge_full: string;
    office_full: string;
    state: string;
    district: string;
    election_years: number[];
}

interface CandidateTotals {
    receipts: number;
    disbursements: number;
    cash_on_hand_end_period: number;
    debts_owed_by_committee: number;
}

export async function GET(req: NextRequest, { params }: { params: { fecId: string } }) {
    const { fecId } = params;
    const API_KEY = process.env.FEC_API_KEY;

    if (!fecId) {
        return NextResponse.json({ error: 'FEC Candidate ID is required' }, { status: 400 });
    }

    if (!API_KEY) {
        console.error('FEC_API_KEY is not set in environment variables.');
        return NextResponse.json({ error: 'Server configuration error: FEC API key not found' }, { status: 500 });
    }

    try {
        const candidateUrl = `https://api.open.fec.gov/v1/candidate/${fecId}/?api_key=${API_KEY}`;
        const totalsUrl = `https://api.open.fec.gov/v1/candidate/${fecId}/totals/?api_key=${API_KEY}`;

        const [candidateRes, totalsRes] = await Promise.all([
            fetch(candidateUrl),
            fetch(totalsUrl)
        ]);

        if (!candidateRes.ok || !totalsRes.ok) {
            console.error('Failed to fetch from OpenFEC API', {
                candidateStatus: candidateRes.status,
                totalsStatus: totalsRes.status
            });
            return NextResponse.json({ error: 'Failed to fetch data from OpenFEC' }, { status: 502 });
        }

        const candidateData = await candidateRes.json();
        const totalsData = await totalsRes.json();

        const candidateResult: CandidateDetail = candidateData.results[0];
        const totalsResult: CandidateTotals = totalsData.results[0];
        
        const responseData = {
            name: candidateResult.name,
            status: candidateResult.incumbent_challenge_full,
            office: candidateResult.office_full,
            district: `${candidateResult.state}-${candidateResult.district}`,
            party: candidateResult.party_full,
            total_receipts: totalsResult.receipts,
            total_disbursements: totalsResult.disbursements,
            cash_on_hand_end_period: totalsResult.cash_on_hand_end_period,
            debts_owed_by_committee: totalsResult.debts_owed_by_committee,
            election_years: candidateResult.election_years.sort((a, b) => b - a),
        };

        return NextResponse.json(responseData);

    } catch (error) {
        console.error('Error fetching FEC data:', error);
        return NextResponse.json({ error: 'Internal server error while fetching FEC data' }, { status: 500 });
    }
}
