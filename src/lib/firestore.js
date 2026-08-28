import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit as fsLimit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { createProfile, hydrateProfile, trimProfile } from './profile';

// ---------------------------------------------------------------------------
// Firestore access layer.
//
// Spark plan budget: 50,000 reads and 20,000 writes per day. Every function
// here is written to keep a normal training day in the low tens of operations:
//   app boot          1 read
//   finish workout    2 writes (profile + session document)
//   history page      1 read per session, paginated, and served from the
//                     persistent IndexedDB cache on revisit
// Nothing writes per set or per rep — the active session lives in React state
// and localStorage until the hunter hits Finish.
// ---------------------------------------------------------------------------

export const userRef = (uid) => doc(db, 'users', uid);
export const workoutsRef = (uid) => collection(db, 'users', uid, 'workouts');
export const routinesRef = (uid) => collection(db, 'users', uid, 'routines');

/** Load the profile, creating it on first sign-in. One read (plus one write once, ever). */
export async function loadProfile(user) {
  const ref = userRef(user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const fresh = createProfile({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email?.split('@')[0] || 'Unnamed Hunter',
      photoURL: user.photoURL,
    });
    await setDoc(ref, { ...fresh, createdAtServer: serverTimestamp() });
    return fresh;
  }

  return hydrateProfile(snap.data(), { uid: user.uid, email: user.email });
}

/**
 * Persist the profile. Callers batch their changes in memory and call this
 * once — never in a loop, and never per set.
 */
export async function saveProfile(uid, profile) {
  const trimmed = trimProfile(profile);
  const { uid: _ignored, ...rest } = trimmed;
  // Server time, not the client's: a device with a wrong (or deliberately
  // wrong) clock must not be able to stamp when its progress happened.
  await setDoc(userRef(uid), { ...rest, uid, updatedAt: serverTimestamp() }, { merge: true });
  return trimmed;
}

/** Patch a few profile fields without rewriting the whole document. */
export async function patchProfile(uid, patch) {
  await updateDoc(userRef(uid), { ...patch, updatedAt: serverTimestamp() });
}

/**
 * Commit a finished session: the full set data goes to the subcollection and
 * the recomputed profile goes to the user document, in a single atomic batch
 * so a half-saved workout can never award XP without recording the sets.
 */
export async function commitWorkout(uid, workout, profile) {
  const batch = writeBatch(db);
  const sessionRef = doc(workoutsRef(uid));

  batch.set(sessionRef, { ...workout, id: sessionRef.id, uid });

  const trimmed = trimProfile(profile);
  const { uid: _ignored, ...rest } = trimmed;
  batch.set(userRef(uid), { ...rest, uid, updatedAt: Date.now() }, { merge: true });

  await batch.commit();
  return { id: sessionRef.id, profile: trimmed };
}

/**
 * Paginated workout history. `cursor` is the last document snapshot seen.
 *
 * There is deliberately no `where('uid','==',uid)` here: the collection is
 * already /users/{uid}/workouts, so the filter would be redundant — and adding
 * an equality filter alongside an orderBy on a different field is exactly what
 * forces a composite index. Without it this runs on Firestore's automatic
 * single-field index, so there is no index to build or deploy.
 */
export async function fetchWorkouts(uid, { pageSize = 20, cursor = null } = {}) {
  const clauses = [orderBy('finishedAt', 'desc'), fsLimit(pageSize)];
  if (cursor) clauses.splice(1, 0, startAfter(cursor));

  const snap = await getDocs(query(workoutsRef(uid), ...clauses));
  return {
    workouts: snap.docs.map((d) => ({ ...d.data(), id: d.id })),
    cursor: snap.docs.length === pageSize ? snap.docs[snap.docs.length - 1] : null,
    exhausted: snap.docs.length < pageSize,
  };
}

export async function deleteWorkout(uid, workoutId) {
  await deleteDoc(doc(db, 'users', uid, 'workouts', workoutId));
}

// --- Routines (also the landing zone for Notomi-synced programmes) ---------

export async function fetchRoutines(uid) {
  const snap = await getDocs(query(routinesRef(uid), orderBy('updatedAt', 'desc'), fsLimit(50)));
  return snap.docs.map((d) => ({ ...d.data(), id: d.id }));
}

export async function saveRoutine(uid, routine) {
  const ref = routine.id ? doc(db, 'users', uid, 'routines', routine.id) : doc(routinesRef(uid));
  const payload = { ...routine, id: ref.id, uid, updatedAt: Date.now() };
  await setDoc(ref, payload, { merge: true });
  return payload;
}

export async function deleteRoutine(uid, routineId) {
  await deleteDoc(doc(db, 'users', uid, 'routines', routineId));
}

/** Write several routines at once — used by the Notomi weekly import. */
export async function saveRoutines(uid, routines) {
  const batch = writeBatch(db);
  const saved = [];
  for (const routine of routines) {
    const ref = routine.id ? doc(db, 'users', uid, 'routines', routine.id) : doc(routinesRef(uid));
    const payload = { ...routine, id: ref.id, uid, updatedAt: Date.now() };
    batch.set(ref, payload, { merge: true });
    saved.push(payload);
  }
  await batch.commit();
  return saved;
}
