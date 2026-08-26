import { MUSCLES, PATTERNS, REGIONS } from './constants';
import {
  estimateSoreness,
  soreMuscles,
  neglectedMuscles,
  systemicReadiness,
  regionReadiness,
} from './soreness';
import { MOBILITY_DRILLS, CONDITIONING_DRILLS, RECOVERY_DRILLS } from '../data/mobility';
import { dayKey, seededRandom, seededSample, DAY_MS } from '../lib/date';
import { QUEST_DAMAGE } from './raid';

// ---------------------------------------------------------------------------
// THE QUEST BOARD — a rule-based expert system, not a model.
//
// Every morning the engine reads the last 48–72 hours of logged work, runs it
// through the soreness model, and fires a prioritised set of rules. Each rule
// that matches proposes a quest; the highest-priority non-overlapping quests
// become today's board. The whole thing is seeded by (userId + date) so the
// board is identical on every device and stable all day, with no server.
// ---------------------------------------------------------------------------

export const QUEST_TYPES = {
  mobility: { id: 'mobility', label: 'Mobility', color: '#26bdff', icon: 'Waves' },
  activation: { id: 'activation', label: 'Activation', color: '#4ade80', icon: 'Zap' },
  recovery: { id: 'recovery', label: 'Recovery', color: '#a78bfa', icon: 'Moon' },
  conditioning: { id: 'conditioning', label: 'Conditioning', color: '#fb923c', icon: 'Wind' },
  strength: { id: 'strength', label: 'Strength', color: '#fbbf24', icon: 'Dumbbell' },
  discipline: { id: 'discipline', label: 'Discipline', color: '#f43f5e', icon: 'Flame' },
};

export const DIFFICULTY = {
  easy: { id: 'easy', label: 'E', xp: 30, color: '#94a3b8' },
  normal: { id: 'normal', label: 'D', xp: 55, color: '#4ade80' },
  hard: { id: 'hard', label: 'C', xp: 90, color: '#26bdff' },
  elite: { id: 'elite', label: 'B', xp: 140, color: '#a78bfa' },
};

const drillTarget = (drill) =>
  drill.duration ? { value: drill.duration, unit: 'seconds' } : { value: drill.reps, unit: 'reps' };

/**
 * Build today's quest board.
 *
 * @param history   finished workouts, newest first, each { finishedAt, muscleVolume, patternVolume, volumeKg }
 * @param profile   { unit, bodyweight, goal, ... }
 * @param streak    { current, atRisk, trainedToday, graceLeft }
 * @param now       evaluation instant
 * @param userId    seeds the deterministic picks
 */
