import { NextResponse, type NextRequest } from 'next/server';

interface CandidateTotalsResponse {
    cycle: number;
    receipts: number;
    disbursements: number;
    cash_on_hand_end_period: number;
    debts_owed_by_committee: number;
    individual_itemized_contributions: number;
    individual_unitemized_contributions: number;
    other_political_committee_contributions: number;
    candidate_contribution: number;
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
        const totalsUrl = `https://api.open.fec.gov/v1/candidate/${fecId}/totals/?api_key=${API_KEY}&sort=-cycle&per_page=1`;

        const totalsRes = await fetch(totalsUrl);

        if (!totalsRes.ok) {
            console.error('Failed to fetch from OpenFEC API', {
                totalsStatus: totalsRes.status
            });
            return NextResponse.json({ error: 'Failed to fetch data from OpenFEC' }, { status: 502 });
        }

        const totalsData = await totalsRes.json();

        if (!totalsData.results || totalsData.results.length === 0) {
            return NextResponse.json({ error: 'No financial data available' }, { status: 404 });
        }

        const totalsResult: CandidateTotalsResponse = totalsData.results[0];

        // Calculate "other" contributions
        const largeContributions = totalsResult.individual_itemized_contributions || 0;
        const smallContributions = totalsResult.individual_unitemized_contributions || 0;
        const pacContributions = totalsResult.other_political_committee_contributions || 0;
        const candidateContributions = totalsResult.candidate_contribution || 0;
        const totalReceipts = totalsResult.receipts || 0;

        const otherContributions = Math.max(0,
            totalReceipts - largeContributions - smallContributions - pacContributions - candidateContributions
        );

        const responseData = {
            cycle: totalsResult.cycle,
            cash_on_hand: totalsResult.cash_on_hand_end_period || 0,
            debts: totalsResult.debts_owed_by_committee || 0,
            receipts: totalReceipts,
            disbursements: totalsResult.disbursements || 0,
            large_contributions: largeContributions,
            small_contributions: smallContributions,
            pac_contributions: pacContributions,
            candidate_contributions: candidateContributions,
            other_contributions: otherContributions,
        };

        return NextResponse.json(responseData);

    } catch (error) {
        console.error('Error fetching FEC totals data:', error);
        return NextResponse.json({ error: 'Internal server error while fetching FEC data' }, { status: 500 });
    }
}
