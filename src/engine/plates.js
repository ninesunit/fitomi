import { LBS_PER_KG } from './constants';

// ---------------------------------------------------------------------------
// PLATE CALCULATOR
//
// Greedy loading from the heaviest plate down is optimal for real plate sets
// (each denomination is at least double the next once you account for pairs),
// and it also matches how anyone actually loads a bar.
// ---------------------------------------------------------------------------

export const BARS = {
  kg: [
    { id: 'olympic20', name: 'Olympic Barbell', weight: 20 },
    { id: 'womens15', name: "Women's Olympic Bar", weight: 15 },
    { id: 'ez10', name: 'EZ Curl Bar', weight: 10 },
    { id: 'trap25', name: 'Trap / Hex Bar', weight: 25 },
    { id: 'safety25', name: 'Safety Squat Bar', weight: 25 },
    { id: 'training10', name: 'Training Bar', weight: 10 },
    { id: 'none', name: 'No Bar / Machine', weight: 0 },
  ],
  lb: [
    { id: 'olympic45', name: 'Olympic Barbell', weight: 45 },
    { id: 'womens35', name: "Women's Olympic Bar", weight: 35 },
    { id: 'ez25', name: 'EZ Curl Bar', weight: 25 },
    { id: 'trap55', name: 'Trap / Hex Bar', weight: 55 },
    { id: 'safety55', name: 'Safety Squat Bar', weight: 55 },
    { id: 'training15', name: 'Training Bar', weight: 15 },
    { id: 'none', name: 'No Bar / Machine', weight: 0 },
  ],
};

// Plate colours follow IWF competition standards so the visual reads correctly
// to anyone who has been in a real gym.
export const PLATE_SETS = {
  kg: [
    { weight: 25, color: '#dc2626', text: '#fff', height: 100 },
    { weight: 20, color: '#2563eb', text: '#fff', height: 100 },
    { weight: 15, color: '#eab308', text: '#111', height: 94 },
    { weight: 10, color: '#16a34a', text: '#fff', height: 86 },
    { weight: 5, color: '#f1f5f9', text: '#111', height: 74 },
    { weight: 2.5, color: '#dc2626', text: '#fff', height: 62 },
    { weight: 1.25, color: '#94a3b8', text: '#111', height: 52 },
    { weight: 0.5, color: '#64748b', text: '#fff', height: 44 },
    { weight: 0.25, color: '#475569', text: '#fff', height: 38 },
  ],
  lb: [
    { weight: 45, color: '#2563eb', text: '#fff', height: 100 },
    { weight: 35, color: '#eab308', text: '#111', height: 92 },
    { weight: 25, color: '#16a34a', text: '#fff', height: 84 },
    { weight: 10, color: '#f1f5f9', text: '#111', height: 70 },
    { weight: 5, color: '#dc2626', text: '#fff', height: 58 },
    { weight: 2.5, color: '#94a3b8', text: '#111', height: 48 },
    { weight: 1.25, color: '#475569', text: '#fff', height: 40 },
  ],
};

export const DEFAULT_AVAILABLE = {
  kg: [25, 20, 15, 10, 5, 2.5, 1.25],
  lb: [45, 35, 25, 10, 5, 2.5],
};

/**
 * Work out what to hang on each side of the bar.
 *
 * Greedy loading is *not* correct in general: with only 25/20/15 kg plates on
 * hand, a 30 kg side needs 15+15, but greedy grabs the 25 and stalls 5 kg
 * short. So this solves it exactly — an unbounded knapsack over the available
 * denominations that maximises loaded weight without exceeding the target, and
 * breaks ties by using the fewest plates.
 *
 * The DP is scaled into integer units of the greatest common divisor of the
 * plate weights, which keeps the table tiny (a 150 kg side is ~600 cells).
 *
 * @returns {{ perSide: Array, achieved: number, requested: number, remainder: number, exact: boolean }}
 */