export function generateQuests({ history = [], profile = {}, streak = {}, records = {}, now = Date.now(), userId = 'anon' }) {
  const today = dayKey(new Date(now));
  const seed = `${userId}:${today}`;
  const rng = seededRandom(seed);

  const soreness = estimateSoreness(history, now);
  const sore = soreMuscles(soreness, 0.45);
  const neglected = neglectedMuscles(soreness);
  const readiness = systemicReadiness(soreness);
  const regions = regionReadiness(soreness);

  const recent48 = history.filter((w) => now - (w.finishedAt || 0) <= 2 * DAY_MS);
  const recent7 = history.filter((w) => now - (w.finishedAt || 0) <= 7 * DAY_MS);
  const volume48 = recent48.reduce((sum, w) => sum + (w.volumeKg || 0), 0);
  const weeklyVolume = recent7.reduce((sum, w) => sum + (w.volumeKg || 0), 0);
  const avgSessionVolume = history.length
    ? history.reduce((s, w) => s + (w.volumeKg || 0), 0) / history.length
    : 4000;

  const candidates = [];
  const push = (q) => candidates.push(q);

  // -- RULE 1: sore tissue gets targeted mobility, hardest-hit first ---------
  for (const muscle of sore.slice(0, 3)) {
    const drills = MOBILITY_DRILLS.filter((d) => d.muscles.includes(muscle.id));
    if (!drills.length) continue;
    const drill = drills[Math.floor(rng() * drills.length)];
    const target = drillTarget(drill);
    push({
      id: `mobility-${muscle.id}-${drill.id}`,
      type: 'mobility',
      priority: 90 + muscle.value * 10,
      title: drill.name,
      subtitle: `${MUSCLES[muscle.id].name} · ${muscle.state.label}`,
      description: `The System reads ${MUSCLES[muscle.id].name.toLowerCase()} at ${Math.round(
        muscle.value * 100,
      )}% fatigue from the last ${Math.round(muscle.hoursSince || 0)}h. Restore tissue quality before it costs you a session.`,
      cue: drill.cue,
      difficulty: 'easy',
      target,
      muscles: [muscle.id],
      reason: `${MUSCLES[muscle.id].name} at ${Math.round(muscle.value * 100)}% fatigue`,
    });
  }

  // -- RULE 2: high systemic load in 48h => the quest is to actually rest ----
  if (readiness < 0.35 && volume48 > avgSessionVolume * 1.4) {
    const drill = RECOVERY_DRILLS[Math.floor(rng() * RECOVERY_DRILLS.length)];
    push({
      id: `recovery-${drill.id}`,
      type: 'recovery',
      priority: 95,
      title: drill.name,
      subtitle: 'Systemic recovery',
      description: `You moved ${Math.round(volume48).toLocaleString()} kg in 48 hours and readiness has dropped to ${Math.round(
        readiness * 100,
      )}%. Recovery is the training. Take it.`,
      cue: drill.cue,
      difficulty: 'easy',
      target: drill.duration ? { value: drill.duration, unit: 'seconds' } : { value: 1, unit: 'complete' },
      muscles: [],
      reason: `Readiness at ${Math.round(readiness * 100)}%`,
    });
  }

  // -- RULE 3: neglected muscles get activation work ------------------------
  for (const muscle of neglected.slice(0, 2)) {
    const drills = MOBILITY_DRILLS.filter(
      (d) => d.muscles.includes(muscle.id) && d.kind === 'activation',
    );
    const pool = drills.length ? drills : MOBILITY_DRILLS.filter((d) => d.muscles.includes(muscle.id));
    if (!pool.length) continue;
    const drill = pool[Math.floor(rng() * pool.length)];
    const known = Number.isFinite(muscle.daysSince);
    const days = known ? Math.floor(muscle.daysSince) : null;
    push({
      id: `activation-${muscle.id}-${drill.id}`,
      type: 'activation',
      priority: 70 + (known ? Math.min(20, days) : 22),
      title: drill.name,
      subtitle: `${MUSCLES[muscle.id].name} · ${known ? 'neglected' : 'never trained'}`,
      description: known
        ? `${MUSCLES[muscle.id].name} has gone ${days} days without stimulus. Weak links become injuries. Wake it up.`
        : `${MUSCLES[muscle.id].name} has never appeared in a logged session. Weak links become injuries. Wake it up.`,
      cue: drill.cue,
      difficulty: 'normal',
      target: drillTarget(drill),
      muscles: [muscle.id],
      reason: known ? `${days} days untrained` : 'Never trained',
    });
  }

  // -- RULE 4: recovered => go and train, and say what to train -----------
  // Skipped with no history at all, because RULE 9 already owns that board.
  if (readiness > 0.6 && !streak.trainedToday && history.length > 0) {
    const targetVolume = Math.round(Math.max(2000, avgSessionVolume * 0.85) / 100) * 100;
    const freshest = regions.filter((r) => r.ready);
    const cooked = regions.filter((r) => !r.ready);
    const nameOf = (id) => REGIONS.find((r) => r.id === id)?.name || id;
    const steer = freshest.length
      ? `Freshest right now: ${freshest.slice(0, 2).map((r) => nameOf(r.region)).join(' and ')}.`
      : '';
    const avoid = cooked.length ? ` Leave ${nameOf(cooked[cooked.length - 1].region)} alone today.` : '';

    push({
      id: 'strength-session',
      type: 'strength',
      priority: 100,
      title: 'Clear a Gate',
      subtitle: 'Log a full session today',
      description: `Readiness is at ${Math.round(
        readiness * 100,
      )}%. Log a session of at least ${targetVolume.toLocaleString()} kg of volume. ${steer}${avoid}`.trim(),
      cue: 'Warm up, hit your main lift, log every set as you go.',
      difficulty: 'hard',
      target: { value: targetVolume, unit: 'kg' },
      auto: 'volume',
      muscles: [],
      reason: `Readiness ${Math.round(readiness * 100)}%`,
    });
  }

  // -- RULE 5: streak about to lapse => a minimum viable session ------------
  if (streak.atRisk && streak.current > 0) {
    push({
      id: 'discipline-streak',
      type: 'discipline',
      priority: 120,
      title: 'Hold the Line',
      subtitle: `${streak.current}-day streak expiring`,
      description: `Your ${streak.current}-day streak lapses in under ${Math.max(
        1,
        streak.graceLeft || 1,
      )} day${(streak.graceLeft || 1) > 1 ? 's' : ''}. Log anything — ten minutes counts. Shadows are lost far faster than they are extracted.`,
      cue: 'A short session still counts. Consistency beats intensity every time.',
      difficulty: 'normal',
      target: { value: 1, unit: 'workout' },
      auto: 'workout',
      muscles: [],
      reason: 'Streak at risk',
    });
  }

  // -- RULE 6: conditioning when cardio has gone quiet ----------------------
  const cardioDays = soreness.cardio?.daysSince;
  if (cardioDays === null || cardioDays === undefined || cardioDays > 3) {
    const drill = CONDITIONING_DRILLS[Math.floor(rng() * CONDITIONING_DRILLS.length)];
    push({
      id: `conditioning-${drill.id}`,
      type: 'conditioning',
      priority: 60,
      title: drill.name,
      subtitle: 'Agility conditioning',
      description: `No conditioning logged ${
        Number.isFinite(cardioDays) ? `in ${Math.floor(cardioDays)} days` : 'yet'
      }. Agility is the stat most hunters let rot. Raise it.`,
      cue: drill.cue,
      difficulty: 'normal',
      target: { value: drill.duration, unit: 'seconds' },
      muscles: ['cardio'],
      reason: 'Conditioning gap',
    });
  }

  // -- RULE 7: a stale, well-recovered main lift is a PR opportunity --------
  const prTarget = findPrOpportunity(records, soreness, now);
  if (prTarget && readiness > 0.55) {
    push({
      id: `strength-pr-${prTarget.exerciseId}`,
      type: 'strength',
      priority: 85,
      title: `Attempt a PR: ${prTarget.name}`,
      subtitle: 'Raid damage opportunity',
      description: `${prTarget.name} has not moved in ${Math.floor(
        prTarget.daysSince,
      )} days and the involved muscles are recovered. A new record deals heavy damage to this week's boss.`,
      cue: 'Ramp properly. One or two honest top sets, then back off.',
      difficulty: 'elite',
      target: { value: 1, unit: 'PR' },
      auto: 'pr',
      muscles: [],
      reason: `${Math.floor(prTarget.daysSince)} days since last attempt`,
    });
  }

  // -- RULE 8: weekly volume shortfall -------------------------------------
  const weeklyTarget = Math.round(Math.max(12000, avgSessionVolume * 3.5) / 500) * 500;
  if (history.length >= 3 && weeklyVolume < weeklyTarget * 0.6) {
    push({
      id: 'strength-weekly-volume',
      type: 'strength',
      priority: 55,
      title: 'Tonnage Quota',
      subtitle: 'Weekly volume behind pace',
      description: `${Math.round(weeklyVolume).toLocaleString()} kg logged in the last 7 days against a ${weeklyTarget.toLocaleString()} kg pace. Close the gap.`,
      cue: 'Volume is the currency of hypertrophy. Add a set, not a session.',
      difficulty: 'hard',
      target: { value: weeklyTarget, unit: 'kg/week' },
      auto: 'weeklyVolume',
      muscles: [],
      reason: 'Below weekly pace',
    });
  }

  // -- RULE 9: a first-session onboarding board ----------------------------
  if (!history.length) {
    push({
      id: 'discipline-first-log',
      type: 'discipline',
      priority: 130,
      title: 'The First Gate',
      subtitle: 'Log your first workout',
      description:
        'The System cannot read you until you give it data. Log a single workout — any weight, any number of sets — and the engine starts calibrating.',
      cue: 'Start with a compound lift you already know how to do.',
      difficulty: 'normal',
      target: { value: 1, unit: 'workout' },
      auto: 'workout',
      muscles: [],
      reason: 'No history yet',
    });
    const drill = MOBILITY_DRILLS.find((d) => d.id === 'worlds-greatest');
    push({
      id: 'mobility-onboard',
      type: 'mobility',
      priority: 65,
      title: drill.name,
      subtitle: 'Baseline mobility',
      description: 'A baseline mobility drill so the System has something to compare against.',
      cue: drill.cue,
      difficulty: 'easy',
      target: drillTarget(drill),
      muscles: drill.muscles,
      reason: 'Onboarding',
    });
  }

  // Rank by priority, then trim to a board that does not overwhelm.
  candidates.sort((a, b) => b.priority - a.priority);

  const chosen = [];
  const usedTypes = {};
  for (const quest of candidates) {
    const count = usedTypes[quest.type] || 0;
    // At most two quests of any one type — a board of five mobility drills is
    // technically correct and completely demoralising.
    if (count >= 2) continue;
    usedTypes[quest.type] = count + 1;
    chosen.push(quest);
    if (chosen.length >= 5) break;
  }

  return chosen.map((quest) => ({
    ...quest,
    day: today,
    xp: DIFFICULTY[quest.difficulty].xp,
    damage: QUEST_DAMAGE,
    typeMeta: QUEST_TYPES[quest.type],
    difficultyMeta: DIFFICULTY[quest.difficulty],
  }));
}

