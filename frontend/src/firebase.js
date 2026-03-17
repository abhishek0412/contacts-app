import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

const requiredFirebaseKeys = ["apiKey", "authDomain", "projectId", "appId"];

const missingFirebaseKeys = requiredFirebaseKeys.filter(
  (key) => !firebaseConfig[key],
);

export const isFirebaseConfigured = missingFirebaseKeys.length === 0;

if (!isFirebaseConfigured) {
  // eslint-disable-next-line no-console
  console.warn(
    "Firebase is not configured. Missing env vars:",
    missingFirebaseKeys.map((key) => `REACT_APP_FIREBASE_${key.toUpperCase()}`),
  );
}

const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : null;
export const analytics = app ? getAnalytics(app) : null;
export default app;
