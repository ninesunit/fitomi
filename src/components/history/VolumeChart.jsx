import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';

// ---------------------------------------------------------------------------
// Session tonnage over time.
//
// One series, one axis, one hue. Bars rather than a line because each session
// is a discrete event — a line would imply values between workouts that do not
// exist. The grid is recessive (a single mean reference line), only the hovered
// bar carries a label, and the hit target is the full column height so it stays
// usable with a thumb.
// ---------------------------------------------------------------------------

export function VolumeChart({ sessions = [], unit = 'kg', convert = (v) => v, height = 150 }) {
  const [hovered, setHovered] = useState(null);

  const data = useMemo(
    () =>
      [...sessions]
        .sort((a, b) => (a.finishedAt || 0) - (b.finishedAt || 0))
        .slice(-24)
        .map((s) => ({
          at: s.finishedAt,
          value: convert(s.volumeKg || 0),
          name: s.name,
          sets: s.sets,
          xp: s.xp,
        })),
    [sessions, convert],
  );

  if (!data.length) {
    return (
      <p className="py-8 text-center text-sm text-slate-500">
        No sessions logged yet. The chart fills in as you train.
      </p>
    );
  }

  const peak = Math.max(...data.map((d) => d.value), 1);
  const mean = data.reduce((sum, d) => sum + d.value, 0) / data.length;
  const active = hovered !== null ? data[hovered] : null;

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <span className="hud-label">Tonnage per session</span>
        <span className="tnum font-mono text-[11px] text-slate-400">
          {active
            ? `${Math.round(active.value).toLocaleString()} ${unit}`
            : `avg ${Math.round(mean).toLocaleString()} ${unit}`}
        </span>
      </div>

      <div className="relative" style={{ height }}>
        <div
          className="absolute inset-x-0 border-t border-dashed border-white/15"
          style={{ bottom: `${(mean / peak) * 100}%` }}
          aria-hidden
        />

        <div className="flex h-full items-end gap-[3px]">
          {data.map((d, i) => (
            <button
              key={d.at || i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(i)}
              onBlur={() => setHovered(null)}
              className="relative flex h-full flex-1 items-end"
              aria-label={`${d.name}: ${Math.round(d.value)} ${unit}`}
            >
              <motion.span
                className="w-full rounded-t"
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(2, (d.value / peak) * 100)}%` }}
                transition={{ duration: 0.5, delay: i * 0.015, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  backgroundColor: hovered === i ? 'rgb(var(--accent))' : 'rgb(var(--accent) / 0.5)',
                  boxShadow: hovered === i ? '0 0 14px -2px rgb(var(--accent))' : 'none',
                }}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="mt-1.5 flex items-baseline justify-between gap-2 font-mono text-[10px] text-slate-600">
        <span className="shrink-0">
          {new Date(data[0].at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </span>
        {active && (
          <span className="accent-text truncate">
            {active.name} · {active.sets} sets · +{active.xp} XP
          </span>
        )}
        <span className="shrink-0">
          {new Date(data[data.length - 1].at).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          })}
        </span>
      </div>
    </div>
  );
}

export default VolumeChart;
