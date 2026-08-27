// ---------------------------------------------------------------------------
// SHARED VECTOR GEOMETRY
//
// Primitives used by anything the app draws procedurally — the hunter avatar
// and the raid bestiary both build their silhouettes out of swept chains.
// Pure functions, no React, checkable in Node.
// ---------------------------------------------------------------------------

const f = (n) => Math.round(n * 100) / 100;
const pt = (p) => `${f(p.x)},${f(p.y)}`;

export { f, pt };

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

