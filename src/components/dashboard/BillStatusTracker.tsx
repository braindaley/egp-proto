
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface BillStatusTrackerProps {
  userId: string;
}

const BillStatusTracker: React.FC<BillStatusTrackerProps> = ({ userId }) => {
  const [trackedBills, setTrackedBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock fetching tracked bills
    setLoading(true);
    const mockData = [
      {
        id: 'hr-123',
        title: 'Example Bill Title',
        status: 'Introduced',
        timeline: [
          { step: 'Introduced', date: '2024-01-15' },
          { step: 'In Committee', date: '2024-02-01' },
        ],
        votes: [
          { representative: 'B001234', vote: 'Yea' },
        ],
        impact: {
          contacts: 1250,
          user_contacts: 1,
        }
      }
    ];
    setTrackedBills(mockData);
    setLoading(false);
  }, [userId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tracked Bill Status</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Loading bill statuses...</p>
        ) : (
          trackedBills.map(bill => (
            <div key={bill.id} className="mb-6 p-4 border rounded-lg">
              <h3 className="text-lg font-semibold">{bill.title} - <Badge>{bill.status}</Badge></h3>
              
              <div className="my-4">
                <h4 className="font-semibold mb-2">Progress Timeline:</h4>
                <div className="relative pl-6">
                  {bill.timeline.map((step: any, index: number) => (
                     <div key={index} className="flex items-center mb-4">
                       <div className="absolute left-0 w-3 h-3 bg-indigo-500 rounded-full"></div>
                       {index < bill.timeline.length - 1 && <div className="absolute left-1.5 h-full border-l-2 border-indigo-200"></div>}
                       <p className="ml-4">{step.step} - <span className="text-sm text-gray-500">{step.date}</span></p>
                     </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold">Voting Results:</h4>
                <p>Rep. {bill.votes[0].representative}: <Badge variant={bill.votes[0].vote === 'Yea' ? 'default' : 'destructive'}>{bill.votes[0].vote}</Badge></p>
              </div>
              
              <div className="mt-4">
                <h4 className="font-semibold">Impact Metrics:</h4>
                <p>{bill.impact.contacts.toLocaleString()} people have contacted their reps about this bill.</p>
              </div>

            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default BillStatusTracker;
