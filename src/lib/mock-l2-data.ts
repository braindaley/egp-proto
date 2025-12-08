/**
 * Mock L2 Political Data Service
 *
 * This generates realistic mock L2 data for demonstration purposes.
 * In production, this would be replaced with actual L2 API integration.
 */

export interface L2UserData {
  // Core IDs
  lalVoterId: string;
  lalHouseId: string;

  // Voter Registration
  votersActive: 'Active' | 'Inactive';
  votersCalculatedRegDate: Date;
  partiesDescription: string;

  // Demographics
  votersAge: number;
  votersAgeRange: string;
  votersGender: 'F' | 'M' | 'U';
  ethnicDescription: string;

  // Location
  state: string;
  county: string;
  usCongressionalDistrict: string;

  // Consumer Data
  consumerDataEducationOfPerson: string;
  consumerDataEstimatedIncomeRange: string;
  consumerDataOccupationGroup: string;
  consumerDataHomeownerProbabilityModel: string;
  consumerDataPresenceOfChildrenInHH: string;
  consumerDataMaritalStatus: string | null;
  consumerDataVeteranInHH: string;
  consumerDataRUSCode: string;

  // Vote History
  voteHistory: {
    [key: string]: '0' | '1';
  };
  votingPerformanceEvenYearGeneral: string;
}

// Distribution weights for generating realistic data
const PARTY_DISTRIBUTION = [
  { value: 'Democratic', weight: 35 },
  { value: 'Republican', weight: 30 },
  { value: 'Independent', weight: 25 },
  { value: 'Libertarian', weight: 3 },
  { value: 'Green', weight: 2 },
  { value: 'Other', weight: 5 },
];

const AGE_RANGES = [
  { range: '18-24', min: 18, max: 24, weight: 12 },
  { range: '25-34', min: 25, max: 34, weight: 18 },
  { range: '35-44', min: 35, max: 44, weight: 20 },
  { range: '45-54', min: 45, max: 54, weight: 18 },
  { range: '55-64', min: 55, max: 64, weight: 16 },
  { range: '65+', min: 65, max: 85, weight: 16 },
];

const GENDER_DISTRIBUTION = [
  { value: 'F', weight: 52 },
  { value: 'M', weight: 46 },
  { value: 'U', weight: 2 },
];

const ETHNICITY_DISTRIBUTION = [
  { value: 'European', weight: 58 },
  { value: 'Hispanic', weight: 18 },
  { value: 'African-American', weight: 13 },
  { value: 'Asian', weight: 6 },
  { value: 'Other', weight: 5 },
];

const EDUCATION_DISTRIBUTION = [
  { value: 'High School', weight: 25 },
  { value: 'Some College', weight: 20 },
  { value: 'Completed College Likely', weight: 30 },
  { value: 'Graduate Degree Likely', weight: 20 },
  { value: 'Less Than High School', weight: 5 },
];

const INCOME_DISTRIBUTION = [
  { value: 'Under $25,000', weight: 12 },
  { value: '$25,000-$49,999', weight: 18 },
  { value: '$50,000-$74,999', weight: 22 },
  { value: '$75,000-$99,999', weight: 18 },
  { value: '$100,000-$149,999', weight: 16 },
  { value: '$150,000+', weight: 14 },
];

const OCCUPATION_DISTRIBUTION = [
  { value: 'Education', weight: 15 },
  { value: 'Healthcare', weight: 14 },
  { value: 'Technology', weight: 12 },
  { value: 'Retail/Service', weight: 12 },
  { value: 'Legal', weight: 8 },
  { value: 'Finance', weight: 8 },
  { value: 'Government', weight: 7 },
  { value: 'Manufacturing', weight: 6 },
  { value: 'Nonprofit', weight: 5 },
  { value: 'Retired', weight: 8 },
  { value: 'Other', weight: 5 },
];

const STATE_DISTRIBUTION = [
  { value: 'CA', weight: 12 },
  { value: 'TX', weight: 9 },
  { value: 'FL', weight: 7 },
  { value: 'NY', weight: 6 },
  { value: 'PA', weight: 4 },
  { value: 'IL', weight: 4 },
  { value: 'OH', weight: 4 },
  { value: 'GA', weight: 3 },
  { value: 'NC', weight: 3 },
  { value: 'MI', weight: 3 },
  { value: 'NJ', weight: 3 },
  { value: 'VA', weight: 3 },
  { value: 'WA', weight: 2 },
  { value: 'AZ', weight: 2 },
  { value: 'MA', weight: 2 },
  { value: 'TN', weight: 2 },
  { value: 'IN', weight: 2 },
  { value: 'MO', weight: 2 },
  { value: 'MD', weight: 2 },
  { value: 'WI', weight: 2 },
  { value: 'CO', weight: 2 },
  { value: 'MN', weight: 2 },
  { value: 'SC', weight: 2 },
  { value: 'AL', weight: 2 },
  { value: 'LA', weight: 1 },
  { value: 'KY', weight: 1 },
  { value: 'OR', weight: 1 },
  { value: 'OK', weight: 1 },
  { value: 'CT', weight: 1 },
  { value: 'UT', weight: 1 },
  { value: 'OTHER', weight: 5 },
];

