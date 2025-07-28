
'use server';

import { z } from 'zod';

const GetCommitteeAssignmentsInputSchema = z.object({
  memberName: z.string().min(1, "Member name cannot be empty"),
  congressNumber: z.string().min(1, "Congress number cannot be empty"),
  bioguideId: z.string().min(1, "Bioguide ID cannot be empty"),
});
export type GetCommitteeAssignmentsInput = z.infer<typeof GetCommitteeAssignmentsInputSchema>;

export interface CommitteeAssignment {
  name: string;
  role: 'Member' | 'Ranking Member' | 'Chair' | 'Vice Chair';
  isPrimary: boolean; 
  thomasId: string;
  chamber: 'House' | 'Senate' | 'Joint';
  url?: string;
}

export interface SubcommitteeAssignment {
  name:string;
  thomasId: string;
  parentCommittee: string;
  role: 'Member' | 'Ranking Member' | 'Chair' | 'Vice Chair';
  url?: string;
}

export interface CommitteeAssignmentsData {
  memberName: string;
  congress: string;
  chamber: 'Senate' | 'House';
  committees: CommitteeAssignment[];
  subcommittees: SubcommitteeAssignment[];
  lastUpdated: string;
  source: string;
}

export type GetCommitteeAssignmentsOutput = CommitteeAssignmentsData;

// --- In-memory cache for committee data ---
interface CommitteeCache {
    committees: any[];
    memberships: any;
    timestamp: number;
}
let committeeCache: CommitteeCache | null = null;
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

async function getCommitteeDataFromSource(): Promise<CommitteeCache> {
    const now = Date.now();
    if (committeeCache && (now - committeeCache.timestamp) < CACHE_DURATION_MS) {
        console.log('Using cached committee data.');
        return committeeCache;
    }

    console.log('Fetching fresh committee data...');
    const committeesUrl = 'https://unitedstates.github.io/congress-legislators/committees-current.json';
    const membershipsUrl = 'https://unitedstates.github.io/congress-legislators/committee-membership-current.json';

    try {
        const [committeesRes, membershipsRes] = await Promise.all([
            fetch(committeesUrl),
            fetch(membershipsUrl)
        ]);

        if (!committeesRes.ok || !membershipsRes.ok) {
            throw new Error('Failed to fetch committee data');
        }

        const committees = await committeesRes.json();
        const memberships = await membershipsRes.json();

        committeeCache = {
            committees,
            memberships,
            timestamp: now
        };

        return committeeCache;
    } catch (error) {
        console.error("Error fetching committee data from source:", error);
        // If fetch fails but we have stale cache, return it. Otherwise, throw.
        if (committeeCache) {
            console.warn("Serving stale cache due to fetch failure.");
            return committeeCache;
        }
        throw error;
    }
}

function processMemberAssignments(
    bioguideId: string, 
    memberName: string, 
    congress: string, 
    cache: CommitteeCache
): CommitteeAssignmentsData {
    
    const { committees, memberships } = cache;
    const memberCommittees: CommitteeAssignment[] = [];
    const memberSubcommittees: SubcommitteeAssignment[] = [];
    let memberChamber: 'Senate' | 'House' = 'House'; // Default to House

    const committeeMap = new Map(committees.map(c => [c.thomas_id, c]));

    for (const thomasId in memberships) {
        const members = memberships[thomasId];
        const memberInfo = members.find((m: any) => m.bioguide === bioguideId);

        if (memberInfo) {
            const committeeInfo = committeeMap.get(thomasId);
            if (!committeeInfo) continue; 

            // Skip joint committees as they are not typically displayed this way
            if (committeeInfo.type === 'joint') continue;

            let role: 'Member' | 'Ranking Member' | 'Chair' | 'Vice Chair' = 'Member';
            if (memberInfo.rank === 1) role = 'Chair';
            if (memberInfo.rank === 2) role = 'Ranking Member';
            
            // Determine chamber from the committee itself, which is more reliable
            if (committeeInfo.chamber && committeeInfo.chamber.toLowerCase() === 'senate') {
                memberChamber = 'Senate';
            } else if (committeeInfo.chamber && committeeInfo.chamber.toLowerCase() === 'house') {
                memberChamber = 'House';
            }
            
            // Check if it's a subcommittee by seeing if it has a parent
            if (committeeInfo.parent_committee_id) {
                const parentCommittee = committeeMap.get(committeeInfo.parent_committee_id);
                memberSubcommittees.push({
                    name: committeeInfo.name,
                    thomasId: committeeInfo.thomas_id,
                    parentCommittee: parentCommittee ? parentCommittee.name : 'Unknown Committee',
                    role: role,
                    url: committeeInfo.url
                });
            } else {
                 // It's a main committee
                memberCommittees.push({
                    name: committeeInfo.name,
                    role: role,
                    isPrimary: false, // This is hard to determine, so default
                    thomasId: committeeInfo.thomas_id,
                    chamber: committeeInfo.chamber,
                    url: committeeInfo.url
                });
            }
        }
    }

    return {
        memberName,
        congress,
        chamber: memberChamber,
        committees: memberCommittees,
        subcommittees: memberSubcommittees,
        lastUpdated: new Date(cache.timestamp).toISOString(),
        source: 'https://theunitedstates.io/congress-legislators/'
    };
}


export async function getCommitteeAssignments(input: GetCommitteeAssignmentsInput): Promise<GetCommitteeAssignmentsOutput> {
  try {
    const validatedInput = GetCommitteeAssignmentsInputSchema.parse(input);
    const committeeDataCache = await getCommitteeDataFromSource();
    
    return processMemberAssignments(
        validatedInput.bioguideId, 
        validatedInput.memberName, 
        validatedInput.congressNumber,
        committeeDataCache
    );
    
  } catch (error) {
    console.error('Error generating committee assignments from live data:', error);
    // Return empty data structure on error
    return {
      memberName: input.memberName || 'Unknown',
      congress: input.congressNumber || 'Unknown',
      chamber: 'House',
      committees: [],
      subcommittees: [],
      lastUpdated: new Date().toISOString(),
      source: 'Error fetching data'
    };
  }
}
