import { weekKey, seededRandom, hashString } from '../lib/date';

// ---------------------------------------------------------------------------
// WEEKLY RAID BOSSES
//
// One boss per ISO week, chosen deterministically from the week key — so every
// hunter on Earth faces the same monster in the same week without a server ever
// being consulted. Damage comes from PRs (the headline mechanic), with chip
// damage from tonnage and quest clears so a boss is beatable by grinding too.
// ---------------------------------------------------------------------------

export const BOSSES = [
  {
    id: 'ashen-warden',
    name: 'Ashen Warden',
    title: 'Keeper of the Stone Gate',
    element: 'stone',
    weakness: 'squat',
    weaknessLabel: 'Squat patterns',
    color: '#f97316',
    accent: '#fbbf24',
    baseHp: 12500,
    flavor: 'A colossus of fused rock. It does not move quickly — it does not need to.',
  },
  {
    id: 'drowned-choir',
    name: 'Drowned Choir',
    title: 'Voice Beneath the Tide',
    element: 'water',
    weakness: 'conditioning',
    weaknessLabel: 'Conditioning work',
    color: '#06b6d4',
    accent: '#67e8f9',
    baseHp: 11000,
    flavor: 'It sings until your lungs give out. Outlast the song.',
  },
  {
    id: 'iron-revenant',
    name: 'Iron Revenant',
    title: 'The Unbending',
    element: 'metal',
    weakness: 'horizontalPush',
    weaknessLabel: 'Pressing movements',
    color: '#94a3b8',
    accent: '#e2e8f0',
    baseHp: 13000,
    flavor: 'Forged from every barbell that ever pinned a hunter to a bench.',
  },
  {
    id: 'crimson-hound',
    name: 'Crimson Hound',
    title: 'Hunter of Hunters',
    element: 'blood',
    weakness: 'verticalPull',
    weaknessLabel: 'Pull-ups and pulldowns',
    color: '#ef4444',
    accent: '#fca5a5',
    baseHp: 11500,
    flavor: 'It smells hesitation. Do not hesitate.',
  },
  {
    id: 'hollow-sovereign',
    name: 'Hollow Sovereign',
    title: 'Throne of Empty Sets',
    element: 'void',
    weakness: 'hinge',
    weaknessLabel: 'Hinge patterns',
    color: '#8b5cf6',
    accent: '#c4b5fd',
    baseHp: 14000,
    flavor: 'Every workout you skipped fed this thing. Take it back.',
  },
  {
    id: 'glass-serpent',
    name: 'Glass Serpent',
    title: 'Coil of Shattering Light',
    element: 'light',
    weakness: 'rotation',
    weaknessLabel: 'Core and rotational work',
    color: '#22d3ee',
    accent: '#a5f3fc',
    baseHp: 10500,
    flavor: 'Beautiful, brittle, and fast enough to open you before you blink.',
  },
  {
    id: 'famine-king',
    name: 'Famine King',
    title: 'He Who Eats Progress',
    element: 'decay',
    weakness: 'horizontalPull',
    weaknessLabel: 'Rows',
    color: '#84cc16',
    accent: '#d9f99d',
    baseHp: 12800,
    flavor: 'A plateau given a body. It grows fat on repeated weeks.',
  },
  {
    id: 'frost-marshal',
    name: 'Frost Marshal',
    title: 'Winter of the Ninth Gate',
    element: 'ice',
    weakness: 'verticalPush',
    weaknessLabel: 'Overhead pressing',
    color: '#38bdf8',
    accent: '#bae6fd',
    baseHp: 13600,
    flavor: 'Cold enough that your warm-up is the whole fight.',
  },
  {
    id: 'thousand-arm',
    name: 'Thousand-Arm Ascetic',
    title: 'The Patient Ruin',
    element: 'shadow',
    weakness: 'isolation',
    weaknessLabel: 'Isolation work',
    color: '#a78bfa',
    accent: '#ddd6fe',
    baseHp: 11800,
    flavor: 'It has curled for ten thousand years. Its arms are the mountains.',
  },
  {
    id: 'gate-tyrant',
    name: 'Gate Tyrant',
    title: 'S-Rank Anomaly',
    element: 'chaos',
    weakness: 'carry',
    weaknessLabel: 'Loaded carries',
    color: '#f43f5e',
    accent: '#fecdd3',
    baseHp: 16000,
    flavor: 'The System flagged this gate red and recommended evacuation.',
  },
];

