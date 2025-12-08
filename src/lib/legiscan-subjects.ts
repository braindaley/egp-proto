/**
 * Helper functions for extracting and processing subjects from Legiscan bill data
 * Maps LegiScan subjects to the same ALLOWED_SUBJECTS used for federal bills
 */

import { ALLOWED_SUBJECTS, findMatchingAllowedSubject } from './subjects';

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
 * Map a Legiscan subject to our app's ALLOWED_SUBJECTS categories
 * Uses the same mapping logic as federal bills for consistency
 */
export function mapLegiscanSubjectToCategory(subjectName: string): string | null {
  if (!subjectName) return null;

  // Use the same mapping function as federal bills
  return findMatchingAllowedSubject(subjectName);
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

  // Get unique categories (only those that mapped successfully)
  const uniqueCategories = Array.from(
    new Set(
      categorizedSubjects
        .map(s => s.category)
        .filter((c): c is string => c !== null)
    )
  );

  return {
    rawSubjects,
    categorizedSubjects,
    primaryCategory: uniqueCategories[0] || null,
    allCategories: uniqueCategories,
  };
}

/**
 * Get the list of allowed subjects for filtering (same as federal)
 */
export function getAllowedSubjectsForStateFilter() {
  return [...ALLOWED_SUBJECTS].sort();
}
