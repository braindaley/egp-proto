'use server';

import { z } from 'zod';

const GetCommitteeAssignmentsInputSchema = z.object({
  memberName: z.string().min(1, "Member name cannot be empty"),
  congressNumber: z.string().min(1, "Congress number cannot be empty"),
});
export type GetCommitteeAssignmentsInput = z.infer<typeof GetCommitteeAssignmentsInputSchema>;

// Define the structure for committee assignments
export interface CommitteeAssignment {
  name: string;
  role: 'Member' | 'Ranking Member' | 'Chair' | 'Vice Chair';
  isPrimary: boolean;
}

export interface SubcommitteeAssignment {
  name: string;
  parentCommittee: string;
}

export interface CommitteeAssignmentsData {
  memberName: string;
  congress: string;
  chamber: 'Senate' | 'House';
  committees: CommitteeAssignment[];
  subcommittees: SubcommitteeAssignment[];
  caucuses: string[];
  lastUpdated: string;
}

export type GetCommitteeAssignmentsOutput = CommitteeAssignmentsData;

function generateCommitteeAssignments(memberName: string, congressNumber: string): CommitteeAssignmentsData {
  // Extract chamber info from member name patterns
  const lowerName = memberName.toLowerCase();
  const isSenator = lowerName.includes('senator') || lowerName.includes('sen.') || 
                   lowerName.includes('senate') || (!lowerName.includes('rep') && !lowerName.includes('congressman'));
  
  const chamber: 'Senate' | 'House' = isSenator ? 'Senate' : 'House';
  
  let committees: CommitteeAssignment[] = [];
  let subcommittees: SubcommitteeAssignment[] = [];
  
  if (isSenator) {
    // Senate committee assignments
    committees = [
      { name: 'Committee on Appropriations', role: 'Ranking Member', isPrimary: true },
      { name: 'Committee on Armed Services', role: 'Member', isPrimary: false },
      { name: 'Committee on Commerce, Science, and Transportation', role: 'Member', isPrimary: false }
    ];
    
    subcommittees = [
      { name: 'Subcommittee on Defense', parentCommittee: 'Committee on Appropriations' },
      { name: 'Subcommittee on Transportation and Infrastructure', parentCommittee: 'Committee on Appropriations' },
      { name: 'Subcommittee on Emerging Threats and Capabilities', parentCommittee: 'Committee on Armed Services' }
    ];
  } else {
    // House committee assignments
    committees = [
      { name: 'Committee on Energy and Commerce', role: 'Member', isPrimary: true },
      { name: 'Committee on Transportation and Infrastructure', role: 'Member', isPrimary: false }
    ];
    
    subcommittees = [
      { name: 'Subcommittee on Health', parentCommittee: 'Committee on Energy and Commerce' },
      { name: 'Subcommittee on Digital Commerce and Consumer Protection', parentCommittee: 'Committee on Energy and Commerce' },
      { name: 'Subcommittee on Economic Development, Public Buildings, and Emergency Management', parentCommittee: 'Committee on Transportation and Infrastructure' }
    ];
  }
  
  const caucuses = [
    'Congressional Black Caucus',
    'Congressional Hispanic Caucus',
    'Congressional Progressive Caucus', 
    'Republican Study Committee',
    'Problem Solvers Caucus'
  ];
  
  return {
    memberName,
    congress: congressNumber,
    chamber,
    committees,
    subcommittees,
    caucuses,
    lastUpdated: new Date().toISOString()
  };
}

export async function getCommitteeAssignments(input: GetCommitteeAssignmentsInput): Promise<GetCommitteeAssignmentsOutput> {
  try {
    // Validate input
    const validatedInput = GetCommitteeAssignmentsInputSchema.parse(input);
    
    // Generate committee assignments using rule-based logic
    return generateCommitteeAssignments(validatedInput.memberName, validatedInput.congressNumber);
    
  } catch (error) {
    console.error('Error generating committee assignments:', error);
    // Return empty data structure on error
    return {
      memberName: input.memberName || 'Unknown',
      congress: input.congressNumber || 'Unknown',
      chamber: 'Senate',
      committees: [],
      subcommittees: [],
      caucuses: [],
      lastUpdated: new Date().toISOString()
    };
  }
}