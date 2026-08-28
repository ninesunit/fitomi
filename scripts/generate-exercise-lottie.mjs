import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const output = fileURLToPath(new URL('../public/lottie/exercises/', import.meta.url));

const P = (rootY = 0, torso = 0, arm = 0, forearm = 0, thigh = 0, shin = 0, rootX = 0) => ({
  rootX, rootY, torso, arm, forearm, thigh, shin,
});

const POSES = {
  squat: [P(0, 6), P(24, 28, 8, 10, -58, 96)],
  hinge: [P(0, 4), P(8, 66, -64, 6, -16, 12)],
  lunge: [P(0, 6), P(18, 12, 2, 6, -48, 86, 5)],
  press: [P(0, 0, -55, 128), P(0, 0, -84, 4)],
  overhead: [P(0, 2, -50, 166), P(0, -4, -170, 2)],
  pulldown: [P(0, 6, -166, -6), P(0, 14, -116, 66)],
  pullup: [P(22, 2, -176, 2, 10, 14), P(0, -6, -168, 58, 26, 30)],
  row: [P(0, 60, -58, 2, -14, 10), P(0, 60, -62, 106, -14, 10)],
  curl: [P(0, 0, -6, 4), P(0, 0, -10, 140)],
  extension: [P(0, 0, -150, 118), P(0, 0, -156, 6)],
  fly: [P(0, 0, -88, 8), P(0, 0, -30, 6)],
  raise: [P(0, 0, -4, 4), P(0, 0, -86, 6)],
  calf: [P(0), P(-12)],
  crunch: [P(0, 0, -120, 40, -84, 74), P(0, 34, -128, 44, -88, 70)],
  plank: [P(30, 88, -84, 84, -86, 6), P(30, 88, -84, 84, -86, 6)],
  rotate: [P(0, 4, -78, 6, 0, 0, -8), P(0, 4, -78, 6, 0, 0, 8)],
  carry: [P(0, 2, -2, 2), P(-3, 2, -2, 2, -12, 16)],
  run: [P(0, 10, -34, 62, -30, 44), P(-6, 10, 30, 58, 26, 8)],
  jump: [P(14, 20, 44, 20, -46, 82), P(-18, -4, -150, 6, 12, 6)],
  clean: [P(4, 58, -58, 4, -20, 18), P(-6, -4, -46, 156)],
  snatch: [P(4, 58, -58, 4, -20, 18), P(-6, -2, -172, 2, -8, 10)],
  slam: [P(0, -6, -172, 2), P(6, 56, -46, 8, -14, 12)],
};

const violet = [0.52, 0.24, 1, 1];
const cyan = [0.1, 0.74, 1, 1];
const ink = [0.035, 0.045, 0.12, 1];
const skin = [0.55, 0.68, 0.78, 1];

const staticValue = (k) => ({ a: 0, k });
const eased = (from, to, vector = false) => ({
  a: 1,
  k: [
    { t: 0, s: vector ? from : [from], e: vector ? to : [to], i: { x: [0.45], y: [1] }, o: { x: [0.45], y: [0] } },
    { t: 30, s: vector ? to : [to], e: vector ? from : [from], i: { x: [0.45], y: [1] }, o: { x: [0.45], y: [0] } },
    { t: 60, s: vector ? from : [from] },
  ],
});

const transform = ({ position = [0, 0, 0], rotation = 0, opacity = 100, scale = [100, 100, 100], anchor = [0, 0, 0] } = {}) => ({
  o: staticValue(opacity),
  r: typeof rotation === 'object' ? rotation : staticValue(rotation),
  p: Array.isArray(position) ? staticValue(position) : position,
  a: staticValue(anchor),
  s: staticValue(scale),
});

const fill = (color, opacity = 100) => ({ ty: 'fl', c: staticValue(color), o: staticValue(opacity), r: 1, nm: 'Fill' });
const stroke = (color = violet, width = 2.4, opacity = 100) => ({
  ty: 'st', c: staticValue(color), o: staticValue(opacity), w: staticValue(width), lc: 2, lj: 2, nm: 'Energy rim',
});
const groupTransform = () => ({ ty: 'tr', p: staticValue([0, 0]), a: staticValue([0, 0]), s: staticValue([100, 100]), r: staticValue(0), o: staticValue(100), sk: staticValue(0), sa: staticValue(0) });

function capsule(width, height, color = ink, rim = violet) {
  return [{
    ty: 'gr', nm: 'Armored form', it: [
      { ty: 'rc', d: 1, p: staticValue([0, height / 2]), s: staticValue([width, height]), r: staticValue(width / 2), nm: 'Anatomical segment' },
      fill(color), stroke(rim), groupTransform(),
    ],
  }];
}

