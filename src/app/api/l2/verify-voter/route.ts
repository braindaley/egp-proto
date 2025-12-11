import { NextRequest, NextResponse } from 'next/server';
import { verifyVoter } from '@/lib/l2-api';

/**
 * POST /api/l2/verify-voter
 *
 * Verifies a voter using the L2 Political API
 *
 * Request body:
 * - firstName: string (required)
 * - lastName: string (required)
 * - address: string (required)
 * - city?: string (optional)
 * - state?: string (optional)
 * - zipCode?: string (optional)
 * - phone?: string (optional, for refined search)
 * - dobMonth?: string (optional, for refined search)
 * - dobDay?: string (optional, for refined search)
 * - dobYear?: string (optional, for refined search)
 * - voterId?: string (optional, for refined search)
 *
 * Response:
 * - success: boolean
 * - matches: L2VoterRecord[] (array of matching voter records)
 * - error?: string (error message if failed)
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { firstName, lastName, address, city, state, zipCode, phone, dobMonth, dobDay, dobYear, voterId } = body;

        // Validate required fields
        if (!firstName || !lastName || !address) {
            return NextResponse.json(
                {
                    success: false,
                    matches: [],
                    error: 'Missing required fields: firstName, lastName, and address are required',
                },
                { status: 400 }
            );
        }

        // Validate field lengths
        if (firstName.length < 2) {
            return NextResponse.json(
                {
                    success: false,
                    matches: [],
                    error: 'First name must be at least 2 characters',
                },
                { status: 400 }
            );
        }

        if (lastName.length < 2) {
            return NextResponse.json(
                {
                    success: false,
                    matches: [],
                    error: 'Last name must be at least 2 characters',
                },
                { status: 400 }
            );
        }

        if (address.length < 10) {
            return NextResponse.json(
                {
                    success: false,
                    matches: [],
                    error: 'Address must be at least 10 characters',
                },
                { status: 400 }
            );
        }

        // Call L2 API to verify voter
        const result = await verifyVoter({
            firstName,
            lastName,
            address,
            city,
            state,
            zipCode,
            phone,
            dobMonth,
            dobDay,
            dobYear,
            voterId,
        });

        // Return the result
        return NextResponse.json(result);
    } catch (error) {
        console.error('Error in verify-voter API:', error);
        return NextResponse.json(
            {
                success: false,
                matches: [],
                error: 'Failed to verify voter',
            },
            { status: 500 }
        );
    }
}