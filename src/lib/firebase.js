import { initializeApp } from 'firebase/app';
import {
  browserLocalPersistence,
  getAuth,
  initializeAuth,
  indexedDBLocalPersistence,
} from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentSingleTabManager,
} from 'firebase/firestore';

// The web config is safe to ship — it identifies the project rather than
// granting access. Real authorisation lives in firestore.rules. Env vars are
// supported so the app can be pointed at a different project without a code
// change, falling back to the production `fitomii` project.
// `import.meta.env` only exists under Vite. Reading it optionally keeps this
// module loadable outside the bundler — which is what lets the integration
// tests exercise the real data layer in Node instead of a mock of it.
const env = import.meta.env ?? {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || 'AIzaSyDSNKoP3LYQzIfpcidsQgMXYlt2NZJjikQ',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'fitomii.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'fitomii',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'fitomii.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '586069946450',
  appId: env.VITE_FIREBASE_APP_ID || '1:586069946450:web:584d05f79c5a9667626f8b',
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || 'G-J6K6NDZ46X',
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
// 50k daily document reads: repeat reads of the profile and history are served
// from IndexedDB instead of billing a read.
//
// It needs IndexedDB, which is missing or blocked in Firefox private windows,
// some in-app browsers and any non-browser runtime. The SDK detects that and
// downgrades to an in-memory cache on its own, so no guard is needed here: the
// app still works in those environments, it just pays a read where it would
// otherwise have hit the cache.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentSingleTabManager() }),
  ignoreUndefinedProperties: true,
});

export default app;
