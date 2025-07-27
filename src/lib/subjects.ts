// List of allowed subjects to display
export const ALLOWED_SUBJECTS = [
  'Agriculture and Food',
  'Animals',
  'Armed Forces and National Security',
  'Arts, Culture, Religion',
  'Civil Rights and Liberties, Minority Issues',
  'Commerce',
  'Congress',
  'Crime and Law Enforcement',
  'Economics and Public Finance',
  'Education',
  'Emergency Management',
  'Energy',
  'Environmental Protection',
  'Families',
  'Finance and Financial Sector',
  'Foreign Trade and International Finance',
  'Government Operations and Politics',
  'Health',
  'Housing and Community Development',
  'Immigration',
  'International Affairs',
  'Labor and Employment',
  'Law',
  'Native Americans',
  'Public Lands and Natural Resources',
  'Science, Technology, Communications',
  'Social Sciences and History',
  'Social Welfare',
  'Sports and Recreation',
  'Taxation',
  'Transportation and Public Works',
  'Water Resources Development'
] as const;

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
  
  // Add legislative subjects
  if (apiSubjects.legislativeSubjects) {
    allSubjects.push(...apiSubjects.legislativeSubjects.map(s => s.name));
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
  
  // Exact match first
  for (const allowed of ALLOWED_SUBJECTS) {
    if (allowed.toLowerCase() === normalized) {
      return allowed;
    }
  }
  
  // Partial match
  for (const allowed of ALLOWED_SUBJECTS) {
    if (allowed.toLowerCase().includes(normalized) || normalized.includes(allowed.toLowerCase())) {
      return allowed;
    }
  }
  
  return null;
}

// Function to map common API subject names to our standardized names
export function mapApiSubjectToAllowed(apiSubjectName: string): string | null {
  const mappings: Record<string, string> = {
    // Common variations from Congress.gov API
    'Agriculture and nutrition': 'Agriculture and Food',
    'Food assistance and relief': 'Agriculture and Food',
    'Armed Forces': 'Armed Forces and National Security',
    'Defense and security': 'Armed Forces and National Security',
    'Civil rights': 'Civil Rights and Liberties, Minority Issues',
    'Minority rights': 'Civil Rights and Liberties, Minority Issues',
    'Business and industry': 'Commerce',
    'Trade and commerce': 'Commerce',
    'Criminal justice': 'Crime and Law Enforcement',
    'Law enforcement': 'Crime and Law Enforcement',
    'Economic policy': 'Economics and Public Finance',
    'Public finance': 'Economics and Public Finance',
    'Schools and education': 'Education',
    'Emergency preparedness': 'Emergency Management',
    'Disaster relief': 'Emergency Management',
    'Environment': 'Environmental Protection',
    'Climate change': 'Environmental Protection',
    'Family policy': 'Families',
    'Banking and finance': 'Finance and Financial Sector',
    'Financial services': 'Finance and Financial Sector',
    'International trade': 'Foreign Trade and International Finance',
    'Government administration': 'Government Operations and Politics',
    'Public administration': 'Government Operations and Politics',
    'Healthcare': 'Health',
    'Medical care': 'Health',
    'Housing policy': 'Housing and Community Development',
    'Community development': 'Housing and Community Development',
    'Immigration policy': 'Immigration',
    'Foreign affairs': 'International Affairs',
    'International relations': 'International Affairs',
    'Employment': 'Labor and Employment',
    'Workers rights': 'Labor and Employment',
    'Legal system': 'Law',
    'Judiciary': 'Law',
    'Indian affairs': 'Native Americans',
    'Tribal affairs': 'Native Americans',
    'Natural resources': 'Public Lands and Natural Resources',
    'Public lands': 'Public Lands and Natural Resources',
    'Technology': 'Science, Technology, Communications',
    'Telecommunications': 'Science, Technology, Communications',
    'Research and development': 'Science, Technology, Communications',
    'Social services': 'Social Welfare',
    'Welfare': 'Social Welfare',
    'Recreation': 'Sports and Recreation',
    'Tax policy': 'Taxation',
    'Revenue': 'Taxation',
    'Transportation': 'Transportation and Public Works',
    'Infrastructure': 'Transportation and Public Works',
    'Water policy': 'Water Resources Development',
    'Water management': 'Water Resources Development'
  };
  
  // Try direct mapping first
  const directMapping = mappings[apiSubjectName];
  if (directMapping) return directMapping;
  
  // Try fuzzy matching
  return findMatchingAllowedSubject(apiSubjectName);
}