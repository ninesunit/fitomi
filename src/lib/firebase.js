import { initializeApp } from 'firebase/app';
import {
  browserLocalPersistence,
  getAuth,
  initializeAuth,
  indexedDBLocalPersistence,
} from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentSingleTabManager } from 'firebase/firestore';

// The web config is safe to ship — it identifies the project rather than
// granting access. Real authorisation lives in firestore.rules. Env vars are
// supported so the app can be pointed at a different project without a code
// change, falling back to the production `fitomii` project.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDSNKoP3LYQzIfpcidsQgMXYlt2NZJjikQ',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'fitomii.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'fitomii',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'fitomii.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '586069946450',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:586069946450:web:584d05f79c5a9667626f8b',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-J6K6NDZ46X',
};

export const app = initializeApp(firebaseConfig);

// initializeAuth with an explicit persistence chain avoids the extra network
// round-trip getAuth() makes on some browsers, and keeps sessions across reloads.
let authInstance;
try {
  authInstance = initializeAuth(app, {
    persistence: [indexedDBLocalPersistence, browserLocalPersistence],
  });
} catch {
  // Already initialised (hot reload) — reuse it.
  authInstance = getAuth(app);
}
export const auth = authInstance;

// The persistent local cache is the single biggest lever on the Spark plan's
// 50k daily document reads: repeat reads of the profile, history and exercise
// metadata are served from IndexedDB instead of billing a read.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentSingleTabManager() }),
  ignoreUndefinedProperties: true,
});

export default app;
