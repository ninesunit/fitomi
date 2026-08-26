import { dayKey, daysBetween, DAY_MS } from '../lib/date';

// ---------------------------------------------------------------------------
// SHADOW EXTRACTION
//
// The streak system. Holding a streak "extracts a shadow", and every shadow
// carries a UI theme with it — unlocking one literally re-skins the app by
// rewriting the --accent CSS variables. Shadows are cosmetic rewards for the
// one behaviour that actually predicts results: turning up again.
// ---------------------------------------------------------------------------

export const SHADOWS = [
  {
    id: 'umbra',
    name: 'Umbra',
    title: 'First Shadow',
    requirement: { type: 'streak', value: 3 },
    theme: { name: 'Umbral', accent: '38 189 255', accent2: '139 92 246' },
    sigil: 'M32 6 54 18v16c0 12-9 21-22 26C19 55 10 46 10 34V18L32 6Z',
    flavor: 'The first thing the System takes from you is the excuse.',
  },
  {
    id: 'sentinel',
    name: 'Sentinel',
    title: 'Shadow of the Week',
    requirement: { type: 'streak', value: 7 },
    theme: { name: 'Sentinel', accent: '56 189 248', accent2: '14 165 233' },
    sigil: 'M32 4 58 20v24L32 60 6 44V20L32 4Zm0 12L18 25v14l14 9 14-9V25L32 16Z',
    flavor: 'Seven days. The habit has a heartbeat now.',
  },
  {
    id: 'revenant',
    name: 'Revenant',
    title: 'Shadow of Return',
    requirement: { type: 'streak', value: 14 },
    theme: { name: 'Crimson', accent: '248 113 113', accent2: '190 24 93' },
    sigil: 'M32 5c8 10 20 14 20 27S43 58 32 60C21 58 12 45 12 32S24 15 32 5Z',
    flavor: 'Two weeks. Missing a session now feels like losing something.',
  },
  {
    id: 'warden',
    name: 'Warden',
    title: 'Shadow of Discipline',
    requirement: { type: 'streak', value: 21 },
    theme: { name: 'Verdant', accent: '52 211 153', accent2: '16 185 129' },
    sigil: 'M32 6 12 20v20l20 18 20-18V20L32 6Zm0 10 12 8v14l-12 11-12-11V24l12-8Z',
    flavor: 'Twenty-one days — long enough that your body stopped negotiating.',
  },
  {
    id: 'behemoth',
    name: 'Behemoth',
    title: 'Shadow of the Month',
    requirement: { type: 'streak', value: 30 },
    theme: { name: 'Molten', accent: '251 146 60', accent2: '234 88 12' },
    sigil: 'M8 44 20 12h24l12 32-24 14L8 44Zm24-22-8 22h16l-8-22Z',
    flavor: 'A full month. The System stops testing you and starts arming you.',
  },
  {
    id: 'wyrm',
    name: 'Wyrm',
    title: 'Shadow of Winter',
    requirement: { type: 'streak', value: 50 },
    theme: { name: 'Glacier', accent: '125 211 252', accent2: '99 102 241' },
    sigil: 'M32 4v56M8 18l48 28M56 18 8 46M32 4 20 16h24L32 4Z',
    flavor: 'Fifty days. Most hunters never see this shadow.',
  },
  {
    id: 'eclipse',
    name: 'Eclipse',
    title: 'Shadow of the Void',
    requirement: { type: 'streak', value: 75 },
    theme: { name: 'Eclipse', accent: '167 139 250', accent2: '109 40 217' },
    sigil: 'M32 6a26 26 0 1 0 0 52 26 26 0 0 0 0-52Zm0 8a18 18 0 1 1 0 36 18 18 0 0 1 0-36Z',
    flavor: 'The light goes out and you keep training anyway.',
  },
  {
    id: 'sovereign',
    name: 'Sovereign',
    title: 'Shadow of the Monarch',
    requirement: { type: 'streak', value: 100 },
    theme: { name: 'Monarch', accent: '251 191 36', accent2: '139 92 246' },
    sigil: 'M8 48 14 16l12 14 6-22 6 22 12-14 6 32H8Zm8-6h32l-2-12-8 9-6-16-6 16-8-9-2 12Z',
    flavor: 'One hundred consecutive days. There is no rank above this.',
  },

  // --- Shadows earned by feats other than streaks -------------------------
  {
    id: 'gatebreaker',
    name: 'Gatebreaker',
    title: 'Shadow of the Fallen Boss',
    requirement: { type: 'bossKills', value: 3 },
    theme: { name: 'Gate', accent: '244 63 94', accent2: '124 45 18' },
    sigil: 'M16 8h32v48H16V8Zm8 8v32h16V16H24Zm-8 16h32',
    flavor: 'Three raid bosses down. The gates open for you now.',
  },
  {
    id: 'recordkeeper',
    name: 'Recordkeeper',
    title: 'Shadow of the Ledger',
    requirement: { type: 'prCount', value: 25 },
    theme: { name: 'Ledger', accent: '250 204 21', accent2: '180 83 9' },
    sigil: 'M14 6h28l8 8v44H14V6Zm8 14h20M22 30h20M22 40h12',
    flavor: 'Twenty-five records broken. The numbers only go one way.',
  },
  {
    id: 'ironheart',
    name: 'Ironheart',
    title: 'Shadow of Tonnage',
    requirement: { type: 'volumeKg', value: 500000 },
    theme: { name: 'Ironheart', accent: '148 163 184', accent2: '71 85 105' },
    sigil: 'M12 24h8v16h-8V24Zm32 0h8v16h-8V24ZM20 30h24v4H20v-4Z',
    flavor: 'Half a million kilograms moved. That is a small mountain.',
  },
  {
    id: 'ascetic',
    name: 'Ascetic',
    title: 'Shadow of the Hundred',
    requirement: { type: 'workouts', value: 100 },
    theme: { name: 'Ascetic', accent: '45 212 191', accent2: '15 118 110' },
    sigil: 'M32 8v48M8 32h48M18 18l28 28M46 18 18 46',
    flavor: 'One hundred sessions logged. Talent was never the variable.',
  },
];

