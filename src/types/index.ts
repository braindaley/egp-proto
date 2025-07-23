export interface Bill {
  congress: number;
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
