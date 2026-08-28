// ---------------------------------------------------------------------------
// XP INTEGRITY
//
// What this can and cannot do.
//
// There is no server. The client computes XP and writes it to Firestore, so a
// user with devtools can attempt to write any number they like. Nothing in
// this file changes that, and no amount of client-side cleverness will —
// checksums, obfuscation and signing are all computed by the same client that
// would be forging the value.
//
// What it *can* do is make every plausible value cheap and every implausible
// one impossible to write, which is enough to stop the two things that
// actually happen: accidental inflation from a typo, and casual cheating
// through the app's own interface. Firestore rules then enforce the same
// bounds at the boundary, so bypassing the UI does not bypass the limits.
//
// Anything stricter needs a trusted server to recompute the workout.
// ---------------------------------------------------------------------------

/**
 * Physical bounds on a single set. These are set well above any real training
 * value — the heaviest sanctioned deadlift in history is around 501 kg — so a
 * genuine set is never rejected, but nothing absurd survives.
 */
export const SET_LIMITS = {
  weightKg: 750,
  reps: 500,
  durationSec: 4 * 3600,
  distanceM: 100_000,
};

/**
 * Per-session and per-day ceilings on what the engine will award.
 *
 * Measured against the scorer rather than guessed. A beginner's session scores
 * ~680, a solid intermediate one ~1,650, and a hard advanced session ~3,070.
 * The theoretical maximum — an S-rank hunter on a 60-day streak setting a PR on
 * every lift in a 188-tonne session nobody has ever performed — is ~13,200.
 *
 * The cap sits at roughly 2.6x the hardest realistic session, so no real
 * workout is ever trimmed, while a forged one is bounded to about three days
 * of genuine training instead of being unlimited.
 */
export const XP_LIMITS = {
  perWorkout: 8_000,
  /** Two maximal sessions plus a full quest board. */
  perDay: 20_000,
  /**
   * The largest single delta a profile write may carry, in either direction.
   * Equal to the daily ceiling because saves are debounced — a hunter who
   * trains and then clears the board before the save fires legitimately lands
   * a day's worth in one write.
   */
  perWrite: 20_000,
};

export const PROFILE_LIMITS = {
  totalXp: 500_000_000,
  level: 500,
  stat: 200_000,
};

/** Clamp one logged set into the physically possible. */
export function clampSet(set) {
  if (!set) return set;
  const num = (v, max) => {
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0) return 0;
    return Math.min(n, max);
  };
  return {
    ...set,
    weight: set.weight === '' || set.weight == null ? set.weight : num(set.weight, SET_LIMITS.weightKg * 2.5),
    reps: set.reps === '' || set.reps == null ? set.reps : num(set.reps, SET_LIMITS.reps),
    duration: set.duration === '' || set.duration == null ? set.duration : num(set.duration, SET_LIMITS.durationSec),
    distance: set.distance === '' || set.distance == null ? set.distance : num(set.distance, SET_LIMITS.distanceM),
  };
}

/**
 * Is this set plausible enough to score? Implausible sets are still stored —
 * losing someone's data over a mistyped digit would be worse — but they earn
 * nothing, which removes the incentive to type them.
 */
export function isPlausibleSet(set, unitToKg = (v) => v) {
  const weightKg = unitToKg(Number(set?.weight) || 0);
  const reps = Number(set?.reps) || 0;
  const duration = Number(set?.duration) || 0;
  const distance = Number(set?.distance) || 0;
  return (
    weightKg >= 0 && weightKg <= SET_LIMITS.weightKg
    && reps >= 0 && reps <= SET_LIMITS.reps
    && duration >= 0 && duration <= SET_LIMITS.durationSec
    && distance >= 0 && distance <= SET_LIMITS.distanceM
  );
}

/**
 * The XP a profile may still earn today.
 *
 * The ledger is a plain { day, xp } counter on the profile. It is client-side
 * and therefore forgeable on its own — its value is that combined with the
 * per-write cap in the security rules, inflating a total requires many writes
 * over many days rather than one.
 */
export function remainingDailyXp(profile, dayKey) {
  const ledger = profile?.xpLedger;
  const spent = ledger?.day === dayKey ? Number(ledger.xp) || 0 : 0;
  return Math.max(0, XP_LIMITS.perDay - spent);
}

/** Fold an award into the daily ledger, returning the new ledger. */
export function recordDailyXp(profile, dayKey, amount) {
  const ledger = profile?.xpLedger;
  const spent = ledger?.day === dayKey ? Number(ledger.xp) || 0 : 0;
  return { day: dayKey, xp: Math.max(0, spent + amount) };
}

/**
 * Cap an award against both the per-session ceiling and what is left today.
 * Returns the amount actually grantable and why it was trimmed, so the UI can
 * say so rather than silently paying out less than it showed.
 */
export function capAward(profile, dayKey, requested, perEventCap = XP_LIMITS.perWorkout) {
  const wanted = Math.max(0, Math.round(Number(requested) || 0));
  const bySession = Math.min(wanted, perEventCap);
  const granted = Math.min(bySession, remainingDailyXp(profile, dayKey));
  return {
    granted,
    capped: granted < wanted,
    reason: granted < bySession ? 'daily' : bySession < wanted ? 'session' : null,
  };
}

export default { SET_LIMITS, XP_LIMITS, PROFILE_LIMITS, clampSet, isPlausibleSet, capAward };