/** The boss for a given week — same monster for every hunter, no server needed. */
export function bossForWeek(week = weekKey()) {
  const idx = hashString(`boss:${week}`) % BOSSES.length;
  return { ...BOSSES[idx], week };
}

/**
 * Bosses scale with the hunter so an S-Rank never one-shots the week — but the
 * scaling is deliberately shallower than the growth in a hunter's damage
 * output, so a boss stays winnable in a good week at every rank.
 */
export function bossHp(boss, level = 1) {
  return Math.round(boss.baseHp * (1 + (level - 1) * 0.028));
}

export const DAMAGE_SOURCES = {
  pr: { id: 'pr', label: 'Personal Record', color: '#fbbf24' },
  volume: { id: 'volume', label: 'Training Volume', color: '#26bdff' },
  quest: { id: 'quest', label: 'Quest Clear', color: '#4ade80' },
  streak: { id: 'streak', label: 'Streak Bonus', color: '#a78bfa' },
};

/**
 * Damage from a single PR.
 *
 * Scaled by how big the jump was rather than the absolute number, so a
 * beginner adding 5 kg to a 60 kg squat is rewarded like an advanced lifter
 * adding 2.5 kg to a 200 kg squat. Tier weights keep compounds meaningful.
 */
export function prDamage(pr, boss, exercise) {
  const TIER = { s: 1.5, a: 1.25, b: 1.0, c: 0.8 };
  const TYPE = { e1rm: 1.0, weight: 0.85, volume: 0.6, reps: 0.5 };

  const base = 900;
  // A first-ever log of an exercise is not progress yet — it is a baseline — so
  // it deals a token hit rather than a 100%-improvement haymaker.
  const improvement = pr.firstTime
    ? 0.005
    : Math.min(0.35, Math.max(0.005, pr.improvement || 0.01));
  // sqrt compresses the range so a lucky 30% jump is worth ~2.4x a 5% one,
  // not 6x.
  const magnitude = Math.sqrt(improvement / 0.05);

  let damage = base * magnitude * (TIER[pr.tier] || 1) * (TYPE[pr.type] || 1);

  const weak =
    exercise && boss && (exercise.pattern === boss.weakness || exercise.category === boss.weakness);
  if (weak) damage *= 1.6;

  return { amount: Math.round(damage), weakness: Boolean(weak) };
}

/** Chip damage from tonnage — grinding volume still moves the bar. */
export function volumeDamage(volumeKg, patternVolume = {}, boss) {
  const base = volumeKg / 8;
  const weakVolume = boss ? patternVolume[boss.weakness] || 0 : 0;
  const bonus = weakVolume / 5;
  return { amount: Math.round(base + bonus), weakness: weakVolume > 0 };
}

export const QUEST_DAMAGE = 350;

/** A held streak chips the boss once per training day. */
export function streakDamage(streak) {
  return { amount: Math.round(60 * Math.min(30, Math.max(0, streak))), source: 'streak' };
}

/** Fold a raid state and a list of hits into the new state. */
export function applyDamage(raid, hits) {
  const log = [...(raid.log || [])];
  let dealt = raid.damage || 0;

  for (const hit of hits) {
    if (!hit || !hit.amount) continue;
    dealt += hit.amount;
    log.push({
      at: hit.at || Date.now(),
      amount: hit.amount,
      source: hit.source,
      label: hit.label || '',
      weakness: Boolean(hit.weakness),
    });
  }

  return {
    ...raid,
    damage: dealt,
    log: log.slice(-60), // keep the document small — Firestore docs cap at 1 MiB
    defeated: dealt >= (raid.hp || Infinity),
    defeatedAt: dealt >= (raid.hp || Infinity) ? raid.defeatedAt || Date.now() : raid.defeatedAt || null,
  };
}

/** Reward for felling a boss, scaled to the hunter's level. */
export function bossReward(boss, level) {
  return {
    xp: Math.round(600 + level * 45),
    title: boss.title,
    badge: boss.id,
  };
}

export function createRaid(level, week = weekKey()) {
  const boss = bossForWeek(week);
  return {
    week,
    bossId: boss.id,
    hp: bossHp(boss, level),
    damage: 0,
    log: [],
    defeated: false,
    defeatedAt: null,
    startedAt: Date.now(),
  };
}

/** Cosmetic-only per-boss variation for the SVG sigil. */
export function bossSeed(boss) {
  return seededRandom(`sigil:${boss.id}`);
}
