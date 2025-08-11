
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
  position: 'Support' | 'Oppose' | string;
  reasoning: string;
  supportCount: number;
  opposeCount: number;
  actionButtonText: string;
}

const advocacyGroupsData: Record<string, AdvocacyGroup> = {
  'league-of-women-voters': {
    name: 'League of Women Voters',
    slug: 'league-of-women-voters',
    logoUrl: 'https://placehold.co/100x100.png',
    description: 'A nonpartisan political organization that encourages informed and active participation in government through voter education, registration, and advocacy for voting rights and election integrity.',
    website: 'https://www.lwv.org/',
    nonprofitStatus: '501(c)(3) Nonprofit',
    yearsActive: 105,
    billsSupportedCount: 300,
    priorityBills: [
       {
        bill: {
          number: '14',
          type: 'HR',
          congress: 119,
        },
        position: 'Support',
        actionButtonText: 'Voice your opinion',
        reasoning: '### Why LWV Supports the John R. Lewis Voting Rights Advancement Act\n\n*   **It restores protections weakened by court decisions.** After the 2013 *Shelby County v. Holder* ruling gutted key provisions of the Voting Rights Act, this legislation is seen as essential to reestablish federal oversight and guard against discriminatory changes in voting laws.\n\n*   **It defends democracy and honors the VRA\'s legacy.** Named for civil rights hero John Lewis, the bill is framed as much-needed defense of voting rights—particularly amid renewed state-level attacks on fair representation and redistricting.\n\n*   **It aligns with LWV\'s mission.** The League has a long history of fighting to make elections fair, inclusive, and accessible. This act fits squarely within that mission by preventing racial discrimination and ensuring every voter is heard.',
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
        actionButtonText: 'Voice your opinion',
        reasoning: '### Why LWV Opposes the SAVE Act (H.R. 22)\n\n*   **It creates unnecessary barriers to voting.** Although voters are already required to affirm citizenship when registering, the SAVE Act adds redundant requirements, such as presenting documentary proof of U.S. citizenship in person every time you update your registration. This puts an unfair burden on many eligible voters.\n\n*   **It disproportionately impacts marginalized groups.** The League highlights how the SAVE Act harms rural voters, voters of color, military families who move frequently, those recovering from disasters, and especially married women who\'ve changed their names and may struggle to match documentation.\n*   **It addresses a problem that doesn\'t exist.** Noncitizen voting is already illegal and extremely rare. The League warns that the SAVE Act is rooted in fear, misinformation, and divisive rhetoric—not real threats to democracy.\n*   **It undermines voter access and overloads election infrastructure.** Requiring in-person registrations and strict document checks could overwhelm local election offices and undermine the League\'s century-long mission of encouraging broad participation.',
        supportCount: 3100,
        opposeCount: 15600,
      },
    ],
  },
  'brennan-center-for-justice': {
    name: 'Brennan Center for Justice',
    slug: 'brennan-center-for-justice',
    logoUrl: 'https://placehold.co/100x100.png',
    description: 'A nonpartisan law and policy institute at NYU Law that works to reform, revitalize, and defend the country\'s systems of democracy and justice through research, litigation, and advocacy.',
    website: 'https://www.brennancenter.org/',
    nonprofitStatus: '501(c)(3) Nonprofit',
    yearsActive: 30,
    billsSupportedCount: 215,
    priorityBills: [
      {
        bill: {
          number: '22',
          type: 'HR',
          congress: 119,
        },
        position: 'Oppose',
        actionButtonText: 'Voice your opinion',
        reasoning: 'The SAVE Act would require documentary proof of citizenship for voter registration, creating significant barriers for eligible voters. Research shows that more than 21 million Americans would not be able to quickly locate required documents, and nearly 4 million citizens lack access to any form of citizenship proof.',
        supportCount: 2800,
        opposeCount: 18500,
      },
      {
        bill: {
          number: '51',
          type: 'S',
          congress: 119,
        },
        position: 'Support',
        actionButtonText: 'Voice your opinion',
        reasoning: 'Federal oversight is essential to prevent discriminatory voting changes. This bill would restore key provisions of the Voting Rights Act that were struck down in Shelby County v. Holder, providing crucial protections against voter suppression.',
        supportCount: 14200,
        opposeCount: 4100,
      },
      {
        bill: {
          number: '1',
          type: 'S',
          congress: 119,
        },
        position: 'Support',
        actionButtonText: 'Voice your opinion',
        reasoning: 'Comprehensive election security and voting access reforms are needed to protect democracy. This legislation addresses cybersecurity threats, improves election infrastructure, and ensures all eligible Americans can participate in elections.',
        supportCount: 16800,
        opposeCount: 5200,
      },
    ],
  },
  'common-cause': {
    name: 'Common Cause',
    slug: 'common-cause',
    logoUrl: 'https://placehold.co/100x100.png',
    description: 'A nonpartisan grassroots organization dedicated to upholding core democratic values through campaign finance reform, voting rights advocacy, government ethics, and media and democracy issues.',
    website: 'https://www.commoncause.org/',
    nonprofitStatus: '501(c)(4) Nonprofit',
    yearsActive: 54,
    billsSupportedCount: 400,
    priorityBills: [
      {
        bill: {
          number: '1',
          type: 'HR',
          congress: 119,
        },
        position: 'Support',
        actionButtonText: 'Voice your opinion',
        reasoning: 'The For the People Act would transform American democracy by expanding voting rights, ending partisan gerrymandering through independent redistricting commissions, and implementing comprehensive campaign finance reform including small-donor public financing.',
        supportCount: 18900,
        opposeCount: 6200,
      },
      {
        bill: {
          number: '4',
          type: 'S',
          congress: 119,
        },
        position: 'Support',
        actionButtonText: 'Voice your opinion',
        reasoning: 'Restoring net neutrality protections ensures equal access to information and prevents internet service providers from blocking, throttling, or prioritizing content based on payment. An open internet is essential for democracy and civic participation.',
        supportCount: 22500,
        opposeCount: 3800,
      },
      {
        bill: {
          number: '2278',
          type: 'HR',
          congress: 119,
        },
        position: 'Oppose',
        actionButtonText: 'Voice your opinion',
        reasoning: 'This legislation would weaken campaign finance disclosure requirements and allow more dark money in elections. Voters have a right to know who is funding political advertisements and campaign activities.',
        supportCount: 4100,
        opposeCount: 16700,
      },
    ],
  },
  'fair-elections-center': {
    name: 'Fair Elections Center',
    slug: 'fair-elections-center',
    logoUrl: 'https://placehold.co/100x100.png',
    description: 'A national, nonpartisan voting rights and election reform organization that works to remove barriers to registration and voting for traditionally underrepresented constituencies through litigation, advocacy, and voter education.',
    website: 'https://fairelectionscenter.org/',
    nonprofitStatus: '501(c)(3) Nonprofit',
    yearsActive: 12,
    billsSupportedCount: 85,
    priorityBills: [
      {
        bill: {
          number: '14',
          type: 'HR',
          congress: 119,
        },
        position: 'Support',
        actionButtonText: 'Voice your opinion',
        reasoning: 'The John R. Lewis Voting Rights Advancement Act would restore and strengthen voting rights protections, particularly for communities of color and other traditionally underrepresented groups who continue to face barriers to voting.',
        supportCount: 11200,
        opposeCount: 2100,
      },
      {
        bill: {
          number: '1',
          type: 'HR',
          congress: 119,
        },
        position: 'Support',
        actionButtonText: 'Voice your opinion',
        reasoning: 'Comprehensive voting reforms are needed to ensure all eligible Americans can participate in elections. This includes automatic voter registration, expanded early voting, and restoration of voting rights for people with prior felony convictions.',
        supportCount: 13800,
        opposeCount: 4300,
      },
      {
        bill: {
          number: '22',
          type: 'HR',
          congress: 119,
        },
        position: 'Oppose',
        actionButtonText: 'Voice your opinion',
        reasoning: 'Documentary proof of citizenship requirements create significant barriers to voter registration, particularly for naturalized citizens, low-income Americans, and elderly voters who may lack easy access to required documents.',
        supportCount: 3200,
        opposeCount: 14900,
      },
    ],
  },
  'fairvote': {
    name: 'FairVote',
    slug: 'fairvote',
    logoUrl: 'https://placehold.co/100x100.png',
    description: 'A nonpartisan organization working for better elections through ranked choice voting and the Fair Representation Act, which would create multi-member congressional districts elected through proportional representation.',
    website: 'https://fairvote.org/',
    nonprofitStatus: '501(c)(3) Nonprofit',
    yearsActive: 33,
    billsSupportedCount: 45,
    priorityBills: [
      {
        bill: {
          number: '3365',
          type: 'HR',
          congress: 119,
        },
        position: 'Support',
        actionButtonText: 'Voice your opinion',
        reasoning: 'The Fair Representation Act would establish multi-member congressional districts elected through ranked choice voting, ensuring that every vote counts and that Congress better reflects the diversity of American voters. This reform would end gerrymandering and increase competition.',
        supportCount: 8900,
        opposeCount: 5200,
      },
      {
        bill: {
          number: '1',
          type: 'S',
          congress: 119,
        },
        position: 'Support',
        actionButtonText: 'Voice your opinion',
        reasoning: 'Federal support for ranked choice voting implementation would help states and localities adopt this proven reform that gives voters more choice, reduces negative campaigning, and ensures winners have majority support.',
        supportCount: 12400,
        opposeCount: 3100,
      },
      {
        bill: {
          number: '5845',
          type: 'HR',
          congress: 119,
        },
        position: 'Oppose',
        actionButtonText: 'Voice your opinion',
        reasoning: 'State bans on ranked choice voting prevent local communities from implementing proven electoral reforms. Voters and local governments should have the freedom to choose voting methods that work best for their communities.',
        supportCount: 2800,
        opposeCount: 9600,
      },
    ],
  },
  'voteriders': {
    name: 'VoteRiders',
    slug: 'voteriders',
    logoUrl: 'https://placehold.co/100x100.png',
    description: 'A national nonpartisan organization that helps eligible voters get the ID they need to vote, providing voter education, assistance obtaining required documents, and transportation to ID-issuing offices.',
    website: 'https://www.voteriders.org/',
    nonprofitStatus: '501(c)(3) Nonprofit',
    yearsActive: 12,
    billsSupportedCount: 25,
    priorityBills: [
      {
        bill: {
          number: '22',
          type: 'HR',
          congress: 119,
        },
        position: 'Oppose',
        actionButtonText: 'Voice your opinion',
        reasoning: 'Additional ID requirements would create new barriers for eligible voters, particularly impacting communities that already face challenges accessing identification. Nearly 21 million Americans lack current government-issued photo ID, with disproportionate impacts on marginalized communities.',
        supportCount: 4200,
        opposeCount: 18300,
      },
      {
        bill: {
          number: '1',
          type: 'HR',
          congress: 119,
        },
        position: 'Support',
        actionButtonText: 'Voice your opinion',
        reasoning: 'Comprehensive voting reforms should include provisions to make obtaining required voter ID easier and more accessible, including federal standards for acceptable forms of ID and assistance for voters who need help obtaining documentation.',
        supportCount: 15600,
        opposeCount: 4800,
      },
      {
        bill: {
          number: '2847',
          type: 'HR',
          congress: 119,
        },
        position: 'Support',
        actionButtonText: 'Voice your opinion',
        reasoning: 'Federal funding for voter ID assistance programs would help ensure that all eligible Americans can obtain the identification needed to exercise their right to vote, regardless of their economic circumstances or geographic location.',
        supportCount: 13200,
        opposeCount: 2900,
      },
    ],
  },
  'rock-the-vote': {
    name: 'Rock the Vote',
    slug: 'rock-the-vote',
    logoUrl: 'https://placehold.co/100x100.png',
    description: 'A nonpartisan organization dedicated to building political power of young people through voter registration, education, and civic engagement using pop culture, music, art, and technology.',
    website: 'https://www.rockthevote.org/',
    nonprofitStatus: '501(c)(3) Nonprofit',
    yearsActive: 34,
    billsSupportedCount: 55,
    priorityBills: [
      {
        bill: {
          number: '1',
          type: 'HR',
          congress: 119,
        },
        position: 'Support',
        actionButtonText: 'Voice your opinion',
        reasoning: 'Young voters face unique barriers to voting including frequent moves, lack of traditional forms of ID, and unfamiliarity with voting processes. Comprehensive voting reform would address these barriers through automatic registration, expanded early voting, and modernized election systems.',
        supportCount: 19500,
        opposeCount: 3200,
      },
      {
        bill: {
          number: '4',
          type: 'HR',
          congress: 119,
        },
        position: 'Support',
        actionButtonText: 'Voice your opinion',
        reasoning: 'Lowering the voting age for federal elections would recognize the civic engagement and political awareness of 16 and 17-year-olds, many of whom are already participating in democracy through youth councils, school boards, and community organizing.',
        supportCount: 8900,
        opposeCount: 12400,
      },
      {
        bill: {
          number: '22',
          type: 'HR',
          congress: 119,
        },
        position: 'Oppose',
        actionButtonText: 'Voice your opinion',
        reasoning: 'Additional documentation requirements disproportionately impact young voters who are more likely to lack traditional forms of ID or have mismatched addresses due to frequent moves for school or work. These barriers suppress youth civic participation.',
        supportCount: 4100,
        opposeCount: 16800,
      },
    ],
  },
  'mi-familia-vota': {
    name: 'Mi Familia Vota',
    slug: 'mi-familia-vota',
    logoUrl: 'https://placehold.co/100x100.png',
    description: 'A national civic engagement organization that unites Latino, immigrant, and allied communities to promote social and economic justice through increased civic participation and community organizing.',
    website: 'https://mifamiliavota.org/',
    nonprofitStatus: '501(c)(3) Nonprofit',
    yearsActive: 19,
    billsSupportedCount: 75,
    priorityBills: [
      {
        bill: {
          number: '14',
          type: 'HR',
          congress: 119,
        },
        position: 'Support',
        actionButtonText: 'Voice your opinion',
        reasoning: 'The John R. Lewis Voting Rights Advancement Act would restore critical protections against voting discrimination that particularly benefit Latino and immigrant communities, ensuring equal access to the ballot and language assistance.',
        supportCount: 16200,
        opposeCount: 2800,
      },
      {
        bill: {
          number: '6',
          type: 'HR',
          congress: 119,
        },
        position: 'Support',
        actionButtonText: 'Voice your opinion',
        reasoning: 'Comprehensive immigration reform would provide a pathway to citizenship for millions of immigrants, expanding the electorate and ensuring that immigrant communities have a voice in the democratic process.',
        supportCount: 18900,
        opposeCount: 6100,
      },
      {
        bill: {
          number: '22',
          type: 'HR',
          congress: 119,
        },
        position: 'Oppose',
        actionButtonText: 'Voice your opinion',
        reasoning: 'Documentary proof of citizenship requirements would create significant barriers for naturalized citizens and Latino voters, many of whom may face challenges obtaining or affording required documentation.',
        supportCount: 3400,
        opposeCount: 15800,
      },
    ],
  },
  'black-voters-matter': {
    name: 'Black Voters Matter',
    slug: 'black-voters-matter',
    logoUrl: 'https://placehold.co/100x100.png',
    description: 'A power-building organization focused on increasing civic engagement and voter turnout in Black communities through organizing, advocacy, and direct action to ensure effective representation.',
    website: 'https://blackvotersmatter.org/',
    nonprofitStatus: '501(c)(4) Nonprofit',
    yearsActive: 9,
    billsSupportedCount: 65,
    priorityBills: [
      {
        bill: {
          number: '14',
          type: 'HR',
          congress: 119,
        },
        position: 'Support',
        actionButtonText: 'Voice your opinion',
        reasoning: 'The John R. Lewis Voting Rights Advancement Act is essential for protecting Black voting rights and preventing discriminatory voting changes. This legislation would restore federal oversight of elections in areas with histories of discrimination.',
        supportCount: 17800,
        opposeCount: 2200,
      },
      {
        bill: {
          number: '1',
          type: 'HR',
          congress: 119,
        },
        position: 'Support',
        actionButtonText: 'Voice your opinion',
        reasoning: 'Comprehensive democracy reform would expand voting access in Black communities through automatic registration, early voting expansion, and restoration of voting rights for people with prior convictions, addressing historical and ongoing voter suppression.',
        supportCount: 16500,
        opposeCount: 4100,
      },
      {
        bill: {
          number: '51',
          type: 'HR',
          congress: 119,
        },
        position: 'Support',
        actionButtonText: 'Voice your opinion',
        reasoning: 'D.C. statehood would provide full representation for the majority-Black District of Columbia, ending taxation without representation and ensuring that D.C. residents have voting representation in Congress.',
        supportCount: 14200,
        opposeCount: 8100,
      },
    ],
  },
  'when-we-all-vote': {
    name: 'When We All Vote',
    slug: 'when-we-all-vote',
    logoUrl: 'https://placehold.co/100x100.png',
    description: 'A nonpartisan organization launched by Michelle Obama that aims to change the culture around voting and increase participation in every election through voter registration, education, and community organizing.',
    website: 'https://whenweallvote.org/',
    nonprofitStatus: '501(c)(3) Nonprofit',
    yearsActive: 7,
    billsSupportedCount: 35,
    priorityBills: [
      {
        bill: {
          number: '1',
          type: 'HR',
          congress: 119,
        },
        position: 'Support',
        actionButtonText: 'Voice your opinion',
        reasoning: 'The For the People Act would make voting more accessible for all Americans through automatic voter registration, expanded early voting, and improved election security. These reforms would help create a culture where voting is easy and accessible for everyone.',
        supportCount: 20100,
        opposeCount: 4500,
      },
      {
        bill: {
          number: '14',
          type: 'HR',
          congress: 119,
        },
        position: 'Support',
        actionButtonText: 'Voice your opinion',
        reasoning: 'Voting rights protections are fundamental to ensuring that every American can participate in democracy. The John R. Lewis Voting Rights Advancement Act would restore crucial safeguards against discriminatory voting practices.',
        supportCount: 18700,
        opposeCount: 3100,
      },
      {
        bill: {
          number: '22',
          type: 'HR',
          congress: 119,
        },
        position: 'Oppose',
        actionButtonText: 'Voice your opinion',
        reasoning: 'Additional barriers to voter registration would make it harder for eligible Americans to participate in elections, particularly impacting first-time voters and communities that have historically faced voting obstacles.',
        supportCount: 5200,
        opposeCount: 16900,
      },
    ],
  },
};

