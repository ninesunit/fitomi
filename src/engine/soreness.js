import { MUSCLES } from './constants';
import { DAY_MS } from '../lib/date';

// ---------------------------------------------------------------------------
// SORENESS MODEL
//
// There is no wearable and no API here — soreness is *inferred* from what was
// logged. Each muscle accumulates tonnage, which then decays over that muscle's
// own recovery window (quads take ~60h, forearms ~24h). The result is
// normalised against the lifter's own typical working volume for that muscle,
// so "sore" means sore relative to you, not to some population average.
// ---------------------------------------------------------------------------

export const SORENESS_STATES = {
  fresh: { id: 'fresh', label: 'Fresh', color: '#4ade80', min: 0 },
  primed: { id: 'primed', label: 'Primed', color: '#26bdff', min: 0.18 },
  fatigued: { id: 'fatigued', label: 'Fatigued', color: '#fbbf24', min: 0.45 },
  sore: { id: 'sore', label: 'Sore', color: '#fb923c', min: 0.7 },
  smoked: { id: 'smoked', label: 'Smoked', color: '#ef4444', min: 0.9 },
};

export function sorenessState(value) {
  if (value >= 0.9) return SORENESS_STATES.smoked;
  if (value >= 0.7) return SORENESS_STATES.sore;
  if (value >= 0.45) return SORENESS_STATES.fatigued;
  if (value >= 0.18) return SORENESS_STATES.primed;
  return SORENESS_STATES.fresh;
}

/**
 * Per-muscle fatigue map from workout history.
 *
 * @param history  Array of finished workouts, each { finishedAt, muscleVolume }
 * @param now      Evaluation instant
 * @returns {{ [muscleId]: { value, state, hoursSince, lastVolume, daysSince, neglected } }}
 */
export function estimateSoreness(history = [], now = Date.now()) {
  const out = {};
  const baselines = volumeBaselines(history);

  for (const muscle of Object.keys(MUSCLES)) {
    const recoveryHours = MUSCLES[muscle].recovery;
    let weighted = 0;
    let lastAt = null;
    let lastVolume = 0;

    for (const workout of history) {
      const at = Number(workout.finishedAt) || 0;
      if (!at) continue;
      const hoursSince = (now - at) / 3600000;
      if (hoursSince < 0 || hoursSince > recoveryHours) continue;

      const volume = Number(workout.muscleVolume?.[muscle]) || 0;
      if (volume <= 0) continue;

      // Linear decay across the muscle's recovery window. Simple, legible,
      // and close enough to observed DOMS curves for a motivation app.
      const remaining = 1 - hoursSince / recoveryHours;
      weighted += volume * remaining;

      if (!lastAt || at > lastAt) {
        lastAt = at;
        lastVolume = volume;
      }
    }

    // Most recent time this muscle was touched at all, for the neglect rules.
    let lastTouched = null;
    for (const workout of history) {
      const volume = Number(workout.muscleVolume?.[muscle]) || 0;
      if (volume > 0) {
        const at = Number(workout.finishedAt) || 0;
        if (!lastTouched || at > lastTouched) lastTouched = at;
      }
    }

    const baseline = baselines[muscle];
    const value = baseline > 0 ? Math.min(1, weighted / baseline) : 0;
    const daysSince = lastTouched ? (now - lastTouched) / DAY_MS : null;

    out[muscle] = {
      value,
      state: sorenessState(value),
      weightedVolume: weighted,
      lastVolume,
      hoursSince: lastAt ? (now - lastAt) / 3600000 : null,
      daysSince,
      // Never trained, or not in over a week, with enough history to know better.
      neglected: (daysSince === null && history.length >= 3) || (daysSince !== null && daysSince >= 7),
    };
  }

  return out;
}

/**
 * The tonnage that counts as "a hard session" for each muscle, for this lifter.
 * Uses the 75th percentile of non-zero session volumes so one outlier week
 * doesn't permanently raise the bar.
 */
export function volumeBaselines(history = []) {
  const samples = {};
  for (const workout of history) {
    for (const [muscle, volume] of Object.entries(workout.muscleVolume || {})) {
      if (volume > 0) (samples[muscle] ||= []).push(volume);
    }
  }

  const out = {};
  for (const muscle of Object.keys(MUSCLES)) {
    const values = (samples[muscle] || []).sort((a, b) => a - b);
    if (!values.length) {
      out[muscle] = 2500; // sensible default before any history exists
      continue;
    }
    const p75 = values[Math.min(values.length - 1, Math.floor(values.length * 0.75))];
    out[muscle] = Math.max(800, p75);
  }
  return out;
}

/** Muscles above a fatigue threshold, most cooked first. */
export function soreMuscles(soreness, threshold = 0.45) {
  return Object.entries(soreness)
    .filter(([, v]) => v.value >= threshold)
    .sort((a, b) => b[1].value - a[1].value)
    .map(([id, v]) => ({ id, ...v }));
}

/**
 * Muscles that have gone untrained for too long. `daysSince` stays null for a
 * muscle that has never been trained at all — callers phrase those differently
 * ("never trained" rather than "0 days"), so it must not be defaulted here.
 */
export function neglectedMuscles(soreness) {
  return Object.entries(soreness)
    .filter(([id, v]) => v.neglected && MUSCLES[id]?.region !== 'system')
    .sort((a, b) => (b[1].daysSince ?? Infinity) - (a[1].daysSince ?? Infinity))
    .map(([id, v]) => ({ id, ...v }));
}

/**
 * Which body regions are clear to train hard today, and which to leave alone.
 * Drives the "train X today" guidance on the strength quest.
 */
export function regionReadiness(soreness) {
  const buckets = {};
  for (const [id, v] of Object.entries(soreness)) {
    const region = MUSCLES[id]?.region;
    if (!region || region === 'system') continue;
    (buckets[region] ||= []).push(v.value);
  }
  return Object.entries(buckets)
    .map(([region, values]) => ({
      region,
      fatigue: Math.max(...values),
      ready: Math.max(...values) < 0.45,
    }))
    .sort((a, b) => a.fatigue - b.fatigue);
}

/** Whole-body readiness 0..1 — how hard today can reasonably go. */
export function systemicReadiness(soreness) {
  const values = Object.entries(soreness)
    .filter(([id]) => MUSCLES[id]?.region !== 'system')
    .map(([, v]) => v.value);
  if (!values.length) return 1;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const peak = Math.max(...values);
  // Peak fatigue matters more than average — one smoked muscle limits a session.
  return Math.max(0, 1 - (mean * 0.55 + peak * 0.45));
}
