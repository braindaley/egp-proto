import { useState, useEffect } from 'react';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { getBillStatus, type BillStatusCategory } from '@/lib/bill-status-utils';

interface UserActivityStats {
  supportedCount: number;
  opposedCount: number;
  totalCount: number;
  supportedPercentage: number;
  opposedPercentage: number;
  supportedBills: ActivityBill[];
  opposedBills: ActivityBill[];
  // Advocacy effectiveness metrics
  supportedEnacted: number;
  supportedPassed: number;
  opposedEnacted: number;
  opposedPassed: number;
  successRate: number;
  effectivenessScore: number;
}

interface ActivityBill {
  billNumber: string;
  billType: string;
  congress: string;
  billTitle: string;
  billCurrentStatus: string;
  latestActionDate: string;
  latestActionText: string;
  userStance: 'support' | 'oppose';
  sentAt: any;
  // New status fields
  billStatusLabel: string;
  billStatusCategory: BillStatusCategory;
  billStatusDescription: string;
}

export function useUserActivity() {
  const { user } = useAuth();
  const [activityStats, setActivityStats] = useState<UserActivityStats>({
    supportedCount: 0,
    opposedCount: 0,
    totalCount: 0,
    supportedPercentage: 0,
    opposedPercentage: 0,
    supportedBills: [],
    opposedBills: [],
    supportedEnacted: 0,
    supportedPassed: 0,
    opposedEnacted: 0,
    opposedPassed: 0,
    successRate: 0,
    effectivenessScore: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserActivity = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      const db = getFirestore(app);
      
      try {
        // Fetch user messages (existing functionality)
        const messagesQuery = query(
          collection(db, 'user_messages'),
          where('userId', '==', user.uid)
        );
        
        const messagesSnapshot = await getDocs(messagesQuery);
        const messagesData = messagesSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        })) as any[];

        // Fetch user bill actions from localStorage (temporary solution until Firebase rules are updated)
        let actionsData: any[] = [];
        try {
          const localActions = JSON.parse(localStorage.getItem('userBillActions') || '[]');
          actionsData = localActions.filter((action: any) => action.userId === user.uid);
        } catch (localStorageError) {
          console.warn('Could not read from localStorage:', localStorageError);
        }

        // TODO: Uncomment this once Firebase rules are deployed
        /*
        // Fetch user bill actions (new support/oppose clicks)
        const actionsQuery = query(
          collection(db, 'user_bill_actions'),
          where('userId', '==', user.uid)
        );
        
        const actionsSnapshot = await getDocs(actionsQuery);
        const actionsData = actionsSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        })) as any[];
        */

        // Group by bill to avoid duplicates (same bill, multiple messages/actions)
        const billMap = new Map<string, ActivityBill>();
        
        // Process messages data
        messagesData.forEach(message => {
          const billKey = `${message.congress}-${message.billType}-${message.billNumber}`;

          // Only keep the most recent message for each bill
          if (!billMap.has(billKey) ||
              (message.sentAt?.seconds || 0) > (billMap.get(billKey)?.sentAt?.seconds || 0)) {
            const latestActionText = message.latestActionText || '';
            const latestActionDate = message.latestActionDate || '';
            const statusInfo = getBillStatus(latestActionText, latestActionDate);

            billMap.set(billKey, {
              billNumber: message.billNumber,
              billType: message.billType?.toUpperCase() || '',
              congress: message.congress,
              billTitle: message.billShortTitle || `${message.billType?.toUpperCase()} ${message.billNumber}`,
              billCurrentStatus: message.billCurrentStatus || 'Unknown',
              latestActionDate: latestActionDate,
              latestActionText: latestActionText,
              userStance: message.userStance,
              sentAt: message.sentAt,
              billStatusLabel: statusInfo.label,
              billStatusCategory: statusInfo.category,
              billStatusDescription: statusInfo.description
            });
          }
        });

        // Process actions data (support/oppose clicks)
        actionsData.forEach(action => {
          const billKey = `${action.congress}-${action.billType}-${action.billNumber}`;

          // Handle both localStorage timestamp (string) and Firebase timestamp (object)
          const actionTime = typeof action.timestamp === 'string'
            ? new Date(action.timestamp).getTime() / 1000
            : action.timestamp?.seconds || 0;
          const existingTime = billMap.get(billKey)?.sentAt?.seconds ||
            (typeof billMap.get(billKey)?.sentAt === 'string'
              ? new Date(billMap.get(billKey)?.sentAt as string).getTime() / 1000
              : 0);

          // Only keep the most recent action for each bill, or add if not exists
          if (!billMap.has(billKey) || actionTime > existingTime) {
            const latestActionDate = typeof action.timestamp === 'string' ? action.timestamp :
              (action.timestamp ? new Date(action.timestamp.seconds * 1000).toISOString() : '');
            const latestActionText = `${action.action === 'support' ? 'Supported' : 'Opposed'} this bill`;
            const statusInfo = getBillStatus(latestActionText, latestActionDate);

            billMap.set(billKey, {
              billNumber: action.billNumber,
              billType: action.billType?.toUpperCase() || '',
              congress: action.congress,
              billTitle: action.billTitle || `${action.billType?.toUpperCase()} ${action.billNumber}`,
              billCurrentStatus: 'Active', // Default for action-only entries
              latestActionDate: latestActionDate,
              latestActionText: latestActionText,
              userStance: action.action,
              sentAt: action.timestamp,
              billStatusLabel: statusInfo.label,
              billStatusCategory: statusInfo.category,
              billStatusDescription: statusInfo.description
            });
          }
        });

        const uniqueBills = Array.from(billMap.values());

        // Fetch fresh bill data to get current status
        const billDetailsPromises = uniqueBills.map(async (bill) => {
          try {
            const response = await fetch(
              `/api/bill?congress=${bill.congress}&billType=${bill.billType.toLowerCase()}&billNumber=${bill.billNumber}`
            );

            if (response.ok) {
              const billData = await response.json();
              const latestActionText = billData.latestAction?.text || bill.latestActionText;
              const latestActionDate = billData.latestAction?.actionDate || bill.latestActionDate;
              const statusInfo = getBillStatus(latestActionText, latestActionDate);

              return {
                ...bill,
                latestActionText,
                latestActionDate,
                billStatusLabel: statusInfo.label,
                billStatusCategory: statusInfo.category,
                billStatusDescription: statusInfo.description
              };
            }
          } catch (error) {
            console.error(`Error fetching bill details for ${bill.billType} ${bill.billNumber}:`, error);
          }

          // Return original bill if fetch fails
          return bill;
        });

        const billsWithFreshData = await Promise.all(billDetailsPromises);

        // Sort by sent date (most recent first)
        billsWithFreshData.sort((a, b) => {
          const timeA = a.sentAt?.seconds || 0;
          const timeB = b.sentAt?.seconds || 0;
          return timeB - timeA;
        });

        const supportedBills = billsWithFreshData.filter(bill => bill.userStance === 'support');
        const opposedBills = billsWithFreshData.filter(bill => bill.userStance === 'oppose');

        const supportedCount = supportedBills.length;
        const opposedCount = opposedBills.length;
        const totalCount = supportedCount + opposedCount;

        // Calculate advocacy effectiveness metrics
        const supportedEnacted = supportedBills.filter(b => b.billStatusCategory === 'enacted').length;
        const supportedPassed = supportedBills.filter(b => b.billStatusCategory === 'passed' || b.billStatusCategory === 'enacted').length;
        const opposedEnacted = opposedBills.filter(b => b.billStatusCategory === 'enacted').length;
        const opposedPassed = opposedBills.filter(b => b.billStatusCategory === 'passed' || b.billStatusCategory === 'enacted').length;

        // Success rate: % of supported bills that became law
        const successRate = supportedCount > 0 ? Math.round((supportedEnacted / supportedCount) * 100) : 0;

        // Effectiveness score: bills where outcome aligned with stance
        // Supported bills that passed/enacted + Opposed bills that stalled/failed
        const alignedOutcomes = supportedPassed + opposedBills.filter(b => b.billStatusCategory === 'stalled').length;
        const effectivenessScore = totalCount > 0 ? Math.round((alignedOutcomes / totalCount) * 100) : 0;

        setActivityStats({
          supportedCount,
          opposedCount,
          totalCount,
          supportedPercentage: totalCount > 0 ? Math.round((supportedCount / totalCount) * 100) : 0,
          opposedPercentage: totalCount > 0 ? Math.round((opposedCount / totalCount) * 100) : 0,
          supportedBills,
          opposedBills,
          supportedEnacted,
          supportedPassed,
          opposedEnacted,
          opposedPassed,
          successRate,
          effectivenessScore
        });
      } catch (error) {
        console.error('Error fetching user activity:', error);
        setActivityStats({
          supportedCount: 0,
          opposedCount: 0,
          totalCount: 0,
          supportedPercentage: 0,
          opposedPercentage: 0,
          supportedBills: [],
          opposedBills: [],
          supportedEnacted: 0,
          supportedPassed: 0,
          opposedEnacted: 0,
          opposedPassed: 0,
          successRate: 0,
          effectivenessScore: 0
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserActivity();
  }, [user]);

  return { activityStats, loading };
}