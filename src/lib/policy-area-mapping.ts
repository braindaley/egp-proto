// Mapping from Congress.gov policy areas to site issue categories
// Based on the standard policy areas from api.congress.gov

export const SITE_ISSUE_CATEGORIES = [
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

export type SiteIssueCategory = typeof SITE_ISSUE_CATEGORIES[number];

// Map Congress.gov policy areas to our site's issue categories
// Source: https://www.congress.gov/help/legislative-glossary#glossary_policyarea
export const POLICY_AREA_TO_SITE_CATEGORY: Record<string, SiteIssueCategory> = {
  'Agriculture and Food': 'Agriculture & Food',
  'Animals': 'Animals',
  'Armed Forces and National Security': 'Defense & Security',
  'Arts, Culture, Religion': 'Arts & Culture',
  'Civil Rights and Liberties, Minority Issues': 'Civil Rights',
  'Commerce': 'Commerce',
  'Congress': 'Congress',
  'Crime and Law Enforcement': 'Crime & Law',
  'Economics and Public Finance': 'Economy & Finance',
  'Education': 'Education',
  'Emergency Management': 'Emergency Mgmt',
  'Energy': 'Energy',
  'Environmental Protection': 'Environment',
  'Families': 'Families',
  'Finance and Financial Sector': 'Banking & Finance',
  'Foreign Trade and International Finance': 'Trade',
  'Government Operations and Politics': 'Government',
  'Health': 'Health',
  'Housing and Community Development': 'Housing',
  'Immigration': 'Immigration',
  'International Affairs': 'Foreign Affairs',
  'Labor and Employment': 'Labor',
  'Law': 'Law',
  'Native Americans': 'Native Issues',
  'Public Lands and Natural Resources': 'Public Lands',
  'Science, Technology, Communications': 'Science & Tech',
  'Social Welfare': 'Social Welfare',
  'Sports and Recreation': 'Sports & Recreation',
  'Taxation': 'Taxes',
  'Transportation and Public Works': 'Transportation',
  'Water Resources Development': 'Water Resources'
};

/**
 * Maps a Congress.gov policy area to our site's issue categories
 * Returns the mapped category or 'Government' as default
 */
export function mapPolicyAreaToSiteCategory(policyArea: string | undefined): SiteIssueCategory | null {
  if (!policyArea) return null;

  // Direct mapping
  const mappedCategory = POLICY_AREA_TO_SITE_CATEGORY[policyArea];
  if (mappedCategory) return mappedCategory;

  // Default to Government for unmapped areas
  console.warn(`Unmapped policy area: ${policyArea}, defaulting to Government`);
  return 'Government';
}

/**
 * Get all Congress.gov policy areas that map to a specific site category
 */
export function getPolicyAreasForSiteCategory(category: SiteIssueCategory): string[] {
  return Object.entries(POLICY_AREA_TO_SITE_CATEGORY)
    .filter(([_, siteCategory]) => siteCategory === category)
    .map(([policyArea]) => policyArea);
}

// Map user policy interest keys to site issue categories
export const POLICY_INTEREST_TO_SITE_CATEGORY: Record<string, SiteIssueCategory> = {
  agricultureFood: 'Agriculture & Food',
  animals: 'Animals',
  defenseSecurity: 'Defense & Security',
  artsCulture: 'Arts & Culture',
  civilRights: 'Civil Rights',
  commerce: 'Commerce',
  congress: 'Congress',
  crimeLaw: 'Crime & Law',
  economyFinance: 'Economy & Finance',
  education: 'Education',
  emergencyMgmt: 'Emergency Mgmt',
  energy: 'Energy',
  environment: 'Environment',
  families: 'Families',
  bankingFinance: 'Banking & Finance',
  trade: 'Trade',
  government: 'Government',
  health: 'Health',
  housing: 'Housing',
  immigration: 'Immigration',
  foreignAffairs: 'Foreign Affairs',
  labor: 'Labor',
  law: 'Law',
  nativeIssues: 'Native Issues',
  publicLands: 'Public Lands',
  scienceTech: 'Science & Tech',
  socialWelfare: 'Social Welfare',
  sportsRecreation: 'Sports & Recreation',
  taxes: 'Taxes',
  transportation: 'Transportation',
  waterResources: 'Water Resources'
};

// Map site issue categories back to policy interest keys
export const SITE_CATEGORY_TO_POLICY_INTEREST: Record<SiteIssueCategory, string> = {
  'Agriculture & Food': 'agricultureFood',
  'Animals': 'animals',
  'Defense & Security': 'defenseSecurity',
  'Arts & Culture': 'artsCulture',
  'Civil Rights': 'civilRights',
  'Commerce': 'commerce',
  'Congress': 'congress',
  'Crime & Law': 'crimeLaw',
  'Economy & Finance': 'economyFinance',
  'Education': 'education',
  'Emergency Mgmt': 'emergencyMgmt',
  'Energy': 'energy',
  'Environment': 'environment',
  'Families': 'families',
  'Banking & Finance': 'bankingFinance',
  'Trade': 'trade',
  'Government': 'government',
  'Health': 'health',
  'Housing': 'housing',
  'Immigration': 'immigration',
  'Foreign Affairs': 'foreignAffairs',
  'Labor': 'labor',
  'Law': 'law',
  'Native Issues': 'nativeIssues',
  'Public Lands': 'publicLands',
  'Science & Tech': 'scienceTech',
  'Social Welfare': 'socialWelfare',
  'Sports & Recreation': 'sportsRecreation',
  'Taxes': 'taxes',
  'Transportation': 'transportation',
  'Water Resources': 'waterResources'
};

/**
 * Get user's interest level for a specific site category
 */
export function getUserInterestForCategory(
  policyInterests: Record<string, number> | undefined,
  category: SiteIssueCategory
): number {
  if (!policyInterests) return 2; // Default to neutral
  
  const interestKey = SITE_CATEGORY_TO_POLICY_INTEREST[category];
  return policyInterests[interestKey] ?? 2;
}

// Map Legiscan subject names to our site's issue categories
// Based on the extracted subjects from state bills
export const LEGISCAN_SUBJECT_TO_SITE_CATEGORY: Record<string, SiteIssueCategory> = {
  // Energy
  'Energy': 'Energy',
  'ENERGY/CONSERVATION': 'Energy',
  'Energy Matters': 'Energy',
  'Renewable Energy': 'Energy',

  // Environment
  'Environmental Protection': 'Environment',
  'Forestry': 'Environment',
  'Wildlife': 'Environment',
  'Natural Resources': 'Environment',
  'Pollution Control': 'Environment',

  // Water Resources
  'Water Resources': 'Water Resources',
  'Water': 'Water Resources',

  // Animals
  'Animals': 'Animals',

  // Public Lands
  'Parks and Recreation': 'Public Lands',
  'Public Lands': 'Public Lands',

  // Crime & Law
  'CRIME/SEX OFFENSES': 'Crime & Law',
  'CRIMINAL RECORDS': 'Crime & Law',
  'Crimes': 'Crime & Law',
  'Crimes and Punishments': 'Crime & Law',
  'Crimes, Corrections, and Law Enforcement': 'Crime & Law',
  'Crimes, Corrections, and Law Enforcement : Crime and Punishment': 'Crime & Law',
  'Crimes, Corrections, and Law Enforcement : Criminal Records Checks': 'Crime & Law',
  'Crimes, Corrections, and Law Enforcement : Firearms': 'Crime & Law',
  'Crimes, Corrections, and Law Enforcement : Sealing or Expungement': 'Crime & Law',
  'Criminal Law - Substantive Crimes': 'Crime & Law',
  'Criminal Procedure': 'Crime & Law',
  'Law Enforcement': 'Crime & Law',
  'Corrections Impact': 'Crime & Law',
  'Corrections and Correctional Facilities, State': 'Crime & Law',
  'Jails and Jailers': 'Crime & Law',
  'Juvenile Offenders': 'Crime & Law',
  'Concealed Carry': 'Crime & Law',
  'Company Police': 'Crime & Law',
  'Detention': 'Crime & Law',
  'Child Abuse and Neglect': 'Crime & Law',

  // Law
  'Courts': 'Law',
  'Courts, Supreme Court of Tennessee': 'Law',
  'JUSTICE OF THE PEACE': 'Law',
  'Judges': 'Law',

  // Defense & Security
  'Military': 'Defense & Security',
  'Veterans': 'Defense & Security',
  'National Guard': 'Defense & Security',
  'Homeland Security': 'Defense & Security',

  // Emergency Mgmt
  'Emergency Management': 'Emergency Mgmt',
  'EMERGENCY MANAGEMENT, TEXAS DIVISION OF': 'Emergency Mgmt',
  'Emergency Services': 'Emergency Mgmt',
  'Emergency Services and Vehicles': 'Emergency Mgmt',
  'Disaster': 'Emergency Mgmt',
  'Disaster Preparedness & Relief': 'Emergency Mgmt',
  'ALERT SYSTEM': 'Emergency Mgmt',
  'FLOODS': 'Emergency Mgmt',

  // Civil Rights
  'Civil Rights': 'Civil Rights',
  'Civil rights: privacy': 'Civil Rights',
  'Human Trafficking': 'Civil Rights',

  // Native Issues
  'Indian Tribes': 'Native Issues',
  'Native Americans': 'Native Issues',

  // Commerce
  'Commerce': 'Commerce',
  'Commercial Law': 'Commerce',
  'COMMERCIAL LAW -- GENERAL REGULATORY PROVISIONS': 'Commerce',
  'Consumer Protection': 'Commerce',
  'Economic Development': 'Commerce',

  // Economy & Finance
  'Economics and public finance': 'Economy & Finance',
  'Fiscal Policy & Taxes': 'Economy & Finance',
  'Currency & Coins': 'Economy & Finance',
  'APPROPRIATIONS': 'Economy & Finance',
  'Appropriations': 'Economy & Finance',
  'Appropriation Process': 'Economy & Finance',
  'Appropriation Extension ($)': 'Economy & Finance',
  'CAPITAL OUTLAY': 'Economy & Finance',
  'Capital, State': 'Economy & Finance',
  'Budgeting': 'Economy & Finance',
  'Debt': 'Economy & Finance',

  // Labor
  'Employment': 'Labor',
  'Labor: benefits': 'Labor',
  'Labor: hours and wages': 'Labor',
  'Job Training': 'Labor',

  // Agriculture & Food
  'Agriculture Animal Care and Food': 'Agriculture & Food',
  'Commerce, Economic Development and Agriculture': 'Agriculture & Food',
  'Gaming: lottery': 'Agriculture & Food',

  // Housing
  'Housing and Real Property': 'Housing',
  'Housing and Real Property : Real Estate Transactions': 'Housing',
  'Homeowners Associations': 'Housing',

  // Banking & Finance
  'Finance': 'Banking & Finance',
  'Finance and Appropriations': 'Banking & Finance',
  'Insurance': 'Banking & Finance',
  'INSURANCE, TEXAS DEPARTMENT OF': 'Banking & Finance',

  // Transportation
  'Airports': 'Transportation',
  'Transportation': 'Transportation',
  'Highways': 'Transportation',
  'Department Of Transportation (adot)': 'Transportation',
  'Adot (see Also: Department Of Transportation)': 'Transportation',

  // Education
  'Education': 'Education',
  'Education : Primary and Secondary Education': 'Education',
  'Education Boards': 'Education',
  'Education, Finance': 'Education',
  'Education, Higher': 'Education',
  'Education, State Board Of': 'Education',
  'Education, Vocational': 'Education',
  'Education: financing': 'Education',
  'Elementary Education': 'Education',
  'K-12 Education': 'Education',
  'Kindergarten': 'Education',
  'Higher Education': 'Education',
  'Colleges & Universities': 'Education',
  'Health Education': 'Education',
  'Graduates': 'Education',

  // Health
  'Health': 'Health',
  'HEALTH & HUMAN SERVICES COMMISSION': 'Health',
  'Health And Safety': 'Health',
  'Health Occupations': 'Health',
  'Health and Human Services : Health Care': 'Health',
  'Health and Medical Services': 'Health',
  'Health--Emergency Services & Personnel': 'Health',
  'Behavioral Health': 'Health',
  'Behavioral Health Examiners': 'Health',
  'Behavioral Health Licensure': 'Health',
  'Board Of Behavioral Health Examiners': 'Health',
  'Diseases & Health Disorders': 'Health',
  'Mental Health': 'Health',
  'Public Health': 'Health',
  'Alcohol': 'Health',
  'Aging': 'Health',
  'Aging and Human Services': 'Health',

  // Immigration
  'Immigration': 'Immigration',
  'Citizenship': 'Immigration',

  // Foreign Affairs
  'International Trade': 'Foreign Affairs',
  'Foreign Relations': 'Foreign Affairs',

  // Government
  'Government Administration': 'Government',
  'Government Employees': 'Government',
  'Government Operations (State Issues)': 'Government',
  'Government operations and politics': 'Government',
  'Governor': 'Government',
  'Governor -- Bills Requested By': 'Government',
  'Legislative Agencies': 'Government',
  'Legislative Committees': 'Government',
  'Legislative Operations': 'Government',
  'Legislators': 'Government',
  'Legislature': 'Government',
  'Federal Government': 'Government',
  'HOUSE OF REPRESENTATIVES, US': 'Government',
  'Constitution, Us': 'Government',
  'ELECTIONS': 'Government',
  'Elections': 'Government',
  'Elections And Electors - Title 16': 'Government',
  'Campaigns': 'Government',
  'Ethics': 'Government',
  'Administrative Code': 'Government',
  'Administrative Rules': 'Government',
  'Bills and Joint Resolutions Signed by the Governor': 'Government',
  'Boards': 'Government',
  'Counties': 'Government',
  'Counties Cities and Towns': 'Government',
  'Counties: other': 'Government',
  'County Board': 'Government',
  'County Commissioners': 'Government',
  'Cities: other': 'Government',
  'City Councils': 'Government',
  'Committees and Commissions': 'Government',
  'Charters': 'Government',

  // Arts & Culture
  'Religion': 'Arts & Culture',

  // Science & Tech
  'Artificial Intelligence': 'Science & Tech',
  'BROADBAND NETWORKS': 'Science & Tech',
  'Electronic Communication': 'Science & Tech',
  'Electronic Information Systems': 'Science & Tech',
  'INFORMATION TECHNOLOGY SERVICES': 'Science & Tech',
  'Digital Images': 'Science & Tech',
  'Technology': 'Science & Tech',

  // Families
  'Adoption': 'Families',
  'Children': 'Families',
  'Children (4-12)': 'Families',
  'Children and Minors': 'Families',
  'Health and Human Services : Child Care': 'Families',
  'Domestic Relations': 'Families',
  'Families': 'Families',

  // Social Welfare
  'Social Welfare': 'Social Welfare'
};

/**
 * Maps a Legiscan subject to our site's issue categories
 * Returns the mapped category or null if no mapping found
 */
export function mapLegiscanSubjectToSiteCategory(subject: string | undefined): SiteIssueCategory | null {
  if (!subject) return null;
  
  // Direct mapping
  const mappedCategory = LEGISCAN_SUBJECT_TO_SITE_CATEGORY[subject];
  if (mappedCategory) return mappedCategory;
  
  // Partial matching for subjects that might have variations
  const lowerSubject = subject.toLowerCase();
  
  // Find a partial match
  for (const [mappedSubject, category] of Object.entries(LEGISCAN_SUBJECT_TO_SITE_CATEGORY)) {
    if (lowerSubject.includes(mappedSubject.toLowerCase()) || 
        mappedSubject.toLowerCase().includes(lowerSubject)) {
      return category;
    }
  }
  
  return null;
}

/**
 * Get all Legiscan subjects that map to a specific site category
 */
export function getLegiscanSubjectsForSiteCategory(category: SiteIssueCategory): string[] {
  return Object.entries(LEGISCAN_SUBJECT_TO_SITE_CATEGORY)
    .filter(([_, siteCategory]) => siteCategory === category)
    .map(([subject]) => subject);
}