// ---------------------------------------------------------------------------
// GEAR
//
// The library's `equipment` field is a coarse bucket — "machine" alone covers
// 41 exercises. That is fine for browsing and useless for programme building:
// a home gym with a leg press and a lat tower but no barbell would either be
// handed pec decks it does not own, or nothing at all.
//
// So every exercise also declares the *specific* apparatus it needs, and the
// programme generator prescribes a movement only when the hunter owns all of
// it. Bodyweight movements require nothing and are always available.
// ---------------------------------------------------------------------------

export const GEAR_GROUPS = [
  { id: 'bars', name: 'Bars, Racks & Benches' },
  { id: 'free', name: 'Free Weights & Small Gear' },
  { id: 'stations', name: 'Bodyweight Stations' },
  { id: 'cable', name: 'Cable & Pulley' },
  { id: 'machines', name: 'Resistance Machines' },
  { id: 'cardio', name: 'Cardio' },
  { id: 'strongman', name: 'Strongman & Outdoor' },
];

export const GEAR = [
  // --- bars, racks, benches ---
  { id: 'barbell', label: 'Olympic barbell', group: 'bars' },
  { id: 'plates', label: 'Weight plates', group: 'bars' },
  { id: 'ez-bar', label: 'EZ / curl bar', group: 'bars' },
  { id: 'rack', label: 'Squat or power rack', group: 'bars' },
  { id: 'bench-flat', label: 'Flat bench', group: 'bars' },
  { id: 'bench-adjustable', label: 'Adjustable / incline bench', group: 'bars' },
  { id: 'smith', label: 'Smith machine', group: 'bars' },
  { id: 'landmine', label: 'Landmine attachment', group: 'bars' },
  { id: 'preacher-bench', label: 'Preacher bench', group: 'bars' },

  // --- free weights & small gear ---
  { id: 'dumbbells', label: 'Dumbbells', group: 'free' },
  { id: 'kettlebells', label: 'Kettlebells', group: 'free' },
  { id: 'bands', label: 'Resistance bands', group: 'free' },
  { id: 'medicine-ball', label: 'Medicine / slam ball', group: 'free' },
  { id: 'ab-wheel', label: 'Ab wheel', group: 'free' },
  { id: 'jump-rope', label: 'Jump rope', group: 'free' },
  { id: 'wrist-roller', label: 'Wrist roller', group: 'free' },

  // --- bodyweight stations ---
  { id: 'pullup-bar', label: 'Pull-up bar', group: 'stations' },
  { id: 'dip-bars', label: 'Dip bars / parallel bars', group: 'stations' },
  { id: 'box', label: 'Plyo box or step', group: 'stations' },
  { id: 'back-ext-bench', label: 'Back extension bench', group: 'stations' },

  // --- cable ---
  { id: 'cable-station', label: 'Cable machine / functional trainer', group: 'cable' },
  { id: 'lat-pulldown', label: 'Lat pulldown tower', group: 'cable' },
  { id: 'seated-row', label: 'Seated cable row', group: 'cable' },

  // --- resistance machines ---
  { id: 'chest-press-machine', label: 'Chest press machine', group: 'machines' },
  { id: 'pec-deck', label: 'Pec deck / fly machine', group: 'machines' },
  { id: 'shoulder-press-machine', label: 'Shoulder press machine', group: 'machines' },
  { id: 'lateral-raise-machine', label: 'Lateral raise machine', group: 'machines' },
  { id: 'row-machine', label: 'Seated row machine', group: 'machines' },
  { id: 'pulldown-machine', label: 'Plate-loaded pulldown', group: 'machines' },
  { id: 'pullover-machine', label: 'Pullover machine', group: 'machines' },
  { id: 'leg-press', label: 'Leg press', group: 'machines' },
  { id: 'hack-squat', label: 'Hack squat', group: 'machines' },
  { id: 'pendulum-squat', label: 'Pendulum / V-squat', group: 'machines' },
  { id: 'belt-squat', label: 'Belt squat', group: 'machines' },
  { id: 'leg-extension', label: 'Leg extension', group: 'machines' },
  { id: 'leg-curl', label: 'Leg curl', group: 'machines' },
  { id: 'calf-machine', label: 'Calf raise machine', group: 'machines' },
  { id: 'hip-abduction', label: 'Hip abduction / adduction', group: 'machines' },
  { id: 'hip-thrust-machine', label: 'Hip thrust / glute drive', group: 'machines' },
  { id: 'preacher-machine', label: 'Preacher curl machine', group: 'machines' },
  { id: 'triceps-machine', label: 'Triceps extension machine', group: 'machines' },
  { id: 'assisted-pullup', label: 'Assisted pull-up / dip machine', group: 'machines' },
  { id: 'dip-machine', label: 'Seated dip machine', group: 'machines' },
  { id: 'ab-machine', label: 'Ab crunch machine', group: 'machines' },
  { id: 'torso-rotation', label: 'Torso rotation machine', group: 'machines' },
  { id: 'reverse-hyper', label: 'Reverse hyperextension', group: 'machines' },

  // --- cardio ---
  { id: 'treadmill', label: 'Treadmill', group: 'cardio' },
  { id: 'bike', label: 'Stationary bike', group: 'cardio' },
  { id: 'air-bike', label: 'Air / assault bike', group: 'cardio' },
  { id: 'rower', label: 'Rowing machine', group: 'cardio' },
  { id: 'elliptical', label: 'Elliptical', group: 'cardio' },
  { id: 'stair-climber', label: 'Stair climber', group: 'cardio' },
  { id: 'ski-erg', label: 'Ski erg', group: 'cardio' },
  { id: 'pool', label: 'Swimming pool', group: 'cardio' },

  // --- strongman & outdoor ---
  { id: 'sled', label: 'Prowler / sled', group: 'strongman' },
  { id: 'battle-ropes', label: 'Battle ropes', group: 'strongman' },
  { id: 'sandbag', label: 'Sandbag', group: 'strongman' },
  { id: 'atlas-stone', label: 'Atlas stone', group: 'strongman' },
  { id: 'yoke', label: 'Yoke', group: 'strongman' },
  { id: 'log', label: 'Log bar', group: 'strongman' },
  { id: 'neck-harness', label: 'Neck harness', group: 'strongman' },
  { id: 'outdoors', label: 'Outdoor space / track', group: 'strongman' },
];

