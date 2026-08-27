import { STAT_IDS, EMPTY_STATS, toKg } from './constants';
import { EXERCISES, getExercise } from '../data/exercises';
import { canPerform, gearFor, presetGear } from '../data/gear';
import { seededRandom } from '../lib/date';

// ---------------------------------------------------------------------------
// THE AWAKENING ASSESSMENT
//
// Everything the questionnaire collects is folded here into a starting build:
// an attribute spread, a body-composition read, a recovery estimate, named weak
// points, and a full week-by-week training programme drawn from the exercise
// library and filtered to the equipment the hunter actually has.
//
// Pure and deterministic — the same answers always produce the same assessment,
// so it can be recomputed on any device without storing the result.
// ---------------------------------------------------------------------------

export const QUESTION_IDS = [
  'name', 'age', 'gender', 'body', 'experience', 'goal', 'weaknesses',
  'days', 'duration', 'split', 'equipment', 'focus', 'limitations',
];

// --- option tables ---------------------------------------------------------

export const GENDERS = [
  { id: 'male', label: 'Male' },
  { id: 'female', label: 'Female' },
  { id: 'other', label: 'Other' },
  { id: 'private', label: 'Prefer not to say' },
];

export const EXPERIENCE_LEVELS = [
  { id: 'none', label: 'Never trained', detail: 'The System will start from the floor.', years: 0 },
  { id: 'beginner', label: 'Under a year', detail: 'Movements are still being learned.', years: 0.5 },
  { id: 'intermediate', label: 'One to three years', detail: 'A program holds together now.', years: 2 },
  { id: 'advanced', label: 'Three years or more', detail: 'Progress is earned in small increments.', years: 5 },
];

export const GOALS = [
  { id: 'strength', label: 'Raw Strength', detail: 'Move the heaviest weight possible.', icon: 'Dumbbell', stats: { str: 3.2, vit: 1.4 } },
  { id: 'hypertrophy', label: 'Muscle Size', detail: 'Build visible mass.', icon: 'TrendingUp', stats: { str: 2.2, vit: 2.0, per: 1.2 } },
  { id: 'fatloss', label: 'Fat Loss', detail: 'Reduce bodyfat, keep muscle.', icon: 'Flame', stats: { agi: 2.6, vit: 1.8, int: 1.0 } },
  { id: 'endurance', label: 'Conditioning', detail: 'Lungs, work capacity, stamina.', icon: 'Wind', stats: { agi: 3.0, vit: 2.2 } },
  { id: 'athletic', label: 'Athleticism', detail: 'Speed, power, coordination.', icon: 'Zap', stats: { agi: 2.8, str: 1.8, per: 1.4 } },
  { id: 'general', label: 'General Health', detail: 'Feel better, move well, stay consistent.', icon: 'Heart', stats: { vit: 2.2, int: 1.6, agi: 1.2 } },
];

/**
 * Self-reported weaknesses. These *subtract* from the matching attribute —
 * the assessment is meant to be an honest read, and a named weak point is what
 * the quest engine later attacks.
 */
export const WEAKNESSES = [
  { id: 'strength', label: 'Raw strength', stat: 'str', muscles: ['chest', 'back', 'quads'] },
  { id: 'stamina', label: 'Cardio / stamina', stat: 'agi', muscles: ['cardio'] },
  { id: 'explosiveness', label: 'Speed & explosiveness', stat: 'agi', muscles: ['glutes', 'calves'] },
  { id: 'size', label: 'Muscle size', stat: 'vit', muscles: ['chest', 'lats', 'quads'] },
  { id: 'consistency', label: 'Turning up consistently', stat: 'int', muscles: [] },
  { id: 'technique', label: 'Lifting technique', stat: 'per', muscles: [] },
  { id: 'mobility', label: 'Mobility & flexibility', stat: 'agi', muscles: ['hipFlexors', 'hamstrings'] },
  { id: 'core', label: 'Core & posture', stat: 'vit', muscles: ['abs', 'lowerBack', 'obliques'] },
  { id: 'grip', label: 'Grip strength', stat: 'per', muscles: ['forearms'] },
  { id: 'recovery', label: 'Recovery & sleep', stat: 'vit', muscles: [] },
];

