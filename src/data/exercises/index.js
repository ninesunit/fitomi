import chest from './chest';
import back from './back';
import shoulders from './shoulders';
import arms from './arms';
import legs from './legs';
import core from './core';
import cardio from './cardio';
import olympic from './olympic';
import machines from './machines';

export const EXERCISES = [...chest, ...back, ...shoulders, ...arms, ...legs, ...core, ...cardio, ...olympic, ...machines];

export const EXERCISE_MAP = new Map(EXERCISES.map((e) => [e.id, e]));

export const getExercise = (id) => EXERCISE_MAP.get(id) || null;

export const CATEGORIES = [
  { id: 'chest', name: 'Chest', accent: '#26bdff' },
  { id: 'back', name: 'Back', accent: '#a78bfa' },
  { id: 'shoulders', name: 'Shoulders', accent: '#4ade80' },
  { id: 'arms', name: 'Arms', accent: '#fbbf24' },
  { id: 'legs', name: 'Legs', accent: '#fb923c' },
  { id: 'core', name: 'Core', accent: '#f43f5e' },
  { id: 'cardio', name: 'Conditioning', accent: '#22d3ee' },
  { id: 'olympic', name: 'Power & Strongman', accent: '#f87171' },
];

/**
 * Pre-built lowercase search haystack per exercise.
 *
 * Built once at module load rather than per keystroke: the library page filters
 * on every character typed, and re-lowercasing 200-plus records each time is
 * the difference between an instant filter and a janky one on a phone.
 */
const SEARCH_INDEX = EXERCISES.map((e) => ({
  id: e.id,
  haystack: [e.name, ...e.aliases, e.equipment, e.category, ...e.primary, ...e.secondary, e.pattern]
    .join(' ')
    .toLowerCase(),
}));

/** Substring search across name, aliases, equipment and targeted muscles. */
export function searchExercises(query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return EXERCISES;
  const terms = q.split(/\s+/);
  const ids = SEARCH_INDEX.filter(({ haystack }) => terms.every((t) => haystack.includes(t))).map((r) => r.id);
  return ids.map((id) => EXERCISE_MAP.get(id));
}

/** Filter by any combination of category, equipment, muscle and difficulty. */
export function filterExercises({ query, category, equipment, muscle, difficulty, pattern } = {}) {
  let list = query ? searchExercises(query) : EXERCISES;
  if (category && category !== 'all') list = list.filter((e) => e.category === category);
  if (equipment && equipment !== 'all') list = list.filter((e) => e.equipment === equipment);
  if (muscle && muscle !== 'all') {
    list = list.filter((e) => e.primary.includes(muscle) || e.secondary.includes(muscle));
  }
  if (difficulty && difficulty !== 'all') list = list.filter((e) => e.difficulty === difficulty);
  if (pattern && pattern !== 'all') list = list.filter((e) => e.pattern === pattern);
  return list;
}

/** Exercises that train a given muscle, primaries first. */
export function exercisesForMuscle(muscleId) {
  const primary = EXERCISES.filter((e) => e.primary.includes(muscleId));
  const secondary = EXERCISES.filter((e) => e.secondary.includes(muscleId));
  return [...primary, ...secondary];
}

/** The big lifts, for the strength-standards panel on the profile. */
export const KEY_LIFTS = [
  'barbell-back-squat',
  'barbell-bench-press',
  'barbell-deadlift',
  'barbell-overhead-press',
  'barbell-front-squat',
  'pull-up',
  'barbell-hip-thrust',
  'barbell-power-clean',
];

export default EXERCISES;