// Helper function for weighted random selection
function weightedRandom<T extends { weight: number }>(items: T[]): T {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;

  for (const item of items) {
    random -= item.weight;
    if (random <= 0) return item;
  }

  return items[items.length - 1];
}

// Generate a unique L2 voter ID
function generateL2Id(): string {
  const state = 'LAL';
  const number = Math.floor(Math.random() * 900000000) + 100000000;
  return `${state}${number}`;
}

// Generate random vote history
function generateVoteHistory(): { [key: string]: '0' | '1' } {
  const years = ['2024', '2022', '2020', '2018', '2016'];
  const types = ['EG', 'EP']; // General, Primary
  const history: { [key: string]: '0' | '1' } = {};

  // General elections have higher turnout
  years.forEach(year => {
    types.forEach(type => {
      const baseRate = type === 'EG' ? 0.65 : 0.35; // General vs Primary turnout
      // Presidential years have higher turnout
      const isPres = year === '2024' || year === '2020' || year === '2016';
      const rate = isPres && type === 'EG' ? baseRate + 0.15 : baseRate;
      history[`${type}_${year}`] = Math.random() < rate ? '1' : '0';
    });
  });

  return history;
}

// Calculate voting performance from history
function calculateVotingPerformance(history: { [key: string]: '0' | '1' }): string {
  const generalElections = Object.entries(history)
    .filter(([key]) => key.startsWith('EG_'));
  const voted = generalElections.filter(([, value]) => value === '1').length;
  const percentage = Math.round((voted / generalElections.length) * 100);
  return `${percentage}%`;
}

/**
 * Generate mock L2 data for a user
 * Uses userId as seed for consistent generation
 */
export function generateMockL2Data(userId: string): L2UserData {
  // Use userId to seed some consistency (same user = same data)
  const seed = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  const ageData = weightedRandom(AGE_RANGES);
  const age = ageData.min + Math.floor(Math.random() * (ageData.max - ageData.min));
  const gender = weightedRandom(GENDER_DISTRIBUTION).value as 'F' | 'M' | 'U';
  const voteHistory = generateVoteHistory();
  const state = weightedRandom(STATE_DISTRIBUTION).value;

  return {
    lalVoterId: generateL2Id(),
    lalHouseId: String(Math.floor(Math.random() * 900000000) + 100000000),
    votersActive: Math.random() > 0.05 ? 'Active' : 'Inactive',
    votersCalculatedRegDate: new Date(Date.now() - Math.random() * 20 * 365 * 24 * 60 * 60 * 1000),
    partiesDescription: weightedRandom(PARTY_DISTRIBUTION).value,
    votersAge: age,
    votersAgeRange: ageData.range,
    votersGender: gender,
    ethnicDescription: weightedRandom(ETHNICITY_DISTRIBUTION).value,
    state: state,
    county: 'SAMPLE COUNTY',
    usCongressionalDistrict: String(Math.floor(Math.random() * 53) + 1).padStart(2, '0'),
    consumerDataEducationOfPerson: weightedRandom(EDUCATION_DISTRIBUTION).value,
    consumerDataEstimatedIncomeRange: weightedRandom(INCOME_DISTRIBUTION).value,
    consumerDataOccupationGroup: weightedRandom(OCCUPATION_DISTRIBUTION).value,
    consumerDataHomeownerProbabilityModel: Math.random() > 0.35 ? 'Owner' : 'Renter',
    consumerDataPresenceOfChildrenInHH: Math.random() > 0.65 ? 'Yes' : 'No',
    consumerDataMaritalStatus: Math.random() > 0.45 ? 'Married' : Math.random() > 0.5 ? 'Single' : null,
    consumerDataVeteranInHH: Math.random() > 0.92 ? 'Yes' : 'No',
    consumerDataRUSCode: Math.random() > 0.3 ? 'Suburban' : Math.random() > 0.5 ? 'Urban' : 'Rural',
    voteHistory,
    votingPerformanceEvenYearGeneral: calculateVotingPerformance(voteHistory),
  };
}

/**
 * Get age group from age
 */
