// ---------------------------------------------------------------------------
// FIGURE GEOMETRY
//
// Builds the SVG path data for the hunter silhouette from the parameters in
// engine/physique.js. Kept free of React so the shapes can be checked in Node,
// and so the same geometry can draw the status avatar, the body-type picker
// and the rank cards without three separate sets of artwork.
//
// The figure lives in a 120 x 200 box, standing on the ground line at y=190.
// ---------------------------------------------------------------------------

const f = (n) => Math.round(n * 100) / 100;
const pt = (p) => `${f(p.x)},${f(p.y)}`;

/**
 * A limb: a chain of {x, y, w} nodes swept into a smooth tapered shape with
 * rounded caps. Widths are half-widths, so a node with w=6 is 12 units thick.
 */
export function taperedChain(nodes) {
  const n = nodes.length;
  if (n < 2) return '';

  // Direction at each node, averaged across its neighbours so the outline does
  // not kink where segments meet (a knee should bend, not crease).
  const dirs = nodes.map((_, i) => {
    const a = nodes[Math.max(0, i - 1)];
    const b = nodes[Math.min(n - 1, i + 1)];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    return { x: dx / len, y: dy / len };
  });

  const right = nodes.map((p, i) => ({ x: p.x - dirs[i].y * p.w, y: p.y + dirs[i].x * p.w }));
  const left = nodes.map((p, i) => ({ x: p.x + dirs[i].y * p.w, y: p.y - dirs[i].x * p.w }));

  const last = n - 1;
  // Caps are quadratics whose control point sits two half-widths past the
  // joint; that puts the curve's midpoint exactly one half-width out, which is
  // a semicircle to within a pixel at this scale.
  const endCtl = { x: nodes[last].x + dirs[last].x * nodes[last].w * 2, y: nodes[last].y + dirs[last].y * nodes[last].w * 2 };
  const startCtl = { x: nodes[0].x - dirs[0].x * nodes[0].w * 2, y: nodes[0].y - dirs[0].y * nodes[0].w * 2 };

  return [
    `M${pt(right[0])}`,
    sweep(right),
    `Q${pt(endCtl)} ${pt(left[last])}`,
    sweep([...left].reverse()),
    `Q${pt(startCtl)} ${pt(right[0])}`,
    'Z',
  ].join(' ');
}

/** Smooths one side of a chain by curving through the midpoints between nodes. */
function sweep(pts) {
  let d = '';
  for (let i = 1; i < pts.length - 1; i += 1) {
    const mid = { x: (pts[i].x + pts[i + 1].x) / 2, y: (pts[i].y + pts[i + 1].y) / 2 };
    d += `Q${pt(pts[i])} ${pt(mid)} `;
  }
  return `${d}L${pt(pts[pts.length - 1])}`;
}

/**
 * The trunk, drawn as one closed outline: neck -> trapezius -> deltoid ->
 * lat taper -> waist -> pelvis, mirrored.
 *
 * One side is authored as a list of cubic segments running top-down. The other
 * side is the same list mirrored in x and walked backwards with each segment's
 * control points swapped, which is the exact reverse of a cubic Bezier — so
 * the two halves are guaranteed symmetric rather than hand-matched.
 */
