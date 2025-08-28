import { NextResponse } from 'next/server';
import { createLegiscanConnector, LEGISCAN_STATE_IDS } from '@/lib/legiscan-connector';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');
  const stateCode = searchParams.get('state');
  const sessionId = searchParams.get('sessionId');
  const billId = searchParams.get('billId');
  const personId = searchParams.get('personId');
  const query = searchParams.get('query');
  const debug = searchParams.get('debug');

  try {
    const legiscan = createLegiscanConnector();

    switch (action) {
      case 'sessions':
        if (stateCode) {
          // Validate state code exists in our mapping (for validation only)
          const upperStateCode = stateCode.toUpperCase();
          if (!LEGISCAN_STATE_IDS[upperStateCode as keyof typeof LEGISCAN_STATE_IDS]) {
            return NextResponse.json({ error: 'Invalid state code' }, { status: 400 });
          }
          // Pass the state code directly to LegiScan API (not the state ID)
          const sessions = await legiscan.getSessions(upperStateCode);
          return NextResponse.json(sessions);
        } else {
          const allSessions = await legiscan.getSessions();
          return NextResponse.json(allSessions);
        }

      case 'masterlist':
        if (!sessionId) {
          return NextResponse.json({ error: 'Session ID required for masterlist' }, { status: 400 });
        }
        const masterList = await legiscan.getMasterList(parseInt(sessionId));
        return NextResponse.json(masterList);

      case 'bill':
        if (!billId) {
          return NextResponse.json({ error: 'Bill ID required' }, { status: 400 });
        }
        const bill = await legiscan.getBill(parseInt(billId));
        return NextResponse.json(bill);

      case 'search':
        if (!query) {
          return NextResponse.json({ error: 'Query required for search' }, { status: 400 });
        }
        const searchParams = {
          state: stateCode || undefined,
        };
        const searchResults = await legiscan.searchBills(query, searchParams);
        return NextResponse.json(searchResults);

      case 'recent':
        const recentParams = {
          state: stateCode || undefined,
          days: 7, // Default to last 7 days
        };
        const recentBills = await legiscan.getRecentBills(recentParams);
        return NextResponse.json(recentBills);

      case 'session-people':
        if (!sessionId) {
          return NextResponse.json({ error: 'Session ID required for session-people' }, { status: 400 });
        }
        const sessionPeople = await legiscan.getSessionPeople(parseInt(sessionId));
        return NextResponse.json(sessionPeople);

      case 'person':
        if (!personId) {
          return NextResponse.json({ error: 'Person ID required for person' }, { status: 400 });
        }
        const person = await legiscan.getPerson(parseInt(personId));
        return NextResponse.json(person);

      case 'states':
        // Return available state mappings
        return NextResponse.json({
          status: 'success',
          data: LEGISCAN_STATE_IDS,
        });

      default:
        return NextResponse.json({
          error: 'Invalid action',
          availableActions: ['sessions', 'masterlist', 'bill', 'search', 'recent', 'session-people', 'person', 'states'],
          examples: {
            sessions: '/api/legiscan?action=sessions&state=CA',
            masterlist: '/api/legiscan?action=masterlist&sessionId=1234',
            bill: '/api/legiscan?action=bill&billId=5678',
            search: '/api/legiscan?action=search&query=healthcare&state=CA',
            recent: '/api/legiscan?action=recent&state=CA',
            sessionPeople: '/api/legiscan?action=session-people&sessionId=1234',
            person: '/api/legiscan?action=person&personId=1234',
            states: '/api/legiscan?action=states',
          },
        }, { status: 400 });
    }
  } catch (error: any) {
    const errorResponse = {
      error: 'Legiscan API error',
      message: error.message,
      ...(debug && { stack: error.stack }),
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, ...params } = body;
    
    const legiscan = createLegiscanConnector();

    switch (action) {
      case 'bulk-search':
        const { queries, state } = params;
        if (!Array.isArray(queries)) {
          return NextResponse.json({ error: 'queries must be an array' }, { status: 400 });
        }

        const results = await Promise.all(
          queries.map(async (query: string) => {
            const result = await legiscan.searchBills(query, { state });
            return { query, result };
          })
        );

        return NextResponse.json({
          status: 'success',
          data: results,
        });

      default:
        return NextResponse.json({
          error: 'Invalid POST action',
          availableActions: ['bulk-search'],
        }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({
      error: 'Legiscan API error',
      message: error.message,
    }, { status: 500 });
  }
}