export const GEAR_MAP = new Map(GEAR.map((g) => [g.id, g]));
export const gearLabel = (id) => GEAR_MAP.get(id)?.label || id;

// --- per-exercise requirements ------------------------------------------

/** Default requirement implied by the coarse equipment bucket. */
const BY_EQUIPMENT = {
  barbell: ['barbell', 'plates'],
  ez: ['ez-bar', 'plates'],
  dumbbell: ['dumbbells'],
  kettlebell: ['kettlebells'],
  band: ['bands'],
  plate: ['plates'],
  smith: ['smith'],
  cable: ['cable-station'],
  bodyweight: [],
  machine: [],
  cardio: [],
  other: [],
};

/**
 * Explicit requirements, keyed by exercise id.
 *
 * Anything not listed falls back to its equipment bucket. Listed entries
 * REPLACE that default, so a barbell lift that also needs a bench says so.
 */
const EXPLICIT = {
  // ---- barbell lifts that need a bench or a rack ----
  'barbell-bench-press': ['barbell', 'plates', 'bench-flat', 'rack'],
  'barbell-incline-bench-press': ['barbell', 'plates', 'bench-adjustable', 'rack'],
  'barbell-decline-bench-press': ['barbell', 'plates', 'bench-adjustable', 'rack'],
  'close-grip-bench-press': ['barbell', 'plates', 'bench-flat', 'rack'],
  'guillotine-press': ['barbell', 'plates', 'bench-flat', 'rack'],
  'jm-press': ['barbell', 'plates', 'bench-flat', 'rack'],
  'floor-press': ['barbell', 'plates'],
  'barbell-back-squat': ['barbell', 'plates', 'rack'],
  'barbell-front-squat': ['barbell', 'plates', 'rack'],
  'box-squat': ['barbell', 'plates', 'rack', 'box'],
  'good-morning': ['barbell', 'plates', 'rack'],
  'good-morning-legs': ['barbell', 'plates', 'bench-flat'],
  'barbell-overhead-press': ['barbell', 'plates', 'rack'],
  'push-press': ['barbell', 'plates', 'rack'],
  'bradford-press': ['barbell', 'plates', 'rack'],
  'rack-pull': ['barbell', 'plates', 'rack'],
  'seal-row': ['barbell', 'plates', 'bench-flat'],
  'barbell-hip-thrust': ['barbell', 'plates', 'bench-flat'],
  'landmine-press-chest': ['barbell', 'plates', 'landmine'],
  'landmine-press': ['barbell', 'plates', 'landmine'],
  'landmine-twist': ['barbell', 'plates', 'landmine'],
  'meadows-row': ['barbell', 'plates', 'landmine'],
  't-bar-row': ['barbell', 'plates', 'landmine'],
  'overhead-hold': ['barbell', 'plates', 'rack'],
  'barbell-thruster': ['barbell', 'plates'],

  // ---- EZ-bar work ----
  'preacher-curl': ['ez-bar', 'plates', 'preacher-bench'],
  'skull-crusher': ['ez-bar', 'plates', 'bench-flat'],

  // ---- dumbbell work needing a bench ----
  'dumbbell-bench-press': ['dumbbells', 'bench-flat'],
  'dumbbell-incline-press': ['dumbbells', 'bench-adjustable'],
  'dumbbell-fly': ['dumbbells', 'bench-flat'],
  'dumbbell-pullover': ['dumbbells', 'bench-flat'],
  'chest-supported-row': ['dumbbells', 'bench-adjustable'],
  'dumbbell-row': ['dumbbells', 'bench-flat'],
  'incline-dumbbell-curl': ['dumbbells', 'bench-adjustable'],
  'spider-curl': ['dumbbells', 'bench-adjustable'],
  'concentration-curl': ['dumbbells', 'bench-flat'],
  'y-raise': ['dumbbells', 'bench-adjustable'],
  'tate-press': ['dumbbells', 'bench-flat'],
  'bulgarian-split-squat': ['dumbbells', 'bench-flat'],
  'step-up': ['dumbbells', 'box'],
  'farmers-walk': ['dumbbells'],
  'suitcase-carry': ['dumbbells'],
  'overhead-triceps-extension': ['dumbbells'],

  // ---- bodyweight stations ----
  'pull-up': ['pullup-bar'],
  'chin-up': ['pullup-bar'],
  'neutral-grip-pull-up': ['pullup-bar'],
  'chin-up-curl': ['pullup-bar'],
  'dead-hang': ['pullup-bar'],
  'dead-hang-grip': ['pullup-bar'],
  'hanging-leg-raise': ['pullup-bar'],
  'hanging-knee-raise': ['pullup-bar'],
  'toes-to-bar': ['pullup-bar'],
  'dip-chest': ['dip-bars'],
  'dip-triceps': ['dip-bars'],
  'bench-dip': ['bench-flat'],
  'inverted-row': ['rack'],
  'decline-push-up': ['bench-flat'],
  'incline-push-up': ['bench-flat'],
  'decline-sit-up': ['bench-adjustable'],
  'back-extension': ['back-ext-bench'],
  'copenhagen-plank': ['bench-flat'],
  'l-sit': ['dip-bars'],
  'nordic-curl': [],
  'box-jump': ['box'],
  'standing-broad-jump': ['outdoors'],

  // ---- cable ----
  'lat-pulldown': ['lat-pulldown'],
  'close-grip-pulldown': ['lat-pulldown'],
  'cable-machine-lat-pulldown-wide': ['lat-pulldown'],
  'straight-arm-pulldown': ['cable-station'],
  'seated-cable-row': ['seated-row'],
  'single-arm-cable-row': ['seated-row'],

  // ---- machines, one apparatus each ----
  'machine-chest-press': ['chest-press-machine'],
  'machine-incline-press': ['chest-press-machine'],
  'chest-press-converging': ['chest-press-machine'],
  'pec-deck': ['pec-deck'],
  'reverse-pec-deck': ['pec-deck'],
  'pec-fly-cable-machine': ['pec-deck'],
  'machine-row': ['row-machine'],
  'low-row-machine': ['row-machine'],
  'hammer-strength-row': ['row-machine'],
  'hammer-strength-pulldown': ['pulldown-machine'],
  'vertical-traction-machine': ['pulldown-machine'],
  'machine-pullover': ['pullover-machine'],
  'lat-pullover-machine': ['pullover-machine'],
  'machine-shoulder-press': ['shoulder-press-machine'],
  'machine-lateral-raise': ['lateral-raise-machine'],
  'lateral-raise-cable-machine': ['lateral-raise-machine'],
  'machine-triceps-extension': ['triceps-machine'],
  'seated-dip-machine': ['dip-machine'],
  'assisted-pull-up-machine': ['assisted-pullup'],
  'assisted-dip-machine': ['assisted-pullup'],
  'machine-preacher-curl': ['preacher-machine'],
  'preacher-curl-machine': ['preacher-machine'],
  'hack-squat': ['hack-squat'],
  'leg-press': ['leg-press'],
  'calf-raise-leg-press': ['leg-press'],
  'pendulum-squat': ['pendulum-squat'],
  'v-squat': ['pendulum-squat'],
  'belt-squat': ['belt-squat'],
  'leg-extension': ['leg-extension'],
  'leg-curl-lying': ['leg-curl'],
  'leg-curl-seated': ['leg-curl'],
  'standing-leg-curl': ['leg-curl'],
  'calf-raise-standing': ['calf-machine'],
  'calf-raise-seated': ['calf-machine'],
  'donkey-calf-raise': ['calf-machine'],
  'hip-abduction': ['hip-abduction'],
  'hip-adduction': ['hip-abduction'],
  'hip-thrust-machine': ['hip-thrust-machine'],
  'glute-drive-machine': ['hip-thrust-machine'],
  'machine-crunch': ['ab-machine'],
  'ab-coaster': ['ab-machine'],
  'torso-rotation-machine': ['torso-rotation'],
  'reverse-hyper': ['reverse-hyper'],
  'neck-harness': ['neck-harness'],

  // ---- smith ----
  'smith-split-squat': ['smith'],
  'smith-calf-raise': ['smith', 'box'],
  'smith-incline-press': ['smith', 'bench-adjustable'],
  'smith-bench-press': ['smith', 'bench-flat'],
  'smith-overhead-press': ['smith', 'bench-adjustable'],

  // ---- cardio ----
  'treadmill-run': ['treadmill'],
  'incline-walk': ['treadmill'],
  'rowing-machine': ['rower'],
  'assault-bike': ['air-bike'],
  'stationary-bike': ['bike'],
  'stair-climber': ['stair-climber'],
  'elliptical': ['elliptical'],
  'ski-erg': ['ski-erg'],
  'swimming': ['pool'],
  'running-outdoor': ['outdoors'],
  'hiit-intervals': [],

  // ---- other implements ----
  'wrist-roller': ['wrist-roller'],
  'sled-push': ['sled'],
  'sled-drag': ['sled'],
  'ab-wheel-rollout': ['ab-wheel'],
  'jump-rope': ['jump-rope'],
  'battle-ropes': ['battle-ropes'],
  'medicine-ball-slam': ['medicine-ball'],
  'atlas-stone-lift': ['atlas-stone'],
  'yoke-walk': ['yoke'],
  'log-press': ['log'],
  'sandbag-carry': ['sandbag'],
  'weighted-carry-overhead': ['dumbbells'],
  'plate-pinch': ['plates'],
  'russian-twist': ['plates'],
  'svend-press': ['plates'],
  'plate-front-raise': ['plates'],
};

