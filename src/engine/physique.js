// ---------------------------------------------------------------------------
// PHYSIQUE
//
// Turns a hunter's attributes into the proportions of the figure that
// represents them. The avatar is not decoration bolted on top of the numbers:
// every dimension below is a function of a stat, so training a lift visibly
// changes the body on the status screen.
//
//   STR -> shoulder span, deltoid caps, arm girth
//   VIT -> chest depth, neck, overall robustness
//   AGI -> waist taper and limb leanness (it *removes* width)
//   INT -> aura rings (programming discipline reads as control, not mass)
//   PER -> visor intensity
//
// Stats arrive unbounded and heavily skewed early on, so each is squashed
// through a saturating curve rather than a linear scale: the difference
// between 0 and 10 STR is dramatic, between 90 and 100 barely visible. That
// matches how bodies actually respond to training.
// ---------------------------------------------------------------------------

/**
 * Saturating 0..1 curve. `half` is the stat value that reads as halfway
 * developed, so the shape of the whole avatar can be retuned from one number.
 */
export function saturate(value, half = 26) {
  const v = Math.max(0, Number(value) || 0);
  return v / (v + half);
}

// Body types the hunter picks during the awakening. These set the baseline the
// stats then push away from, so the figure resembles them from day one instead
// of everyone starting as the same androgynous mannequin.
export const BODY_TYPES = [
  { id: 'lean',     name: 'Lean',     detail: 'Slim frame, low mass',      mass: 0.06, tone: 0.34 },
  { id: 'average',  name: 'Average',  detail: 'Middle of the road',        mass: 0.36, tone: 0.40 },
  { id: 'athletic', name: 'Athletic', detail: 'Some muscle already built', mass: 0.44, tone: 0.78 },
  { id: 'heavy',    name: 'Heavy',    detail: 'Broad or carrying weight',  mass: 0.88, tone: 0.36 },
];

export const BODY_TYPE_BY_ID = Object.fromEntries(BODY_TYPES.map((b) => [b.id, b]));

/**
 * Body types can also be inferred from height and weight when the hunter would
 * rather not self-describe. BMI is a poor measure of an individual's health,
 * but as a *drawing* hint for baseline width it is exactly the right tool.
 */
export function inferBodyType({ height, weight, unit = 'kg' } = {}) {
  const h = Number(height);
  const kg = unit === 'lb' ? Number(weight) * 0.45359237 : Number(weight);
  if (!(h > 80) || !(kg > 20)) return 'average';
  const bmi = kg / (h / 100) ** 2;
  if (bmi < 20) return 'lean';
  if (bmi < 25.5) return 'average';
  if (bmi < 29) return 'athletic';
  return 'heavy';
}

/**
 * The full parameter set the renderer needs. Everything is in the figure's own
 * 120x200 coordinate space so the SVG can scale without touching this maths.
 */
export function figureParams({ stats = {}, bodyType = 'average', sex = '' } = {}) {
  const base = BODY_TYPE_BY_ID[bodyType] || BODY_TYPE_BY_ID.average;

  const str = saturate(stats.str);
  const agi = saturate(stats.agi);
  const vit = saturate(stats.vit);
  const int = saturate(stats.int);
  const per = saturate(stats.per);

  // Training adds mass and tone on top of the starting frame; agility trims it.
  const mass = clamp01(base.mass + vit * 0.34 + str * 0.2 - agi * 0.16);
  const tone = clamp01(base.tone + str * 0.42 + agi * 0.2);

  // A wider pelvis and narrower shoulders read as female at silhouette scale.
  // This is a drawing convention, not a claim about any individual hunter, and
  // it only ever nudges: a strong hunter is broad-shouldered either way.
  const fem = sex === 'female' ? 1 : 0;

  return {
    // vertical landmarks (figure stands on y=190, ~7 heads tall)
    headY: 27, neckY: 46, shoulderY: 57, chestY: 77, waistY: 103,
    hipY: 116, kneeY: 150, ankleY: 186, cx: 60,

    // horizontal half-widths
    headR: 10.6 + vit * 0.9 - fem * 0.4,
    neckHalf: 4.2 + vit * 2 + str * 0.9 - fem * 0.8,
    shoulderHalf: 17.6 + str * 9.6 + mass * 3 - fem * 2,
    chestHalf: 15.4 + vit * 4.6 + str * 3.2 + mass * 2.8,
    // A heavy lifter has a thick trunk, not a wasp waist: strength adds here
    // too, it just adds less than it adds to the shoulders.
    waistHalf: 10.2 + mass * 7.4 + str * 1.8 - agi * 2.4 - fem * 0.4,
    hipHalf: 13 + mass * 4.6 + str * 0.8 + fem * 2.4,
    thighHalf: 7.8 + str * 2.8 + mass * 3.2 + fem * 0.6,
    kneeHalf: 5.2 + str * 0.9 + mass * 1,
    calfHalf: 5.4 + str * 1.9 + mass * 1.2,
    ankleHalf: 3.3 + mass * 0.5,
    upperArmHalf: 4.2 + str * 2.9 + mass * 1.1,
    elbowHalf: 3.4 + str * 1.2 + mass * 0.4,
    forearmHalf: 3.7 + str * 1.8 + mass * 0.6,
    wristHalf: 2.5 + str * 0.5,

    // presentation
    tone,           // how hard the muscle-definition lines read
    aura: int,      // aura ring opacity and count
    visor: per,     // eye/visor intensity
    mass,
  };
}

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

export default figureParams;
