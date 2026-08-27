import { EMPTY_STATS } from '../engine/constants';
import { DEFAULT_THEME } from '../engine/shadows';

// ---------------------------------------------------------------------------
// The user profile document.
//
// This single document is the entire live application state: progression,
// stats, streak, shadows, records, the current raid and today's quest board.
//
// That is a deliberate Spark-plan decision. Booting the app costs exactly ONE
// document read instead of one per collection, and finishing a workout costs
// ONE write to this document plus one to the workouts subcollection. Full set
// data lives in the workouts subcollection and is only read when the user
// actually opens their history.
// ---------------------------------------------------------------------------

/** How many session summaries the profile carries for the soreness engine. */
export const RECENT_WORKOUT_LIMIT = 40;
/** How many training-day keys the streak calculation needs. */
export const TRAINING_DAY_LIMIT = 180;

export function createProfile({ uid, email, displayName, photoURL } = {}) {
  return {
    uid,
    email: email || null,
    displayName: displayName || 'Unnamed Hunter',
    photoURL: photoURL || null,
    createdAt: Date.now(),
    updatedAt: Date.now(),

    // --- progression ---
    totalXp: 0,
    level: 1,
    stats: EMPTY_STATS(),
    // Fractional stat points carried between level-ups — see
    // allocatePointsWithCarry for why this has to persist.
    statCarry: EMPTY_STATS(),
    statPoints: 0,
    unspentPoints: 0,

    // --- physical profile ---
    unit: 'kg',
    bodyweight: 75,
    height: null,
    goal: 'strength',
    experience: 'beginner',

    // --- streak / shadows ---
    trainingDays: [],
    streak: { current: 0, longest: 0, lastDay: null },
    shadows: [],
    activeTheme: 'system',
    title: null,

    // --- aggregates (kept here so the dashboard needs no extra queries) ---
    totals: { workouts: 0, volumeKg: 0, sets: 0, reps: 0, prCount: 0, bossKills: 0, durationSec: 0 },

    // --- rolling session summaries that feed the quest + soreness engines ---
    recentWorkouts: [],

    // --- personal records, keyed by exercise id ---
    records: {},

    // --- current weekly raid ---
    raid: null,

    // --- today's quest board state ---
    questState: { day: null, completed: [], generated: null },
    weeklyQuestState: { week: null, completed: [] },

    // --- preferences ---
    settings: {
      restSeconds: 120,
      restSecondsCompound: 180,
      autoStartRest: true,
      soundEnabled: true,
      vibrationEnabled: true,
      restNotifications: false,
      graceDays: 1,
      availablePlates: { kg: [25, 20, 15, 10, 5, 2.5, 1.25], lb: [45, 35, 25, 10, 5, 2.5] },
      defaultBar: { kg: 20, lb: 45 },
      showRpe: true,
      confettiOnPr: true,
    },

    // --- Notomi companion app link ---
    notomi: { connected: false, lastSync: null, handle: null, routines: [] },

    // --- the awakening assessment, applied once on first sign-in ---
    awakening: null,
    age: null,
    gender: null,
    job: null,
  };
}

/**
 * Merge a loaded document over the defaults.
 *
 * Every new field added in a later release lands here with its default rather
 * than as `undefined` on an old account, so the app never has to guard for
 * missing keys at the call site.
 */
export function hydrateProfile(raw, fallback = {}) {
  const base = createProfile(fallback);
  if (!raw) return base;

  return {
    ...base,
    ...raw,
    stats: { ...base.stats, ...(raw.stats || {}) },
    statCarry: { ...base.statCarry, ...(raw.statCarry || {}) },
    totals: { ...base.totals, ...(raw.totals || {}) },
    streak: { ...base.streak, ...(raw.streak || {}) },
    settings: {
      ...base.settings,
      ...(raw.settings || {}),
      availablePlates: {
        ...base.settings.availablePlates,
        ...((raw.settings || {}).availablePlates || {}),
      },
      defaultBar: { ...base.settings.defaultBar, ...((raw.settings || {}).defaultBar || {}) },
    },
    notomi: { ...base.notomi, ...(raw.notomi || {}) },
    questState: { ...base.questState, ...(raw.questState || {}) },
    weeklyQuestState: { ...base.weeklyQuestState, ...(raw.weeklyQuestState || {}) },
    records: raw.records || {},
    recentWorkouts: raw.recentWorkouts || [],
    trainingDays: raw.trainingDays || [],
  };
}

/** Trim the rolling arrays so the profile document can never grow unbounded. */
export function trimProfile(profile) {
  return {
    ...profile,
    recentWorkouts: (profile.recentWorkouts || [])
      .slice()
      .sort((a, b) => (b.finishedAt || 0) - (a.finishedAt || 0))
      .slice(0, RECENT_WORKOUT_LIMIT),
    trainingDays: [...new Set(profile.trainingDays || [])].sort().slice(-TRAINING_DAY_LIMIT),
  };
}

export const themeOf = (profile) =>
  profile?.activeTheme && profile.activeTheme !== 'system' ? profile.activeTheme : DEFAULT_THEME;
