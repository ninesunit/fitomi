// ---------------------------------------------------------------------------
// MONSTER GEOMETRY
//
// Ten bosses, drawn rather than hand-illustrated. Each one is an archetype
// (a colossus, a beast, a serpent, a swarm) whose silhouette is generated
// from its own id, so the artwork costs nothing to host and every boss is
// unmistakably itself.
//
// All shapes live in a 200 x 200 box with the creature's mass centred around
// (100, 108) and its footprint on y=182.
// ---------------------------------------------------------------------------

import { taperedChain, f } from '../../lib/shapes';

/** Deterministic 0..1 stream from a string, so a boss looks the same forever. */
export function seedStream(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A tapered spike from a base point outward — horns, spines, reaching limbs. */
function spike(x, y, angle, length, width) {
  const ux = Math.cos(angle);
  const uy = Math.sin(angle);
  const nx = -uy * width;
  const ny = ux * width;
  return `M${f(x + nx)},${f(y + ny)} Q${f(x + ux * length * 0.55)},${f(y + uy * length * 0.55)} `
    + `${f(x + ux * length)},${f(y + uy * length)} `
    + `Q${f(x + ux * length * 0.55)},${f(y + uy * length * 0.55)} ${f(x - nx)},${f(y - ny)} Z`;
}

/** Evenly spaced glowing eyes across a face. */
function eyeRow(cx, cy, count, spread) {
  if (count <= 1) return [{ x: cx, y: cy, r: 3.6 }];
  const out = [];
  for (let i = 0; i < count; i += 1) {
    const t = (i / (count - 1)) * 2 - 1;
    out.push({ x: cx + t * spread, y: cy + (i % 2 ? 2.5 : 0), r: count > 4 ? 2.1 : 2.9 });
  }
  return out;
}

/** Horns fanned across the top of a head. */
function crown(cx, cy, r, count, rnd, len = 26) {
  const out = [];
  for (let i = 0; i < count; i += 1) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const a = -Math.PI / 2 - 0.85 + t * 1.7;
    out.push(spike(cx + Math.cos(a) * r, cy + Math.sin(a) * r, a, len * (0.7 + rnd() * 0.6), 4));
  }
  return out;
}