export function getAgeGroup(age: number): string {
  if (age < 25) return '18-24';
  if (age < 35) return '25-34';
  if (age < 45) return '35-44';
  if (age < 55) return '45-54';
  if (age < 65) return '55-64';
  return '65+';
}

/**
 * Get generation from age
 */
export function getGeneration(age: number): string {
  if (age < 28) return 'Gen Z';
  if (age < 44) return 'Millennial';
  if (age < 60) return 'Gen X';
  if (age < 78) return 'Boomer';
  return 'Silent';
}

/**
 * Aggregate L2 data from multiple users into campaign demographics
 */
export interface CampaignDemographics {
  totalParticipants: number;
  verifiedVoters: number;
  verifiedVoterPercentage: number;

  ageGroups: { [key: string]: number };
  generations: { [key: string]: number };
  partyRegistration: { [key: string]: number };
  gender: { [key: string]: number };
  ethnicity: { [key: string]: number };
  education: { [key: string]: number };
  income: { [key: string]: number };
  occupation: { [key: string]: number };
  states: { [key: string]: number };
  homeownership: { [key: string]: number };
  householdsWithChildren: number;
  married: number;
  veterans: number;
  urbanRural: { [key: string]: number };

  voterHistory: {
    general2024: number;
    general2022: number;
    general2020: number;
    primary2024: number;
    primary2022: number;
    primary2020: number;
    averageTurnout: number;
  };

  likelyVoterScore: {
    high: number;   // 80-100%
    medium: number; // 50-79%
    low: number;    // 0-49%
  };
}

/**
 * Aggregate L2 data for a list of users
 */
export function aggregateL2Data(userL2Data: L2UserData[]): CampaignDemographics {
  const total = userL2Data.length;
  if (total === 0) {
    return getEmptyDemographics();
  }

  const activeVoters = userL2Data.filter(u => u.votersActive === 'Active').length;

  // Initialize counters
  const ageGroups: { [key: string]: number } = {};
  const generations: { [key: string]: number } = {};
  const partyRegistration: { [key: string]: number } = {};
  const gender: { [key: string]: number } = {};
  const ethnicity: { [key: string]: number } = {};
  const education: { [key: string]: number } = {};
  const income: { [key: string]: number } = {};
  const occupation: { [key: string]: number } = {};
  const states: { [key: string]: number } = {};
  const homeownership: { [key: string]: number } = {};
  const urbanRural: { [key: string]: number } = {};

  let householdsWithChildren = 0;
  let married = 0;
  let veterans = 0;

  let generalVoters2024 = 0;
  let generalVoters2022 = 0;
  let generalVoters2020 = 0;
  let primaryVoters2024 = 0;
  let primaryVoters2022 = 0;
  let primaryVoters2020 = 0;

  let highLikelyVoters = 0;
  let mediumLikelyVoters = 0;
  let lowLikelyVoters = 0;

  // Process each user
  userL2Data.forEach(user => {
    // Age groups
    const ageGroup = getAgeGroup(user.votersAge);
    ageGroups[ageGroup] = (ageGroups[ageGroup] || 0) + 1;

    // Generations
    const gen = getGeneration(user.votersAge);
    generations[gen] = (generations[gen] || 0) + 1;

    // Party
    partyRegistration[user.partiesDescription] = (partyRegistration[user.partiesDescription] || 0) + 1;

    // Gender
    const genderLabel = user.votersGender === 'F' ? 'Female' : user.votersGender === 'M' ? 'Male' : 'Other';
    gender[genderLabel] = (gender[genderLabel] || 0) + 1;

    // Ethnicity
    ethnicity[user.ethnicDescription] = (ethnicity[user.ethnicDescription] || 0) + 1;

    // Education
    education[user.consumerDataEducationOfPerson] = (education[user.consumerDataEducationOfPerson] || 0) + 1;

    // Income
    income[user.consumerDataEstimatedIncomeRange] = (income[user.consumerDataEstimatedIncomeRange] || 0) + 1;

    // Occupation
    occupation[user.consumerDataOccupationGroup] = (occupation[user.consumerDataOccupationGroup] || 0) + 1;

    // States
    states[user.state] = (states[user.state] || 0) + 1;

    // Homeownership
    homeownership[user.consumerDataHomeownerProbabilityModel] = (homeownership[user.consumerDataHomeownerProbabilityModel] || 0) + 1;

    // Urban/Rural
    urbanRural[user.consumerDataRUSCode] = (urbanRural[user.consumerDataRUSCode] || 0) + 1;

    // Household characteristics
    if (user.consumerDataPresenceOfChildrenInHH === 'Yes') householdsWithChildren++;
    if (user.consumerDataMaritalStatus === 'Married') married++;
    if (user.consumerDataVeteranInHH === 'Yes') veterans++;

    // Vote history
    if (user.voteHistory['EG_2024'] === '1') generalVoters2024++;
    if (user.voteHistory['EG_2022'] === '1') generalVoters2022++;
    if (user.voteHistory['EG_2020'] === '1') generalVoters2020++;
    if (user.voteHistory['EP_2024'] === '1') primaryVoters2024++;
    if (user.voteHistory['EP_2022'] === '1') primaryVoters2022++;
    if (user.voteHistory['EP_2020'] === '1') primaryVoters2020++;

    // Likely voter score based on voting performance
    const perf = parseInt(user.votingPerformanceEvenYearGeneral) || 0;
    if (perf >= 80) highLikelyVoters++;
    else if (perf >= 50) mediumLikelyVoters++;
    else lowLikelyVoters++;
  });

  // Calculate average turnout
  const totalVotes = generalVoters2024 + generalVoters2022 + generalVoters2020;
  const averageTurnout = Math.round((totalVotes / (total * 3)) * 100);

  return {
    totalParticipants: total,
    verifiedVoters: activeVoters,
    verifiedVoterPercentage: Math.round((activeVoters / total) * 100),

    ageGroups: convertToPercentages(ageGroups, total),
    generations: convertToPercentages(generations, total),
    partyRegistration: convertToPercentages(partyRegistration, total),
    gender: convertToPercentages(gender, total),
    ethnicity: convertToPercentages(ethnicity, total),
    education: convertToPercentages(education, total),
    income: convertToPercentages(income, total),
    occupation: convertToPercentages(occupation, total),
    states: convertToPercentages(states, total),
    homeownership: convertToPercentages(homeownership, total),
    urbanRural: convertToPercentages(urbanRural, total),

    householdsWithChildren: Math.round((householdsWithChildren / total) * 100),
    married: Math.round((married / total) * 100),
    veterans: Math.round((veterans / total) * 100),

    voterHistory: {
      general2024: Math.round((generalVoters2024 / total) * 100),
      general2022: Math.round((generalVoters2022 / total) * 100),
      general2020: Math.round((generalVoters2020 / total) * 100),
      primary2024: Math.round((primaryVoters2024 / total) * 100),
      primary2022: Math.round((primaryVoters2022 / total) * 100),
      primary2020: Math.round((primaryVoters2020 / total) * 100),
      averageTurnout,
    },

    likelyVoterScore: {
      high: Math.round((highLikelyVoters / total) * 100),
      medium: Math.round((mediumLikelyVoters / total) * 100),
      low: Math.round((lowLikelyVoters / total) * 100),
    },
  };
}

