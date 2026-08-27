import { estimate1RM } from './oneRepMax';
import { setVolumeKg, setLoadKg } from './leveling';
import { toKg } from './constants';

// ---------------------------------------------------------------------------
// PERSONAL RECORDS
//
// Four independent record types per exercise, because "a PR" means different
// things depending on how you train:
//   weight  — heaviest single set, any rep count
//   reps    — most reps at or above a previously used weight
//   volume  — biggest single-set tonnage
//   e1rm    — best estimated one-rep max (the one that drives raid damage)
// ---------------------------------------------------------------------------

export const PR_TYPES = {
  weight: { id: 'weight', label: 'Heaviest Weight', short: 'WT', color: '#fbbf24' },
  e1rm: { id: 'e1rm', label: 'Estimated 1RM', short: '1RM', color: '#26bdff' },
  volume: { id: 'volume', label: 'Set Volume', short: 'VOL', color: '#a78bfa' },
  reps: { id: 'reps', label: 'Rep Record', short: 'REP', color: '#4ade80' },
};

/** Best-of summary for one exercise, folded from its logged sets. */
export function summarizeExercise(sets, exercise, profile) {
  const summary = { weight: 0, reps: 0, volume: 0, e1rm: 0, bestSet: null };
  for (const set of sets || []) {
    if (set.completed === false) continue;
    const reps = Number(set.reps) || 0;
    const load = setLoadKg(set, exercise, profile);
    const volume = setVolumeKg(set, exercise, profile);
    const e1rm = reps > 0 ? estimate1RM(load, reps, set.rpe) : load;

    if (load > summary.weight) summary.weight = load;
    if (reps > summary.reps) summary.reps = reps;
    if (volume > summary.volume) summary.volume = volume;
    if (e1rm > summary.e1rm) {
      summary.e1rm = e1rm;
      summary.bestSet = { reps, weightKg: load, rpe: set.rpe ?? null };
    }
  }
  return summary;
}

/**
 * Relative significance of each PR type when several fall in the same session.
 * A session where you add weight to the bar breaks the weight, 1RM and volume
 * records simultaneously — that is one achievement, not three.
 */
const PR_PRIORITY = { e1rm: 4, weight: 3, reps: 2, volume: 1 };

/**
 * Compare a session's exercises against stored bests and return the PRs broken.
 *
 * `records` is the user's stored map: { [exerciseId]: { weight, e1rm, volume, reps, ... } }
 * All comparisons happen in kilograms so a unit switch never fabricates a PR.
 *
 * Every broken record is written back to the store, but only the single most
 * significant one per exercise is *returned* as a PR — otherwise adding 2.5 kg
 * to the bar would pay four XP bonuses and hit the raid boss four times.
 */
