// ---------------------------------------------------------------------------
// Shared vocabulary for the whole System. Every exercise, quest, stat gain and
// soreness calculation keys off these ids, so they are the one place a muscle
// group or movement pattern is ever named.
// ---------------------------------------------------------------------------

export const MUSCLES = {
  chest: { id: 'chest', name: 'Chest', region: 'upper', recovery: 48 },
  back: { id: 'back', name: 'Back', region: 'upper', recovery: 48 },
  lats: { id: 'lats', name: 'Lats', region: 'upper', recovery: 48 },
  traps: { id: 'traps', name: 'Traps', region: 'upper', recovery: 36 },
  shoulders: { id: 'shoulders', name: 'Shoulders', region: 'upper', recovery: 40 },
  biceps: { id: 'biceps', name: 'Biceps', region: 'arms', recovery: 36 },
  triceps: { id: 'triceps', name: 'Triceps', region: 'arms', recovery: 36 },
  forearms: { id: 'forearms', name: 'Forearms', region: 'arms', recovery: 24 },
  quads: { id: 'quads', name: 'Quads', region: 'legs', recovery: 60 },
  hamstrings: { id: 'hamstrings', name: 'Hamstrings', region: 'legs', recovery: 60 },
  glutes: { id: 'glutes', name: 'Glutes', region: 'legs', recovery: 54 },
  calves: { id: 'calves', name: 'Calves', region: 'legs', recovery: 30 },
  abs: { id: 'abs', name: 'Abs', region: 'core', recovery: 30 },
  obliques: { id: 'obliques', name: 'Obliques', region: 'core', recovery: 30 },
  lowerBack: { id: 'lowerBack', name: 'Lower Back', region: 'core', recovery: 60 },
  hipFlexors: { id: 'hipFlexors', name: 'Hip Flexors', region: 'legs', recovery: 30 },
  adductors: { id: 'adductors', name: 'Adductors', region: 'legs', recovery: 48 },
  abductors: { id: 'abductors', name: 'Abductors', region: 'legs', recovery: 40 },
  neck: { id: 'neck', name: 'Neck', region: 'upper', recovery: 30 },
  cardio: { id: 'cardio', name: 'Cardiovascular', region: 'system', recovery: 20 },
};

export const MUSCLE_LIST = Object.values(MUSCLES);

export const REGIONS = [
  { id: 'upper', name: 'Upper Body' },
  { id: 'arms', name: 'Arms' },
  { id: 'legs', name: 'Lower Body' },
  { id: 'core', name: 'Core' },
  { id: 'system', name: 'Conditioning' },
];

export const EQUIPMENT = {
  barbell: { id: 'barbell', name: 'Barbell' },
  dumbbell: { id: 'dumbbell', name: 'Dumbbell' },
  machine: { id: 'machine', name: 'Machine' },
  cable: { id: 'cable', name: 'Cable' },
  smith: { id: 'smith', name: 'Smith Machine' },
  bodyweight: { id: 'bodyweight', name: 'Bodyweight' },
  kettlebell: { id: 'kettlebell', name: 'Kettlebell' },
  band: { id: 'band', name: 'Resistance Band' },
  plate: { id: 'plate', name: 'Weight Plate' },
  ez: { id: 'ez', name: 'EZ / Trap Bar' },
  cardio: { id: 'cardio', name: 'Cardio Machine' },
  other: { id: 'other', name: 'Other' },
};

export const EQUIPMENT_LIST = Object.values(EQUIPMENT);

// Movement patterns drive the quest engine's "you are neglecting X" rules.
export const PATTERNS = {
  squat: 'Squat',
  hinge: 'Hinge',
  lunge: 'Lunge',
  horizontalPush: 'Horizontal Push',
  verticalPush: 'Vertical Push',
  horizontalPull: 'Horizontal Pull',
  verticalPull: 'Vertical Pull',
  carry: 'Carry',
  rotation: 'Rotation',
  isolation: 'Isolation',
  conditioning: 'Conditioning',
  mobility: 'Mobility',
};

// The five hunter attributes.
export const STATS = [
  { id: 'str', name: 'Strength', short: 'STR', blurb: 'Raw force output. Grown by heavy compound loading.' },
  { id: 'agi', name: 'Agility', short: 'AGI', blurb: 'Speed and explosiveness. Grown by conditioning and dynamic work.' },
  { id: 'vit', name: 'Vitality', short: 'VIT', blurb: 'Work capacity and durability. Grown by volume and posterior chain work.' },
  { id: 'int', name: 'Intelligence', short: 'INT', blurb: 'Programming discipline. Grown by consistency and progressive overload.' },
  { id: 'per', name: 'Perception', short: 'PER', blurb: 'Mind–muscle awareness. Grown by accurate RPE logging and isolation work.' },
];

export const STAT_IDS = STATS.map((s) => s.id);

export const LBS_PER_KG = 2.2046226218;

export const toKg = (value, unit) => (unit === 'lb' ? value / LBS_PER_KG : value);
export const fromKg = (kg, unit) => (unit === 'lb' ? kg * LBS_PER_KG : kg);

export const EMPTY_STATS = () => ({ str: 0, agi: 0, vit: 0, int: 0, per: 0 });
