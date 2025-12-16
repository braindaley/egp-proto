import { NextRequest, NextResponse } from 'next/server';

// State abbreviation to name mapping
const STATE_ABBREV_TO_NAME: Record<string, string> = {
    'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
    'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
    'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
    'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
    'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
    'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
    'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
    'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
    'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
    'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming',
    'DC': 'District of Columbia'
};

// Parse state from address string
function parseStateFromAddress(address: string): { stateCode: string | null; stateName: string | null } {
    // Try to find state abbreviation (e.g., "CA 92660" or ", CA,")
    const stateAbbrevMatch = address.match(/\b([A-Z]{2})\s*\d{5}|\b([A-Z]{2})\s*,|\,\s*([A-Z]{2})\b/i);
    if (stateAbbrevMatch) {
        const abbrev = (stateAbbrevMatch[1] || stateAbbrevMatch[2] || stateAbbrevMatch[3]).toUpperCase();
        if (STATE_ABBREV_TO_NAME[abbrev]) {
            return { stateCode: abbrev.toLowerCase(), stateName: STATE_ABBREV_TO_NAME[abbrev] };
        }
    }

    // Try to find full state name
    for (const [abbrev, name] of Object.entries(STATE_ABBREV_TO_NAME)) {
        if (address.toLowerCase().includes(name.toLowerCase())) {
            return { stateCode: abbrev.toLowerCase(), stateName: name };
        }
    }

    return { stateCode: null, stateName: null };
}

/**
 * GET /api/voter-registration
 *
 * Gets voter registration information using Google Civic Information API
 * Falls back to parsing state from address if API fails
 *
 * Query params:
 * - address: string (required) - Full address or city, state
 *
 * Response:
 * - registrationUrl: string | null - URL to register to vote
 * - confirmationUrl: string | null - URL to check registration status
 * - stateName: string | null - State name
 * - error?: string
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get('address');

    if (!address) {
        return NextResponse.json(
            { error: 'Address is required' },
            { status: 400 }
        );
    }

    // Parse state from address as fallback
    const parsedState = parseStateFromAddress(address);

    const apiKey = process.env.GOOGLE_CIVIC_API_KEY || process.env.GOOGLE_GENAI_API_KEY;

    if (!apiKey) {
        console.error('Google API key not configured');
        // Return fallback with parsed state
        return NextResponse.json({
            registrationUrl: parsedState.stateCode
                ? `https://vote.org/register-to-vote/${parsedState.stateCode}/`
                : 'https://vote.org/register-to-vote/',
            confirmationUrl: parsedState.stateCode
                ? `https://vote.org/am-i-registered-to-vote/${parsedState.stateCode}/`
                : 'https://vote.org/am-i-registered-to-vote/',
            stateName: parsedState.stateName,
            fallback: true,
        });
    }

    try {
        const encodedAddress = encodeURIComponent(address);

        // First, try representatives endpoint to get state info (works with most API keys)
        const repInfoUrl = `https://www.googleapis.com/civicinfo/v2/representatives?key=${apiKey}&address=${encodedAddress}`;
        const repInfoResponse = await fetch(repInfoUrl);

        let stateCode: string | null = parsedState.stateCode;
        let stateName: string | null = parsedState.stateName;

        if (repInfoResponse.ok) {
            const repData = await repInfoResponse.json();
            const apiStateName = repData.normalizedInput?.state || null;
            if (apiStateName) {
                stateName = STATE_ABBREV_TO_NAME[apiStateName] || apiStateName;
                stateCode = apiStateName.toLowerCase();
            }
            console.log('Google Civic representatives found state:', stateName);
        } else {
            console.log('Google Civic API representatives error:', repInfoResponse.status, '- using parsed state:', parsedState.stateName);
        }

        // Try to get election-specific voter info for official registration URL
        const electionsUrl = `https://www.googleapis.com/civicinfo/v2/elections?key=${apiKey}`;
        const electionsResponse = await fetch(electionsUrl);

        if (electionsResponse.ok) {
            const electionsData = await electionsResponse.json();
            const electionId = electionsData.elections?.[0]?.id || '2000';

            const voterInfoUrl = `https://www.googleapis.com/civicinfo/v2/voterinfo?key=${apiKey}&address=${encodedAddress}&electionId=${electionId}`;
            const voterInfoResponse = await fetch(voterInfoUrl);

            if (voterInfoResponse.ok) {
                const voterInfoData = await voterInfoResponse.json();
                const stateInfo = voterInfoData.state?.[0];
                const electionAdmin = stateInfo?.electionAdministrationBody;

                const registrationUrl = electionAdmin?.electionRegistrationUrl ||
                    stateInfo?.local_jurisdiction?.electionAdministrationBody?.electionRegistrationUrl;

                const confirmationUrl = electionAdmin?.electionRegistrationConfirmationUrl ||
                    stateInfo?.local_jurisdiction?.electionAdministrationBody?.electionRegistrationConfirmationUrl;

                const voterStateName = stateInfo?.name || voterInfoData.normalizedInput?.state;

                if (registrationUrl) {
                    return NextResponse.json({
                        registrationUrl,
                        confirmationUrl: confirmationUrl || 'https://vote.org/am-i-registered-to-vote/',
                        stateName: voterStateName || stateName || null,
                        fallback: false,
                    });
                }
            }
        } else {
            console.log('Google Civic API elections error:', electionsResponse.status, '- using state-specific fallback');
        }

        // Fall back to state-specific vote.org URL if we have state info
        return NextResponse.json({
            registrationUrl: stateCode
                ? `https://vote.org/register-to-vote/${stateCode}/`
                : 'https://vote.org/register-to-vote/',
            confirmationUrl: stateCode
                ? `https://vote.org/am-i-registered-to-vote/${stateCode}/`
                : 'https://vote.org/am-i-registered-to-vote/',
            stateName: stateName || null,
            fallback: true,
        });
    } catch (error) {
        console.error('Error fetching voter registration info:', error);
        return NextResponse.json({
            registrationUrl: 'https://vote.org/register-to-vote/',
            confirmationUrl: 'https://vote.org/am-i-registered-to-vote/',
            stateName: null,
            fallback: true,
            error: 'Failed to fetch registration info',
        });
    }
}
