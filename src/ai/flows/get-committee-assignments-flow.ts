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
  name: string;
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
  memberships: Record<string, any[]>;
  timestamp: number;
}
let committeeCache: CommitteeCache | null = null;
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

async function getCommitteeDataFromSource(): Promise<CommitteeCache> {
  const now = Date.now();
  if (committeeCache && now - committeeCache.timestamp < CACHE_DURATION_MS) {
    console.log('Using cached committee data. Timestamp:', new Date(committeeCache.timestamp).toISOString());
    return committeeCache;
  }

  console.log('Fetching fresh committee data...');
  // Use jsDelivr CDN to ensure valid JSON
  const committeesUrl =
    'https://cdn.jsdelivr.net/gh/unitedstates/congress-legislators@gh-pages/committees-current.json';
  const membershipsUrl =
    'https://cdn.jsdelivr.net/gh/unitedstates/congress-legislators@gh-pages/committee-membership-current.json';

  try {
    const [committeesRes, membershipsRes] = await Promise.all([
      fetch(committeesUrl),
      fetch(membershipsUrl),
    ]);

    console.log('Committees fetch status:', committeesRes.status);
    console.log('Memberships fetch status:', membershipsRes.status);

    if (!committeesRes.ok || !membershipsRes.ok) {
      throw new Error(`Failed to fetch committee data: ${committeesRes.status} / ${membershipsRes.status}`);
    }

    const committees = await committeesRes.json();
    const memberships = await membershipsRes.json();

    console.log('Loaded', committees.length, 'committees and', Object.keys(memberships).length, 'membership entries');

    committeeCache = { committees, memberships, timestamp: now };
    return committeeCache;
  } catch (error) {
    console.error('Error fetching committee data from source:', error);
    if (committeeCache) {
      console.warn('Serving stale cache due to fetch failure.');
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

  // Build quick lookup for committees
  const committeeMap = new Map(committees.map((c) => [c.thomas_id, c]));

  for (const thomasId in memberships) {
    const members = memberships[thomasId];
    const memberInfo = members.find((m: any) => m.bioguide === bioguideId);
    if (!memberInfo) continue;

    const committeeInfo = committeeMap.get(thomasId);
    if (!committeeInfo) continue;

    // Skip joint if you don't want them
    if (committeeInfo.type === 'joint') continue;

    let role: 'Member' | 'Ranking Member' | 'Chair' | 'Vice Chair' = 'Member';
    if (memberInfo.rank === 1) role = 'Chair';
    if (memberInfo.rank === 2) role = 'Ranking Member';

    // Determine chamber from committee metadata
    if (committeeInfo.chamber?.toLowerCase() === 'senate') {
      memberChamber = 'Senate';
    } else if (committeeInfo.chamber?.toLowerCase() === 'house') {
      memberChamber = 'House';
    }

    // Subcommittee vs main
    if (committeeInfo.parent_committee_id) {
      const parent = committeeMap.get(committeeInfo.parent_committee_id);
      memberSubcommittees.push({
        name: committeeInfo.name,
        thomasId: committeeInfo.thomas_id,
        parentCommittee: parent ? parent.name : 'Unknown',
        role,
        url: committeeInfo.url,
      });
    } else {
      memberCommittees.push({
        name: committeeInfo.name,
        role,
        isPrimary: false,
        thomasId: committeeInfo.thomas_id,
        chamber: committeeInfo.chamber,
        url: committeeInfo.url,
      });
    }
  }

  console.log(`Member ${bioguideId} has ${memberCommittees.length} committees and ${memberSubcommittees.length} subcommittees`);

  return {
    memberName,
    congress,
    chamber: memberChamber,
    committees: memberCommittees,
    subcommittees: memberSubcommittees,
    lastUpdated: new Date(cache.timestamp).toISOString(),
    source: 'https://unitedstates.github.io/congress-legislators/',
  };
}

export async function getCommitteeAssignments(
  input: GetCommitteeAssignmentsInput
): Promise<GetCommitteeAssignmentsOutput> {
  try {
    const validated = GetCommitteeAssignmentsInputSchema.parse(input);
    const cache = await getCommitteeDataFromSource();
    return processMemberAssignments(
      validated.bioguideId,
      validated.memberName,
      validated.congressNumber,
      cache
    );
  } catch (error) {
    console.error('Error generating committee assignments:', error);
    return {
      memberName: input.memberName || 'Unknown',
      congress: input.congressNumber || 'Unknown',
      chamber: 'House',
      committees: [],
      subcommittees: [],
      lastUpdated: new Date().toISOString(),
      source: 'Error fetching data',
    };
  }
}
