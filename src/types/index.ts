










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

type ApiCollection<T> = {
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
  cosponsors: ApiCollection<Cosponsor> & { url: string; };
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
    cosponsorsCount: number;
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

export interface Member {
  bioguideId: string;
  district?: number;
  name: string;
  partyName: string;
  state: string;
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
  sponsoredLegislation?: SponsoredLegislation[];
  cosponsoredLegislation?: CosponsoredLegislation[];
  leadership?: Leadership[];
  partyHistory?: PartyHistory[];
  currentMember: boolean;
  addressInformation: {
      city: string;
      district: string;
      officeAddress: string;
      phoneNumber: string;
      zipCode: number;
  },
  cosponsoredLegislation: {
      count: number;
      url: string;
  };
  honorificName: string;
  invertedOrderName: string;
  sponsoredLegislation: {
      count: number;
      url: string;
  };
  updateDate: string;
  news?: NewsArticle[];
}

export interface Congress {
  name: string;
  number: number;
  startYear: string;
  endYear: string;
}
