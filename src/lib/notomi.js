import { EXERCISES, getExercise } from '../data/exercises';
import { seededRandom, weekKey, dayKey, addDays, startOfWeek } from './date';
import { fromKg } from '../engine/constants';

// ---------------------------------------------------------------------------
// NOTOMI SYNC
//
// Notomi is the companion scheduling app. Fitomi pulls the week's planned
// routines from it and turns them into sessions you can start with one tap.
//
// The brief rules out external APIs, so the transport here is a local mock that
// generates a deterministic, plausible week from the hunter's handle. The point
// is the *seam*: `createNotomiClient` takes a transport, and everything above it
// — the adapter, the reconciliation, the UI — is written against the real
// contract. Pointing this at a live Notomi instance is a one-line change at the
// bottom of this file, with nothing above it touched.
//
// Wire format (what a real endpoint must return):
//   {
//     handle: string,
//     week: "2026-W35",
//     generatedAt: epoch-ms,
//     routines: [{
//       externalId, name, dayOfWeek (0=Mon), focus, estimatedMinutes,
//       blocks: [{ exercise: <slug|name>, sets, reps, rpe?, restSeconds?, notes? }]
//     }]
//   }
// ---------------------------------------------------------------------------

export const NOTOMI_VERSION = '1.0';

const FOCUS_TEMPLATES = [
  {
    focus: 'Lower — Squat Emphasis',
    picks: ['barbell-back-squat', 'romanian-deadlift', 'leg-press', 'leg-curl-seated', 'calf-raise-standing', 'hanging-leg-raise'],
  },
  {
    focus: 'Upper — Push Emphasis',
    picks: ['barbell-bench-press', 'barbell-overhead-press', 'dumbbell-incline-press', 'lateral-raise', 'cable-pushdown', 'dip-triceps'],
  },
  {
    focus: 'Upper — Pull Emphasis',
    picks: ['pull-up', 'barbell-row', 'lat-pulldown', 'seated-cable-row', 'face-pull', 'dumbbell-curl'],
  },
  {
    focus: 'Lower — Hinge Emphasis',
    picks: ['barbell-deadlift', 'barbell-hip-thrust', 'bulgarian-split-squat', 'leg-curl-lying', 'back-extension', 'plank'],
  },
  {
    focus: 'Full Body — Power',
    picks: ['barbell-power-clean', 'barbell-front-squat', 'push-press', 'pull-up', 'farmers-walk', 'kettlebell-swing'],
  },
  {
    focus: 'Conditioning & Core',
    picks: ['rowing-machine', 'assault-bike', 'kettlebell-swing', 'ab-wheel-rollout', 'pallof-press', 'side-plank'],
  },
  {
    focus: 'Arms & Shoulders',
    picks: ['barbell-curl', 'skull-crusher', 'lateral-raise', 'hammer-curl', 'cable-pushdown', 'rear-delt-fly'],
  },
];

/**
 * The mock transport. Deterministic in (handle, week) so two devices syncing
 * the same account see byte-identical routines — the same discipline the quest
 * and raid engines follow.
 */
async function mockTransport({ handle, week }) {
  // A short delay so the UI's loading states are exercised honestly rather than
  // resolving in the same tick.
  await new Promise((resolve) => setTimeout(resolve, 550));

  const rng = seededRandom(`notomi:${handle}:${week}`);
  const sessionCount = 3 + Math.floor(rng() * 3); // 3–5 sessions in a week
  const chosen = [];
  const pool = [...FOCUS_TEMPLATES];

  const dayOptions = [0, 1, 2, 3, 4, 5, 6];
  const days = [];
  for (let i = 0; i < sessionCount; i += 1) {
    const idx = Math.floor(rng() * dayOptions.length);
    days.push(dayOptions.splice(idx, 1)[0]);
  }
  days.sort((a, b) => a - b);

  for (let i = 0; i < sessionCount; i += 1) {
    const template = pool.splice(Math.floor(rng() * pool.length), 1)[0] || FOCUS_TEMPLATES[0];
    const blocks = template.picks
      .filter((id) => getExercise(id))
      .map((id, bi) => {
        const exercise = getExercise(id);
        const compound = exercise.mechanics === 'compound';
        return {
          exercise: id,
          sets: compound ? 3 + Math.floor(rng() * 2) : 3,
          reps: compound ? [5, 6, 8][Math.floor(rng() * 3)] : [10, 12, 15][Math.floor(rng() * 3)],
          rpe: bi === 0 ? 8 : null,
          restSeconds: compound ? 180 : 90,
        };
      });

    chosen.push({
      externalId: `ntm-${week}-${i}`,
      name: template.focus,
      dayOfWeek: days[i],
      focus: template.focus,
      estimatedMinutes: 45 + Math.floor(rng() * 30),
      blocks,
    });
  }

  return {
    handle,
    week,
    generatedAt: Date.now(),
    routines: chosen,
    source: 'mock',
  };
}

