// List of allowed issue categories
export const ALLOWED_SUBJECTS = [
  'Age & Generations',
  'Economy & Work',
  'Family & Relationships',
  'Immigration & Migration',
  'International Affairs',
  'Politics & Policy',
  'Race & Ethnicity',
  'Religion',
  'Science'
] as const;

// Mapping table from Congress.gov API subjects to our issue categories
const API_SUBJECT_MAPPINGS: Record<string, string> = {
  // Age & Generations
  'Social Welfare': 'Age & Generations',
  'Social services': 'Age & Generations',
  'Welfare': 'Age & Generations',
  
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
  'Finance and Financial Sector': 'Economy & Work',
  'Banking and finance': 'Economy & Work',
  'Financial services': 'Economy & Work',
  'Labor and Employment': 'Economy & Work',
  'Employment': 'Economy & Work',
  'Workers rights': 'Economy & Work',
  
  // Family & Relationships
  'Families': 'Family & Relationships',
  'Family policy': 'Family & Relationships',
  'Housing and Community Development': 'Family & Relationships',
  'Housing policy': 'Family & Relationships',
  'Community development': 'Family & Relationships',
  
  // Immigration & Migration
  'Immigration': 'Immigration & Migration',
  'Immigration policy': 'Immigration & Migration',
  
  // International Affairs
  'Foreign Trade and International Finance': 'International Affairs',
  'International trade': 'International Affairs',
  'International Affairs': 'International Affairs',
  'Foreign affairs': 'International Affairs',
  'International relations': 'International Affairs',
  
  // Politics & Policy
  'Armed Forces and National Security': 'Politics & Policy',
  'Armed Forces': 'Politics & Policy',
  'Defense and security': 'Politics & Policy',
  'Civil Rights and Liberties, Minority Issues': 'Politics & Policy',
  'Civil rights': 'Politics & Policy',
  'Minority rights': 'Politics & Policy',
  'Congress': 'Politics & Policy',
  'Crime and Law Enforcement': 'Politics & Policy',
  'Criminal justice': 'Politics & Policy',
  'Law enforcement': 'Politics & Policy',
  'Emergency Management': 'Politics & Policy',
  'Emergency preparedness': 'Politics & Policy',
  'Disaster relief': 'Politics & Policy',
  'Government Operations and Politics': 'Politics & Policy',
  'Government administration': 'Politics & Policy',
  'Public administration': 'Politics & Policy',
  'Law': 'Politics & Policy',
  'Legal system': 'Politics & Policy',
  'Judiciary': 'Politics & Policy',
  'Taxation': 'Politics & Policy',
  'Tax policy': 'Politics & Policy',
  'Revenue': 'Politics & Policy',
  'Transportation and Public Works': 'Politics & Policy',
  'Transportation': 'Politics & Policy',
  'Infrastructure': 'Politics & Policy',
  
  // Race & Ethnicity
  'Native Americans': 'Race & Ethnicity',
  'Indian affairs': 'Race & Ethnicity',
  'Tribal affairs': 'Race & Ethnicity',
  
  // Religion
  'Arts, Culture, Religion': 'Religion',
  'Religion': 'Religion',
  'Religious liberty': 'Religion',
  'Religious freedom': 'Religion',
  'Faith-based': 'Religion',
  'Church': 'Religion',
  'Religious institutions': 'Religion',
  
  // Science
  'Animals': 'Science',
  'Energy': 'Science',
  'Environmental Protection': 'Science',
  'Environment': 'Science',
  'Climate change': 'Science',
  'Public Lands and Natural Resources': 'Science',
  'Natural resources': 'Science',
  'Public lands': 'Science',
  'Science, Technology, Communications': 'Science',
  'Technology': 'Science',
  'Telecommunications': 'Science',
  'Research and development': 'Science',
  'Water Resources Development': 'Science',
  'Water policy': 'Science',
  'Water management': 'Science',
  'Advanced technology and technological innovations': 'Science',
  'Computers and information technology': 'Science'
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