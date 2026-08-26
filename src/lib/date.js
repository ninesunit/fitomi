// ---------------------------------------------------------------------------
// Date helpers. Everything the System counts — streaks, weekly bosses, daily
// quests — keys off the user's LOCAL day, never UTC, so a 9pm workout never
// lands on tomorrow's streak.
// ---------------------------------------------------------------------------

export const DAY_MS = 86400000;

/** Local-day key, e.g. "2026-08-26". Stable string for map keys and sorting. */
export function dayKey(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Whole local days between two instants (calendar days, not 24h blocks). */
export function daysBetween(a, b) {
  return Math.round((startOfDay(b) - startOfDay(a)) / DAY_MS);
}

/** ISO-8601 week number and year — the identity of a weekly raid boss. */
export function isoWeek(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7; // Monday = 1 ... Sunday = 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum); // shift to the week's Thursday
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d - yearStart) / DAY_MS + 1) / 7);
  return { year: d.getUTCFullYear(), week };
}

/** Stable id for the current raid week, e.g. "2026-W35". */
export function weekKey(date = new Date()) {
  const { year, week } = isoWeek(date);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

/** Monday 00:00 local of the week containing `date`. */
export function startOfWeek(date = new Date()) {
  const d = startOfDay(date);
  const day = (d.getDay() + 6) % 7; // Monday = 0
  return addDays(d, -day);
}

export function endOfWeek(date = new Date()) {
  return addDays(startOfWeek(date), 7);
}

export function formatDuration(seconds) {
  const s = Math.max(0, Math.floor(seconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export function formatClock(seconds) {
  const s = Math.max(0, Math.round(seconds || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function relativeTime(timestamp) {
  if (!timestamp) return '—';
  const diff = Date.now() - Number(timestamp);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return new Date(Number(timestamp)).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function formatDate(timestamp, opts = { month: 'short', day: 'numeric' }) {
  if (!timestamp) return '—';
  return new Date(Number(timestamp)).toLocaleDateString(undefined, opts);
}

/**
 * Deterministic 32-bit hash — the "AI" in this app is seeded randomness, and
 * every seeded choice (today's quests, this week's boss) runs through here so
 * the same day always produces the same result on every device.
 */
export function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Mulberry32 — a tiny, well-distributed seeded PRNG. */
export function seededRandom(seed) {
  let a = typeof seed === 'string' ? hashString(seed) : seed >>> 0;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic pick-N-without-replacement, seeded by a string. */
export function seededSample(items, count, seed) {
  const rng = seededRandom(seed);
  const pool = [...items];
  const out = [];
  const n = Math.min(count, pool.length);
  for (let i = 0; i < n; i += 1) {
    const idx = Math.floor(rng() * pool.length);
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
}