/**
 * Pick a lift that is due a PR attempt: trained before, recovered now, and
 * stale enough that the lifter has probably adapted since.
 */
function findPrOpportunity(records, soreness, now) {
  const entries = Object.entries(records || {})
    .map(([exerciseId, r]) => ({
      exerciseId,
      name: r.name,
      daysSince: r.lastPerformed ? (now - r.lastPerformed) / DAY_MS : null,
      sessions: r.sessions || 0,
    }))
    .filter((r) => r.name && r.sessions >= 3 && r.daysSince !== null && r.daysSince >= 5 && r.daysSince <= 45);

  if (!entries.length) return null;
  entries.sort((a, b) => b.daysSince - a.daysSince);
  return entries[0];
}

/**
 * Weekly quests — longer arcs that survive a single day, generated from the
 * same deterministic seed but keyed to the week.
 */
export function generateWeeklyQuests({ history = [], streak = {}, week, userId = 'anon' }) {
  const recent = history.filter((w) => Date.now() - (w.finishedAt || 0) <= 28 * DAY_MS);
  const avgSessions = recent.length ? Math.round(recent.length / 4) : 3;
  const avgVolume = recent.length ? recent.reduce((s, w) => s + (w.volumeKg || 0), 0) / recent.length : 4000;

  const pool = [
    {
      id: 'weekly-sessions',
      title: 'Four Gates',
      description: `Log ${Math.max(3, avgSessions + 1)} sessions this week.`,
      target: { value: Math.max(3, avgSessions + 1), unit: 'workouts' },
      auto: 'weeklyWorkouts',
      xp: 260,
      type: 'discipline',
    },
    {
      id: 'weekly-tonnage',
      title: 'Siege Tonnage',
      description: `Move ${Math.round((avgVolume * 4) / 1000)} tonnes across the week.`,
      target: { value: Math.round(avgVolume * 4), unit: 'kg' },
      auto: 'weeklyVolume',
      xp: 300,
      type: 'strength',
    },
    {
      id: 'weekly-pr',
      title: 'Break the Ceiling',
      description: 'Set at least one personal record this week.',
      target: { value: 1, unit: 'PR' },
      auto: 'weeklyPr',
      xp: 340,
      type: 'strength',
    },
    {
      id: 'weekly-streak',
      title: 'Unbroken',
      description: 'Do not let the streak lapse before the week closes.',
      target: { value: 1, unit: 'streak held' },
      auto: 'streakHeld',
      xp: 220,
      type: 'discipline',
    },
    {
      id: 'weekly-conditioning',
      title: 'Lungs of a Hunter',
      description: 'Log two conditioning sessions this week.',
      target: { value: 2, unit: 'sessions' },
      auto: 'weeklyConditioning',
      xp: 240,
      type: 'conditioning',
    },
  ];

  return seededSample(pool, 3, `${userId}:${week}`).map((q) => ({
    ...q,
    week,
    typeMeta: QUEST_TYPES[q.type],
    damage: QUEST_DAMAGE * 2,
  }));
}

export { PATTERNS };
