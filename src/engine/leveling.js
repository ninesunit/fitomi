import { STAT_IDS, EMPTY_STATS, toKg } from './constants';

// ---------------------------------------------------------------------------
// LEVELLING — the arithmetic core of the System.
//
// Everything here is a pure function of logged data. There is no server, no
// model, no API: XP is a deterministic transform of (sets x reps x weight),
// modulated by intensity, novelty and consistency.
// ---------------------------------------------------------------------------

/** XP required to advance FROM `level` to `level + 1`. */
export function xpToNext(level) {
  return Math.floor(100 * Math.pow(level, 1.34) + 150);
}

// Cumulative thresholds are precomputed once — the dashboard reads them on
// every render and recomputing a 200-deep loop each time is wasteful.
const MAX_LEVEL = 200;
const CUMULATIVE = (() => {
  const out = [0, 0]; // index 0 unused, level 1 starts at 0 total XP
  let acc = 0;
  for (let lvl = 1; lvl <= MAX_LEVEL; lvl += 1) {
    acc += xpToNext(lvl);
    out[lvl + 1] = acc;
  }
  return out;
})();

/** Total accumulated XP required to *be* at `level`. */
export function totalXpForLevel(level) {
  const clamped = Math.max(1, Math.min(MAX_LEVEL + 1, Math.floor(level)));
  return CUMULATIVE[clamped] ?? CUMULATIVE[CUMULATIVE.length - 1];
}

/** Resolve a raw lifetime XP number into level + progress within that level. */
export function levelFromXp(totalXp) {
  const xp = Math.max(0, Math.floor(totalXp || 0));
  let level = 1;
  while (level < MAX_LEVEL && xp >= CUMULATIVE[level + 1]) level += 1;

  const floor = CUMULATIVE[level];
  const need = xpToNext(level);
  const into = xp - floor;
  return {
    level,
    xpIntoLevel: into,
    xpForLevel: need,
    xpRemaining: Math.max(0, need - into),
    progress: need > 0 ? Math.min(1, into / need) : 1,
    totalXp: xp,
  };
}

/** Stat points granted for reaching `level`. Milestone levels pay extra. */
export function statPointsForLevel(level) {
  let points = 3;
  if (level % 5 === 0) points += 2;
  if (level % 10 === 0) points += 3;
  if (level % 25 === 0) points += 5;
  return points;
}

// --- Volume ----------------------------------------------------------------

/**
 * Effective load of a single set, in kilograms.
 *
 * Bodyweight movements have no logged weight, so the user's bodyweight times a
 * per-exercise leverage factor stands in for it (a push-up moves ~65% of you,
 * a pull-up ~100%), plus any added weight.
 */
export function setLoadKg(set, exercise, profile) {
  const unit = profile?.unit || 'kg';
  const bodyweightKg = toKg(Number(profile?.bodyweight) || 75, unit);
  const added = toKg(Number(set.weight) || 0, unit);

  if (exercise?.equipment === 'bodyweight' || exercise?.usesBodyweight) {
    const factor = exercise?.bodyweightFactor ?? 0.65;
    return bodyweightKg * factor + added;
  }
  return added;
}

/** Tonnage for one set: load x reps. Time-based sets convert seconds to reps. */
export function setVolumeKg(set, exercise, profile) {
  const load = setLoadKg(set, exercise, profile);
  if (exercise?.tracking === 'duration' || set.duration) {
    // A held/carried second is treated as ~1/3 of a rep of tonnage.
    const seconds = Number(set.duration) || 0;
    return load * (seconds / 3);
  }
  if (exercise?.tracking === 'distance') {
    const meters = Number(set.distance) || 0;
    const bodyweightKg = toKg(Number(profile?.bodyweight) || 75, profile?.unit || 'kg');
    // Locomotion tonnage: bodyweight moved over distance, heavily discounted.
    return bodyweightKg * (meters / 220);
  }
  return load * (Number(set.reps) || 0);
}