// Add remaining groups with research-based information
const additionalGroups = [
  {
    slug: 'fair-fight-action',
    name: 'Fair Fight Action',
    description: 'A national voting rights organization working to promote fair elections and combat voter suppression through advocacy, organizing, and litigation.',
    website: 'https://fairfight.com/',
    nonprofitStatus: '501(c)(4) Nonprofit',
    yearsActive: 7,
    billsSupportedCount: 42,
  },
  {
    slug: 'campaign-legal-center',
    name: 'Campaign Legal Center',
    description: 'A nonpartisan organization working to protect and strengthen the democratic process through litigation, policy advocacy, and public education on campaign finance, voting rights, and government ethics.',
    website: 'https://campaignlegal.org/',
    nonprofitStatus: '501(c)(3) Nonprofit',
    yearsActive: 20,
    billsSupportedCount: 95,
  },
  {
    slug: 'vote-smart',
    name: 'Vote Smart',
    description: 'A nonpartisan research organization that provides accurate information about candidates and elected officials\' positions, voting records, and backgrounds to help voters make informed decisions.',
    website: 'https://justfacts.votesmart.org/',
    nonprofitStatus: '501(c)(3) Nonprofit',
    yearsActive: 32,
    billsSupportedCount: 15,
  },
  {
    slug: 'ballotready',
    name: 'BallotReady',
    description: 'A civic technology organization that provides comprehensive, nonpartisan information about all elections and candidates on voters\' ballots to increase informed participation in democracy.',
    website: 'https://ballotready.org/',
    nonprofitStatus: '501(c)(3) Nonprofit',
    yearsActive: 11,
    billsSupportedCount: 8,
  },
  {
    slug: 'democracy-works-turbovote',
    name: 'Democracy Works',
    description: 'A nonpartisan technology organization that makes voting easier and more accessible through tools like TurboVote, helping citizens register to vote, get election reminders, and request absentee ballots.',
    website: 'https://democracy.works/',
    nonprofitStatus: '501(c)(3) Nonprofit',
    yearsActive: 15,
    billsSupportedCount: 12,
  },
  {
    slug: 'headcount',
    name: 'HeadCount',
    description: 'A nonpartisan organization that works with musicians and artists to promote participation in democracy through voter registration drives at concerts, festivals, and online campaigns.',
    website: 'https://headcount.org/',
    nonprofitStatus: '501(c)(3) Nonprofit',
    yearsActive: 20,
    billsSupportedCount: 18,
  },
  {
    slug: 'state-voices',
    name: 'State Voices',
    description: 'A national network of state-based civic engagement organizations working to expand democracy by increasing voter registration, participation, and civic engagement in underrepresented communities.',
    website: 'https://statevoices.org/',
    nonprofitStatus: '501(c)(3) Nonprofit',
    yearsActive: 18,
    billsSupportedCount: 85,
  },
  {
    slug: 'asian-americans-advancing-justice',
    name: 'Asian Americans Advancing Justice',
    description: 'A national civil rights organization working to advance the human and civil rights of Asian Americans and Pacific Islanders through advocacy, education, organizing, and legal services.',
    website: 'https://advancingjustice.org/',
    nonprofitStatus: '501(c)(3) Nonprofit',
    yearsActive: 52,
    billsSupportedCount: 125,
  },
  {
    slug: 'naacp-legal-defense-fund',
    name: 'NAACP Legal Defense Fund',
    description: 'America\'s premier legal organization fighting for racial justice through litigation, advocacy, and public education, with a strong focus on voting rights and fair representation.',
    website: 'https://naacpldf.org/',
    nonprofitStatus: '501(c)(3) Nonprofit',
    yearsActive: 84,
    billsSupportedCount: 200,
  },
  {
    slug: 'voto-latino',
    name: 'Voto Latino',
    description: 'A grassroots political organization focused on educating and empowering Latino communities to participate in the democratic process through voter registration, education, and advocacy.',
    website: 'https://votolatino.org/',
    nonprofitStatus: '501(c)(4) Nonprofit',
    yearsActive: 19,
    billsSupportedCount: 68,
  },
];

