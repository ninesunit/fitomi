// ---------------------------------------------------------------------------
// Onboarding state.
//
// The questionnaire runs BEFORE sign-in, so there is no account to write to
// yet. Answers live in localStorage and are seeded into the profile the first
// time the hunter authenticates. That ordering is the whole point of the flow:
// the System assesses you, and only then asks you to register.
// ---------------------------------------------------------------------------

const KEY = 'fitomi:awakening';

export const EMPTY_ANSWERS = {
  name: '',
  age: '',
  gender: '',
  height: '',
  weight: '',
  unit: 'kg',
  experience: '',
  goal: '',
  weaknesses: [],
  focus: [],
  days: 4,
  duration: 60,
  split: 'auto',
  equipment: [],
  limitations: [],
  completedAt: null,
};

export function loadAnswers() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return { ...EMPTY_ANSWERS, ...parsed };
  } catch {
    return null;
  }
}

export function saveAnswers(answers) {
  try {
    localStorage.setItem(KEY, JSON.stringify(answers));
  } catch {
    /* private mode — the flow still completes, it just will not survive a reload */
  }
}

export function clearAnswers() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nothing to do */
  }
}

/** True once the questionnaire has been finished and the assessment shown. */
export function hasCompletedAwakening() {
  return Boolean(loadAnswers()?.completedAt);
}

/**
 * Fold the questionnaire and its assessment into the fields a fresh profile
 * needs. Applied once, on first sign-in.
 */
export function seedProfileFromAssessment(profile, answers, assessment) {
  if (!answers || !assessment) return profile;

  return {
    ...profile,
    displayName: answers.name?.trim() || profile.displayName,
    age: Number(answers.age) || null,
    gender: answers.gender || null,
    height: Number(answers.height) || null,
    bodyweight: Number(answers.weight) || profile.bodyweight,
    unit: answers.unit || profile.unit,
    goal: answers.goal || profile.goal,
    experience: answers.experience || profile.experience,
    // The assessment's starting spread replaces the flat default, which is
    // what makes two new hunters look different on day one.
    stats: assessment.stats,
    awakening: {
      completedAt: answers.completedAt || Date.now(),
      weaknesses: answers.weaknesses || [],
      focus: answers.focus || [],
      equipment: answers.equipment || [],
      limitations: answers.limitations || [],
      daysPerWeek: Number(answers.days) || 4,
      sessionMinutes: Number(answers.duration) || 60,
      splitId: assessment.program.id,
      splitDays: assessment.program.days.map((d) => d.name),
    },
    settings: {
      ...profile.settings,
      // A hunter training six days a week should not lose a streak on a rest day.
      graceDays: Number(answers.days) >= 5 ? 1 : 2,
    },
  };
}
