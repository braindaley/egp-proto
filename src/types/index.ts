

export interface Amendment {
    congress: number;
    number: number;
    type: string;
    url: string;
    purpose: string;
    description: string;
    updateDate: string;
    latestAction?: {
        actionDate: string;
        text: string;
    };
}

export interface RelatedBill {
    congress: number;
    number: string;
    type: string;
    title: string;
    latestAction?: {
        actionDate: string;
        text: string;
    };
    relationshipDetails: {
        count: number;
        items?: {
            type: string;
            identifiedBy: string;
        }[];
    };
    url: string;
}

export interface Summary {
    actionDate: string;
    actionDesc: string;
    text: string;
    updateDate: string;
    versionCode: string;
}

export interface TextVersion {
    date: string;
    type: string;
    formats: {
        type: string;
        url:string;
    }[];
}

export interface Sponsor {
    bioguideId: string;
    fullName: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    party: string;
    state: string;
    url: string;
    email?: string;
    depiction?: {
        imageUrl?: string;
    };
}

export interface Cosponsor {
    bioguideId: string;
    fullName: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    party: string;
    state: string;
    url: string;
    isOriginalCosponsor: boolean;
}

export interface Committee {
    chamber: string;
    name: string;
    systemCode: string;
    type: string;
    url: string;
    activities: {
        name: string;
        date?: string; 
    }[];
}

export interface Subject {
    name: string;
    url: string;
}

export interface PolicyArea {
    name: string;
}

export type ApiCollection<T> = {
    count: number;
    items: T[];
}

export interface Bill {
  congress: number;
  introducedDate: string;
  latestAction: {
    actionDate: string;
    text: string;
  };
  number: string;
  originChamber: string;
  originChamberCode: string;
  title: string;
  shortTitle?: string;
  type: string;
  updateDate: string;
  url: string;
  sponsors: Sponsor[];
  cosponsors?: ApiCollection<Cosponsor> & { url: string; };
  committees: ApiCollection<Committee>;
  summaries: {
    count: number;
    url?: string;
    summary?: Summary;
    items?: Summary[];
  };
  allSummaries: Summary[];
  textVersions: ApiCollection<TextVersion>;
  actions: ApiCollection<{ actionDate: string; text: string; }>;
  amendments: ApiCollection<Amendment>;
  relatedBills: ApiCollection<RelatedBill>;
  subjects: {
    count: number;
    items: (Subject | PolicyArea)[];
    url?: string;
    legislativeSubjects?: Subject[];
    policyArea?: PolicyArea;
  };
}

export interface CongressApiResponse {
  bills: Bill[];
  pagination: {
    count: number;
    next: string;
  };
  request: {
    contentType: string;
    format: string;
  };
}

export interface MemberTerm {
    chamber: string;
    congress: number;
    startYear: number;
    endYear: number;
    memberType: string;
    partyName: string;
    stateCode: string;
    stateName: string;
    district?: number;
    phone?: string;
    office?: string;
}

export interface SponsoredLegislation {
    congress: number;
    number: string;
    title: string;
    type: string;
    introducedDate: string;
    latestAction?: {
        actionDate: string;
        text: string;
    };
    cosponsorsCount?: number;
    url: string;
}

export interface CosponsoredLegislation {
    congress: number;
    number: string;
    title: string;
    type: string;
    introducedDate: string;
    cosponsoredDate: string;
    latestAction?: {
        actionDate: string;
        text: string;
    };
    url: string;
}

export interface Leadership {
    type: string;
    congress: number;
}

export interface PartyHistory {
    partyName: string;
    partyAbbreviation: string;
    startYear: number;
    endYear?: number;
}

export interface NewsArticle {
    title: string;
    link: string;
    pubDate: string;
    source?: {
        $: {
            url: string;
        };
        _: string;
    }
    content?: string;
    imageUrl?: string | null;
}

// NEW: Extended Member IDs interfaces
export interface ExtendedMemberIds {
  bioguide: string;
  thomas?: string;
  govtrack?: number;
  opensecrets?: string;
  votesmart?: number;
  icpsr?: number;
  fec?: string[];
  family?: {
    name: string;
    relation: string;
  }[];
  cspan?: number;
  wikipedia?: string;
  house_history?: number;
  ballotpedia?: string;
  maplight?: number;
  wikidata?: string;
  google_entity_id?: string;
}

export interface LegislatorData {
  id: ExtendedMemberIds;
  name: {
    first: string;
    last: string;
    middle?: string;
    suffix?: string;
  };
  bio: {
    birthday?: string;
    gender?: string;
  };
  terms: any[];
}

export interface Member {
  bioguideId: string;
  extendedIds?: ExtendedMemberIds; // NEW: Added extended IDs
  district?: number;
  name: string;
  partyName: string;
  state: string;
  email?: string;
  terms: {
    item?: MemberTerm[];
    current?: {
      startYear: string;
      congress?: number;
    }
  };
  depiction?: {
    imageUrl: string;
    attribution: string;
  };
  chamber: string;
  url: string;
  firstName: string;
  lastName: string;
  directOrderName: string;
  birthDate?: string;
  deathDate?: string;
  birthYear?: string;
  birthLocation?: string;
  education?: string;
  profession?: string;
  family?: string;
  officialWebsiteUrl?: string;
  leadership?: Leadership[];
  partyHistory?: PartyHistory[];
  currentMember: boolean;
  addressInformation?: {
      city: string;
      district: string;
      officeAddress: string;
      phoneNumber: string;
      zipCode: string;
  };
  // FIXED: Use the correct property names that match the Congress API response
  sponsoredLegislation?: {
      count: number;
      url: string;
  };
  cosponsoredLegislation?: {
      count: number;
      url: string;
  };
  honorificName: string;
  invertedOrderName: string;
  updateDate: string;
  news?: NewsArticle[];
  committeeAssignments?: string;
}