/** Total tonnage of a completed session. */
export function workoutVolumeKg(entries, profile, lookup) {
  let total = 0;
  for (const entry of entries || []) {
    const exercise = lookup?.(entry.exerciseId) || entry.exercise;
    for (const set of entry.sets || []) {
      if (set.completed === false) continue;
      total += setVolumeKg(set, exercise, profile);
    }
  }
  return total;
}

// --- XP --------------------------------------------------------------------

/** Compound lifts are worth more per kilo than a cable fly. */
export const TIER_MULTIPLIER = { s: 1.35, a: 1.2, b: 1.05, c: 0.92 };

/**
 * XP earned for a single completed set.
 *
 * Three additive components keep the incentives honest:
 *  - tonnage, so heavier and longer sets pay more;
 *  - a flat completion bonus, so showing up on a deload day still pays;
 *  - an intensity kicker above RPE 7, so hard sets are worth chasing.
 */
export function setXp(set, exercise, profile) {
  if (set?.completed === false) return 0;
  const volume = setVolumeKg(set, exercise, profile);
  const tier = TIER_MULTIPLIER[exercise?.tier] ?? 1;

  const volumeXp = volume / 42;
  const completionXp = 5;
  const rpe = Number(set?.rpe) || 0;
  const intensityXp = rpe > 7 ? (rpe - 7) * 4.5 : 0;
  const warmupPenalty = set?.type === 'warmup' ? 0.25 : 1;

  return Math.max(0, (volumeXp + completionXp + intensityXp) * tier * warmupPenalty);
}

export const PR_XP_BONUS = 80;
export const QUEST_XP_BONUS = 45;

/** Consistency multiplier from the current streak — caps at +30%. */
export function streakMultiplier(streak) {
  return 1 + Math.min(30, Math.max(0, streak || 0)) * 0.01;
}

/**
 * Score a whole finished session.
 * Returns the XP breakdown plus the per-muscle tonnage the stat engine needs.
 */
export function scoreWorkout({ entries, profile, lookup, prCount = 0, streak = 0 }) {
  let baseXp = 0;
  let volumeKg = 0;
  let sets = 0;
  let reps = 0;
  const muscleVolume = {};
  const patternVolume = {};

  for (const entry of entries || []) {
    const exercise = lookup?.(entry.exerciseId) || entry.exercise;
    if (!exercise) continue;

    for (const set of entry.sets || []) {
      if (set.completed === false) continue;
      const vol = setVolumeKg(set, exercise, profile);
      baseXp += setXp(set, exercise, profile);
      volumeKg += vol;
      sets += 1;
      reps += Number(set.reps) || 0;

      // Primary movers take the full share, secondaries a third.
      for (const m of exercise.primary || []) {
        muscleVolume[m] = (muscleVolume[m] || 0) + vol;
      }
      for (const m of exercise.secondary || []) {
        muscleVolume[m] = (muscleVolume[m] || 0) + vol * 0.34;
      }
      if (exercise.pattern) {
        patternVolume[exercise.pattern] = (patternVolume[exercise.pattern] || 0) + vol;
      }
    }
  }

  const prXp = prCount * PR_XP_BONUS;
  const multiplier = streakMultiplier(streak);
  const totalXp = Math.round((baseXp + prXp) * multiplier);

  return {
    xp: totalXp,
    baseXp: Math.round(baseXp),
    prXp,
    multiplier,
    volumeKg,
    sets,
    reps,
    muscleVolume,
    patternVolume,
  };
}

// --- Stat allocation -------------------------------------------------------