export function calculatePlates(targetWeight, barWeight, available, unit = 'kg', maxPerSide = 12) {
  const target = Number(targetWeight) || 0;
  const bar = Number(barWeight) || 0;
  const set = PLATE_SETS[unit] || PLATE_SETS.kg;

  if (target < bar) {
    return {
      perSide: [],
      achieved: bar,
      requested: target,
      remainder: round(target - bar),
      perSideWeight: 0,
      exact: Math.abs(target - bar) < 0.01,
      error: `Target is below the empty bar (${bar}${unit})`,
    };
  }

  const denominations = (available && available.length ? [...available] : DEFAULT_AVAILABLE[unit])
    .map(Number)
    .filter((n) => n > 0)
    .sort((a, b) => b - a);

  const perSideTarget = (target - bar) / 2;
  if (!denominations.length || perSideTarget <= 0) {
    return {
      perSide: [],
      achieved: round(bar),
      requested: target,
      remainder: round(target - bar),
      perSideWeight: 0,
      exact: Math.abs(target - bar) < 0.01,
    };
  }

  // Scale to integers (hundredths) so floating point never decides equality.
  const scaled = denominations.map((d) => Math.round(d * 100));
  const step = scaled.reduce(gcd);
  const units = scaled.map((d) => d / step);
  const capacity = Math.floor(Math.round(perSideTarget * 100) / step);

  // best[w] = fewest plates that sum to exactly w units, or -1 if unreachable.
  const best = new Int32Array(capacity + 1).fill(-1);
  const choice = new Int32Array(capacity + 1).fill(-1);
  best[0] = 0;

  for (let w = 1; w <= capacity; w += 1) {
    for (let i = 0; i < units.length; i += 1) {
      const u = units[i];
      if (u > w) continue;
      const prev = best[w - u];
      if (prev < 0) continue;
      if (best[w] < 0 || prev + 1 < best[w]) {
        best[w] = prev + 1;
        choice[w] = i;
      }
    }
  }

  // Walk down from the target to the heaviest reachable load at or below it.
  let reached = capacity;
  while (reached > 0 && best[reached] < 0) reached -= 1;

  const counts = new Array(units.length).fill(0);
  let cursor = reached;
  while (cursor > 0 && choice[cursor] >= 0) {
    const i = choice[cursor];
    counts[i] += 1;
    cursor -= units[i];
  }

  // Respect a realistic per-denomination plate count; if the exact solution
  // needs more of one plate than the rack holds, fall back to greedy loading.
  if (counts.some((c) => c > maxPerSide)) {
    return greedyPlates(perSideTarget, bar, denominations, set, target);
  }

  const perSide = counts
    .map((count, i) => ({ ...plateMeta(set, denominations[i]), weight: denominations[i], count }))
    .filter((p) => p.count > 0);

  const loadedPerSide = perSide.reduce((sum, p) => sum + p.weight * p.count, 0);
  const achieved = bar + loadedPerSide * 2;

  return {
    perSide,
    achieved: round(achieved),
    requested: target,
    remainder: round(target - achieved),
    perSideWeight: round(loadedPerSide),
    exact: Math.abs(target - achieved) < 0.01,
  };
}

function greedyPlates(perSideTarget, bar, denominations, set, target) {
  const perSide = [];
  let remaining = perSideTarget;
  for (const denom of denominations) {
    const count = Math.floor((remaining + 1e-6) / denom);
    if (count > 0) {
      perSide.push({ ...plateMeta(set, denom), weight: denom, count });
      remaining -= count * denom;
    }
  }
  const loadedPerSide = perSide.reduce((sum, p) => sum + p.weight * p.count, 0);
  const achieved = bar + loadedPerSide * 2;
  return {
    perSide,
    achieved: round(achieved),
    requested: target,
    remainder: round(target - achieved),
    perSideWeight: round(loadedPerSide),
    exact: Math.abs(target - achieved) < 0.01,
  };
}

function plateMeta(set, weight) {
  return (
    set.find((p) => Math.abs(p.weight - weight) < 1e-6) || {
      weight,
      color: '#334155',
      text: '#fff',
      height: 60,
    }
  );
}

function gcd(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

const round = (n) => Math.round(n * 100) / 100;

/** Nearest weight actually loadable with the given plates — for warm-up ramps. */
export function nearestLoadable(target, bar, available, unit = 'kg') {
  const smallest = Math.min(...(available?.length ? available : DEFAULT_AVAILABLE[unit]));
  const step = smallest * 2;
  const above = bar + Math.ceil((target - bar) / step) * step;
  const below = bar + Math.floor((target - bar) / step) * step;
  return Math.abs(target - below) <= Math.abs(above - target) ? round(below) : round(above);
}

/**
 * A warm-up ramp to a working weight: 4 ascending sets at 40/55/70/85%,
 * each snapped to something the plates can actually make.
 */
export function warmupRamp(workingWeight, bar, available, unit = 'kg') {
  const pcts = [0.4, 0.55, 0.7, 0.85];
  const reps = [8, 5, 3, 2];
  return pcts
    .map((pct, i) => {
      const raw = workingWeight * pct;
      const weight = nearestLoadable(Math.max(bar, raw), bar, available, unit);
      return { pct: Math.round(pct * 100), weight, reps: reps[i] };
    })
    .filter((s, i, arr) => i === 0 || s.weight > arr[i - 1].weight);
}

export const convertWeight = (value, from, to) => {
  if (from === to) return value;
  return from === 'kg' ? value * LBS_PER_KG : value / LBS_PER_KG;
};