export function detectPRs({ entries, records = {}, profile, lookup }) {
  const prs = [];
  const broken = [];
  const nextRecords = { ...records };

  for (const entry of entries || []) {
    const exercise = lookup?.(entry.exerciseId) || entry.exercise;
    if (!exercise) continue;

    const completed = (entry.sets || []).filter((s) => s.completed !== false && (s.reps || s.duration || s.distance));
    if (!completed.length) continue;

    const summary = summarizeExercise(completed, exercise, profile);
    const previous = records[entry.exerciseId] || {};
    const updated = { ...previous, exerciseId: entry.exerciseId, name: exercise.name };

    for (const type of ['weight', 'e1rm', 'volume']) {
      const prev = Number(previous[type]) || 0;
      const now = summary[type];
      // A 0.5% guard stops floating-point noise and unit round-trips from
      // registering a "record" that is really the same lift.
      if (now > prev * 1.005 && now > 0) {
        broken.push({
          exerciseId: entry.exerciseId,
          name: exercise.name,
          type,
          previous: prev,
          value: now,
          delta: now - prev,
          improvement: prev > 0 ? (now - prev) / prev : 0,
          firstTime: prev === 0,
          tier: exercise.tier || 'b',
          bestSet: summary.bestSet,
        });
        updated[type] = now;
      } else if (now > prev) {
        updated[type] = now;
      }
    }

    // A rep PR only counts at or above the weight the previous rep record used.
    const prevReps = Number(previous.reps) || 0;
    const prevRepWeight = Number(previous.repWeight) || 0;
    if (summary.reps > prevReps && summary.weight >= prevRepWeight * 0.98) {
      broken.push({
        exerciseId: entry.exerciseId,
        name: exercise.name,
        type: 'reps',
        previous: prevReps,
        value: summary.reps,
        delta: summary.reps - prevReps,
        improvement: prevReps > 0 ? (summary.reps - prevReps) / prevReps : 0,
        firstTime: prevReps === 0,
        tier: exercise.tier || 'b',
        bestSet: summary.bestSet,
      });
      updated.reps = summary.reps;
      updated.repWeight = summary.weight;
    }

    updated.lastPerformed = Date.now();
    updated.sessions = (Number(previous.sessions) || 0) + 1;

    // What was actually done last time, in kilograms. This is the number a
    // lifter needs when deciding today's load — a lifetime best is the wrong
    // reference for the second set of a deload week. Capped at eight sets so a
    // long session cannot bloat the profile document.
    updated.lastSets = completed.slice(0, 8).map((set) => ({
      reps: Number(set.reps) || 0,
      weightKg: setLoadKg(set, exercise, profile),
      rpe: set.rpe ?? null,
      duration: Number(set.duration) || 0,
    }));

    // A compact strength trend for this lift. Twenty points at ~24 bytes each
    // is a few hundred bytes per exercise, which keeps the whole history on
    // the profile document — so drawing a progress chart costs no extra reads.
    const point = {
      at: Date.now(),
      e1rm: Math.round(summary.e1rm * 10) / 10,
      volume: Math.round(summary.volume),
      topWeight: Math.round(summary.weight * 10) / 10,
    };
    updated.history = [...(previous.history || []), point].slice(-20);

    nextRecords[entry.exerciseId] = updated;

    // Keep the headline record for this exercise, and attach the others so the
    // UI can still show "also: volume, reps" on the PR card.
    const mine = broken.filter((b) => b.exerciseId === entry.exerciseId);
    if (mine.length) {
      mine.sort((a, b) => PR_PRIORITY[b.type] - PR_PRIORITY[a.type]);
      prs.push({ ...mine[0], alsoBroke: mine.slice(1).map((b) => b.type) });
    }
  }

  return { prs, nextRecords, allBroken: broken };
}

/** Strength standards: bodyweight multiples for the big lifts, used on the profile. */
export const STRENGTH_STANDARDS = {
  'barbell-back-squat': { beginner: 0.75, novice: 1.25, intermediate: 1.75, advanced: 2.5, elite: 3.2 },
  'barbell-bench-press': { beginner: 0.5, novice: 0.9, intermediate: 1.3, advanced: 1.8, elite: 2.3 },
  'barbell-deadlift': { beginner: 1.0, novice: 1.5, intermediate: 2.1, advanced: 2.8, elite: 3.6 },
  'barbell-overhead-press': { beginner: 0.35, novice: 0.55, intermediate: 0.8, advanced: 1.1, elite: 1.4 },
  'barbell-front-squat': { beginner: 0.6, novice: 1.0, intermediate: 1.4, advanced: 2.0, elite: 2.6 },
  'barbell-power-clean': { beginner: 0.5, novice: 0.85, intermediate: 1.2, advanced: 1.6, elite: 2.1 },
  'pull-up': { beginner: 1.0, novice: 1.15, intermediate: 1.4, advanced: 1.7, elite: 2.05 },
  'barbell-hip-thrust': { beginner: 0.9, novice: 1.5, intermediate: 2.2, advanced: 3.0, elite: 3.8 },
};

export const STANDARD_TIERS = ['beginner', 'novice', 'intermediate', 'advanced', 'elite'];

/** Where a lift sits against the bodyweight standards, as a 0..1 position. */
export function strengthLevel(exerciseId, e1rmKg, bodyweightKg) {
  const std = STRENGTH_STANDARDS[exerciseId];
  if (!std || !bodyweightKg || !e1rmKg) return null;
  const ratio = e1rmKg / bodyweightKg;

  let tier = null;
  for (const t of STANDARD_TIERS) {
    if (ratio >= std[t]) tier = t;
  }
  const nextTier = STANDARD_TIERS[STANDARD_TIERS.indexOf(tier) + 1] || (tier ? null : STANDARD_TIERS[0]);
  const floor = tier ? std[tier] : 0;
  const ceil = nextTier ? std[nextTier] : std.elite;
  const progress = ceil > floor ? Math.min(1, (ratio - floor) / (ceil - floor)) : 1;

  return { ratio, tier, nextTier, progress, targetRatio: ceil, targetWeight: ceil * bodyweightKg };
}

export const bodyweightKgOf = (profile) => toKg(Number(profile?.bodyweight) || 75, profile?.unit || 'kg');
