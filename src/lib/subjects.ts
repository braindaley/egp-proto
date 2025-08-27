// List of allowed issue categories
export const ALLOWED_SUBJECTS = [
  'Climate, Energy & Environment',
  'Criminal Justice',
  'Defense & National Security',
  'Discrimination & Prejudice',
  'Economy & Work',
  'Education',
  'Health Policy',
  'Immigration & Migration',
  'International Affairs',
  'National Conditions',
  'Religion & Government',
  'Technology'
] as const;

// Mapping table from Congress.gov API subjects to our issue categories
const API_SUBJECT_MAPPINGS: Record<string, string> = {
  // Climate, Energy & Environment
  'Animals': 'Climate, Energy & Environment',
  'Energy': 'Climate, Energy & Environment',
  'Environmental Protection': 'Climate, Energy & Environment',
  'Environment': 'Climate, Energy & Environment',
  'Climate change': 'Climate, Energy & Environment',
  'Public Lands and Natural Resources': 'Climate, Energy & Environment',
  'Natural resources': 'Climate, Energy & Environment',
  'Public lands': 'Climate, Energy & Environment',
  'Water Resources Development': 'Climate, Energy & Environment',
  'Water policy': 'Climate, Energy & Environment',
  'Water management': 'Climate, Energy & Environment',
  'Advanced technology and technological innovations': 'Climate, Energy & Environment',
  'Computers and information technology': 'Climate, Energy & Environment',
  
  // Criminal Justice
  'Crime and Law Enforcement': 'Criminal Justice',
  'Criminal justice': 'Criminal Justice',
  'Law enforcement': 'Criminal Justice',
  'Law': 'Criminal Justice',
  'Legal system': 'Criminal Justice',
  'Judiciary': 'Criminal Justice',
  
  // Defense & National Security
  'Armed Forces and National Security': 'Defense & National Security',
  'Armed Forces': 'Defense & National Security',
  'Defense and security': 'Defense & National Security',
  
  // Discrimination & Prejudice
  'Civil Rights and Liberties, Minority Issues': 'Discrimination & Prejudice',
  'Civil rights': 'Discrimination & Prejudice',
  'Minority rights': 'Discrimination & Prejudice',
  'Native Americans': 'Discrimination & Prejudice',
  'Indian affairs': 'Discrimination & Prejudice',
  'Tribal affairs': 'Discrimination & Prejudice',
  
  // Economy & Work
  'Agriculture and Food': 'Economy & Work',
  'Agriculture and nutrition': 'Economy & Work',
  'Food assistance and relief': 'Economy & Work',
  'Commerce': 'Economy & Work',
  'Business and industry': 'Economy & Work',
  'Trade and commerce': 'Economy & Work',
  'Economics and Public Finance': 'Economy & Work',
  'Economic policy': 'Economy & Work',
  'Public finance': 'Economy & Work',
  'Families': 'Economy & Work',
  'Family policy': 'Economy & Work',
  'Finance and Financial Sector': 'Economy & Work',
  'Banking and finance': 'Economy & Work',
  'Financial services': 'Economy & Work',
  'Housing and Community Development': 'Economy & Work',
  'Housing policy': 'Economy & Work',
  'Community development': 'Economy & Work',
  'Labor and Employment': 'Economy & Work',
  'Employment': 'Economy & Work',
  'Workers rights': 'Economy & Work',
  'Social Welfare': 'Economy & Work',
  'Social services': 'Economy & Work',
  'Welfare': 'Economy & Work',
  'Taxation': 'Economy & Work',
  'Tax policy': 'Economy & Work',
  'Revenue': 'Economy & Work',
  'Transportation and Public Works': 'Economy & Work',
  'Transportation': 'Economy & Work',
  'Infrastructure': 'Economy & Work',
  
  // Education
  'Education': 'Education',
  'Education policy': 'Education',
  'Schools': 'Education',
  'Higher education': 'Education',
  
  // Health Policy
  'Health': 'Health Policy',
  'Health policy': 'Health Policy',
  'Healthcare': 'Health Policy',
  'Public health': 'Health Policy',
  
  
  // Immigration & Migration
  'Immigration': 'Immigration & Migration',
  'Immigration policy': 'Immigration & Migration',
  
  // International Affairs
  'Foreign Trade and International Finance': 'International Affairs',
  'International trade': 'International Affairs',
  'International Affairs': 'International Affairs',
  'Foreign affairs': 'International Affairs',
  'International relations': 'International Affairs',
  
  // National Conditions
  'Congress': 'National Conditions',
  'Emergency Management': 'National Conditions',
  'Emergency preparedness': 'National Conditions',
  'Disaster relief': 'National Conditions',
  'Government Operations and Politics': 'National Conditions',
  'Government administration': 'National Conditions',
  'Public administration': 'National Conditions',
  'Sports and Recreation': 'National Conditions',
  'Sports': 'National Conditions',
  'Recreation': 'National Conditions',
  
  // Religion & Government
  'Arts, Culture, Religion': 'Religion & Government',
  'Religion': 'Religion & Government',
  'Religious liberty': 'Religion & Government',
  'Religious freedom': 'Religion & Government',
  'Faith-based': 'Religion & Government',
  'Church': 'Religion & Government',
  'Religious institutions': 'Religion & Government',
  
  // Technology
  'Science, Technology, Communications': 'Technology',
  'Technology': 'Technology',
  'Telecommunications': 'Technology',
  'Research and development': 'Technology'
  
};

