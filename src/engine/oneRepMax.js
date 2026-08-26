// ---------------------------------------------------------------------------
// 1RM ESTIMATION + RPE
//
// Six published rep-max formulas are averaged rather than picking one, because
// each is only well-behaved over part of the rep range (Brzycki drifts badly
// past ~10 reps, Epley is optimistic at low reps). Averaging the well-behaved
// subset for a given rep count gives a far steadier number across a session.
// ---------------------------------------------------------------------------

export const FORMULAS = {
  epley: { name: 'Epley', fn: (w, r) => w * (1 + r / 30) },
  brzycki: { name: 'Brzycki', fn: (w, r) => (r < 37 ? w * (36 / (37 - r)) : NaN) },
  lombardi: { name: 'Lombardi', fn: (w, r) => w * Math.pow(r, 0.1) },
  oconner: { name: "O'Conner", fn: (w, r) => w * (1 + r / 40) },
  wathan: { name: 'Wathan', fn: (w, r) => (100 * w) / (48.8 + 53.8 * Math.exp(-0.075 * r)) },
  lander: { name: 'Lander', fn: (w, r) => (100 * w) / (101.3 - 2.67123 * r) },
};

/**
 * RPE -> percentage of 1RM, indexed [rpe][reps].
 * This is the standard RTS-style chart: an RPE 8 set of 5 is ~81% of 1RM.
 * Used to correct an estimate when the lifter left reps in reserve.
 */
const RPE_CHART = {
  10: [100, 95.5, 92.2, 89.2, 86.3, 83.7, 81.1, 78.6, 76.2, 73.9, 70.7, 68.0],
  9.5: [97.8, 94.3, 91.4, 88.0, 85.0, 82.4, 79.9, 77.4, 75.1, 72.3, 69.4, 66.8],
  9: [95.5, 92.2, 89.2, 86.3, 83.7, 81.1, 78.6, 76.2, 73.9, 70.7, 68.0, 65.6],
  8.5: [94.2, 91.0, 87.8, 85.0, 82.4, 79.9, 77.4, 75.1, 72.3, 69.4, 66.8, 64.4],
  8: [92.2, 89.2, 86.3, 83.7, 81.1, 78.6, 76.2, 73.9, 70.7, 68.0, 65.6, 63.2],
  7.5: [91.0, 87.8, 85.0, 82.4, 79.9, 77.4, 75.1, 72.3, 69.4, 66.8, 64.4, 62.0],
  7: [89.2, 86.3, 83.7, 81.1, 78.6, 76.2, 73.9, 70.7, 68.0, 65.6, 63.2, 60.9],
  6.5: [87.8, 85.0, 82.4, 79.9, 77.4, 75.1, 72.3, 69.4, 66.8, 64.4, 62.0, 59.8],
  6: [86.3, 83.7, 81.1, 78.6, 76.2, 73.9, 70.7, 68.0, 65.6, 63.2, 60.9, 58.7],
};

const RPE_KEYS = Object.keys(RPE_CHART).map(Number).sort((a, b) => a - b);

/** Nearest half-point RPE that the chart actually has a row for. */
function snapRpe(rpe) {
  const r = Math.max(6, Math.min(10, Number(rpe)));
  return RPE_KEYS.reduce((best, k) => (Math.abs(k - r) < Math.abs(best - r) ? k : best), 10);
}

/** Percentage of 1RM represented by `reps` reps at `rpe`. */
export function rpePercent(reps, rpe) {
  const row = RPE_CHART[snapRpe(rpe)];
  if (!row) return null;
  const idx = Math.max(0, Math.min(row.length - 1, Math.round(reps) - 1));
  return row[idx] / 100;
}

/**
 * Estimate a 1RM from one set.
 * With an RPE the chart is authoritative (it accounts for reps left in the
 * tank). Without one, the formula average is used, restricted to the formulas
 * that behave over the given rep count.
 */
export function estimate1RM(weight, reps, rpe) {
  const w = Number(weight) || 0;
  const r = Math.round(Number(reps) || 0);
  if (w <= 0 || r <= 0) return 0;
  if (r === 1 && (!rpe || rpe >= 10)) return w;

  if (rpe) {
    const pct = rpePercent(r, rpe);
    if (pct) return w / pct;
  }

  // Brzycki and Lander degrade badly at high reps — drop them there.
  const useAll = r <= 10;
  const picks = useAll
    ? ['epley', 'brzycki', 'lombardi', 'oconner', 'wathan', 'lander']
    : ['epley', 'lombardi', 'oconner', 'wathan'];

  const values = picks
    .map((k) => FORMULAS[k].fn(w, r))
    .filter((v) => Number.isFinite(v) && v > 0);

  if (!values.length) return w;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** Every formula's opinion — shown in the 1RM tool so the number isn't a black box. */
export function estimateBreakdown(weight, reps) {
  return Object.entries(FORMULAS)
    .map(([id, { name, fn }]) => ({ id, name, value: fn(Number(weight) || 0, Math.round(Number(reps) || 0)) }))
    .filter((e) => Number.isFinite(e.value) && e.value > 0);
}

/** Working weight for a target rep count at a target RPE, given a 1RM. */
export function workingWeight(oneRm, reps, rpe = 8) {
  const pct = rpePercent(reps, rpe);
  return pct ? oneRm * pct : 0;
}

/** Classic percentage table for planning. */
export function percentageTable(oneRm) {
  return [95, 90, 85, 80, 75, 70, 65, 60, 55, 50].map((pct) => ({
    pct,
    weight: (oneRm * pct) / 100,
    reps: repsAtPercent(pct),
  }));
}

/** Rough reps achievable at a given %1RM (inverse of the RPE 10 row). */
export function repsAtPercent(pct) {
  const row = RPE_CHART[10];
  for (let i = 0; i < row.length; i += 1) {
    if (pct >= row[i]) return i + 1;
  }
  return 12;
}

export const RPE_DESCRIPTIONS = {
  6: 'Easy — 4+ reps left in the tank',
  6.5: 'Comfortable — 3–4 reps left',
  7: 'Moderate — 3 reps left',
  7.5: 'Getting real — 2–3 reps left',
  8: 'Hard — 2 reps left',
  8.5: 'Very hard — 1–2 reps left',
  9: 'Near limit — 1 rep left',
  9.5: 'Limit — maybe 1 more',
  10: 'Maximal — nothing left',
};