/**
 * Build a sync client.
 *
 * @param transport async ({ handle, week }) => wire payload.
 *        Swap the default for a real `fetch` and nothing else changes.
 */
export function createNotomiClient(transport = mockTransport) {
  return {
    async pullWeek({ handle, week = weekKey() }) {
      if (!handle || !handle.trim()) {
        throw new Error('A Notomi handle is required to sync.');
      }

      const payload = await transport({ handle: handle.trim(), week });
      return adaptPayload(payload, week);
    },
  };
}

/**
 * Translate the wire format into Fitomi routines.
 *
 * Deliberately forgiving: Notomi names an exercise however its own library
 * does, so blocks resolve by slug first, then by exact name, then by a loose
 * name match. Anything that still cannot be resolved is reported rather than
 * silently dropped, so a hunter can see exactly what did not come across.
 */
export function adaptPayload(payload, week = weekKey()) {
  if (!payload || !Array.isArray(payload.routines)) {
    throw new Error('Notomi returned a response Fitomi could not read.');
  }

  const monday = startOfWeek(new Date());
  const unresolved = [];

  const routines = payload.routines.map((routine) => {
    const blocks = (routine.blocks || []).map((block) => {
      const exercise = resolveExercise(block.exercise);
      if (!exercise) unresolved.push(block.exercise);
      return {
        exerciseId: exercise?.id || null,
        name: exercise?.name || String(block.exercise),
        sets: Number(block.sets) || 3,
        reps: Number(block.reps) || 10,
        weightKg: Number(block.weightKg) || 0,
        rpe: block.rpe ?? null,
        restSeconds: Number(block.restSeconds) || null,
        notes: block.notes || '',
        resolved: Boolean(exercise),
      };
    });

    const scheduledFor = addDays(monday, Number(routine.dayOfWeek) || 0);

    return {
      id: `notomi-${routine.externalId}`,
      source: 'notomi',
      externalId: routine.externalId,
      name: routine.name || routine.focus || 'Notomi Session',
      focus: routine.focus || '',
      week,
      dayOfWeek: Number(routine.dayOfWeek) || 0,
      scheduledFor: scheduledFor.getTime(),
      scheduledDay: dayKey(scheduledFor),
      estimatedMinutes: Number(routine.estimatedMinutes) || null,
      blocks,
      importedAt: Date.now(),
    };
  });

  return {
    handle: payload.handle,
    week,
    generatedAt: payload.generatedAt || Date.now(),
    source: payload.source || 'remote',
    routines: routines.sort((a, b) => a.dayOfWeek - b.dayOfWeek),
    unresolved: [...new Set(unresolved)],
  };
}

/** Slug → exact name → loose name. */
function resolveExercise(reference) {
  if (!reference) return null;
  const direct = getExercise(reference);
  if (direct) return direct;

  const needle = String(reference).toLowerCase().trim();
  const exact = EXERCISES.find(
    (e) => e.name.toLowerCase() === needle || e.aliases.some((a) => a.toLowerCase() === needle),
  );
  if (exact) return exact;

  return (
    EXERCISES.find((e) => e.name.toLowerCase().includes(needle) || needle.includes(e.name.toLowerCase())) || null
  );
}

/** Turn an imported routine into the entry shape the workout session expects. */
export function routineToSession(routine, unit = 'kg') {
  return {
    name: routine.name,
    routineId: routine.id,
    entries: routine.blocks
      .filter((block) => block.resolved && block.exerciseId)
      .map((block) => ({
        exerciseId: block.exerciseId,
        notes: block.notes,
        sets: Array.from({ length: block.sets }, (_, i) => ({
          id: `${routine.id}-${block.exerciseId}-${i}`,
          reps: block.reps,
          weight: Number(fromKg(block.weightKg || 0, unit).toFixed(1)),
          rpe: block.rpe,
          duration: '',
          distance: '',
          type: 'working',
          completed: false,
          completedAt: null,
        })),
      })),
  };
}

export const notomi = createNotomiClient();
export default notomi;
