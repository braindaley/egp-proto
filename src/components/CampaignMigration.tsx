'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { getFirestore, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { getAdvocacyGroupData } from '@/lib/advocacy-groups';

const CampaignMigration: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [migrationResult, setMigrationResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleMigrate = async () => {
    if (!user) {
      setError('You must be logged in to migrate campaigns');
      return;
    }

    setIsLoading(true);
    setError(null);
    setMigrationResult(null);

    const db = getFirestore(app);
    const migratedCampaigns = [];
    const errors = [];

    // Define all advocacy group slugs that have campaigns
    const advocacyGroupSlugs = [
      'league-of-women-voters',
      'brennan-center-for-justice', 
      'common-cause',
      'fair-elections-center',
      'fairvote',
      'vote-smart',
      'voteriders',
      'rock-the-vote',
      'mi-familia-vota',
      'black-voters-matter',
      'when-we-all-vote',
      'fair-fight-action',
      'campaign-legal-center',
      'ballotready',
      'democracy-works-turbovote',
      'headcount',
      'state-voices',
      'asian-americans-advancing-justice',
      'naacp-legal-defense-fund',
      'voto-latino',
      'alliance-for-youth-action',
      'national-vote-at-home-institute',
      'national-voter-registration-day',
      'democracy-nc',
      'the-civics-center',
      'no-labels'
    ];

    try {
      for (const groupSlug of advocacyGroupSlugs) {
        try {
          const groupData = getAdvocacyGroupData(groupSlug);
          
          if (!groupData || !groupData.priorityBills) {
            continue;
          }

          for (const priorityBill of groupData.priorityBills) {
            try {
              // Check if campaign already exists for this user and bill
              const existingQuery = query(
                collection(db, 'campaigns'),
                where('userId', '==', user.uid),
                where('billType', '==', priorityBill.bill.type),
                where('billNumber', '==', priorityBill.bill.number)
              );
              
              const existingSnapshot = await getDocs(existingQuery);
              if (!existingSnapshot.empty) {
                console.log(`Campaign already exists for ${priorityBill.bill.type} ${priorityBill.bill.number}`);
                continue;
              }

              // Get bill title from API if possible
              let billTitle = '';
              try {
                const billResponse = await fetch(`/api/bill?congress=${priorityBill.bill.congress}&billType=${priorityBill.bill.type}&billNumber=${priorityBill.bill.number}`);
                if (billResponse.ok) {
                  const billData = await billResponse.json();
                  billTitle = billData.title || '';
                }
              } catch (billError) {
                console.warn(`Could not fetch bill title for ${priorityBill.bill.type} ${priorityBill.bill.number}:`, billError);
              }

              const campaignData = {
                userId: user.uid,
                groupSlug: groupData.slug,
                groupName: groupData.name,
                name: `${groupData.name} - ${priorityBill.bill.type} ${priorityBill.bill.number}`,
                billNumber: priorityBill.bill.number,
                billType: priorityBill.bill.type,
                congress: priorityBill.bill.congress?.toString() || '119',
                billTitle: billTitle,
                stance: priorityBill.position.toLowerCase(),
                position: priorityBill.position,
                reasoning: priorityBill.reasoning || '',
                actionButtonText: priorityBill.actionButtonText || 'Voice your opinion',
                supportCount: priorityBill.supportCount || 0,
                opposeCount: priorityBill.opposeCount || 0,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                migratedFrom: 'advocacy-groups'
              };

              const docRef = await addDoc(collection(db, 'campaigns'), campaignData);
              
              migratedCampaigns.push({
                id: docRef.id,
                groupSlug: groupData.slug,
                billType: priorityBill.bill.type,
                billNumber: priorityBill.bill.number,
                position: priorityBill.position
              });

            } catch (billError) {
              console.error(`Error migrating bill ${priorityBill.bill.type} ${priorityBill.bill.number} for ${groupSlug}:`, billError);
              errors.push(`${groupSlug}: ${priorityBill.bill.type} ${priorityBill.bill.number} - ${billError.message}`);
            }
          }
        } catch (groupError) {
          console.error(`Error processing group ${groupSlug}:`, groupError);
          errors.push(`${groupSlug}: ${groupError.message}`);
        }
      }

      const result = {
        success: true,
        migratedCount: migratedCampaigns.length,
        migratedCampaigns,
        errors: errors.length > 0 ? errors : undefined,
        message: `Successfully migrated ${migratedCampaigns.length} campaigns`
      };

      setMigrationResult(result);
      
      // Refresh the page after successful migration to show new campaigns
      if (result.success && result.migratedCount > 0) {
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      }
    } catch (err) {
      console.error('Migration error:', err);
      setError(err instanceof Error ? err.message : 'Migration failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Card className="mb-6 border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Download className="h-5 w-5" />
          Migrate Existing Campaigns
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-blue-700">
          <p className="mb-2">
            We found existing campaign data from advocacy groups that can be migrated to your personal dashboard.
            This includes campaigns from League of Women Voters, Brennan Center, and other organizations.
          </p>
          <p className="font-medium">
            • 29 campaigns available for migration
          </p>
          <p className="font-medium">
            • Includes HR-14 and HR-22 from League of Women Voters
          </p>
        </div>

        {migrationResult && (
          <div className="p-3 rounded-md bg-green-100 border border-green-200">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">Migration Successful!</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              Migrated {migrationResult.migratedCount} campaigns to your account.
              Page will refresh automatically...
            </p>
            {migrationResult.errors && migrationResult.errors.length > 0 && (
              <details className="mt-2">
                <summary className="text-sm font-medium cursor-pointer">
                  View errors ({migrationResult.errors.length})
                </summary>
                <ul className="text-xs mt-1 space-y-1">
                  {migrationResult.errors.map((error: string, index: number) => (
                    <li key={index} className="text-red-600">• {error}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}

        {error && (
          <div className="p-3 rounded-md bg-red-100 border border-red-200">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Migration Failed</span>
            </div>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        )}

        <Button 
          onClick={handleMigrate}
          disabled={isLoading || !!migrationResult}
          className="w-full"
          variant={migrationResult ? "outline" : "default"}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Migrating campaigns...
            </>
          ) : migrationResult ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Migration Complete
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Migrate All Campaigns to My Account
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default CampaignMigration;