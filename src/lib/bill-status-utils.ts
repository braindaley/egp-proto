/**
 * Utility functions for determining bill status from Congress.gov API data
 */

export type BillStatusCategory = 'enacted' | 'passed' | 'active' | 'stalled';

export interface BillStatusInfo {
  label: string;
  category: BillStatusCategory;
  description: string;
}

/**
 * Determines the current status of a bill based on its latest action
 * @param latestActionText - The text of the latest action from the Congress.gov API
 * @param latestActionDate - The date of the latest action
 * @returns BillStatusInfo object with label, category, and description
 */
export function getBillStatus(
  latestActionText: string,
  latestActionDate: string
): BillStatusInfo {
  const actionLower = latestActionText.toLowerCase();

  // Check if bill became law
  if (
    actionLower.includes('became public law') ||
    actionLower.includes('signed by president') ||
    actionLower.includes('signed into law') ||
    actionLower.includes('public law no') ||
    actionLower.includes('became law') ||
    /public law \d+-\d+/.test(actionLower)
  ) {
    return {
      label: 'Became Law',
      category: 'enacted',
      description: 'Signed into law'
    };
  }

  // Check if presented to president
  if (
    actionLower.includes('presented to president') ||
    actionLower.includes('to president')
  ) {
    return {
      label: 'Presented to President',
      category: 'passed',
      description: 'Awaiting presidential signature or veto'
    };
  }

  // Check if passed both chambers
  if (
    actionLower.includes('passed senate') && actionLower.includes('passed house')
  ) {
    return {
      label: 'Passed Both Chambers',
      category: 'passed',
      description: 'Approved by House and Senate'
    };
  }

  // Check if passed one chamber
  if (actionLower.includes('passed senate')) {
    return {
      label: 'Passed Senate',
      category: 'passed',
      description: 'Approved by the Senate'
    };
  }

  if (actionLower.includes('passed house') || actionLower.includes('passed/agreed to in house')) {
    return {
      label: 'Passed House',
      category: 'passed',
      description: 'Approved by the House'
    };
  }

  if (actionLower.includes('passed') || actionLower.includes('agreed to')) {
    return {
      label: 'Passed Chamber',
      category: 'passed',
      description: 'Approved by one chamber of Congress'
    };
  }

  // Check if failed
  if (
    actionLower.includes('failed') ||
    actionLower.includes('rejected') ||
    actionLower.includes('defeated')
  ) {
    return {
      label: 'Failed',
      category: 'stalled',
      description: 'Failed to pass'
    };
  }

  // Check if stalled (no activity in 90+ days)
  const daysSinceAction = latestActionDate
    ? Math.floor((Date.now() - new Date(latestActionDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  if (daysSinceAction > 90) {
    return {
      label: 'Stalled',
      category: 'stalled',
      description: 'No recent activity'
    };
  }

  // Check if in committee
  if (
    actionLower.includes('committee') ||
    actionLower.includes('referred') ||
    actionLower.includes('reported')
  ) {
    return {
      label: 'In Committee',
      category: 'active',
      description: 'Under committee review'
    };
  }

  // Check if in floor debate
  if (
    actionLower.includes('debate') ||
    actionLower.includes('considered') ||
    actionLower.includes('amendment')
  ) {
    return {
      label: 'Floor Debate',
      category: 'active',
      description: 'Being debated on the chamber floor'
    };
  }

  // Default: introduced/active
  return {
    label: 'Active',
    category: 'active',
    description: 'Bill is active in the legislative process'
  };
}

/**
 * Gets a simple status label for display
 */
export function getBillStatusLabel(latestActionText: string, latestActionDate: string): string {
  return getBillStatus(latestActionText, latestActionDate).label;
}

/**
 * Gets the status category for grouping/filtering
 */
export function getBillStatusCategory(latestActionText: string, latestActionDate: string): BillStatusCategory {
  return getBillStatus(latestActionText, latestActionDate).category;
}

/**
 * Gets the badge variant based on bill status category
 */
export function getStatusBadgeVariant(category: BillStatusCategory): 'default' | 'secondary' | 'success' | 'destructive' {
  switch (category) {
    case 'enacted':
      return 'success';
    case 'passed':
      return 'default';
    case 'stalled':
      return 'destructive';
    case 'active':
    default:
      return 'secondary';
  }
}