// Add all additional groups with placeholder data
additionalGroups.forEach(group => {
  advocacyGroupsData[group.slug] = {
    name: group.name,
    slug: group.slug,
    logoUrl: 'https://placehold.co/100x100.png',
    description: group.description,
    website: group.website,
    nonprofitStatus: group.nonprofitStatus,
    yearsActive: group.yearsActive,
    billsSupportedCount: group.billsSupportedCount,
    priorityBills: [],
  };
});

// Add remaining placeholder groups
const remainingGroupSlugs = [
  'alliance-for-youth-action', 'national-vote-at-home-institute', 
  'national-voter-registration-day', 'democracy-nc', 'the-civics-center', 'no-labels'
];

remainingGroupSlugs.forEach(slug => {
  if (!advocacyGroupsData[slug]) {
    let name, description, website, yearsActive, nonprofitStatus;
    
    switch(slug) {
      case 'no-labels':
        name = 'No Labels';
        description = 'A national movement of commonsense Americans pushing our leaders to solve the nation\'s biggest problems through bipartisan cooperation and practical solutions to major challenges.';
        website = 'https://www.nolabels.org/';
        yearsActive = 14;
        nonprofitStatus = '501(c)(4) Nonprofit';
        break;
      case 'alliance-for-youth-action':
        name = 'Alliance for Youth Action';
        description = 'A national organization that builds power with young people to create progressive change through organizing, advocacy, and civic engagement.';
        website = 'https://allianceforyouthaction.org/';
        yearsActive = 8;
        nonprofitStatus = '501(c)(4) Nonprofit';
        break;
      case 'national-vote-at-home-institute':
        name = 'National Vote at Home Institute';
        description = 'A nonpartisan organization promoting vote-by-mail and secure election administration to make voting more accessible and convenient for all eligible Americans.';
        website = 'https://voteathome.org/';
        yearsActive = 9;
        nonprofitStatus = '501(c)(3) Nonprofit';
        break;
      case 'national-voter-registration-day':
        name = 'National Voter Registration Day';
        description = 'A nonpartisan civic holiday dedicated to celebrating democracy and creating coordinated efforts to register voters across the country.';
        website = 'https://nationalvoterregistrationday.org/';
        yearsActive = 13;
        nonprofitStatus = '501(c)(3) Nonprofit';
        break;
      case 'democracy-nc':
        name = 'Democracy North Carolina',
        description = 'A nonpartisan organization working to strengthen democratic participation in North Carolina through voter education, registration, and advocacy for fair elections.';
        website = 'https://democracync.org/';
        yearsActive = 25;
        nonprofitStatus = '501(c)(3) Nonprofit';
        break;
      case 'the-civics-center':
        name = 'The Civics Center';
        description = 'A nonpartisan organization working to build a culture of civic engagement by providing resources and training for educators, students, and communities.';
        website = 'https://thecivicscenter.org/';
        yearsActive = 8;
        nonprofitStatus = '501(c)(3) Nonprofit';
        break;
      default:
        name = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        description = 'A civic engagement organization working to strengthen democracy and increase voter participation.';
        website = '#';
        yearsActive = 10;
        nonprofitStatus = '501(c)(3) Nonprofit';
    }
    
    advocacyGroupsData[slug] = {
      name,
      slug,
      logoUrl: 'https://placehold.co/100x100.png',
      description,
      website,
      nonprofitStatus,
      yearsActive,
      billsSupportedCount: 25,
      priorityBills: [],
    };
  }
});

export const getAdvocacyGroupData = (slug: string): AdvocacyGroup | undefined => {
  return advocacyGroupsData[slug];
};

    