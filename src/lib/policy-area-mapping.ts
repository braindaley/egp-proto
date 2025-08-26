// Mapping from Congress.gov policy areas to site issue categories
// Based on the standard policy areas from api.congress.gov

export const SITE_ISSUE_CATEGORIES = [
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

export type SiteIssueCategory = typeof SITE_ISSUE_CATEGORIES[number];

// Map Congress.gov policy areas to our site's issue categories
// Source: https://www.congress.gov/help/legislative-glossary#glossary_policyarea
export const POLICY_AREA_TO_SITE_CATEGORY: Record<string, SiteIssueCategory> = {
  // Age & Generations
  'Social Welfare': 'Age & Generations',
  
  // Economy & Work
  'Agriculture and Food': 'Economy & Work',
  'Commerce': 'Economy & Work',
  'Economics and Public Finance': 'Economy & Work',
  'Finance and Financial Sector': 'Economy & Work',
  'Labor and Employment': 'Economy & Work',
  
  // Family & Relationships
  'Families': 'Family & Relationships',
  'Housing and Community Development': 'Family & Relationships',
  
  // Immigration & Migration
  'Immigration': 'Immigration & Migration',
  
  // International Affairs
  'Foreign Trade and International Finance': 'International Affairs',
  'International Affairs': 'International Affairs',
  
  // Politics & Policy
  'Armed Forces and National Security': 'Politics & Policy',
  'Civil Rights and Liberties, Minority Issues': 'Politics & Policy',
  'Congress': 'Politics & Policy',
  'Crime and Law Enforcement': 'Politics & Policy',
  'Emergency Management': 'Politics & Policy',
  'Government Operations and Politics': 'Politics & Policy',
  'Law': 'Politics & Policy',
  'Taxation': 'Politics & Policy',
  'Transportation and Public Works': 'Politics & Policy',
  
  // Race & Ethnicity
  'Native Americans': 'Race & Ethnicity',
  
  // Religion
  'Arts, Culture, Religion': 'Religion',
  
  // Science
  'Animals': 'Science',
  'Energy': 'Science',
  'Environmental Protection': 'Science',
  'Public Lands and Natural Resources': 'Science',
  'Science, Technology, Communications': 'Science',
  'Water Resources Development': 'Science'
};

/**
 * Maps a Congress.gov policy area to our site's issue categories
 * Returns the mapped category or 'Politics & Policy' as default
 */
export function mapPolicyAreaToSiteCategory(policyArea: string | undefined): SiteIssueCategory | null {
  if (!policyArea) return null;
  
  // Direct mapping
  const mappedCategory = POLICY_AREA_TO_SITE_CATEGORY[policyArea];
  if (mappedCategory) return mappedCategory;
  
  // Default to Politics & Policy for unmapped areas
  console.warn(`Unmapped policy area: ${policyArea}, defaulting to Politics & Policy`);
  return 'Politics & Policy';
}

/**
 * Get all Congress.gov policy areas that map to a specific site category
 */
export function getPolicyAreasForSiteCategory(category: SiteIssueCategory): string[] {
  return Object.entries(POLICY_AREA_TO_SITE_CATEGORY)
    .filter(([_, siteCategory]) => siteCategory === category)
    .map(([policyArea]) => policyArea);
}