// Mock data for LegiScan API responses
// This replaces the actual LegiScan integration for development

export const MOCK_SESSIONS_BY_STATE: Record<string, any[]> = {
  'CA': [
    {
      session_id: 2172,
      state_id: 5,
      state_abbr: 'CA',
      year_start: 2025,
      year_end: 2026,
      prefile: 0,
      sine_die: 0,
      prior: 0,
      special: 0,
      session_tag: 'Regular Session',
      session_title: '2025-2026 Regular Session',
      session_name: '2025-2026 Regular Session',
      name: '2025-2026 Regular Session'
    },
    {
      session_id: 2016,
      state_id: 5,
      state_abbr: 'CA',
      year_start: 2023,
      year_end: 2024,
      prefile: 0,
      sine_die: 1,
      prior: 0,
      special: 0,
      session_tag: 'Regular Session',
      session_title: '2023-2024 Regular Session',
      session_name: '2023-2024 Regular Session',
      name: '2023-2024 Regular Session'
    }
  ],
  'NY': [
    {
      session_id: 1950,
      state_id: 33,
      state_abbr: 'NY',
      year_start: 2025,
      year_end: 2026,
      prefile: 0,
      sine_die: 0,
      prior: 0,
      special: 0,
      session_tag: 'Regular Session',
      session_title: '2025-2026 Regular Session',
      session_name: '2025-2026 Regular Session',
      name: '2025-2026 Regular Session'
    }
  ],
  'TX': [
    {
      session_id: 2100,
      state_id: 44,
      state_abbr: 'TX',
      year_start: 2025,
      year_end: 2026,
      prefile: 0,
      sine_die: 0,
      prior: 0,
      special: 0,
      session_tag: 'Regular Session',
      session_title: '2025 Regular Session',
      session_name: '2025 Regular Session',
      name: '2025 Regular Session'
    }
  ],
  'FL': [
    {
      session_id: 2080,
      state_id: 10,
      state_abbr: 'FL',
      year_start: 2025,
      year_end: 2025,
      prefile: 0,
      sine_die: 0,
      prior: 0,
      special: 0,
      session_tag: 'Regular Session',
      session_title: '2025 Regular Session',
      session_name: '2025 Regular Session',
      name: '2025 Regular Session'
    }
  ]
};

export const MOCK_BILLS_BY_SESSION: Record<number, any> = {
  2172: { // California 2025-2026
    '0': {
      bill_id: 1893344,
      number: 'AB1',
      title: 'California Immigration Rights Act',
      description: 'An act to protect the rights of immigrants and provide pathways to citizenship for undocumented residents. This comprehensive legislation establishes state-level protections for immigrant communities and creates support programs.',
      status: 1,
      status_date: '2025-01-15',
      last_action: 'Introduced in Assembly',
      last_action_date: '2025-01-15',
      url: 'https://legiscan.com/CA/bill/AB1/2025'
    },
    '1': {
      bill_id: 1893345,
      number: 'AB2',
      title: 'Border Community Support Act',
      description: 'An act to provide funding and support for communities along the California-Mexico border, including immigration services and humanitarian assistance programs.',
      status: 2,
      status_date: '2025-02-01',
      last_action: 'Passed Assembly Committee',
      last_action_date: '2025-02-01',
      url: 'https://legiscan.com/CA/bill/AB2/2025'
    },
    '2': {
      bill_id: 1893346,
      number: 'SB1',
      title: 'Residential Property Insurance Reform',
      description: 'An act to reform residential property insurance regulations in high-risk areas, including wildfire and flood zones.',
      status: 1,
      status_date: '2025-01-10',
      last_action: 'Introduced in Senate',
      last_action_date: '2025-01-10',
      url: 'https://legiscan.com/CA/bill/SB1/2025'
    },
    '3': {
      bill_id: 1893347,
      number: 'AB3',
      title: 'Climate Action Investment Act',
      description: 'An act to establish a fund for climate resilience and clean energy investments throughout California.',
      status: 2,
      status_date: '2025-02-15',
      last_action: 'Amended in Committee',
      last_action_date: '2025-02-15',
      url: 'https://legiscan.com/CA/bill/AB3/2025'
    },
    '4': {
      bill_id: 1893348,
      number: 'SB2',
      title: 'Healthcare Access for Immigrants',
      description: 'An act to expand healthcare access for undocumented immigrants and asylum seekers in California.',
      status: 1,
      status_date: '2025-01-20',
      last_action: 'Introduced in Senate',
      last_action_date: '2025-01-20',
      url: 'https://legiscan.com/CA/bill/SB2/2025'
    },
    '5': {
      bill_id: 1893349,
      number: 'AB4',
      title: 'Criminal Justice Reform Act',
      description: 'An act to reform sentencing guidelines and expand rehabilitation programs in the California criminal justice system.',
      status: 1,
      status_date: '2025-01-25',
      last_action: 'Introduced in Assembly',
      last_action_date: '2025-01-25',
      url: 'https://legiscan.com/CA/bill/AB4/2025'
    },
    '6': {
      bill_id: 1893350,
      number: 'SB3',
      title: 'Educational Equity Act',
      description: 'An act to increase funding for schools in underserved communities and expand educational opportunities.',
      status: 2,
      status_date: '2025-02-05',
      last_action: 'Passed Senate Committee',
      last_action_date: '2025-02-05',
      url: 'https://legiscan.com/CA/bill/SB3/2025'
    },
    '7': {
      bill_id: 1893351,
      number: 'AB5',
      title: 'Technology Privacy Protection Act',
      description: 'An act to strengthen privacy protections for personal data and regulate artificial intelligence systems.',
      status: 1,
      status_date: '2025-02-10',
      last_action: 'Introduced in Assembly',
      last_action_date: '2025-02-10',
      url: 'https://legiscan.com/CA/bill/AB5/2025'
    },
    '8': {
      bill_id: 1893352,
      number: 'AB6',
      title: 'Labor Protection Enhancement Act',
      description: 'An act to strengthen worker protections and expand collective bargaining rights for all workers.',
      status: 1,
      status_date: '2025-01-30',
      last_action: 'Introduced in Assembly',
      last_action_date: '2025-01-30',
      url: 'https://legiscan.com/CA/bill/AB6/2025'
    },
    '9': {
      bill_id: 1893353,
      number: 'SB4',
      title: 'Mental Health Support Act',
      description: 'An act to expand mental health services and funding for community mental health programs.',
      status: 2,
      status_date: '2025-02-20',
      last_action: 'Passed Senate Committee',
      last_action_date: '2025-02-20',
      url: 'https://legiscan.com/CA/bill/SB4/2025'
    }
  },
  1950: { // New York 2025-2026
    '0': {
      bill_id: 2001001,
      number: 'A1',
      title: 'New York Immigration Protection Act',
      description: 'An act to establish sanctuary protections for immigrants and limit cooperation with federal immigration enforcement.',
      status: 1,
      status_date: '2025-01-10',
      last_action: 'Introduced in Assembly',
      last_action_date: '2025-01-10',
      url: 'https://legiscan.com/NY/bill/A1/2025'
    },
    '1': {
      bill_id: 2001002,
      number: 'S1',
      title: 'Housing Affordability Crisis Act',
      description: 'An act to address the housing affordability crisis in New York through rent stabilization and affordable housing development.',
      status: 2,
      status_date: '2025-01-20',
      last_action: 'Passed Senate Committee',
      last_action_date: '2025-01-20',
      url: 'https://legiscan.com/NY/bill/S1/2025'
    }
  }
};