function convertToPercentages(counts: { [key: string]: number }, total: number): { [key: string]: number } {
  const result: { [key: string]: number } = {};
  Object.entries(counts).forEach(([key, count]) => {
    result[key] = Math.round((count / total) * 100);
  });
  return result;
}

function getEmptyDemographics(): CampaignDemographics {
  return {
    totalParticipants: 0,
    verifiedVoters: 0,
    verifiedVoterPercentage: 0,
    ageGroups: {},
    generations: {},
    partyRegistration: {},
    gender: {},
    ethnicity: {},
    education: {},
    income: {},
    occupation: {},
    states: {},
    homeownership: {},
    urbanRural: {},
    householdsWithChildren: 0,
    married: 0,
    veterans: 0,
    voterHistory: {
      general2024: 0,
      general2022: 0,
      general2020: 0,
      primary2024: 0,
      primary2022: 0,
      primary2020: 0,
      averageTurnout: 0,
    },
    likelyVoterScore: {
      high: 0,
      medium: 0,
      low: 0,
    },
  };
}

/**
 * Generate mock participant data for a campaign
 * This simulates what would come from querying user_messages + joining L2 data
 */
export function generateMockCampaignParticipants(
  campaignId: string,
  participantCount: number
): { userId: string; l2Data: L2UserData; stance: 'support' | 'oppose' }[] {
  const participants: { userId: string; l2Data: L2UserData; stance: 'support' | 'oppose' }[] = [];

  // Generate a consistent seed based on campaignId for reproducible data
  const seed = campaignId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  for (let i = 0; i < participantCount; i++) {
    const userId = `user-${seed}-${i}`;
    const l2Data = generateMockL2Data(userId);
    // Randomly assign stance (60% support, 40% oppose for demo)
    const stance = Math.random() > 0.4 ? 'support' : 'oppose';

    participants.push({ userId, l2Data, stance });
  }

  return participants;
}