/** What a given exercise needs. Empty means bodyweight — always available. */
export function gearFor(exercise) {
  if (!exercise) return [];
  return EXPLICIT[exercise.id] ?? BY_EQUIPMENT[exercise.equipment] ?? [];
}

/** Can this be performed with the gear on hand? */
export function canPerform(exercise, owned) {
  const needs = gearFor(exercise);
  if (!needs.length) return true;
  return needs.every((g) => owned.has(g));
}

// --- presets ---------------------------------------------------------------

const ALL = GEAR.map((g) => g.id);

/**
 * Starting points, not straitjackets — every preset is a selection the hunter
 * then edits item by item.
 */
export const GEAR_PRESETS = [
  {
    id: 'fullgym',
    label: 'Full commercial gym',
    detail: 'Everything below, ticked.',
    gear: ALL.filter((g) => !['atlas-stone', 'yoke', 'log', 'sandbag', 'neck-harness', 'pool', 'wrist-roller'].includes(g)),
  },
  {
    id: 'homegym',
    label: 'Home gym — barbell & rack',
    detail: 'Barbell, plates, rack, bench, dumbbells, pull-up bar.',
    gear: ['barbell', 'plates', 'ez-bar', 'rack', 'bench-flat', 'bench-adjustable', 'dumbbells', 'pullup-bar', 'bands', 'box'],
  },
  {
    id: 'homemachines',
    label: 'Home gym — machines, no barbell',
    detail: 'A multi-gym or a few selectorised machines.',
    gear: ['dumbbells', 'cable-station', 'lat-pulldown', 'seated-row', 'chest-press-machine', 'leg-press', 'leg-extension', 'leg-curl', 'bench-adjustable', 'pullup-bar'],
  },
  {
    id: 'dumbbells',
    label: 'Dumbbells & a bench',
    detail: 'Adjustable dumbbells, bench, bands.',
    gear: ['dumbbells', 'bench-flat', 'bench-adjustable', 'bands', 'pullup-bar'],
  },
  {
    id: 'minimal',
    label: 'Minimal / bodyweight',
    detail: 'Bands, a pull-up bar and the floor.',
    gear: ['bands', 'pullup-bar', 'box'],
  },
  {
    id: 'none',
    label: 'Nothing at all',
    detail: 'Pure bodyweight. The System will work with it.',
    gear: [],
  },
];

export const presetGear = (id) => GEAR_PRESETS.find((p) => p.id === id)?.gear || [];
