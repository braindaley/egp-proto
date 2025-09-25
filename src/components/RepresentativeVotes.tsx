'use client';

import { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, MinusCircle, AlertCircle, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useMembersByZip } from '@/hooks/useMembersByZip';
import { useZipCode } from '@/hooks/use-zip-code';

interface RepresentativeVote {
  name: string;
  party: string;
  state: string;
  district?: string;
  vote: 'Yea' | 'Nay' | 'Present' | 'Not Voting' | null;
  bioguideId?: string;
}

interface RepresentativeVotesProps {
  congress: string;
  billType: string;
  billNumber: string;
  latestAction?: any;
  actions?: any;
}

export function RepresentativeVotes({
  congress,
  billType,
  billNumber,
  latestAction,
  actions
}: RepresentativeVotesProps) {
  const { zipCode } = useZipCode();
  const { representatives, isLoading: repsLoading, error: repsError } = useMembersByZip();
  const [votes, setVotes] = useState<RepresentativeVote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voteInfo, setVoteInfo] = useState<any>(null);

  console.log('[RepresentativeVotes] 🔥 Component rendered with:', {
    congress,
    billType,
    billNumber,
    zipCode,
    repsCount: representatives?.length,
    timestamp: new Date().toISOString()
  });

  useEffect(() => {
    const fetchVotes = async () => {
      console.log('[RepresentativeVotes] 📊 fetchVotes called with:', {
        repsCount: representatives?.length,
        billType,
        hasLatestAction: !!latestAction,
        hasActions: !!actions?.items,
        actionsCount: actions?.items?.length
      });

      // Only fetch votes if we have representatives and this is a House bill
      if (!representatives || representatives.length === 0 || billType?.toUpperCase() !== 'HR') {
        console.log('[RepresentativeVotes] ❌ Skipping vote fetch - no reps or not HR bill');
        return;
      }

      console.log('[RepresentativeVotes] ✅ Starting vote fetch...');

      // Debug: Log the actual actions data structure
      console.log('[RepresentativeVotes] 🔍 Latest action structure:', JSON.stringify(latestAction, null, 2));
      console.log('[RepresentativeVotes] 🔍 Actions structure (first 3):', JSON.stringify(actions?.items?.slice(0, 3), null, 2));

      // Extract roll call information from actions using Congress.gov API data
      let rollCall: string | null = null;
      let actionDate: string | null = null;

      // First check latest action for rollCallNumber or recordedVotes
      if (latestAction?.rollCallNumber) {
        rollCall = latestAction.rollCallNumber;
        actionDate = latestAction?.actionDate || latestAction?.date;
        console.log('[RepresentativeVotes] ✅ Found roll call in latest action:', rollCall);
      } else if (latestAction?.recordedVotes?.[0]?.rollNumber) {
        rollCall = latestAction.recordedVotes[0].rollNumber.toString();
        actionDate = latestAction?.actionDate || latestAction?.date;
        console.log('[RepresentativeVotes] ✅ Found roll call in latest action recordedVotes:', rollCall);
      } else if (actions?.items) {
        console.log('[RepresentativeVotes] 🔍 Checking actions for rollCallNumber or recordedVotes, count:', actions.items.length);

        // Look for the original House passage vote first (prioritize "On passage" over amendments)
        let passageRollCall = null;
        let fallbackRollCall = null;

        for (const action of actions.items) {
          let currentRollCall = null;
          let currentDate = action.actionDate || action.date;

          // Extract roll call number
          if (action.rollCallNumber) {
            currentRollCall = action.rollCallNumber;
          } else if (action.recordedVotes?.[0]?.rollNumber) {
            currentRollCall = action.recordedVotes[0].rollNumber.toString();
          }

          if (currentRollCall) {
            console.log('[RepresentativeVotes] 🔍 Found roll call:', currentRollCall, 'Text:', action.text);

            // Check if this is a passage vote (prioritize these)
            if (action.text?.toLowerCase().includes('on passage') ||
                action.text?.toLowerCase().includes('passed by the yeas and nays')) {
              passageRollCall = currentRollCall;
              actionDate = currentDate;
              console.log('[RepresentativeVotes] ✅ Found PASSAGE roll call:', currentRollCall);
              break; // Prioritize passage votes
            } else {
              // Store as fallback if no passage vote is found
              if (!fallbackRollCall) {
                fallbackRollCall = currentRollCall;
                if (!actionDate) actionDate = currentDate;
                console.log('[RepresentativeVotes] 📝 Stored fallback roll call:', currentRollCall);
              }
            }
          }
        }

        // Use passage vote if found, otherwise use fallback
        rollCall = passageRollCall || fallbackRollCall;
        if (rollCall) {
          console.log('[RepresentativeVotes] ✅ Selected roll call:', rollCall, passageRollCall ? '(PASSAGE)' : '(FALLBACK)');
        }
      }

      if (!rollCall) {
        console.log('[RepresentativeVotes] ❌ No rollCallNumber found, trying vote search...');

        // Alternative approach: fetch all House votes and look for this bill
        try {
          const allVotesResponse = await fetch(`/api/congress/house-votes?congress=${congress}&billType=${billType}&billNumber=${billNumber}`);
          if (allVotesResponse.ok) {
            const votesData = await allVotesResponse.json();
            if (votesData.rollCall) {
              rollCall = votesData.rollCall;
              console.log('[RepresentativeVotes] ✅ Found roll call via bill search:', rollCall);
            }
          }
        } catch (err) {
          console.log('[RepresentativeVotes] ❌ Alternative vote search failed:', err);
        }

        if (!rollCall) {
          console.log('[RepresentativeVotes] ❌ No votes found for this bill');
          return;
        }
      }

      // Determine session based on year/date if available
      let session = '1';
      if (actionDate) {
        const year = new Date(actionDate).getFullYear();
        // Even years are typically session 2
        session = year % 2 === 0 ? '2' : '1';
      }

      setLoading(true);
      setError(null);

      try {
        console.log('[RepresentativeVotes] 🗳️ Fetching vote data for roll call:', rollCall, 'session:', session);
        const response = await fetch(
          `/api/congress/house-vote?congress=${congress}&session=${session}&rollCall=${rollCall}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch vote data');
        }

        const data = await response.json();
        console.log('[RepresentativeVotes] 📊 Vote data received:', {
          hasVote: !!data.vote,
          rollCall: data.vote?.rollCall,
          positionsCount: data.positions?.length
        });
        setVoteInfo(data.vote);

        // Find House representatives only
        const houseReps = representatives.filter(rep =>
          rep.officeTitle?.includes('House of Representatives')
        );
        console.log('[RepresentativeVotes] 🏛️ House reps found:', houseReps.length);

        // Match our representatives with their votes
        const repVotes: RepresentativeVote[] = houseReps.map(rep => {
          const votePosition = data.positions?.find((pos: any) =>
            pos.bioguideID === rep.bioguideId ||  // API uses bioguideID (capital D)
            pos.bioguideId === rep.bioguideId ||  // fallback for other formats
            pos.name === rep.name ||
            (pos.name && rep.name && pos.name.toLowerCase().includes(rep.name.toLowerCase().split(' ').pop()))
          );

          console.log('[RepresentativeVotes] 🔄 Matching rep:', rep.name, 'Found vote:', votePosition?.voteCast || votePosition?.vote_position);

          return {
            name: rep.name,
            party: rep.party,
            state: votePosition?.voteState || votePosition?.state || 'Unknown',  // API uses voteState
            district: rep.districtNumber?.toString(),
            vote: votePosition?.voteCast || votePosition?.vote_position || null,  // API uses voteCast
            bioguideId: rep.bioguideId
          };
        });

        console.log('[RepresentativeVotes] 📋 Final votes to display:', repVotes);
        setVotes(repVotes);
      } catch (err) {
        console.error('[RepresentativeVotes] ❌ Error fetching votes:', err);
        setError('Unable to load voting information');
      } finally {
        setLoading(false);
      }
    };

    fetchVotes();
  }, [representatives, congress, billType, billNumber, latestAction, actions]);

  // Don't show anything if not a House bill
  if (billType?.toUpperCase() !== 'HR') {
    return null;
  }

  // Show a message if no zip code is set
  if (!zipCode) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="text-primary" />
            Your Representative's Vote
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
            <p className="text-sm text-gray-700">
              Please set your ZIP code to see how your representative voted on this bill.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (repsLoading || loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="text-primary" />
            Your Representative's Vote
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // No votes found
  if (votes.length === 0) {
    console.log('[RepresentativeVotes] 📋 Showing no votes message. Debug:', {
      votesLength: votes.length,
      hasReps: representatives?.length > 0,
      repsCount: representatives?.length,
      loading,
      error
    });

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="text-primary" />
            Your Representative's Vote
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
            <p className="text-sm text-gray-600">
              No recorded vote found for this bill, or your representative did not vote.
            </p>
            <div className="mt-2 text-xs text-gray-500">
              Debug: Reps: {representatives?.length || 0}, Votes: {votes.length}, Loading: {loading.toString()}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render vote icons
  const renderVoteIcon = (vote: string | null) => {
    switch (vote) {
      case 'Yea':
      case 'Aye':
        return <ThumbsUp className="h-5 w-5 text-black" />;
      case 'Nay':
      case 'No':
        return <ThumbsDown className="h-5 w-5 text-black" />;
      case 'Present':
        return <MinusCircle className="h-5 w-5 text-gray-500" />;
      case 'Not Voting':
      case null:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getVoteColor = (vote: string | null) => {
    switch (vote) {
      case 'Yea':
      case 'Aye':
        return 'bg-gray-100 text-black border-gray-300';
      case 'Nay':
      case 'No':
        return 'bg-gray-200 text-black border-gray-400';
      case 'Present':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      case 'Not Voting':
      case null:
        return 'bg-gray-50 text-gray-600 border-gray-200';
      default:
        return 'bg-white text-gray-500 border-gray-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <User className="text-primary" />
          Your Representative's Vote
        </CardTitle>
        {voteInfo && (
          <p className="text-sm text-muted-foreground mt-1">
            Roll Call #{voteInfo.rollCall} • {new Date(voteInfo.date).toLocaleDateString()}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {votes.map((rep, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                rep.vote ? getVoteColor(rep.vote) : 'border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center">
                  {renderVoteIcon(rep.vote)}
                </div>
                <div>
                  <p className="font-semibold text-sm">{rep.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {rep.party} - District {rep.district}
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className="font-semibold text-black"
              >
                {rep.vote || 'No Vote Recorded'}
              </Badge>
            </div>
          ))}
        </div>
        {error && (
          <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-md">
            <p className="text-sm text-gray-700">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}