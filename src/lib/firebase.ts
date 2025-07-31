
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';

// IMPORTANT: Replace the placeholder values with your actual Firebase project configuration.
// You can find this in your project's settings in the Firebase console.
const firebaseConfig = {
  "projectId": "egut-with-api",
  "appId": "1:891405266254:web:c03357060ea337cb1e421f",
  "storageBucket": "egut-with-api.firebasestorage.app",
  "apiKey": "AIzaSyDpn3QKPct12ZUwFwbLEQolbd4aGD-eyto",
  "authDomain": "egut-with-api.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "891405266254"
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
