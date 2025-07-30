
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';

// IMPORTANT: Replace the placeholder values with your actual Firebase project configuration.
// You can find this in your project's settings in the Firebase console.
const firebaseConfig = {
  apiKey: "AIzaSyAw8a8-pP4g8IAnSgD-p145q_a5J1y_ClE",
  authDomain: "egp-prototype.firebaseapp.com",
  projectId: "egp-prototype",
  storageBucket: "egp-prototype.appspot.com",
  messagingSenderId: "1098592683074",
  appId: "1:1098592683074:web:e576594d6b63529324e941",
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
