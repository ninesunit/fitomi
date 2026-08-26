// ---------------------------------------------------------------------------
// HUNTER RANKS
//
// Thresholds are tuned against the XP curve in leveling.js so that a lifter
// training ~4x/week lands roughly: C-Rank after year one, B in year two,
// A in year three and S somewhere past year four. S-Rank is meant to be rare.
// ---------------------------------------------------------------------------

export const RANKS = [
  {
    id: 'E',
    name: 'E-Rank',
    title: 'The Weakest Hunter',
    minLevel: 1,
    color: '#94a3b8',
    glow: 'rgba(148,163,184,0.45)',
    blurb: 'Every monarch started here. Show up, log the set, survive the week.',
  },
  {
    id: 'D',
    name: 'D-Rank',
    title: 'Awakened',
    minLevel: 8,
    color: '#4ade80',
    glow: 'rgba(74,222,128,0.45)',
    blurb: 'The System has noticed you. Movement patterns are becoming habits.',
  },
  {
    id: 'C',
    name: 'C-Rank',
    title: 'Gate Clearer',
    minLevel: 18,
    color: '#26bdff',
    glow: 'rgba(38,189,255,0.5)',
    blurb: 'You can hold a program together. Load is climbing on the main lifts.',
  },
  {
    id: 'B',
    name: 'B-Rank',
    title: 'Elite Hunter',
    minLevel: 30,
    color: '#a78bfa',
    glow: 'rgba(167,139,250,0.5)',
    blurb: 'Serious numbers, serious consistency. Most lifters never get here.',
  },
  {
    id: 'A',
    name: 'A-Rank',
    title: 'Guild Master',
    minLevel: 44,
    color: '#fb923c',
    glow: 'rgba(251,146,60,0.5)',
    blurb: 'Years of accumulated work. You program for yourself and it works.',
  },
  {
    id: 'S',
    name: 'S-Rank',
    title: 'National Level',
    minLevel: 60,
    color: '#fbbf24',
    glow: 'rgba(251,191,36,0.6)',
    blurb: 'A rank measured in years, not weeks. The gym bends around you.',
  },
  {
    id: 'M',
    name: 'Monarch',
    title: 'Shadow Sovereign',
    minLevel: 100,
    color: '#8b5cf6',
    glow: 'rgba(139,92,246,0.7)',
    blurb: 'Beyond the ranking system entirely.',
  },
];

export function rankForLevel(level) {
  let current = RANKS[0];
  for (const rank of RANKS) {
    if (level >= rank.minLevel) current = rank;
    else break;
  }
  return current;
}

export function nextRank(level) {
  return RANKS.find((r) => level < r.minLevel) || null;
}

/** Progress (0..1) from the current rank's floor to the next rank's floor. */
export function rankProgress(level) {
  const current = rankForLevel(level);
  const next = nextRank(level);
  if (!next) return 1;
  const span = next.minLevel - current.minLevel;
  return span > 0 ? Math.min(1, Math.max(0, (level - current.minLevel) / span)) : 1;
}

export function rankById(id) {
  return RANKS.find((r) => r.id === id) || RANKS[0];
}
