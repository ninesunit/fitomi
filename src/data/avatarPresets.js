export const AVATAR_PRESETS = [
  {
    id: 'male-umbra',
    sex: 'male',
    name: 'Umbra Vanguard',
    face: 'Angular',
    hair: 'Black undercut',
    build: 'Athletic',
    bodyType: 'athletic',
    asset: '/art/avatars/v2/male-umbra.webp',
  },
  {
    id: 'male-phantom',
    sex: 'male',
    name: 'Phantom Warden',
    face: 'Scarred',
    hair: 'Silver crop',
    build: 'Power',
    bodyType: 'heavy',
    asset: '/art/avatars/v2/male-phantom.webp',
  },
  {
    id: 'male-eclipse',
    sex: 'male',
    name: 'Eclipse Seer',
    face: 'Refined',
    hair: 'Long tied',
    build: 'Lean',
    bodyType: 'lean',
    asset: '/art/avatars/v2/male-eclipse.webp',
  },
  {
    id: 'female-umbra',
    sex: 'female',
    name: 'Umbra Vanguard',
    face: 'Angular',
    hair: 'Long layered',
    build: 'Athletic',
    bodyType: 'athletic',
    asset: '/art/avatars/v2/female-umbra.webp',
  },
  {
    id: 'female-phantom',
    sex: 'female',
    name: 'Phantom Warden',
    face: 'Scarred',
    hair: 'Silver bob',
    build: 'Power',
    bodyType: 'heavy',
    asset: '/art/avatars/v2/female-phantom.webp',
  },
  {
    id: 'female-eclipse',
    sex: 'female',
    name: 'Eclipse Seer',
    face: 'Refined',
    hair: 'High ponytail',
    build: 'Lean',
    bodyType: 'lean',
    asset: '/art/avatars/v2/female-eclipse.webp',
  },
];

export const AVATAR_PRESET_BY_ID = Object.fromEntries(AVATAR_PRESETS.map((preset) => [preset.id, preset]));

export function avatarPreset(id) {
  return AVATAR_PRESET_BY_ID[id] || null;
}

export function defaultAvatarPreset(sex) {
  return sex === 'female' ? 'female-umbra' : 'male-umbra';
}

export function avatarPresetForBodyType(sex, bodyType) {
  const variant = bodyType === 'lean' ? 'eclipse' : bodyType === 'heavy' ? 'phantom' : 'umbra';
  return `${sex === 'female' ? 'female' : 'male'}-${variant}`;
}