export const MOCK_LEGISLATORS_BY_SESSION: Record<number, any[]> = {
  2172: [ // California 2025-2026
    {
      people_id: 30001,
      name: 'Maria Rodriguez',
      party: 'D',
      role: 'Assembly Member',
      district: 'Assembly District 50',
      committee_id: null
    },
    {
      people_id: 30002,
      name: 'James Wilson',
      party: 'R',
      role: 'Assembly Member', 
      district: 'Assembly District 25',
      committee_id: null
    },
    {
      people_id: 30003,
      name: 'Sarah Chen',
      party: 'D',
      role: 'Senator',
      district: 'Senate District 15',
      committee_id: null
    },
    {
      people_id: 30004,
      name: 'Robert Johnson',
      party: 'R',
      role: 'Senator',
      district: 'Senate District 8',
      committee_id: null
    },
    {
      people_id: 30005,
      name: 'Ana Garcia',
      party: 'D',
      role: 'Assembly Member',
      district: 'Assembly District 75',
      committee_id: null
    },
    {
      people_id: 30006,
      name: 'Michael Davis',
      party: 'D',
      role: 'Assembly Member',
      district: 'Assembly District 42',
      committee_id: null
    },
    {
      people_id: 30007,
      name: 'Jennifer Lee',
      party: 'D',
      role: 'Senator',
      district: 'Senate District 22',
      committee_id: null
    },
    {
      people_id: 30008,
      name: 'David Thompson',
      party: 'R',
      role: 'Assembly Member',
      district: 'Assembly District 18',
      committee_id: null
    }
  ]
};

export function getMockSessions(state?: string) {
  if (state) {
    const upperState = state.toUpperCase();
    return {
      status: 'success',
      data: {
        status: 'OK',
        sessions: MOCK_SESSIONS_BY_STATE[upperState] || []
      }
    };
  }
  
  // Return all sessions
  const allSessions = Object.values(MOCK_SESSIONS_BY_STATE).flat();
  return {
    status: 'success',
    data: {
      status: 'OK',
      sessions: allSessions
    }
  };
}

export function getMockMasterList(sessionId: number) {
  const bills = MOCK_BILLS_BY_SESSION[sessionId] || {};
  return {
    status: 'success',
    data: {
      status: 'OK',
      masterlist: {
        session: {
          session_id: sessionId,
          session_name: '2025-2026 Regular Session'
        },
        ...bills
      }
    }
  };
}

export function getMockSessionPeople(sessionId: number) {
  const people = MOCK_LEGISLATORS_BY_SESSION[sessionId] || [];
  return {
    status: 'success',
    data: {
      status: 'OK',
      sessionpeople: {
        session: {
          session_id: sessionId
        },
        people: people
      }
    }
  };
}

export function getMockBill(billId: number) {
  // Find the bill across all sessions
  for (const sessionBills of Object.values(MOCK_BILLS_BY_SESSION)) {
    for (const bill of Object.values(sessionBills)) {
      if ((bill as any).bill_id === billId) {
        return {
          status: 'success',
          data: {
            status: 'OK',
            bill: {
              ...(bill as any),
              subjects: [],
              texts: [],
              votes: [],
              history: [],
              amendments: [],
              supplements: [],
              calendar: [],
              committee: []
            }
          }
        };
      }
    }
  }
  
  return {
    status: 'error',
    error: 'Bill not found'
  };
}