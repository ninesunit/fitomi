// ---------------------------------------------------------------------------
// BODY REGIONS
//
// One set of anatomical polygons, shared by everything that draws a body: the
// fatigue map on the quest board and the focus picker in the awakening. Two
// copies would drift apart the first time either was edited.
// ---------------------------------------------------------------------------

// Anatomical regions, in a 100x210 viewBox.
//
// The body *is* the sum of these polygons — there is no separate silhouette
// path behind them to drift out of alignment. Each region is a closed polygon
// sized to its real proportion, so the map reads as a figure rather than a
// diagram of boxes.
export const HEAD = { cx: 50, cy: 17, r: 10 };

export const FRONT = [
  { id: 'neck', d: 'M44 26 L56 26 L56 35 L44 35 Z' },
  { id: 'shoulders', d: 'M27 38 L39 33 L41 46 L28 51 Z M73 38 L61 33 L59 46 L72 51 Z' },
  { id: 'chest', d: 'M39 34 L61 34 L64 47 L62 57 L38 57 L36 47 Z' },
  { id: 'abs', d: 'M41 59 L59 59 L58 88 L42 88 Z' },
  { id: 'obliques', d: 'M35 59 L40 59 L41 87 L36 83 Z M65 59 L60 59 L59 87 L64 83 Z' },
  { id: 'biceps', d: 'M26 53 L37 56 L35 74 L24 71 Z M74 53 L63 56 L65 74 L76 71 Z' },
  { id: 'forearms', d: 'M24 73 L35 76 L33 97 L22 94 Z M76 73 L65 76 L67 97 L78 94 Z' },
  { id: 'quads', d: 'M38 91 L46 91 L45 133 L36 131 Z M62 91 L54 91 L55 133 L64 131 Z' },
  { id: 'adductors', d: 'M46 91 L54 91 L53 121 L47 121 Z' },
  { id: 'calves', d: 'M37 135 L47 135 L45 170 L38 168 Z M63 135 L53 135 L55 170 L62 168 Z' },
];

export const BACK = [
  { id: 'neck', d: 'M44 26 L56 26 L56 35 L44 35 Z' },
  { id: 'traps', d: 'M39 32 L61 32 L67 50 L33 50 Z' },
  { id: 'shoulders', d: 'M27 38 L39 34 L40 47 L28 51 Z M73 38 L61 34 L60 47 L72 51 Z' },
  { id: 'back', d: 'M35 51 L65 51 L64 64 L36 64 Z' },
  { id: 'lats', d: 'M32 52 L38 52 L42 80 L36 78 Z M68 52 L62 52 L58 80 L64 78 Z' },
  { id: 'lowerBack', d: 'M38 65 L62 65 L60 90 L40 90 Z' },
  { id: 'triceps', d: 'M26 53 L37 56 L35 74 L24 71 Z M74 53 L63 56 L65 74 L76 71 Z' },
  { id: 'forearms', d: 'M24 73 L35 76 L33 97 L22 94 Z M76 73 L65 76 L67 97 L78 94 Z' },
  { id: 'glutes', d: 'M37 92 L63 92 L62 113 L38 113 Z' },
  { id: 'hamstrings', d: 'M38 115 L49 115 L48 152 L37 150 Z M62 115 L51 115 L52 152 L63 150 Z' },
  { id: 'abductors', d: 'M32 93 L38 93 L38 114 L32 112 Z M68 93 L62 93 L62 114 L68 112 Z' },
  { id: 'calves', d: 'M37 154 L47 154 L45 186 L38 184 Z M63 154 L53 154 L55 186 L62 184 Z' },
];


// ---------------------------------------------------------------------------
// HIT TESTING
//
// The map is ~130 px wide on a phone, so a region two units across is under
// three physical pixels — no finger can land on it, and enlarging the figure
// enough to fix that would make it taller than the viewport.
//
// So the whole body is one tap surface and the tap resolves to whichever
// region it is *nearest*: zero distance when it lands inside one, otherwise
// the closest edge. Tapping between the thighs picks the adductors; tapping
// on the thigh picks the quads. Every region becomes reachable regardless of
// how few pixels it occupies.
// ---------------------------------------------------------------------------

/** `M38 91 L48 91 Z M62 91 ...` -> [[[38,91],[48,91]], [[62,91], ...]] */
export function subpaths(d) {
  return d
    .split('M')
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const nums = chunk.replace(/Z/gi, '').match(/-?\d+(?:\.\d+)?/g) || [];
      const pts = [];
      for (let i = 0; i + 1 < nums.length; i += 2) pts.push([Number(nums[i]), Number(nums[i + 1])]);
      return pts;
    })
    .filter((pts) => pts.length >= 3);
}

function inside(pts, x, y) {
  let hit = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i, i += 1) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

function distanceToSegment(x, y, [x1, y1], [x2, y2]) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / lenSq));
  return Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy));
}

/** 0 when the point is inside the shape, otherwise the distance to its edge. */
export function distanceToRegion(d, x, y) {
  let best = Infinity;
  for (const pts of subpaths(d)) {
    if (inside(pts, x, y)) return 0;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i, i += 1) {
      best = Math.min(best, distanceToSegment(x, y, pts[j], pts[i]));
    }
  }
  return best;
}

/**
 * The region a tap at (x, y) means, in viewBox units.
 * Returns null past `maxDistance`, so tapping the empty margin clears the
 * selection instead of snapping to whatever happens to be closest.
 */
export function regionAt(regions, x, y, maxDistance = 14) {
  let winner = null;
  let best = Infinity;
  for (const region of regions) {
    const dist = distanceToRegion(region.d, x, y);
    if (dist < best) {
      best = dist;
      winner = region;
    }
  }
  return best <= maxDistance ? winner : null;
}
