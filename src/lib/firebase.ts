
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';

// IMPORTANT: Replace the placeholder values with your actual Firebase project configuration.
// You can find this in your project's settings in the Firebase console.
const firebaseConfig = {
  apiKey: "your_firebase_api_key",
  authDomain: "your_firebase_auth_domain",
  projectId: "your_firebase_project_id",
  storageBucket: "your_firebase_storage_bucket",
  messagingSenderId: "your_firebase_messaging_sender_id",
  appId: "your_firebase_app_id",
};

let app: FirebaseApp;
let auth: Auth;

// Initialize Firebase only if it hasn't been initialized yet.
if (getApps().length === 0) {
  // Check if all placeholder values have been replaced.
  if (Object.values(firebaseConfig).some(value => value.includes('your_firebase_'))) {
    console.error('Firebase config is not set. Please update firebase.ts with your project credentials.');
  }
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

auth = getAuth(app);

export { app, auth };
