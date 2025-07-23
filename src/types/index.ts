

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
  sponsors: {
    bioguideId: string;
    fullName: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    party: string;
    state: string;
    url: string;
  }[];
  cosponsors: {
    count: number;
    url: string;
    items?: {
        bioguideId: string;
        fullName: string;
        firstName: string;
        lastName: string;
        middleName?: string;
        party: string;
        state: string;
        url: string;
        isOriginalCosponsor: boolean;
    }[];
  };
  committees: {
    count: number;
    items: {
      chamber: string;
      name: string;
      systemCode: string;
      type: string;
      url: string;
      activities: {
        name: string;
        date?: string; 
      }[];
    }[];
  };
  summaries: {
    count: number;
    summary?: {
      text: string;
      updateDate: string;
      versionCode: string;
    };
  };
  actions: {
    actionDate: string;
    text: string;
  }[];
  amendments: Amendment[];
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