export interface Congress {
  name: string;
  number: number;
  startYear: string;
  endYear: string;
}

export interface CampaignPromise {
    title: string;
    description: string;
    category: 'Healthcare' | 'Economy' | 'Environment' | 'Education' | 'Defense' | 'Infrastructure';
    priority: 'High' | 'Medium' | 'Low';
    status: 'In Progress' | 'Completed' | 'Stalled' | 'Not Started';
}

export interface CampaignPromisesData {
  memberName: string;
  congress: string;
  promises: CampaignPromise[];
  lastUpdated: string;
}

// Types for Voting Records
export interface Vote {
    chamber: string;
    congress: number;
    date: string;
    number: number;
    question: string;
    session: number;
    sourceUrl: string;
    type: string;
}

export interface MemberVote {
    member: {
        bioguideId: string;
        name: string;
        party: string;
        state: string;
        url: string;
    };
    vote: {
        chamber: string;
        congress: number;
        date: string;
        number: number;
        question: string;
        session: number;
        sourceUrl: string;
        type: string;
        position: 'Yes' | 'No' | 'Not Voting' | 'Present';
    };
}

export interface ChamberVote {
    congress: number;
    chamber: 'House' | 'Senate';
    session: number;
    voteNumber: number;
    date: string;
    time: string;
}

export interface ChamberVoteSummary {
    votes: ChamberVote[];
    totalVotes: number;
    averageAttendance: number;
}

export interface CommitteeInfo {
    systemCode: string;
    chamber: string;
    name: string;
    url: string;
}

export interface SocialMedia {
  bioguide: string;
  twitter?: string;
  facebook?: string;
  youtube?: string;
  instagram?: string;
}

export interface DistrictOffice {
  id: string;
  address: string;
  suite?: string;
  building?: string;
  city: string;
  state: string;
  zip: string;
  phone?: string;
  fax?: string;
  latitude?: number;
  longitude?: number;
}

export interface DistrictOfficesRecord {
  id: {
    bioguide: string;
    govtrack?: number;
    thomas?: string;
  };
  offices: DistrictOffice[];
}

export interface FeedBill {
  shortTitle: string;
  billNumber: string;
  congress: number;
  type: string;
  number: string;
  latestAction: {
    actionDate: string;
    text: string;
  };
  sponsorParty: string;
  sponsorFullName: string;
  sponsorImageUrl: string | null;
  committeeName: string;
  subjects?: string[];
  status: string;
  importanceScore: number;
  summary?: string;
  explainer?: {
    headline: string;
    explainer: string;
    supportStatement: string;
    opposeStatement: string;
    closingQuestion: string;
  };
}

export interface CommitteeMember {
  bioguideId: string;
  name: string;
  party: string;
  state: string;
  district?: string;
  rank?: number;
  title?: string;
  url?: string;
}

export interface Subcommittee {
  name: string;
  systemCode: string;
  url: string;
}

export interface EnhancedCommitteeInfo {
  name: string;
  chamber: string;
  url?: string;
  chair?: CommitteeMember;
  rankingMember?: CommitteeMember;
  members: CommitteeMember[];
  subcommittees: Subcommittee[];
  jurisdiction?: string;
  address?: string;
  phone?: string;
  minorityUrl?: string;
  youtubeId?: string;
  systemCode?: string;
  recentMeetings?: CommitteeMeeting[];
}

export interface CommitteeMeeting {
  eventId: string;
  title: string;
  date: string;
  chamber: string;
  meetingType: string;
  location?: {
    building?: string;
    room?: string;
  };
  url?: string;
}

// Campaign Finance Types
export interface CampaignFinanceDetails {
  cycle: number;
  cash_on_hand: number;
  debts: number;
  receipts: number;
  disbursements: number;
  large_contributions: number;
  small_contributions: number;
  pac_contributions: number;
  candidate_contributions: number;
  other_contributions: number;
}

export interface StateContributor {
  state: string;
  total: number;
}

export interface IndividualContributor {
  employer: string;
  total: number;
}

export interface StateContributorsResponse {
  fec_id: string;
  cycle: number;
  state_totals: StateContributor[];
}

export interface IndividualContributorsResponse {
  fec_id: string;
  cycle: number;
  top_contributors: IndividualContributor[];
}

// Presidential Election Types
export interface PresidentialElectionRecord {
  "State ID": string;
  "State": string;
  "Party": string;
  "Year": number;
  "Candidate Votes": number;
  "Total Votes": number;
}

export interface PresidentialElectionResponse {
  annotations: {
    dataset_name: string;
    source_name: string;
    source_link: string;
    topic: string;
    subtopic: string;
  };
  data: PresidentialElectionRecord[];
}