export function torsoPath(p) {
  const { cx, neckY, shoulderY, chestY, waistY, hipY } = p;
  const SH = p.shoulderHalf;
  const CH = p.chestHalf;
  const WH = p.waistHalf;
  const HH = p.hipHalf;
  const NH = p.neckHalf;
  const crotchY = hipY + 11;

  // Offsets from the centre line, positive = outward. Segments run neck -> hip.
  const segs = [
    // trapezius rising from the neck out to the deltoid
    { c1: [NH + 3, neckY + 2], c2: [SH * 0.62, shoulderY - 7], end: [SH, shoulderY] },
    // deltoid cap falling into the ribcage
    { c1: [SH + 1.4, shoulderY + 7], c2: [CH + 2.2, chestY - 11], end: [CH, chestY] },
    // lat sweep down to the waist
    { c1: [CH + 0.4, chestY + 10], c2: [WH + 1.6, waistY - 11], end: [WH, waistY] },
    // obliques flaring into the pelvis
    { c1: [WH + 0.4, waistY + 5], c2: [HH, hipY - 7], end: [HH, hipY] },
  ];

  const P = (s, [dx, y]) => `${f(cx + s * dx)},${f(y)}`;

  const down = segs.map((sg) => `C${P(-1, sg.c1)} ${P(-1, sg.c2)} ${P(-1, sg.end)}`).join(' ');

  const up = segs
    .map((sg, i) => {
      const prev = i === 0 ? [NH, neckY] : segs[i - 1].end;
      return `C${P(1, sg.c2)} ${P(1, sg.c1)} ${P(1, prev)}`;
    })
    .reverse()
    .join(' ');

  return [
    `M${P(-1, [NH, neckY])}`,
    down,
    // pelvis floor, sloping in to the crotch and back out
    `L${f(cx - HH * 0.94)},${f(hipY + 7)}`,
    `Q${f(cx - HH * 0.46)},${f(crotchY)} ${f(cx)},${f(crotchY - 2)}`,
    `Q${f(cx + HH * 0.4)},${f(crotchY)} ${f(cx + HH * 0.92)},${f(hipY + 9)}`,
    `L${P(1, [HH, hipY])}`,
    up,
    'Z',
  ].join(' ');
}

