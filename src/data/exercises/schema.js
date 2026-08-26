// ---------------------------------------------------------------------------
// Compact exercise DSL.
//
// The library is large, so every exercise is written as a positional tuple and
// expanded at module load. Pipe-delimited strings keep the source dense enough
// to actually read a whole muscle group in one screen, and keep the shipped
// bundle small — which matters on a 360 MB/day hosting budget.
// ---------------------------------------------------------------------------

const split = (s) => (s ? s.split('|').map((t) => t.trim()).filter(Boolean) : []);

/**
 * @param id          stable slug, also the Firestore records key
 * @param name        display name
 * @param equipment   EQUIPMENT id
 * @param category    the muscle group bucket it files under in the library
 * @param primary     muscles doing the work
 * @param secondary   muscles assisting
 * @param pattern     PATTERNS key — drives quests and raid weaknesses
 * @param tier        s|a|b|c — XP and raid-damage weighting
 * @param difficulty  beginner|intermediate|advanced
 * @param steps       pipe-delimited form guide
 * @param cues        pipe-delimited coaching cues
 * @param mistakes    pipe-delimited common errors
 * @param opts        { anim, tracking, usesBodyweight, bodyweightFactor, aliases, unilateral, mechanics, force }
 */
export function x(
  id,
  name,
  equipment,
  category,
  primary,
  secondary,
  pattern,
  tier,
  difficulty,
  steps,
  cues,
  mistakes,
  opts = {},
) {
  return {
    id,
    name,
    equipment,
    category,
    primary,
    secondary,
    pattern,
    tier,
    difficulty,
    steps: split(steps),
    cues: split(cues),
    mistakes: split(mistakes),
    mechanics: opts.mechanics || (primary.length + secondary.length > 2 ? 'compound' : 'isolation'),
    force: opts.force || null,
    tracking: opts.tracking || 'reps',
    usesBodyweight: opts.usesBodyweight || equipment === 'bodyweight',
    bodyweightFactor: opts.bodyweightFactor ?? (equipment === 'bodyweight' ? 0.65 : 0),
    unilateral: opts.unilateral || false,
    aliases: split(opts.aliases || ''),
    anim: opts.anim || pattern,
    isMachine: equipment === 'machine' || equipment === 'smith' || equipment === 'cable',
  };
}

export const bw = (factor, extra = {}) => ({ usesBodyweight: true, bodyweightFactor: factor, ...extra });
export const timed = (extra = {}) => ({ tracking: 'duration', ...extra });
export const dist = (extra = {}) => ({ tracking: 'distance', ...extra });
