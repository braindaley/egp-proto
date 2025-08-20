import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase';

/**
 * Links a previously sent message to a newly created user account
 * This is called after a verified user creates an account
 */
export async function linkPendingMessageToUser(userId: string) {
  try {
    // Check for pending message data in sessionStorage
    const pendingMessageId = sessionStorage.getItem('pendingMessageId');
    const pendingMessageData = sessionStorage.getItem('pendingMessageData');
    
    if (!pendingMessageId) {
      console.log('No pending message to link');
      return false;
    }
    
    const db = getFirestore(app);
    
    // Update the message document to link it to the user
    const messageRef = doc(db, 'user_messages', pendingMessageId);
    await updateDoc(messageRef, {
      userId: userId,
      linkedToAccount: true,
      linkedAt: new Date()
    });
    
    // Clear the pending message data from sessionStorage
    sessionStorage.removeItem('pendingMessageId');
    sessionStorage.removeItem('pendingMessageData');
    sessionStorage.removeItem('verifiedUser'); // Also clear verified user data
    
    console.log(`Successfully linked message ${pendingMessageId} to user ${userId}`);
    return true;
  } catch (error) {
    console.error('Error linking pending message to user:', error);
    return false;
  }
}

/**
 * Checks if there's a pending message that needs to be linked
 */
export function hasPendingMessage(): boolean {
  if (typeof window === 'undefined') return false;
  return !!sessionStorage.getItem('pendingMessageId');
}

/**
 * Gets the pending message data if it exists
 */
export function getPendingMessageData() {
  if (typeof window === 'undefined') return null;
  
  const data = sessionStorage.getItem('pendingMessageData');
  if (!data) return null;
  
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}