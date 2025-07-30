
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';

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

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

auth = getAuth(app);

export { app, auth };
