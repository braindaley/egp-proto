import { NextResponse } from 'next/server';
import { 
  getMockSessions, 
  getMockMasterList, 
  getMockSessionPeople, 
  getMockBill 
} from '@/lib/mock-legiscan-data';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');
  const stateCode = searchParams.get('state');
  const sessionId = searchParams.get('sessionId');
  const billId = searchParams.get('billId');
  const personId = searchParams.get('personId');
  const query = searchParams.get('query');

  // Add a small delay to simulate API response time
  await new Promise(resolve => setTimeout(resolve, 100));

  try {
    switch (action) {
      case 'sessions':
        const sessions = getMockSessions(stateCode || undefined);
        return NextResponse.json(sessions);

      case 'masterlist':
        if (!sessionId) {
          return NextResponse.json({ error: 'Session ID required for masterlist' }, { status: 400 });
        }
        const masterList = getMockMasterList(parseInt(sessionId));
        return NextResponse.json(masterList);

      case 'bill':
        if (!billId) {
          return NextResponse.json({ error: 'Bill ID required' }, { status: 400 });
        }
        const bill = getMockBill(parseInt(billId));
        return NextResponse.json(bill);

      case 'search':
        if (!query) {
          return NextResponse.json({ error: 'Query required for search' }, { status: 400 });
        }
        // Mock search results - in a real implementation, you'd search through bills
        return NextResponse.json({
          status: 'success',
          data: {
            status: 'OK',
            searchresult: []
          }
        });

      case 'recent':
        // Mock recent bills - return some recent bills from California
        const recentBills = getMockMasterList(2172);
        return NextResponse.json(recentBills);

      case 'session-people':
        if (!sessionId) {
          return NextResponse.json({ error: 'Session ID required for session-people' }, { status: 400 });
        }
        const sessionPeople = getMockSessionPeople(parseInt(sessionId));
        return NextResponse.json(sessionPeople);

      case 'person':
        if (!personId) {
          return NextResponse.json({ error: 'Person ID required for person' }, { status: 400 });
        }
        // Mock person data
        return NextResponse.json({
          status: 'success',
          data: {
            status: 'OK',
            person: {
              people_id: parseInt(personId),
              name: 'John Doe',
              party: 'D',
              role: 'Assembly Member',
              district: 'District 1'
            }
          }
        });

      case 'dataset':
        if (!sessionId) {
          return NextResponse.json({ error: 'Session ID required for dataset' }, { status: 400 });
        }
        // Mock dataset - return empty as datasets require special access
        return NextResponse.json({
          status: 'error',
          error: 'Dataset access not available in mock mode'
        });

      case 'states':
        // Return available state mappings
        return NextResponse.json({
          status: 'success',
          data: {
            'AL': 1, 'AK': 2, 'AZ': 3, 'AR': 4, 'CA': 5, 'CO': 6,
            'CT': 7, 'DE': 8, 'FL': 10, 'GA': 11, 'HI': 12, 'ID': 13,
            'IL': 14, 'IN': 15, 'IA': 16, 'KS': 17, 'KY': 18, 'LA': 19,
            'ME': 20, 'MD': 21, 'MA': 22, 'MI': 23, 'MN': 24, 'MS': 25,
            'MO': 26, 'MT': 27, 'NE': 28, 'NV': 29, 'NH': 30, 'NJ': 31,
            'NM': 32, 'NY': 33, 'NC': 34, 'ND': 35, 'OH': 36, 'OK': 37,
            'OR': 38, 'PA': 39, 'RI': 40, 'SC': 41, 'SD': 42, 'TN': 43,
            'TX': 44, 'UT': 45, 'VT': 46, 'VA': 47, 'WA': 48, 'WV': 49,
            'WI': 50, 'WY': 51
          }
        });

      default:
        return NextResponse.json({
          error: 'Invalid action',
          availableActions: ['sessions', 'masterlist', 'bill', 'search', 'recent', 'session-people', 'person', 'dataset', 'states'],
          examples: {
            sessions: '/api/legiscan?action=sessions&state=CA',
            masterlist: '/api/legiscan?action=masterlist&sessionId=2172',
            bill: '/api/legiscan?action=bill&billId=1893344',
            search: '/api/legiscan?action=search&query=immigration',
            recent: '/api/legiscan?action=recent&state=CA',
            'session-people': '/api/legiscan?action=session-people&sessionId=2172',
            person: '/api/legiscan?action=person&personId=30001',
            dataset: '/api/legiscan?action=dataset&sessionId=2172',
            states: '/api/legiscan?action=states'
          }
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Mock API error:', error);
    return NextResponse.json({
      status: 'error',
      error: {
        message: 'Mock API error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}