// How each muscle group converts training tonnage into attributes. Weights are
// normalised per muscle, so a kilo of squat tonnage and a kilo of curl tonnage
// distribute one "unit" of stat pressure — just to different places.
export const MUSCLE_STAT_WEIGHTS = {
  chest: { str: 0.55, vit: 0.25, per: 0.2 },
  back: { str: 0.45, vit: 0.35, per: 0.2 },
  lats: { str: 0.4, vit: 0.3, agi: 0.1, per: 0.2 },
  traps: { str: 0.5, vit: 0.35, per: 0.15 },
  shoulders: { str: 0.4, agi: 0.2, vit: 0.2, per: 0.2 },
  biceps: { str: 0.4, per: 0.4, agi: 0.2 },
  triceps: { str: 0.45, per: 0.35, agi: 0.2 },
  forearms: { str: 0.35, per: 0.45, vit: 0.2 },
  quads: { str: 0.5, vit: 0.3, agi: 0.2 },
  hamstrings: { str: 0.35, agi: 0.35, vit: 0.3 },
  glutes: { str: 0.4, vit: 0.3, agi: 0.3 },
  calves: { agi: 0.6, vit: 0.25, per: 0.15 },
  abs: { vit: 0.4, per: 0.3, agi: 0.3 },
  obliques: { agi: 0.4, vit: 0.3, per: 0.3 },
  lowerBack: { vit: 0.55, str: 0.3, per: 0.15 },
  hipFlexors: { agi: 0.5, per: 0.3, vit: 0.2 },
  adductors: { agi: 0.4, str: 0.3, vit: 0.3 },
  abductors: { agi: 0.45, vit: 0.3, per: 0.25 },
  neck: { vit: 0.6, str: 0.4 },
  cardio: { vit: 0.45, agi: 0.45, int: 0.1 },
};

/**
 * Turn per-muscle tonnage into a normalised 0..1 distribution over the five
 * attributes. This is what "auto-allocates stats based on targeted muscle
 * groups" means in practice — heavy squats push STR/VIT, HIIT pushes AGI.
 */
export function statDistribution(muscleVolume = {}) {
  const acc = EMPTY_STATS();
  let total = 0;

  for (const [muscle, volume] of Object.entries(muscleVolume)) {
    const weights = MUSCLE_STAT_WEIGHTS[muscle];
    if (!weights || !volume) continue;
    for (const [stat, w] of Object.entries(weights)) {
      acc[stat] += volume * w;
      total += volume * w;
    }
  }

  if (total <= 0) return { str: 0.3, agi: 0.2, vit: 0.25, int: 0.1, per: 0.15 };
  for (const id of STAT_IDS) acc[id] /= total;
  return acc;
}

/**
 * Distribute `points` whole stat points across a distribution using the
 * largest-remainder method, so the total always lands exactly on `points`.
 */
export function allocatePoints(points, distribution) {
  const out = EMPTY_STATS();
  if (points <= 0) return out;

  const raw = STAT_IDS.map((id) => ({ id, exact: (distribution[id] || 0) * points }));
  let assigned = 0;
  for (const r of raw) {
    out[r.id] = Math.floor(r.exact);
    assigned += out[r.id];
  }

  const remainder = points - assigned;
  raw.sort((a, b) => (b.exact - Math.floor(b.exact)) - (a.exact - Math.floor(a.exact)));
  for (let i = 0; i < remainder; i += 1) out[raw[i % raw.length].id] += 1;
  return out;
}

/**
 * INT is the "programming discipline" stat: it does not come from tonnage but
 * from behaviour — logging consistently and adding load over time. It is folded
 * in as a floor so a disciplined lifter always earns some.
 */
export function applyDisciplineBias(distribution, { streak = 0, prCount = 0, loggedRpe = 0 }) {
  const out = { ...distribution };
  const intBoost = Math.min(0.22, streak * 0.006 + prCount * 0.03);
  const perBoost = Math.min(0.14, loggedRpe * 0.012);
  const scale = 1 - intBoost - perBoost;

  for (const id of STAT_IDS) out[id] = (out[id] || 0) * scale;
  out.int = (out.int || 0) + intBoost;
  out.per = (out.per || 0) + perBoost;

  const total = STAT_IDS.reduce((s, id) => s + out[id], 0) || 1;
  for (const id of STAT_IDS) out[id] /= total;
  return out;
}

/** Combined stat score — used for rank gating and the radar chart scale. */
export function statPower(stats = {}) {
  return STAT_IDS.reduce((sum, id) => sum + (Number(stats[id]) || 0), 0);
}
