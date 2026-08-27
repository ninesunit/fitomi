import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { STATS } from '../../engine/constants';

// ---------------------------------------------------------------------------
// The hunter's attribute shape.
//
// A radar is the right form here for the one case radars are actually good at:
// a small fixed set of axes (five, always the same, always in the same order)
// where the *shape* is the message — "I am a strength build with no agility" —
// rather than any individual value. Single series, so no legend is needed; each
// axis is labelled directly and every value is printed.
// ---------------------------------------------------------------------------

export function StatRadar({ stats, size = 240, className, showValues = true }) {
  const [hovered, setHovered] = useState(null);
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.34;

  const values = STATS.map((s) => Number(stats?.[s.id]) || 0);
  const peak = Math.max(10, ...values);
  // Round the scale up to a clean step so the rings mean something.
  const scale = Math.ceil(peak / 10) * 10;

  const points = useMemo(
    () =>
      STATS.map((stat, i) => {
        const angle = (Math.PI * 2 * i) / STATS.length - Math.PI / 2;
        const value = Number(stats?.[stat.id]) || 0;
        const r = (value / scale) * radius;
        return {
          ...stat,
          value,
          angle,
          x: cx + Math.cos(angle) * r,
          y: cy + Math.sin(angle) * r,
          ax: cx + Math.cos(angle) * radius,
          ay: cy + Math.sin(angle) * radius,
          lx: cx + Math.cos(angle) * (radius + 26),
          ly: cy + Math.sin(angle) * (radius + 26),
        };
      }),
    [stats, scale, cx, cy, radius],
  );

  const polygon = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className={className}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full" role="img" aria-label="Attribute distribution">
        {/* Recessive grid: four rings and the spokes. */}
        {[0.25, 0.5, 0.75, 1].map((ring) => (
          <polygon
            key={ring}
            points={STATS.map((_, i) => {
              const angle = (Math.PI * 2 * i) / STATS.length - Math.PI / 2;
              return `${cx + Math.cos(angle) * radius * ring},${cy + Math.sin(angle) * radius * ring}`;
            }).join(' ')}
            fill="none"
            stroke="rgb(var(--sys))"
            strokeOpacity={ring === 1 ? 0.28 : 0.1}
            strokeWidth="1"
          />
        ))}

        {points.map((p) => (
          <line
            key={`spoke-${p.id}`}
            x1={cx}
            y1={cy}
            x2={p.ax}
            y2={p.ay}
            stroke="rgb(var(--sys))"
            strokeOpacity="0.12"
            strokeWidth="1"
          />
        ))}

        {/* The shape itself. */}
        <motion.polygon
          points={polygon}
          fill="rgb(var(--sys) / 0.2)"
          stroke="rgb(var(--sys))"
          strokeWidth="2"
          strokeLinejoin="round"
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        />

        {points.map((p) => (
          <g key={p.id}>
            {/* Hit target is deliberately much larger than the 5px vertex. */}
            <circle
              cx={p.x}
              cy={p.y}
              r="14"
              fill="transparent"
              onMouseEnter={() => setHovered(p.id)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'pointer' }}
            />
            <circle
              cx={p.x}
              cy={p.y}
              r={hovered === p.id ? 6 : 4}
              fill="rgb(var(--sys))"
              stroke="#0a0f1e"
              strokeWidth="2"
 className="transition-all"
            />
            <text
              x={p.lx}
              y={p.ly - 4}
              textAnchor="middle"
 className="fill-[rgb(var(--sys-dim))] font-mono text-[9px] uppercase tracking-widest"
            >
              {p.short}
            </text>
            {showValues && (
              <text
                x={p.lx}
                y={p.ly + 9}
                textAnchor="middle"
 className="fill-[rgb(var(--sys-ink))] font-mono text-[12px] font-bold"
              >
                {p.value}
              </text>
            )}
          </g>
        ))}
      </svg>

      {/* Tooltip: the axis name and what grows it. */}
      <div className="mt-1 min-h-[32px] text-center text-xs text-[rgb(var(--sys-dim))]">
        {hovered ? (
          <span>
            <span className="font-semibold text-[rgb(var(--sys-ink))]">{STATS.find((s) => s.id === hovered).name}</span>
            {' — '}
            {STATS.find((s) => s.id === hovered).blurb}
          </span>
        ) : (
          <span>Scale: 0–{scale}. Hover an axis for detail.</span>
        )}
      </div>
    </div>
  );
}

export default StatRadar;
