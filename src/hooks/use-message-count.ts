import { useState, useEffect } from 'react';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';

export function useMessageCount() {
  const { user } = useAuth();
  const [messageCount, setMessageCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMessageCount = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      const db = getFirestore(app);
      
      try {
        const messagesQuery = query(
          collection(db, 'user_messages'),
          where('userId', '==', user.uid)
        );
        
        const querySnapshot = await getDocs(messagesQuery);
        setMessageCount(querySnapshot.size);
      } catch (error) {
        console.error('Error fetching message count:', error);
        setMessageCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchMessageCount();
  }, [user]);

  return { messageCount, loading };
}