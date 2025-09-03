/**
 * Helper functions for extracting and processing subjects from Legiscan bill data
 */

export interface LegiscanSubject {
  subject_name: string;
  subject_id?: number;
}

export interface LegiscanBillData {
  subjects?: LegiscanSubject[];
  subject_name?: string;
  [key: string]: any;
}

/**
 * Extract all subject names from a Legiscan bill object
 */
export function extractSubjectsFromLegiscanBill(bill: LegiscanBillData): string[] {
  const subjects = new Set<string>();
  
  // Check for subjects array
  if (bill.subjects && Array.isArray(bill.subjects)) {
    bill.subjects.forEach(subject => {
      if (typeof subject === 'string') {
        subjects.add(subject);
      } else if (subject.subject_name) {
        subjects.add(subject.subject_name);
      }
    });
  }
  
  // Check for single subject_name field
  if (bill.subject_name && typeof bill.subject_name === 'string') {
    subjects.add(bill.subject_name);
  }
  
  // Check for other possible subject fields
  if (bill.subject && typeof bill.subject === 'string') {
    subjects.add(bill.subject);
  }
  
  return Array.from(subjects).filter(s => s && s.trim().length > 0);
}

/**
 * Map a Legiscan subject to our app's policy categories
 * Uses fuzzy matching to find the closest match from our existing mappings
 */
export function mapLegiscanSubjectToCategory(subjectName: string): string | null {
  if (!subjectName) return null;
  
  const normalized = subjectName.toLowerCase().trim();
  
  // Basic keyword-based mapping for common Legiscan subjects
  const keywordMappings: Record<string, string> = {
    // Health & Healthcare
    'health': 'Health Policy',
    'healthcare': 'Health Policy',
    'medical': 'Health Policy',
    'medicare': 'Health Policy',
    'medicaid': 'Health Policy',
    'behavioral health': 'Health Policy',
    
    // Education
    'education': 'Education',
    'school': 'Education',
    'university': 'Education',
    'college': 'Education',
    'student': 'Education',
    'teacher': 'Education',
    
    // Criminal Justice & Law Enforcement
    'crime': 'Criminal Justice',
    'criminal': 'Criminal Justice',
    'law enforcement': 'Criminal Justice',
    'police': 'Criminal Justice',
    'corrections': 'Criminal Justice',
    'prison': 'Criminal Justice',
    'sentencing': 'Criminal Justice',
    
    // Economy & Work
    'tax': 'Economy & Work',
    'taxation': 'Economy & Work',
    'budget': 'Economy & Work',
    'economic': 'Economy & Work',
    'business': 'Economy & Work',
    'employment': 'Economy & Work',
    'labor': 'Economy & Work',
    'finance': 'Economy & Work',
    'commerce': 'Economy & Work',
    'revenue': 'Economy & Work',
    'appropriation': 'Economy & Work',
    
    // Transportation
    'transportation': 'Economy & Work',
    'motor vehicle': 'Economy & Work',
    'highway': 'Economy & Work',
    'traffic': 'Economy & Work',
    
    // Technology
    'technology': 'Technology',
    'telecommunications': 'Technology',
    'internet': 'Technology',
    'artificial intelligence': 'Technology',
    'broadband': 'Technology',
    
    // Environment & Energy
    'environment': 'Climate, Energy & Environment',
    'energy': 'Climate, Energy & Environment',
    'renewable energy': 'Climate, Energy & Environment',
    'solar': 'Climate, Energy & Environment',
    'water': 'Climate, Energy & Environment',
    'climate': 'Climate, Energy & Environment',
    
    // Government & Politics
    'government': 'National Conditions',
    'election': 'National Conditions',
    'voting': 'National Conditions',
    'legislature': 'National Conditions',
    'public': 'National Conditions',
    'state government': 'National Conditions',
    
    // Civil Rights & Discrimination
    'civil rights': 'Discrimination & Prejudice',
    'discrimination': 'Discrimination & Prejudice',
    
    // Immigration
    'immigration': 'Immigration & Migration',
    
    // Defense & Security
    'defense': 'Defense & National Security',
    'security': 'Defense & National Security',
    'emergency': 'Defense & National Security',
    
    // International Affairs
    'international': 'International Affairs',
    'foreign': 'International Affairs',
    
    // Religion
    'religion': 'Religion & Government',
    'religious': 'Religion & Government',
  };
  
  // Try to find a matching keyword
  for (const [keyword, category] of Object.entries(keywordMappings)) {
    if (normalized.includes(keyword)) {
      return category;
    }
  }
  
  return null; // Return null if no mapping found
}

/**
 * Process subjects from a Legiscan bill and return categorized subjects
 */
export function processLegiscanBillSubjects(bill: LegiscanBillData) {
  const rawSubjects = extractSubjectsFromLegiscanBill(bill);
  
  const categorizedSubjects = rawSubjects.map(subject => ({
    original: subject,
    category: mapLegiscanSubjectToCategory(subject),
  }));
  
  // Get unique categories
  const uniqueCategories = Array.from(
    new Set(
      categorizedSubjects
        .map(s => s.category)
        .filter(Boolean)
    )
  );
  
  return {
    rawSubjects,
    categorizedSubjects,
    primaryCategory: uniqueCategories[0] || null,
    allCategories: uniqueCategories,
  };
}