/** Every path the renderer needs, in draw order. */
export function buildFigure(p) {
  const { cx, hipY, kneeY, ankleY, shoulderY, waistY, neckY, headY } = p;

  // Legs hang from the pelvis with a natural slight inward run to the ankle.
  const hipX = p.hipHalf * 0.46;
  const kneeX = p.hipHalf * 0.4;
  const ankleX = p.hipHalf * 0.34;
  const calfY = kneeY + (ankleY - kneeY) * 0.34;

  const leg = (s) => taperedChain([
    { x: cx + s * hipX, y: hipY + 2, w: p.thighHalf },
    { x: cx + s * hipX * 0.94, y: hipY + (kneeY - hipY) * 0.52, w: p.thighHalf * 0.84 },
    { x: cx + s * kneeX, y: kneeY, w: p.kneeHalf },
    { x: cx + s * kneeX * 0.97, y: calfY, w: p.calfHalf },
    { x: cx + s * ankleX, y: ankleY, w: p.ankleHalf },
  ]);

  // The arm hangs from a joint set *inside* the deltoid, so a broad hunter's
  // arms stay welded to the shoulders instead of floating beside them. The
  // hand comes to rest just below the hip, as it does standing at ease.
  const shX = Math.max(p.upperArmHalf, p.shoulderHalf - p.upperArmHalf * 0.72);
  const elbowY = waistY + 2;
  const wristY = hipY + 10;
  const flare = 0.6 + p.upperArmHalf * 0.16;

  const arm = (s) => taperedChain([
    { x: cx + s * shX, y: shoulderY + 1, w: p.upperArmHalf },
    { x: cx + s * (shX + flare * 0.8), y: elbowY, w: p.elbowHalf },
    { x: cx + s * (shX + flare * 1.5), y: elbowY + 12, w: p.forearmHalf },
    { x: cx + s * (shX + flare * 2.1), y: wristY, w: p.wristHalf },
    // The fist: a short, slightly wider node past the wrist. Without it the
    // forearm just stops, and the arm reads as far too long.
    { x: cx + s * (shX + flare * 2.3), y: wristY + 7, w: p.wristHalf * 1.5 },
  ]);

  // Feet point slightly outward, heel under the ankle, toe forward.
  const foot = (s) => {
    const x = cx + s * ankleX;
    const w = p.ankleHalf;
    const sole = ankleY + 4;
    return `M${f(x - s * w * 1.1)},${f(ankleY - 3)}`
      + ` Q${f(x - s * w * 1.7)},${f(sole)} ${f(x - s * w * 1.2)},${f(sole)}`
      + ` L${f(x + s * (w + 7))},${f(sole)}`
      + ` Q${f(x + s * (w + 9))},${f(sole)} ${f(x + s * (w + 8.2))},${f(sole - 2.4)}`
      + ` Q${f(x + s * (w + 4))},${f(ankleY - 3)} ${f(x + s * w * 1.1)},${f(ankleY - 3.4)} Z`;
  };

  const torso = torsoPath(p);
  const legL = leg(-1);
  const legR = leg(1);
  const armL = arm(-1);
  const armR = arm(1);

  return {
    torso, legL, legR, armL, armR,
    footL: foot(-1),
    footR: foot(1),
    // Anything drawn on top of the body is clipped to the body, so pec and
    // quad lines can be authored generously without escaping the silhouette.
    clip: [torso, legL, legR, armL, armR],
    neck: `M${f(cx - p.neckHalf)},${f(neckY + 4)} V${f(headY + p.headR * 0.72)} h${f(p.neckHalf * 2)} V${f(neckY + 4)} Z`,
    head: { cx, cy: headY, rx: p.headR, ry: p.headR * 1.22 },
    // Musculature. Opacity is driven by `tone`, so an untrained hunter is a
    // smooth silhouette and a strong one is visibly striated.
    detail: [
      // clavicles
      `M${f(cx - p.chestHalf * 0.66)},${f(shoulderY + 5)} Q${f(cx)},${f(shoulderY + 1)} ${f(cx + p.chestHalf * 0.66)},${f(shoulderY + 5)}`,
      // sternum
      `M${f(cx)},${f(shoulderY + 6)} V${f(p.chestY + 2)}`,
      // pec shelf
      `M${f(cx - p.chestHalf * 0.9)},${f(p.chestY - 4)} Q${f(cx)},${f(p.chestY + 6)} ${f(cx + p.chestHalf * 0.9)},${f(p.chestY - 4)}`,
      // linea alba
      `M${f(cx)},${f(p.chestY + 4)} V${f(waistY + 6)}`,
      // abdominal rows
      `M${f(cx - p.waistHalf * 0.52)},${f(p.chestY + 11)} h${f(p.waistHalf * 1.04)}`,
      `M${f(cx - p.waistHalf * 0.5)},${f(p.chestY + 21)} h${f(p.waistHalf)}`,
      // obliques running into the hip
      `M${f(cx - p.waistHalf * 0.95)},${f(waistY - 2)} L${f(cx - p.hipHalf * 0.34)},${f(hipY + 8)}`,
      `M${f(cx + p.waistHalf * 0.95)},${f(waistY - 2)} L${f(cx + p.hipHalf * 0.34)},${f(hipY + 8)}`,
      // quad separation
      `M${f(cx - hipX * 1.05)},${f(hipY + 20)} L${f(cx - kneeX * 1.05)},${f(kneeY - 10)}`,
      `M${f(cx + hipX * 1.05)},${f(hipY + 20)} L${f(cx + kneeX * 1.05)},${f(kneeY - 10)}`,
      // biceps
      `M${f(cx - shX)},${f(shoulderY + 12)} V${f(elbowY - 9)}`,
      `M${f(cx + shX)},${f(shoulderY + 12)} V${f(elbowY - 9)}`,
    ],
    // The torso outline crosses the legs at the pelvis. Rather than fight the
    // seam, it is drawn as the hem of a pair of shorts — which is what a
    // fighter would be wearing anyway.
    hem: `M${f(cx - p.hipHalf * 0.99)},${f(hipY + 4)} Q${f(cx)},${f(hipY + 10)} ${f(cx + p.hipHalf * 0.99)},${f(hipY + 4)}`,
    belt: `M${f(cx - p.waistHalf * 0.99)},${f(waistY + 3)} Q${f(cx)},${f(waistY + 7)} ${f(cx + p.waistHalf * 0.99)},${f(waistY + 3)}`,
    ground: { cx, cy: 190, rx: 32, ry: 5.5 },
  };
}

export default buildFigure;
