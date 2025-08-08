
import type { Bill } from '@/types';

export interface AdvocacyGroup {
  name: string;
  slug: string;
  logoUrl?: string;
  description: string;
  website: string;
  nonprofitStatus: string;
  yearsActive: number;
  billsSupportedCount: number;
  priorityBills: PriorityBill[];
}

export interface PriorityBill {
  bill: Partial<Bill>;
  position: 'Support' | 'Oppose';
  reasoning: string;
  supportCount: number;
  opposeCount: number;
}

const advocacyGroupsData: Record<string, AdvocacyGroup> = {
  'environmental-defense-alliance': {
    name: 'Environmental Defense Alliance',
    slug: 'environmental-defense-alliance',
    logoUrl: 'https://placehold.co/100x100.png',
    description: "A nonprofit organization dedicated to protecting environmental rights and advocating for policies that combat climate change. The Alliance works with legislators to craft and support bills that promote renewable energy, conserve natural resources, and ensure clean air and water for all communities.",
    website: 'https://example.com/eda',
    nonprofitStatus: '501(c)(3) Nonprofit',
    yearsActive: 15,
    billsSupportedCount: 128,
    priorityBills: [
      {
        bill: {
          number: '4815',
          type: 'S',
          congress: 119,
        },
        position: 'Support',
        reasoning: 'This bill provides critical funding for modernizing our energy grid and accelerating the transition to renewable energy sources, which is essential for combating climate change.',
        supportCount: 12543,
        opposeCount: 2319,
      },
      {
        bill: {
          number: '9021',
          type: 'HR',
          congress: 119,
        },
        position: 'Support',
        reasoning: 'By ending taxpayer-funded subsidies for fossil fuel companies, this legislation levels the playing field for clean energy and frees up public funds for sustainable development.',
        supportCount: 18982,
        opposeCount: 4120,
      },
      {
        bill: {
            number: '8871',
            type: 'HR',
            congress: 119,
        },
        position: 'Oppose',
        reasoning: 'This act would weaken clean air and water protections, allowing industrial polluters to increase emissions that harm public health and the environment.',
        supportCount: 1877,
        opposeCount: 22451,
      },
    ],
  },
  'league-of-women-voters': {
    name: 'League of Women Voters',
    slug: 'league-of-women-voters',
    logoUrl: 'https://placehold.co/100x100.png',
    description: 'A nonpartisan political organization that encourages informed and active participation in government. It influences public policy through education and advocacy.',
    website: 'https://www.lwv.org/',
    nonprofitStatus: '501(c)(3) Nonprofit',
    yearsActive: 104,
    billsSupportedCount: 300,
    priorityBills: [
      {
        bill: {
          number: '14',
          type: 'HR',
          congress: 119,
        },
        position: 'Support',
        reasoning: 'This act designates new protected areas and increases funding for the National Park Service, safeguarding our natural treasures for future generations.',
        supportCount: 9850,
        opposeCount: 1520,
      },
      {
        bill: {
          number: '22',
          type: 'HR',
          congress: 119,
        },
        position: 'Oppose',
        reasoning: `Why LWV Opposes the SAVE Act (H.R. 22) It creates unnecessary barriers to voting. Although voters are already required to affirm citizenship when registering, the SAVE Act adds redundant requirements, such as presenting documentary proof of U.S. citizenship in person every time you update your registration. This puts an unfair burden on many eligible voters. It disproportionately impacts marginalized groups. The League highlights how the SAVE Act harms rural voters, voters of color, military families who move frequently, those recovering from disasters, and especially married women who’ve changed their names and may struggle to match documentation. It addresses a problem that doesn’t exist. Noncitizen voting is already illegal and extremely rare. The League warns that the SAVE Act is rooted in fear, misinformation, and divisive rhetoric—not real threats to democracy. It undermines voter access and overloads election infrastructure. Requiring in-person registrations and strict document checks could overwhelm local election offices and undermine the League’s century-long mission of encouraging broad participation.`,
        supportCount: 3100,
        opposeCount: 15600,
      },
    ],
  },
  'brennan-center-for-justice': {
    name: 'Brennan Center for Justice',
    slug: 'brennan-center-for-justice',
    logoUrl: 'https://placehold.co/100x100.png',
    description: 'A nonpartisan law and policy institute that works to reform, revitalize, and when necessary, defend our country’s systems of democracy and justice.',
    website: 'https://www.brennancenter.org/',
    nonprofitStatus: '501(c)(3) Nonprofit',
    yearsActive: 29,
    billsSupportedCount: 215,
    priorityBills: [],
  },
  'common-cause': {
    name: 'Common Cause',
    slug: 'common-cause',
    logoUrl: 'https://placehold.co/100x100.png',
    description: 'A nonpartisan grassroots organization dedicated to upholding the core values of American democracy. It works to create an open, honest, and accountable government that serves the public interest.',
    website: 'https://www.commoncause.org/',
    nonprofitStatus: '501(c)(4) Nonprofit',
    yearsActive: 54,
    billsSupportedCount: 400,
    priorityBills: [],
  },
  'no-labels': {
    name: 'No Labels',
    slug: 'no-labels',
    logoUrl: 'https://placehold.co/100x100.png',
    description: 'A national movement of commonsense Americans pushing our leaders to solve the nation’s biggest problems. It advocates for bipartisanship and problem-solving in politics.',
    website: 'https://www.nolabels.org/',
    nonprofitStatus: '501(c)(4) Nonprofit',
    yearsActive: 14,
    billsSupportedCount: 85,
    priorityBills: [],
  }
};

// Add all other groups with placeholder data
const allGroupSlugs = [
  'fair-elections-center', 'fairvote', 'vote-smart', 'voteriders', 'rock-the-vote', 
  'mi-familia-vota', 'black-voters-matter', 'when-we-all-vote', 'fair-fight-action', 
  'campaign-legal-center', 'ballotready', 'democracy-works-turbovote', 'headcount', 
  'state-voices', 'asian-americans-advancing-justice', 'naacp-legal-defense-fund', 
  'voto-latino', 'alliance-for-youth-action', 'national-vote-at-home-institute', 
  'national-voter-registration-day', 'democracy-nc', 'the-civics-center'
];

allGroupSlugs.forEach(slug => {
  if (!advocacyGroupsData[slug]) {
    advocacyGroupsData[slug] = {
      name: slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      slug,
      logoUrl: 'https://placehold.co/100x100.png',
      description: 'Placeholder description for this advocacy group. Detailed information about their mission and activities will be available soon.',
      website: '#',
      nonprofitStatus: '501(c)(3) Nonprofit',
      yearsActive: 10,
      billsSupportedCount: 50,
      priorityBills: [],
    };
  }
});


export const getAdvocacyGroupData = (slug: string): AdvocacyGroup | undefined => {
  return advocacyGroupsData[slug];
};
