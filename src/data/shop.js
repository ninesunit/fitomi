export const RARITIES = {
  common: { label: 'Common', color: '#94a3b8' },
  rare: { label: 'Rare', color: '#26bdff' },
  epic: { label: 'Epic', color: '#a78bfa' },
  legendary: { label: 'Legendary', color: '#fbbf24' },
};

export const SHOP_CATALOG = [
  {
    id: 'aura-ember', slot: 'aura', name: 'Ember Veil', rarity: 'common', price: 120,
    description: 'A restrained volcanic aura with drifting cinders.', color: '#f97316', accent: '#fbbf24',
  },
  {
    id: 'aura-azure', slot: 'aura', name: 'Azure Current', rarity: 'rare', price: 280,
    description: 'Electric-blue pressure rings and rising sparks.', color: '#26bdff', accent: '#67e8f9',
  },
  {
    id: 'aura-eclipse', slot: 'aura', name: 'Eclipse Dominion', rarity: 'epic', price: 520,
    description: 'A violet singularity field that bends the profile light.', color: '#8b5cf6', accent: '#22d3ee',
  },
  {
    id: 'aura-conqueror', slot: 'aura', name: 'Conqueror Pressure', rarity: 'legendary', price: 940,
    description: 'Gold and crimson energy reserved for veteran gate breakers.', color: '#fbbf24', accent: '#ef4444',
  },
  {
    id: 'armor-warden', slot: 'armor', name: 'Warden Pauldrons', rarity: 'rare', price: 460,
    description: 'Angular basalt shoulder plates with a molten core.', color: '#f97316', accent: '#fbbf24',
  },
  {
    id: 'armor-void-mantle', slot: 'armor', name: 'Void Sovereign Mantle', rarity: 'epic', price: 780,
    description: 'A six-point shadow mantle with violet edge fire.', color: '#7c3aed', accent: '#26bdff',
  },
  {
    id: 'crown-gate', slot: 'crown', name: 'Gatebreaker Crown', rarity: 'epic', price: 720,
    description: 'A black crystal crown cut from a collapsed gate.', color: '#26bdff', accent: '#a78bfa',
  },
  {
    id: 'crown-eclipse', slot: 'crown', name: 'Eclipse Halo', rarity: 'legendary', price: 1200,
    description: 'A rotating crown halo with a contained singularity.', color: '#a78bfa', accent: '#fbbf24',
  },
  {
    id: 'background-eclipse', slot: 'profileBackground', name: 'Eclipse Gate', rarity: 'epic', price: 680,
    description: 'A fractured void gate built for an elite Hunter profile.', asset: '/art/cosmetics/eclipse-gate.webp', color: '#8b5cf6',
  },
  {
    id: 'background-crimson', slot: 'profileBackground', name: 'Crimson Throne', rarity: 'legendary', price: 980,
    description: 'The empty throne of a conquered red gate.', asset: '/art/cosmetics/crimson-throne.webp', color: '#ef4444',
  },
  {
    id: 'background-astral', slot: 'profileBackground', name: 'Astral Sanctum', rarity: 'legendary', price: 1100,
    description: 'A crystal serpent sanctum reflected across black glass.', asset: '/art/cosmetics/astral-sanctum.webp', color: '#22d3ee',
  },
  {
    id: 'frame-rune', slot: 'profileFrame', name: 'Runic Circuit', rarity: 'rare', price: 260,
    description: 'Animated cyan system glyphs around the Hunter card.', color: '#26bdff', accent: '#67e8f9',
  },
  {
    id: 'frame-blood', slot: 'profileFrame', name: 'Blood Gate Seal', rarity: 'epic', price: 540,
    description: 'Crimson angular rails with a pulsing central seal.', color: '#ef4444', accent: '#f97316',
  },
  {
    id: 'frame-sovereign', slot: 'profileFrame', name: 'Sovereign Array', rarity: 'legendary', price: 900,
    description: 'Layered violet geometry and a rotating crown sigil.', color: '#a78bfa', accent: '#fbbf24',
  },
  {
    id: 'title-gatebreaker', slot: 'title', name: 'Gatebreaker', rarity: 'common', price: 140,
    description: 'Hunter title displayed beneath the claimed name.', title: 'Gatebreaker', color: '#94a3b8',
  },
  {
    id: 'title-iron-will', slot: 'title', name: 'Iron Will', rarity: 'rare', price: 300,
    description: 'Hunter title for disciplined lifters.', title: 'Iron Will', color: '#26bdff',
  },
  {
    id: 'title-raid-sovereign', slot: 'title', name: 'Raid Sovereign', rarity: 'legendary', price: 860,
    description: 'A gold title for profiles built around gate conquest.', title: 'Raid Sovereign', color: '#fbbf24',
  },
];

export const SHOP_SLOTS = [
  { id: 'all', label: 'All' },
  { id: 'aura', label: 'Auras' },
  { id: 'armor', label: 'Armor' },
  { id: 'crown', label: 'Crowns' },
  { id: 'profileBackground', label: 'Backgrounds' },
  { id: 'profileFrame', label: 'Frames' },
  { id: 'title', label: 'Titles' },
];

export const getCosmetic = (id) => SHOP_CATALOG.find((item) => item.id === id) || null;

export function equippedCosmetics(profile) {
  const equipped = profile?.equippedCosmetics || {};
  return Object.fromEntries(
    Object.entries(equipped).map(([slot, id]) => [slot, getCosmetic(id)]).filter(([, item]) => item),
  );
}

export default SHOP_CATALOG;