/**
 * Resolve the hunter's owned gear.
 *
 * `gear` is the current shape — an explicit list of apparatus. `equipment` is
 * the older coarse preset list, kept so an account created before the change
 * still resolves to something sensible instead of to nothing.
 */
export function ownedGear(answers = {}) {
  if (answers.gear?.length) return new Set(answers.gear);
  const legacy = new Set();
  for (const id of answers.equipment || []) for (const g of presetGear(id)) legacy.add(g);
  return legacy;
}

export const SPLIT_OPTIONS = [
  { id: 'auto', label: 'Let the System decide', detail: 'Chosen from your days and goal.' },
  { id: 'fullbody', label: 'Full body', detail: 'Everything, every session.' },
  { id: 'upperlower', label: 'Upper / Lower', detail: 'Alternating halves.' },
  { id: 'ppl', label: 'Push / Pull / Legs', detail: 'By movement pattern.' },
  { id: 'bro', label: 'Body part split', detail: 'One or two groups per day.' },
];

export const FOCUS_AREAS = [
  { id: 'chest', label: 'Chest' },
  { id: 'back', label: 'Back' },
  { id: 'shoulders', label: 'Shoulders' },
  { id: 'arms', label: 'Arms' },
  { id: 'legs', label: 'Legs' },
  { id: 'glutes', label: 'Glutes' },
  { id: 'core', label: 'Core / Abs' },
  { id: 'cardio', label: 'Conditioning' },
];

export const LIMITATIONS = [
  { id: 'none', label: 'No limitations', avoid: [] },
  { id: 'lowerback', label: 'Lower back', avoid: ['lowerBack'], avoidPatterns: ['hinge'] },
  { id: 'knee', label: 'Knees', avoid: [], avoidPatterns: ['lunge'] },
  { id: 'shoulder', label: 'Shoulders', avoid: [], avoidPatterns: ['verticalPush'] },
  { id: 'wrist', label: 'Wrists / elbows', avoid: ['forearms'], avoidPatterns: [] },
  { id: 'hip', label: 'Hips', avoid: ['hipFlexors'], avoidPatterns: [] },
];

// --- body composition ------------------------------------------------------

