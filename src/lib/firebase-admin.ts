import { initializeApp, getApps, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  try {
    // For local development, we'll use the client-side firestore with admin privileges
    // For production, use service account or application default credentials
    
    const isProduction = process.env.NODE_ENV === 'production';
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    
    console.log('🔧 Firebase Admin Init:', {
      isProduction,
      hasServiceAccountKey: !!serviceAccountKey,
      serviceAccountKeyLength: serviceAccountKey?.length || 0
    });
    
    if (serviceAccountKey && isProduction) {
      // Production with service account
      const serviceAccount = JSON.parse(serviceAccountKey);
      initializeApp({
        credential: cert(serviceAccount),
        projectId: 'egut-with-api',
      });
    } else if (isProduction) {
      // Production with application default credentials (Vercel)
      initializeApp({
        credential: applicationDefault(),
        projectId: 'egut-with-api',
      });
    } else {
      // Local development - use service account if available
      if (serviceAccountKey) {
        const serviceAccount = JSON.parse(serviceAccountKey);
        initializeApp({
          credential: cert(serviceAccount),
          projectId: serviceAccount.project_id || 'egut-with-api',
        });
      } else {
        // For local development without service account, 
        // we'll fall back to using the client SDK with proper rules
        console.warn('No Firebase Admin credentials found for local development. Using emulator.');
        initializeApp({
          projectId: 'egut-with-api',
        });
      }
    }
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
    // Don't throw in development - we'll handle this gracefully
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
  }
}

export const adminDb = getFirestore();