function torsoShape() {
  const body = {
    i: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
    o: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
    v: [[-34, -72], [34, -72], [25, -5], [14, 4], [-14, 4], [-25, -5]],
    c: true,
  };
  return [{
    ty: 'gr', nm: 'Armored torso', it: [
      { ty: 'sh', ks: staticValue(body), nm: 'Tapered body' },
      fill(ink), stroke(violet, 3),
      { ty: 'sh', ks: staticValue({ i: [[0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0]], v: [[-22, -48], [0, -37], [22, -48]], c: false }), nm: 'Chest plate' },
      stroke(cyan, 1.5, 72), groupTransform(),
    ],
  }];
}

function ellipse(size, color = ink, rim = violet) {
  return [{
    ty: 'gr', nm: 'Head', it: [
      { ty: 'el', d: 1, p: staticValue([0, 0]), s: staticValue(size), nm: 'Head shape' },
      fill(color), stroke(rim, 2.8),
      { ty: 'rc', d: 1, p: staticValue([0, 2]), s: staticValue([22, 4]), r: staticValue(2), nm: 'Visor' },
      fill(cyan, 88), groupTransform(),
    ],
  }];
}

function layer(ind, name, shapes, ks, parent) {
  const value = { ddd: 0, ind, ty: 4, nm: name, sr: 1, ks, ao: 0, shapes, ip: 0, op: 60, st: 0, bm: 0 };
  if (parent) value.parent = parent;
  return value;
}

function rootPosition(a, b) {
  return eased([160 + a.rootX, 178 + a.rootY, 0], [160 + b.rootX, 178 + b.rootY, 0], true);
}

function motionRotation(a, b, mirror = 1) {
  return eased(a * mirror, b * mirror);
}

function build(name, [a, b]) {
  const layers = [
    layer(1, 'Gate floor', [{
      ty: 'gr', it: [
        { ty: 'el', d: 1, p: staticValue([0, 0]), s: staticValue([210, 36]), nm: 'Gate ellipse' },
        fill(violet, 9), stroke(cyan, 1.4, 40), groupTransform(),
      ],
    }], transform({ position: [160, 275, 0] })),
    layer(2, 'Rising aura', [{
      ty: 'gr', it: [
        { ty: 'el', d: 1, p: staticValue([0, 0]), s: staticValue([132, 230]), nm: 'Aura field' },
        fill(violet, 8), stroke(violet, 2, 24), groupTransform(),
      ],
    }], transform({ position: [160, 158, 0], opacity: 72 })),
    layer(3, 'Pelvis', capsule(40, 24), transform({ position: rootPosition(a, b), rotation: motionRotation(0, 0), anchor: [0, 0, 0] })),
    layer(4, 'Torso', torsoShape(), transform({ position: [0, 0, 0], rotation: motionRotation(a.torso, b.torso) }), 3),
    layer(5, 'Head', ellipse([36, 44], skin, cyan), transform({ position: [0, -96, 0] }), 4),
    layer(6, 'Left upper arm', capsule(18, 52), transform({ position: [-30, -64, 0], rotation: motionRotation(a.arm, b.arm) }), 4),
    layer(7, 'Left forearm', capsule(15, 48), transform({ position: [0, 48, 0], rotation: motionRotation(a.forearm, b.forearm) }), 6),
    layer(8, 'Right upper arm', capsule(18, 52), transform({ position: [30, -64, 0], rotation: motionRotation(a.arm, b.arm, -1) }), 4),
    layer(9, 'Right forearm', capsule(15, 48), transform({ position: [0, 48, 0], rotation: motionRotation(a.forearm, b.forearm, -1) }), 8),
    layer(10, 'Left thigh', capsule(22, 64), transform({ position: [-13, 12, 0], rotation: motionRotation(a.thigh, b.thigh) }), 3),
    layer(11, 'Left shin', capsule(17, 62), transform({ position: [0, 59, 0], rotation: motionRotation(a.shin, b.shin) }), 10),
    layer(12, 'Right thigh', capsule(22, 64), transform({ position: [13, 12, 0], rotation: motionRotation(a.thigh, b.thigh, -1) }), 3),
    layer(13, 'Right shin', capsule(17, 62), transform({ position: [0, 59, 0], rotation: motionRotation(a.shin, b.shin, -1) }), 12),
  ];

  return {
    v: '5.12.2', fr: 30, ip: 0, op: 60, w: 320, h: 320, nm: `Fitomi ${name} guide`, ddd: 0,
    assets: [], layers, markers: [],
  };
}

await mkdir(output, { recursive: true });
await Promise.all(
  Object.entries(POSES).map(([name, poses]) =>
    writeFile(join(output, `${name}.json`), JSON.stringify(build(name, poses))),
  ),
);

console.log(`Generated ${Object.keys(POSES).length} exercise Lottie files.`);
