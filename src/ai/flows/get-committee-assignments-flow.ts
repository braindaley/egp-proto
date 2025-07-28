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
  isPrimary: boolean; // This will be hard to determine, so we can default it
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
    const committeesUrl = 'https://theunitedstates.io/congress-legislators/committees-current.json';
    const membershipsUrl = 'https://theunitedstates.io/congress-legislators/committee-membership-current.json';

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
    let memberChamber: 'Senate' | 'House' = 'House';

    const allMemberAssignments = Object.entries(memberships)
        .filter(([_, members]) => (members as any[]).some(m => m.bioguide === bioguideId));

    for (const [thomasId, members] of allMemberAssignments) {
        const memberInfo = (members as any[]).find(m => m.bioguide === bioguideId);
        if (!memberInfo) continue;

        const committeeInfo = committees.find(c => c.thomas_id === thomasId);
        if (!committeeInfo) continue;
        
        let role: 'Member' | 'Ranking Member' | 'Chair' | 'Vice Chair' = 'Member';
        if (memberInfo.rank === 1) role = 'Chair';
        if (memberInfo.rank === 2) role = 'Ranking Member';

        if(committeeInfo.type === 'joint') {
            // Skip joint committees for now
            continue;
        }

        if (committeeInfo.chamber === 'senate') memberChamber = 'Senate';
        
        if (committeeInfo.subcommittees && committeeInfo.subcommittees.length > 0) {
            // It's a main committee, add to committees list
             memberCommittees.push({
                name: committeeInfo.name,
                role,
                isPrimary: false, // Cannot determine this from data
                thomasId: committeeInfo.thomas_id,
                chamber: committeeInfo.chamber,
                url: committeeInfo.url
            });
        }
    }
     // Now find subcommittees by iterating through all committees
    for (const mainCommittee of committees) {
        if (!mainCommittee.subcommittees) continue;

        for (const subcommittee of mainCommittee.subcommittees) {
            const subThomasId = subcommittee.thomas_id;
            const subMembership = memberships[subThomasId];
            
            if (subMembership && Array.isArray(subMembership)) {
                const memberInSub = subMembership.find(m => m.bioguide === bioguideId);
                if (memberInSub) {
                    let subRole: 'Member' | 'Ranking Member' | 'Chair' | 'Vice Chair' = 'Member';
                    if (memberInSub.rank === 1) subRole = 'Chair';
                    if (memberInSub.rank === 2) subRole = 'Ranking Member';

                    memberSubcommittees.push({
                        name: subcommittee.name,
                        thomasId: subThomasId,
                        parentCommittee: mainCommittee.name,
                        role: subRole,
                        url: subcommittee.url
                    });
                }
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
