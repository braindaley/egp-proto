


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
  type: string;
  updateDate: string;
  url: string;
  sponsors: Sponsor[];
  cosponsors: ApiCollection<Cosponsor> & { url: string; };
  committees: ApiCollection<Committee>;
  summaries: {
    count: number;
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
    items: Subject[];
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


export interface Member {
  bioguideId: string;
  district?: number;
  name: string;
  partyName: string;
  state: string;
  terms: {
    current?: {
      startYear: string;
    }
  };
  depiction?: {
    imageUrl: string;
    attribution: string;
  };
  chamber: string;
  url: string;
}