export const DEFAULT_THEME = { name: 'System', accent: '38 189 255', accent2: '139 92 246' };

export function shadowById(id) {
  return SHADOWS.find((s) => s.id === id) || null;
}

export function themeById(id) {
  if (!id || id === 'system') return DEFAULT_THEME;
  return shadowById(id)?.theme || DEFAULT_THEME;
}

// --- Streak ----------------------------------------------------------------

/**
 * Compute the streak from a set of training-day keys.
 *
 * A streak survives up to `graceDays` consecutive rest days, because a program
 * that demands 7 sessions a week is a program that gets abandoned. The default
 * of 1 means training every other day holds the streak indefinitely.
 */
export function computeStreak(trainingDays, graceDays = 1, today = new Date()) {
  const days = [...new Set(trainingDays || [])].sort();
  if (!days.length) return { current: 0, longest: 0, lastDay: null, atRisk: false, graceLeft: 0 };

  const asDate = (key) => {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  let longest = 1;
  let run = 1;
  for (let i = 1; i < days.length; i += 1) {
    const gap = daysBetween(asDate(days[i - 1]), asDate(days[i]));
    if (gap <= graceDays + 1) {
      run += 1;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }

  // Walk backwards from the most recent training day to size the live streak.
  const lastDay = days[days.length - 1];
  const sinceLast = daysBetween(asDate(lastDay), today);

  if (sinceLast > graceDays + 1) {
    return { current: 0, longest, lastDay, atRisk: false, graceLeft: 0, broken: true };
  }

  let current = 1;
  for (let i = days.length - 1; i > 0; i -= 1) {
    const gap = daysBetween(asDate(days[i - 1]), asDate(days[i]));
    if (gap <= graceDays + 1) current += 1;
    else break;
  }

  const graceLeft = graceDays + 1 - sinceLast;
  return {
    current,
    longest: Math.max(longest, current),
    lastDay,
    trainedToday: lastDay === dayKey(today),
    atRisk: graceLeft <= 1 && lastDay !== dayKey(today),
    graceLeft: Math.max(0, graceLeft),
  };
}

/** Milliseconds until the current streak lapses. Drives the countdown on the HUD. */
export function streakDeadline(lastDay, graceDays = 1) {
  if (!lastDay) return null;
  const [y, m, d] = lastDay.split('-').map(Number);
  const last = new Date(y, m - 1, d);
  const deadline = new Date(last.getTime() + (graceDays + 1) * DAY_MS);
  deadline.setHours(23, 59, 59, 999);
  return deadline.getTime();
}

// --- Extraction ------------------------------------------------------------

/**
 * Which shadows the hunter now qualifies for.
 * Pure: give it the stats, it tells you what is newly unlocked.
 */
export function evaluateShadows(progress = {}, unlocked = []) {
  const have = new Set(unlocked);
  const newly = [];

  for (const shadow of SHADOWS) {
    if (have.has(shadow.id)) continue;
    const { type, value } = shadow.requirement;
    const actual = Number(progress[type]) || 0;
    if (actual >= value) newly.push(shadow);
  }

  return newly;
}

/** The next shadow to chase, with progress toward it — shown on the dashboard. */
export function nextShadow(progress = {}, unlocked = []) {
  const have = new Set(unlocked);
  const candidates = SHADOWS.filter((s) => !have.has(s.id)).map((s) => {
    const actual = Number(progress[s.requirement.type]) || 0;
    return { shadow: s, actual, target: s.requirement.value, ratio: actual / s.requirement.value };
  });
  if (!candidates.length) return null;
  candidates.sort((a, b) => b.ratio - a.ratio);
  return candidates[0];
}

export const REQUIREMENT_LABELS = {
  streak: (v) => `${v}-day streak`,
  bossKills: (v) => `Defeat ${v} raid bosses`,
  prCount: (v) => `Break ${v} personal records`,
  volumeKg: (v) => `Move ${(v / 1000).toLocaleString()} tonnes total`,
  workouts: (v) => `Log ${v} workouts`,
};
