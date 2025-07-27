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

// Function to filter subjects to only show allowed ones
export function filterAllowedSubjects(subjects: any[]): string[] {
  if (!subjects || !Array.isArray(subjects)) return [];
  
  return subjects
    .map(subject => {
      // Handle different subject object structures from API
      const name = subject?.name || subject?.legislativeSubject?.name || subject;
      return typeof name === 'string' ? name : null;
    })
    .filter((name): name is string => 
      name !== null && ALLOWED_SUBJECTS.includes(name as any)
    )
    .sort(); // Sort alphabetically
}

// Function to get all allowed subjects for filter dropdowns
export function getAllowedSubjectsForFilter() {
  return [...ALLOWED_SUBJECTS].sort();
}
