// List of allowed issue categories
export const ALLOWED_SUBJECTS = [
  'Agriculture & Food',
  'Animals',
  'Defense & Security',
  'Arts & Culture',
  'Civil Rights',
  'Commerce',
  'Congress',
  'Crime & Law',
  'Economy & Finance',
  'Education',
  'Emergency Mgmt',
  'Energy',
  'Environment',
  'Families',
  'Banking & Finance',
  'Trade',
  'Government',
  'Health',
  'Housing',
  'Immigration',
  'Foreign Affairs',
  'Labor',
  'Law',
  'Native Issues',
  'Public Lands',
  'Science & Tech',
  'Social Welfare',
  'Sports & Recreation',
  'Taxes',
  'Transportation',
  'Water Resources'
] as const;

// Mapping table from Congress.gov API subjects to our issue categories
const API_SUBJECT_MAPPINGS: Record<string, string> = {
  // Agriculture & Food
  'Agriculture and Food': 'Agriculture & Food',
  'Agriculture and nutrition': 'Agriculture & Food',
  'Food assistance and relief': 'Agriculture & Food',

  // Animals
  'Animals': 'Animals',

  // Defense & Security
  'Armed Forces and National Security': 'Defense & Security',
  'Armed Forces': 'Defense & Security',
  'Defense and security': 'Defense & Security',

  // Arts & Culture
  'Arts, Culture, Religion': 'Arts & Culture',
  'Religion': 'Arts & Culture',
  'Religious liberty': 'Arts & Culture',
  'Religious freedom': 'Arts & Culture',
  'Faith-based': 'Arts & Culture',
  'Church': 'Arts & Culture',
  'Religious institutions': 'Arts & Culture',

  // Civil Rights
  'Civil Rights and Liberties, Minority Issues': 'Civil Rights',
  'Civil rights': 'Civil Rights',
  'Minority rights': 'Civil Rights',

  // Commerce
  'Commerce': 'Commerce',
  'Business and industry': 'Commerce',
  'Trade and commerce': 'Commerce',

  // Congress
  'Congress': 'Congress',

  // Crime & Law
  'Crime and Law Enforcement': 'Crime & Law',
  'Criminal justice': 'Crime & Law',
  'Law enforcement': 'Crime & Law',

  // Economy & Finance
  'Economics and Public Finance': 'Economy & Finance',
  'Economic policy': 'Economy & Finance',
  'Public finance': 'Economy & Finance',

  // Education
  'Education': 'Education',
  'Education policy': 'Education',
  'Schools': 'Education',
  'Higher education': 'Education',

  // Emergency Mgmt
  'Emergency Management': 'Emergency Mgmt',
  'Emergency preparedness': 'Emergency Mgmt',
  'Disaster relief': 'Emergency Mgmt',

  // Energy
  'Energy': 'Energy',
  'Climate change': 'Energy',

  // Environment
  'Environmental Protection': 'Environment',
  'Environment': 'Environment',

  // Families
  'Families': 'Families',
  'Family policy': 'Families',

  // Banking & Finance
  'Finance and Financial Sector': 'Banking & Finance',
  'Banking and finance': 'Banking & Finance',
  'Financial services': 'Banking & Finance',

  // Trade
  'Foreign Trade and International Finance': 'Trade',
  'International trade': 'Trade',

  // Government
  'Government Operations and Politics': 'Government',
  'Government administration': 'Government',
  'Public administration': 'Government',

  // Health
  'Health': 'Health',
  'Health policy': 'Health',
  'Healthcare': 'Health',
  'Public health': 'Health',

  // Housing
  'Housing and Community Development': 'Housing',
  'Housing policy': 'Housing',
  'Community development': 'Housing',

  // Immigration
  'Immigration': 'Immigration',
  'Immigration policy': 'Immigration',

  // Foreign Affairs
  'International Affairs': 'Foreign Affairs',
  'Foreign affairs': 'Foreign Affairs',
  'International relations': 'Foreign Affairs',

  // Labor
  'Labor and Employment': 'Labor',
  'Employment': 'Labor',
  'Workers rights': 'Labor',

  // Law
  'Law': 'Law',
  'Legal system': 'Law',
  'Judiciary': 'Law',

  // Native Issues
  'Native Americans': 'Native Issues',
  'Indian affairs': 'Native Issues',
  'Tribal affairs': 'Native Issues',

  // Public Lands
  'Public Lands and Natural Resources': 'Public Lands',
  'Natural resources': 'Public Lands',
  'Public lands': 'Public Lands',

  // Science & Tech
  'Science, Technology, Communications': 'Science & Tech',
  'Technology': 'Science & Tech',
  'Telecommunications': 'Science & Tech',
  'Research and development': 'Science & Tech',
  'Advanced technology and technological innovations': 'Science & Tech',
  'Computers and information technology': 'Science & Tech',

  // Social Welfare
  'Social Welfare': 'Social Welfare',
  'Social services': 'Social Welfare',
  'Welfare': 'Social Welfare',

  // Sports & Recreation
  'Sports and Recreation': 'Sports & Recreation',
  'Sports': 'Sports & Recreation',
  'Recreation': 'Sports & Recreation',

  // Taxes
  'Taxation': 'Taxes',
  'Tax policy': 'Taxes',
  'Revenue': 'Taxes',

  // Transportation
  'Transportation and Public Works': 'Transportation',
  'Transportation': 'Transportation',
  'Infrastructure': 'Transportation',

  // Water Resources
  'Water Resources Development': 'Water Resources',
  'Water policy': 'Water Resources',
  'Water management': 'Water Resources'
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
    'health': 'Health',
    'education': 'Education',
    'jobs': 'Labor',
    'unemployment': 'Labor',
    'trade': 'Trade',
    'finance': 'Banking & Finance',
    'economy': 'Economy & Finance',
    'marriage': 'Families',
    'children': 'Families',
    'family': 'Families',
    'housing': 'Housing',
    'immigration': 'Immigration',
    'foreign': 'Foreign Affairs',
    'international': 'Foreign Affairs',
    'military': 'Defense & Security',
    'defense': 'Defense & Security',
    'security': 'Defense & Security',
    'government': 'Government',
    'policy': 'Government',
    'law': 'Law',
    'rights': 'Civil Rights',
    'native': 'Native Issues',
    'tribal': 'Native Issues',
    'ethnic': 'Civil Rights',
    'religion': 'Arts & Culture',
    'faith': 'Arts & Culture',
    'church': 'Arts & Culture',
    'antisemitism': 'Arts & Culture',
    'religious': 'Arts & Culture',
    'chaplain': 'Arts & Culture',
    'science': 'Science & Tech',
    'research': 'Science & Tech',
    'technology': 'Science & Tech',
    'environment': 'Environment',
    'energy': 'Energy',
    'climate': 'Environment',
    'agriculture': 'Agriculture & Food',
    'food': 'Agriculture & Food',
    'animals': 'Animals',
    'commerce': 'Commerce',
    'congress': 'Congress',
    'crime': 'Crime & Law',
    'emergency': 'Emergency Mgmt',
    'labor': 'Labor',
    'lands': 'Public Lands',
    'social': 'Social Welfare',
    'sports': 'Sports & Recreation',
    'taxes': 'Taxes',
    'transportation': 'Transportation',
    'water': 'Water Resources'
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