// API subject structure interfaces
interface LegislativeSubject {
  name: string;
  updateDate: string;
}

interface PolicyArea {
  name: string;
}

interface ApiSubjects {
  legislativeSubjects?: LegislativeSubject[];
  items?: LegislativeSubject[];  // Bill API returns 'items' instead of 'legislativeSubjects'
  policyArea?: PolicyArea;
}

// Function to filter subjects to only show allowed ones
export function filterAllowedSubjects(subjects: any[]): string[] {
  if (!subjects || !Array.isArray(subjects)) return [];
  
  const subjectNames: string[] = [];
  
  for (const subject of subjects) {
    let name: string | null = null;
    
    // Handle different subject formats from API
    if (typeof subject === 'string') {
      name = subject;
    } else if (subject?.name) {
      name = subject.name;
    } else if (subject?.legislativeSubject?.name) {
      name = subject.legislativeSubject.name;
    }
    
    if (name && typeof name === 'string') {
      subjectNames.push(name);
    }
  }
  
  // Filter to only allowed subjects and remove duplicates
  return [...new Set(subjectNames)]
    .filter(name => ALLOWED_SUBJECTS.includes(name as any))
    .sort();
}

// Function to extract subjects from Congress.gov API response
export function extractSubjectsFromApiResponse(apiSubjects: ApiSubjects): string[] {
  const allSubjects: string[] = [];
  
  // Add legislative subjects (try both 'legislativeSubjects' and 'items')
  if (apiSubjects.legislativeSubjects) {
    allSubjects.push(...apiSubjects.legislativeSubjects.map(s => s.name));
  } else if (apiSubjects.items) {
    allSubjects.push(...apiSubjects.items.map(s => s.name));
  }
  
  // Add policy area
  if (apiSubjects.policyArea?.name) {
    allSubjects.push(apiSubjects.policyArea.name);
  }
  
  return filterAllowedSubjects(allSubjects);
}

// Function to get all allowed subjects for filter dropdowns
export function getAllowedSubjectsForFilter() {
  return [...ALLOWED_SUBJECTS].sort();
}

// Function to check if a subject name matches our allowed list (fuzzy matching)
export function findMatchingAllowedSubject(subjectName: string): string | null {
  if (!subjectName) return null;
  
  const normalized = subjectName.toLowerCase().trim();
  
  // First check if it's already mapped in our API mappings
  for (const [apiSubject, category] of Object.entries(API_SUBJECT_MAPPINGS)) {
    if (apiSubject.toLowerCase().includes(normalized) || normalized.includes(apiSubject.toLowerCase())) {
      return category;
    }
  }
  
  // Direct match with our categories
  for (const allowed of ALLOWED_SUBJECTS) {
    if (allowed.toLowerCase() === normalized) {
      return allowed;
    }
  }
  
  // Keyword-based matching for common terms
  const keywordMappings: Record<string, string> = {
    'health': 'Age & Generations', // Health could relate to aging
    'education': 'Age & Generations', // Education spans generations
    'jobs': 'Economy & Work',
    'unemployment': 'Economy & Work',
    'trade': 'Economy & Work',
    'finance': 'Economy & Work',
    'economy': 'Economy & Work',
    'marriage': 'Family & Relationships',
    'children': 'Family & Relationships',
    'family': 'Family & Relationships',
    'housing': 'Family & Relationships',
    'immigration': 'Immigration & Migration',
    'foreign': 'International Affairs',
    'international': 'International Affairs',
    'military': 'Politics & Policy',
    'defense': 'Politics & Policy',
    'security': 'Politics & Policy',
    'government': 'Politics & Policy',
    'policy': 'Politics & Policy',
    'law': 'Politics & Policy',
    'rights': 'Politics & Policy',
    'native': 'Race & Ethnicity',
    'tribal': 'Race & Ethnicity',
    'ethnic': 'Race & Ethnicity',
    'religion': 'Religion',
    'faith': 'Religion',
    'church': 'Religion',
    'antisemitism': 'Religion',
    'religious': 'Religion',
    'chaplain': 'Religion',
    'science': 'Science',
    'research': 'Science',
    'technology': 'Science',
    'environment': 'Science',
    'energy': 'Science',
    'climate': 'Science'
  };
  
  for (const [keyword, category] of Object.entries(keywordMappings)) {
    if (normalized.includes(keyword)) {
      return category;
    }
  }
  
  return null;
}

// Function to map API subject names to our issue categories
export function mapApiSubjectToAllowed(apiSubjectName: string): string | null {
  // Try direct mapping first
  const directMapping = API_SUBJECT_MAPPINGS[apiSubjectName];
  if (directMapping) return directMapping;
  
  // Try case-insensitive matching
  const normalizedInput = apiSubjectName.toLowerCase();
  for (const [apiSubject, category] of Object.entries(API_SUBJECT_MAPPINGS)) {
    if (apiSubject.toLowerCase() === normalizedInput) {
      return category;
    }
  }
  
  // Try fuzzy matching
  return findMatchingAllowedSubject(apiSubjectName);
}

// Function to get API subject names that map to a given allowed category
export function getApiSubjectsForCategory(category: string): string[] {
  const apiSubjects: string[] = [];
  
  for (const [apiSubject, mappedCategory] of Object.entries(API_SUBJECT_MAPPINGS)) {
    if (mappedCategory === category) {
      apiSubjects.push(apiSubject);
    }
  }
  
  return apiSubjects;
}