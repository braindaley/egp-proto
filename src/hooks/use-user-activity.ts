import { useState, useEffect } from 'react';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';

interface UserActivityStats {
  supportedCount: number;
  opposedCount: number;
  totalCount: number;
  supportedPercentage: number;
  opposedPercentage: number;
  supportedBills: ActivityBill[];
  opposedBills: ActivityBill[];
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
    opposedBills: []
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
            billMap.set(billKey, {
              billNumber: message.billNumber,
              billType: message.billType?.toUpperCase() || '',
              congress: message.congress,
              billTitle: message.billShortTitle || `${message.billType?.toUpperCase()} ${message.billNumber}`,
              billCurrentStatus: message.billCurrentStatus || 'Unknown',
              latestActionDate: message.latestActionDate || '',
              latestActionText: message.latestActionText || '',
              userStance: message.userStance,
              sentAt: message.sentAt
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
            billMap.set(billKey, {
              billNumber: action.billNumber,
              billType: action.billType?.toUpperCase() || '',
              congress: action.congress,
              billTitle: action.billTitle || `${action.billType?.toUpperCase()} ${action.billNumber}`,
              billCurrentStatus: 'Active', // Default for action-only entries
              latestActionDate: typeof action.timestamp === 'string' ? action.timestamp : 
                (action.timestamp ? new Date(action.timestamp.seconds * 1000).toISOString() : ''),
              latestActionText: `${action.action === 'support' ? 'Supported' : 'Opposed'} this bill`,
              userStance: action.action,
              sentAt: action.timestamp
            });
          }
        });

        const uniqueBills = Array.from(billMap.values());
        
        // Sort by sent date (most recent first)
        uniqueBills.sort((a, b) => {
          const timeA = a.sentAt?.seconds || 0;
          const timeB = b.sentAt?.seconds || 0;
          return timeB - timeA;
        });

        const supportedBills = uniqueBills.filter(bill => bill.userStance === 'support');
        const opposedBills = uniqueBills.filter(bill => bill.userStance === 'oppose');
        
        const supportedCount = supportedBills.length;
        const opposedCount = opposedBills.length;
        const totalCount = supportedCount + opposedCount;

        setActivityStats({
          supportedCount,
          opposedCount,
          totalCount,
          supportedPercentage: totalCount > 0 ? Math.round((supportedCount / totalCount) * 100) : 0,
          opposedPercentage: totalCount > 0 ? Math.round((opposedCount / totalCount) * 100) : 0,
          supportedBills,
          opposedBills
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
          opposedBills: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserActivity();
  }, [user]);

  return { activityStats, loading };
}