const ARCHETYPES = {
  /**
   * A hulking humanoid: trapezius swallowing the head, arms long enough to
   * reach the floor. The silhouette is all shoulder and no waist, which is
   * what reads as "colossus" at thumbnail size.
   */
  colossus(rnd, cfg) {
    const sh = 52 + rnd() * 8;
    const body = [
      // trunk — enormous shoulders down to a narrow waist and heavy hips
      `M${f(100 - sh)},86 Q${f(100 - sh * 0.72)},68 ${f(100 - 22)},64`
      + ` L${f(100 + 22)},64 Q${f(100 + sh * 0.72)},68 ${f(100 + sh)},86`
      + ` Q${f(100 + sh * 0.86)},112 ${f(100 + 27)},136`
      + ` L${f(100 + 34)},156 L${f(100 - 34)},156 L${f(100 - 27)},136`
      + ` Q${f(100 - sh * 0.86)},112 ${f(100 - sh)},82 Z`,
      // arms hanging to the floor, knuckles down
      taperedChain([
        { x: 100 - sh * 0.9, y: 84, w: 15 },
        { x: 100 - sh * 1.02, y: 122, w: 12 },
        { x: 100 - sh * 0.98, y: 158, w: 10 },
        { x: 100 - sh * 0.94, y: 174, w: 13 },
      ]),
      taperedChain([
        { x: 100 + sh * 0.9, y: 84, w: 15 },
        { x: 100 + sh * 1.02, y: 122, w: 12 },
        { x: 100 + sh * 0.98, y: 158, w: 10 },
        { x: 100 + sh * 0.94, y: 174, w: 13 },
      ]),
      // legs, planted wide
      taperedChain([
        { x: 82, y: 150, w: 19 }, { x: 76, y: 168, w: 16 }, { x: 72, y: 182, w: 13 },
      ]),
      taperedChain([
        { x: 118, y: 150, w: 19 }, { x: 124, y: 168, w: 16 }, { x: 128, y: 182, w: 13 },
      ]),
      // head, sunk between the shoulders
      // Head, hunched low between the shoulders but still clearing them.
      `M86,60 L100,32 L114,60 L107,74 L93,74 Z`,
    ];
    return { body, spikes: crown(100, 48, 16, cfg.horns, rnd, 26), eyes: eyeRow(100, 58, cfg.eyes, 7) };
  },

  /** A low quadruped: haunches high, head thrust forward, spine ridged. */
  beast(rnd, cfg) {
    const body = [
      taperedChain([
        { x: 42, y: 112, w: 13 },
        { x: 72, y: 100, w: 25 },
        { x: 110, y: 94, w: 31 },
        { x: 144, y: 104, w: 26 },
        { x: 158, y: 118, w: 16 },
      ]),
      // muzzle
      taperedChain([{ x: 44, y: 112, w: 12 }, { x: 20, y: 120, w: 8 }]),
      // legs
      taperedChain([{ x: 62, y: 122, w: 10 }, { x: 56, y: 154, w: 8 }, { x: 58, y: 182, w: 7 }]),
      taperedChain([{ x: 82, y: 124, w: 9 }, { x: 80, y: 154, w: 7 }, { x: 84, y: 182, w: 6 }]),
      taperedChain([{ x: 138, y: 124, w: 12 }, { x: 146, y: 154, w: 8 }, { x: 142, y: 182, w: 7 }]),
      taperedChain([{ x: 118, y: 126, w: 10 }, { x: 116, y: 156, w: 7 }, { x: 118, y: 182, w: 6 }]),
      // tail
      taperedChain([{ x: 158, y: 112, w: 9 }, { x: 180, y: 86, w: 6 }, { x: 176, y: 52, w: 3 }]),
    ];
    const spikes = [];
    for (let i = 0; i < 5; i += 1) {
      const x = 66 + i * 20;
      spikes.push(spike(x, 76 + i * 1.5, -Math.PI / 2 - 0.3, 16 + rnd() * 12, 4));
    }
    spikes.push(...crown(40, 108, 12, Math.max(2, cfg.horns - 1), rnd, 20));
    return { body, spikes, eyes: eyeRow(38, 110, cfg.eyes, 6) };
  },

  /** A rising coil under a hooded head. */
  serpent(rnd, cfg) {
    const body = [
      taperedChain([
        { x: 74, y: 182, w: 24 },
        { x: 52, y: 152, w: 19 },
        { x: 86, y: 130, w: 17 },
        { x: 128, y: 112, w: 16 },
        { x: 100, y: 84, w: 14 },
        { x: 122, y: 60, w: 13 },
      ]),
      // hood, flared behind the skull
      `M96,68 Q76,44 100,28 Q124,14 150,32 Q168,46 150,70 Q136,58 122,58 Q106,58 96,68 Z`,
      // skull
      `M110,50 L128,40 L142,52 L134,66 L114,64 Z`,
    ];
    return { body, spikes: crown(126, 46, 14, cfg.horns, rnd, 20), eyes: eyeRow(126, 53, cfg.eyes, 7) };
  },

  /** A robed mass, faceless under a hood, with far too many arms. */
  swarm(rnd, cfg) {
    const arms = [];
    const n = 7 + Math.round(rnd() * 4);
    for (let i = 0; i < n; i += 1) {
      // Fanned across the upper half only — arms sweeping down through the
      // robe would read as noise rather than limbs.
      const a = -Math.PI - 0.25 + (Math.PI * 1.5 * (i + 0.5)) / n;
      arms.push(spike(100 + Math.cos(a) * 26, 104 + Math.sin(a) * 22, a, 44 + rnd() * 28, 5.5));
    }
    const body = [
      // robe, hem spread on the ground
      `M100,46 Q126,92 138,146 Q150,176 156,182 L44,182 Q50,176 62,146 Q74,92 100,46 Z`,
      // hood
      `M100,34 Q126,58 122,86 Q112,74 100,74 Q88,74 78,86 Q74,58 100,34 Z`,
    ];
    return { body, spikes: arms, eyes: eyeRow(100, 78, cfg.eyes, 7) };
  },
};

/** Which archetype each boss wears. */
const BOSS_FORM = {
  'ashen-warden': 'colossus',
  'drowned-choir': 'swarm',
  'iron-revenant': 'colossus',
  'crimson-hound': 'beast',
  'hollow-sovereign': 'colossus',
  'glass-serpent': 'serpent',
  'famine-king': 'swarm',
  'frost-marshal': 'colossus',
  'thousand-arm': 'swarm',
  'gate-tyrant': 'colossus',
};

/**
 * Builds one boss's shapes. Deterministic in the boss id, so the Crimson
 * Hound looks identical to every hunter, every week it appears.
 */
export function buildBoss(boss) {
  const id = boss?.id || 'ashen-warden';
  const rnd = seedStream(id);
  const form = ARCHETYPES[BOSS_FORM[id] || 'colossus'];
  // Consume a few draws first so bosses sharing an archetype diverge.
  rnd(); rnd();
  const cfg = {
    horns: 2 + Math.round(rnd() * 3),
    eyes: 1 + Math.round(rnd() * 4),
  };
  return form(rnd, cfg);
}

/**
 * Fracture lines that appear across the body as the raid's damage climbs.
 * They are generated from the same seed, so a boss cracks the same way for
 * everyone — and at full health none of them are drawn at all.
 */
export function fractures(boss, count = 7) {
  const rnd = seedStream(`${boss?.id || 'x'}-cracks`);
  const out = [];
  for (let i = 0; i < count; i += 1) {
    const x = 62 + rnd() * 76;
    const y = 62 + rnd() * 92;
    let d = `M${f(x)},${f(y)}`;
    let cx = x;
    let cy = y;
    for (let j = 0; j < 3; j += 1) {
      cx += (rnd() - 0.5) * 30;
      cy += (rnd() - 0.3) * 26;
      d += ` L${f(cx)},${f(cy)}`;
    }
    out.push(d);
  }
  return out;
}

export default buildBoss;