export function bodyRead({ height, weight, unit, age, gender }) {
  const kg = toKg(Number(weight) || 0, unit || 'kg');
  const m = (Number(height) || 0) / 100;
  if (!kg || !m) return null;

  const bmi = kg / (m * m);
  const band =
    bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Healthy range' : bmi < 30 ? 'Overweight' : 'Obese range';

  // Ideal-bodyweight strength reference (Devine), used only to scale targets.
  const inches = m * 39.3701;
  const base = gender === 'female' ? 45.5 : 50;
  const ideal = base + 2.3 * Math.max(0, inches - 60);

  return {
    bmi: Math.round(bmi * 10) / 10,
    band,
    kg: Math.round(kg * 10) / 10,
    idealKg: Math.round(ideal * 10) / 10,
    // Recovery capacity falls with age and rises with a healthy body composition.
    recovery: clamp(
      1 - Math.max(0, ((Number(age) || 25) - 25) * 0.008) - Math.max(0, (bmi - 27) * 0.02),
      0.45,
      1,
    ),
  };
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// --- starting attributes ---------------------------------------------------

/**
 * Every hunter starts at Level 1, E-Rank — the premise does not allow buying
 * your way in. What the assessment personalises is the *shape* of the starting
 * build, so an experienced lifter and a total beginner both begin at the
 * bottom but with visibly different sheets.
 */
export function startingStats(answers) {
  const stats = EMPTY_STATS();
  for (const id of STAT_IDS) stats[id] = 10;

  const experience = EXPERIENCE_LEVELS.find((e) => e.id === answers.experience) || EXPERIENCE_LEVELS[0];
  const goal = GOALS.find((g) => g.id === answers.goal) || GOALS[5];
  const body = bodyRead(answers);
  const age = Number(answers.age) || 25;

  // Training age is the biggest single input.
  const expBonus = { none: 0, beginner: 2, intermediate: 5, advanced: 9 }[experience.id] ?? 0;
  stats.str += expBonus;
  stats.vit += Math.round(expBonus * 0.8);
  stats.per += Math.round(expBonus * 0.6);
  stats.int += Math.round(expBonus * 0.5);

  // Goal tilts the build.
  for (const [id, weight] of Object.entries(goal.stats)) {
    stats[id] += Math.round(weight);
  }

  // Age: recovery and speed decline, accumulated judgement does not.
  if (age < 22) stats.agi += 2;
  else if (age > 45) { stats.agi -= 2; stats.vit -= 1; stats.int += 2; }
  else if (age > 35) { stats.agi -= 1; stats.int += 1; }

  // Body composition.
  if (body) {
    if (body.bmi >= 25 && body.bmi < 30) stats.str += 1;
    if (body.bmi >= 30) { stats.vit -= 2; stats.agi -= 2; }
    if (body.bmi < 18.5) { stats.str -= 2; stats.vit -= 1; }
  }

  // Committed training days signal discipline.
  const days = Number(answers.days) || 3;
  stats.int += days >= 5 ? 2 : days >= 4 ? 1 : 0;

  // Self-reported weak points subtract — this is the honest read.
  for (const id of answers.weaknesses || []) {
    const weakness = WEAKNESSES.find((w) => w.id === id);
    if (weakness) stats[weakness.stat] -= 3;
  }

  for (const id of STAT_IDS) stats[id] = Math.max(5, Math.round(stats[id]));
  return stats;
}

// --- programme generation --------------------------------------------------

/** Every exercise the hunter's gear actually permits. */
export function availableExercises(answers) {
  const owned = ownedGear(answers);
  return EXERCISES.filter((e) => canPerform(e, owned));
}

/**
 * Split templates.
 *
 * A day declares three things, and all three are enforced when picking work:
 *   patterns   — the movement patterns to fill, in priority order
 *   categories — the library categories a movement may come from
 *   force      — optional push/pull constraint
 *
 * The categories and force matter as much as the patterns. Filling a day from
 * patterns alone lets a lat pulldown land on a push day and turns a leg day
 * into a stack of planks, because the top-up pass has nothing to constrain it.
 */
const UPPER = ['chest', 'back', 'shoulders', 'arms'];
const PUSH = ['chest', 'shoulders', 'arms'];
const PULL = ['back', 'arms'];
const LEGS = ['legs'];
const COND = ['cardio', 'core'];

const day = (name, patterns, categories, force = null) => ({ name, patterns, categories, force });

const SPLITS = {
  fullbody: {
    2: [
      day('Full Body A', ['squat', 'horizontalPush', 'horizontalPull', 'isolation'], [...UPPER, ...LEGS, 'core']),
      day('Full Body B', ['hinge', 'verticalPush', 'verticalPull', 'isolation'], [...UPPER, ...LEGS, 'core']),
    ],
    3: [
      day('Full Body A', ['squat', 'horizontalPush', 'horizontalPull', 'isolation'], [...UPPER, ...LEGS, 'core']),
      day('Full Body B', ['hinge', 'verticalPush', 'verticalPull', 'isolation'], [...UPPER, ...LEGS, 'core']),
      day('Full Body C', ['lunge', 'horizontalPush', 'horizontalPull', 'rotation'], [...UPPER, ...LEGS, 'core']),
    ],
    4: [
      day('Full Body A', ['squat', 'horizontalPush', 'horizontalPull', 'isolation'], [...UPPER, ...LEGS, 'core']),
      day('Full Body B', ['hinge', 'verticalPush', 'verticalPull', 'isolation'], [...UPPER, ...LEGS, 'core']),
      day('Full Body C', ['lunge', 'horizontalPush', 'horizontalPull', 'rotation'], [...UPPER, ...LEGS, 'core']),
      day('Conditioning', ['conditioning', 'rotation', 'carry'], COND),
    ],
  },
  upperlower: {
    4: [
      day('Upper A', ['horizontalPush', 'horizontalPull', 'verticalPush', 'isolation'], UPPER),
      day('Lower A', ['squat', 'hinge', 'lunge', 'isolation'], [...LEGS, 'core']),
      day('Upper B', ['verticalPush', 'verticalPull', 'horizontalPull', 'isolation'], UPPER),
      day('Lower B', ['hinge', 'lunge', 'squat', 'isolation'], [...LEGS, 'core']),
    ],
    5: [
      day('Upper A', ['horizontalPush', 'horizontalPull', 'verticalPush', 'isolation'], UPPER),
      day('Lower A', ['squat', 'hinge', 'lunge', 'isolation'], [...LEGS, 'core']),
      day('Upper B', ['verticalPush', 'verticalPull', 'horizontalPull', 'isolation'], UPPER),
      day('Lower B', ['hinge', 'lunge', 'squat', 'isolation'], [...LEGS, 'core']),
      day('Conditioning', ['conditioning', 'rotation', 'carry'], COND),
    ],
    6: [
      day('Upper A', ['horizontalPush', 'horizontalPull', 'isolation'], UPPER),
      day('Lower A', ['squat', 'lunge', 'isolation'], [...LEGS, 'core']),
      day('Upper B', ['verticalPush', 'verticalPull', 'isolation'], UPPER),
      day('Lower B', ['hinge', 'lunge', 'isolation'], [...LEGS, 'core']),
      day('Upper C', ['horizontalPush', 'horizontalPull', 'isolation'], UPPER),
      day('Conditioning', ['conditioning', 'rotation', 'carry'], COND),
    ],
  },
  ppl: {
    3: [
      day('Push', ['horizontalPush', 'verticalPush', 'isolation'], PUSH, 'push'),
      day('Pull', ['verticalPull', 'horizontalPull', 'isolation'], PULL, 'pull'),
      day('Legs', ['squat', 'hinge', 'lunge', 'isolation'], [...LEGS, 'core']),
    ],
    5: [
      day('Push', ['horizontalPush', 'verticalPush', 'isolation'], PUSH, 'push'),
      day('Pull', ['verticalPull', 'horizontalPull', 'isolation'], PULL, 'pull'),
      day('Legs', ['squat', 'hinge', 'lunge', 'isolation'], [...LEGS, 'core']),
      day('Upper', ['horizontalPush', 'horizontalPull', 'isolation'], UPPER),
      day('Conditioning', ['conditioning', 'rotation', 'carry'], COND),
    ],
    6: [
      day('Push A', ['horizontalPush', 'verticalPush', 'isolation'], PUSH, 'push'),
      day('Pull A', ['verticalPull', 'horizontalPull', 'isolation'], PULL, 'pull'),
      day('Legs A', ['squat', 'lunge', 'isolation'], [...LEGS, 'core']),
      day('Push B', ['verticalPush', 'horizontalPush', 'isolation'], PUSH, 'push'),
      day('Pull B', ['horizontalPull', 'verticalPull', 'isolation'], PULL, 'pull'),
      day('Legs B', ['hinge', 'squat', 'isolation'], [...LEGS, 'core']),
    ],
  },
  bro: {
    5: [
      day('Chest', ['horizontalPush', 'isolation'], ['chest'], 'push'),
      day('Back', ['verticalPull', 'horizontalPull'], ['back'], 'pull'),
      day('Legs', ['squat', 'hinge', 'lunge'], LEGS),
      day('Shoulders', ['verticalPush', 'isolation'], ['shoulders'], 'push'),
      day('Arms', ['isolation'], ['arms']),
    ],
    6: [
      day('Chest', ['horizontalPush', 'isolation'], ['chest'], 'push'),
      day('Back', ['verticalPull', 'horizontalPull'], ['back'], 'pull'),
      day('Legs', ['squat', 'hinge', 'lunge'], LEGS),
      day('Shoulders', ['verticalPush', 'isolation'], ['shoulders'], 'push'),
      day('Arms', ['isolation'], ['arms']),
      day('Conditioning', ['conditioning', 'rotation', 'carry'], COND),
    ],
  },
};

/** Pick the split that actually fits the requested number of days. */
export function chooseSplit(preference, days) {
  const d = clamp(Number(days) || 3, 2, 6);

  if (preference && preference !== 'auto' && SPLITS[preference]) {
    const exact = SPLITS[preference][d];
    if (exact) return { id: preference, days: d, template: exact };
    // Fall back to the closest day count this split supports.
    const available = Object.keys(SPLITS[preference]).map(Number).sort((a, b) => Math.abs(a - d) - Math.abs(b - d));
    return { id: preference, days: available[0], template: SPLITS[preference][available[0]] };
  }

  if (d <= 3) return { id: 'fullbody', days: d, template: SPLITS.fullbody[d] || SPLITS.fullbody[3] };
  if (d === 4) return { id: 'upperlower', days: 4, template: SPLITS.upperlower[4] };
  if (d === 5) return { id: 'ppl', days: 5, template: SPLITS.ppl[5] };
  return { id: 'ppl', days: 6, template: SPLITS.ppl[6] };
}

/**
 * Build the actual week: real exercises from the library, filtered to the
 * equipment on hand and biased toward the hunter's stated focus areas, with
 * anything their injuries or experience rules out removed.
 */
export function buildProgram(answers, seed = 'awaken') {
  const owned = ownedGear(answers);
  const split = chooseSplit(answers.split, answers.days);
  const focus = new Set(answers.focus || []);
  const rng = seededRandom(`${seed}:${split.id}:${split.days}`);

  const limitations = (answers.limitations || []).filter((l) => l !== 'none');
  const avoidMuscles = new Set();
  const avoidPatterns = new Set();
  for (const id of limitations) {
    const limit = LIMITATIONS.find((l) => l.id === id);
    for (const m of limit?.avoid || []) avoidMuscles.add(m);
    for (const p of limit?.avoidPatterns || []) avoidPatterns.add(p);
  }

  const experience = answers.experience || 'none';
  // A movement nobody has been coached through does not belong in week one.
  const allowedDifficulty =
    experience === 'none'
      ? new Set(['beginner'])
      : experience === 'beginner'
        ? new Set(['beginner', 'intermediate'])
        : new Set(['beginner', 'intermediate', 'advanced']);

  const usable = EXERCISES.filter(
    (e) =>
      canPerform(e, owned) &&
      allowedDifficulty.has(e.difficulty) &&
      !e.primary.some((m) => avoidMuscles.has(m)) &&
      !avoidPatterns.has(e.pattern),
  );

  // Movements per session, scaled to the time actually available.
  const minutes = Number(answers.duration) || 60;
  const perDay = minutes >= 120 ? 7 : minutes >= 90 ? 6 : minutes >= 45 ? 5 : 4;

  const days = split.template.map((template, dayIndex) => {
    const categories = new Set(template.categories);
    const picked = [];
    const used = new Set();

    // Everything eligible for THIS day — the constraint every pass respects.
    const dayPool = usable.filter(
      (e) => categories.has(e.category) && (!template.force || e.force === template.force || !e.force),
    );

    const score = (e, slot) => {
      let s = 0;
      if (focus.has(e.category)) s += 4;
      if (e.primary.some((m) => focus.has(m))) s += 2;
      s += { s: 3, a: 2, b: 1, c: 0 }[e.tier] ?? 0;
      // The first slot of a day is where the hardest compound belongs.
      if (slot === 0 && e.mechanics === 'compound') s += 4;
      if (slot > 2 && e.mechanics === 'isolation') s += 1.5;
      return s + rng() * 1.2;
    };

    const take = (candidates, slot) => {
      const pool = candidates.filter((e) => !used.has(e.id));
      if (!pool.length) return false;
      pool.sort((a, b) => score(b, slot) - score(a, slot));
      used.add(pool[0].id);
      picked.push(pool[0]);
      return true;
    };

    // Pass 1: fill each declared pattern once, in priority order.
    for (const pattern of template.patterns) {
      if (picked.length >= perDay) break;
      take(dayPool.filter((e) => e.pattern === pattern), picked.length);
    }

    // Pass 2: cycle the patterns again for any remaining slots, so a five-slot
    // day of four patterns gets a second movement for the priority pattern
    // rather than something unrelated.
    let guard = 0;
    while (picked.length < perDay && guard < perDay * 3) {
      guard += 1;
      const pattern = template.patterns[guard % template.patterns.length];
      if (take(dayPool.filter((e) => e.pattern === pattern), picked.length)) continue;
      // Pass 3: anything else that belongs to this day at all.
      if (!take(dayPool, picked.length)) break;
    }

    return {
      id: `day-${dayIndex}`,
      name: template.name,
      dayIndex,
      blocks: picked.map((exercise, i) => {
        const compound = exercise.mechanics === 'compound';
        const strengthGoal = answers.goal === 'strength';
        const timed = exercise.tracking !== 'reps';
        return {
          exerciseId: exercise.id,
          name: exercise.name,
          sets: compound ? (strengthGoal ? 5 : 4) : 3,
          reps: timed ? null : compound ? (strengthGoal ? 5 : 8) : 12,
          seconds: timed ? 45 : null,
          rpe: i === 0 ? 8 : null,
          restSeconds: compound ? 180 : 75,
          resolved: true,
        };
      }),
    };
  });

  return { ...split, days, gearCount: owned.size, availableCount: usable.length };
}

// --- the full assessment ---------------------------------------------------

export function assess(answers) {
  const stats = startingStats(answers);
  const body = bodyRead(answers);
  const program = buildProgram(answers, answers.name || 'hunter');
  const goal = GOALS.find((g) => g.id === answers.goal) || GOALS[5];
  const experience = EXPERIENCE_LEVELS.find((e) => e.id === answers.experience) || EXPERIENCE_LEVELS[0];

  const total = STAT_IDS.reduce((s, id) => s + stats[id], 0);
  const strongest = [...STAT_IDS].sort((a, b) => stats[b] - stats[a])[0];
  const weakest = [...STAT_IDS].sort((a, b) => stats[a] - stats[b])[0];

  const named = (answers.weaknesses || [])
    .map((id) => WEAKNESSES.find((w) => w.id === id))
    .filter(Boolean);

  // Weekly tonnage the program should produce, used to set the first targets.
  const sessionsPerWeek = program.days.length;
  const setsPerWeek = program.days.reduce((s, d) => s + d.blocks.reduce((n, b) => n + b.sets, 0), 0);

  return {
    stats,
    body,
    program,
    goal,
    experience,
    total,
    strongest,
    weakest,
    weaknesses: named,
    sessionsPerWeek,
    setsPerWeek,
    // A plain-language read the result screen prints line by line.
    findings: buildFindings({ answers, stats, body, goal, experience, named, program }),
  };
}

function buildFindings({ answers, body, goal, experience, named, program }) {
  const out = [];

  out.push({
    label: 'Training age',
    value: experience.label,
    note: experience.detail,
  });

  if (body) {
    out.push({
      label: 'Body composition',
      value: `BMI ${body.bmi} · ${body.band}`,
      note:
        body.bmi >= 30
          ? 'Conditioning work is weighted higher to protect the joints while load builds.'
          : body.bmi < 18.5
            ? 'Calorie surplus matters more than programme design at this weight.'
            : 'Body composition is not a limiting factor. Load can climb steadily.',
    });

    out.push({
      label: 'Recovery capacity',
      value: `${Math.round(body.recovery * 100)}%`,
      note:
        body.recovery > 0.85
          ? 'You can absorb a high training frequency.'
          : 'Rest days are load-bearing at this capacity. The quest board will enforce them.',
    });
  }

  out.push({
    label: 'Primary objective',
    value: goal.label,
    note: goal.detail,
  });

  if (named.length) {
    out.push({
      label: 'Weak points identified',
      value: named.map((w) => w.label).join(' · '),
      note: 'Daily quests will target these first. Attributes here start lower and climb fastest.',
    });
  }

  out.push({
    label: 'Assigned programme',
    value: `${program.days.length}-day ${splitName(program.id)}`,
    note: `${program.days.map((d) => d.name).join(' · ')}.`,
  });

  out.push({
    label: 'Equipment matched',
    value: `${program.gearCount} items`,
    note: `${program.availableCount} of the library's movements are performable with what you have — every prescribed lift is one of them.`,
  });

  return out;
}

export function splitName(id) {
  return (
    { fullbody: 'Full Body', upperlower: 'Upper / Lower', ppl: 'Push / Pull / Legs', bro: 'Body Part Split' }[id] ||
    'Custom'
  );
}

/** Turn a generated programme day into a saveable routine. */
export function programToRoutines(program, uid) {
  return program.days.map((day) => ({
    id: `program-${day.id}`,
    source: 'assessment',
    uid,
    name: day.name,
    focus: day.name,
    dayOfWeek: day.dayIndex,
    blocks: day.blocks,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }));
}

export { getExercise };
