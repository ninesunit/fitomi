import { useId, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { STATS } from '../../engine/constants';

const CORE = new Set(['str', 'agi', 'vit']);

export function StatRadar({ stats, size = 280, className, showValues = true }) {
  const uid = useId().replace(/[:]/g, '');
  const [hovered, setHovered] = useState(null);
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.315;

  const values = STATS.map((stat) => Number(stats?.[stat.id]) || 0);
  const peak = Math.max(10, ...values);
  const scale = Math.ceil(peak / 10) * 10;

  const points = useMemo(
    () => STATS.map((stat, index) => {
      const angle = (Math.PI * 2 * index) / STATS.length - Math.PI / 2;
      const value = Number(stats?.[stat.id]) || 0;
      const valueRadius = (value / scale) * radius;
      return {
        ...stat,
        value,
        angle,
        x: cx + Math.cos(angle) * valueRadius,
        y: cy + Math.sin(angle) * valueRadius,
        ax: cx + Math.cos(angle) * radius,
        ay: cy + Math.sin(angle) * radius,
        lx: cx + Math.cos(angle) * (radius + 34),
        ly: cy + Math.sin(angle) * (radius + 34),
      };
    }),
    [stats, scale, cx, cy, radius],
  );

  const polygon = points.map((point) => `${point.x},${point.y}`).join(' ');
  const ringPoints = (ring) => STATS.map((_, index) => {
    const angle = (Math.PI * 2 * index) / STATS.length - Math.PI / 2;
    return `${cx + Math.cos(angle) * radius * ring},${cy + Math.sin(angle) * radius * ring}`;
  }).join(' ');
  const active = hovered ? STATS.find((stat) => stat.id === hovered) : null;

  return (
    <div className={className}>
      <div className="relative mx-auto aspect-square w-full max-w-[320px]">
        <div className="pointer-events-none absolute inset-[13%] rotate-45 border border-[rgb(var(--sys-2)/0.13)] shadow-[inset_0_0_30px_rgb(var(--sys-2)/0.06)]" aria-hidden />
        <svg viewBox={`0 0 ${size} ${size}`} className="relative w-full overflow-visible" role="img" aria-label="Hunter attribute distribution">
          <defs>
            <radialGradient id={`${uid}-field`} cx="50%" cy="48%" r="54%">
              <stop offset="0%" stopColor="rgb(var(--sys-2))" stopOpacity="0.24" />
              <stop offset="62%" stopColor="rgb(var(--sys))" stopOpacity="0.1" />
              <stop offset="100%" stopColor="rgb(var(--sys-deep-2))" stopOpacity="0" />
            </radialGradient>
            <linearGradient id={`${uid}-data`} x1="12%" y1="10%" x2="88%" y2="92%">
              <stop offset="0%" stopColor="rgb(var(--sys))" stopOpacity="0.52" />
              <stop offset="100%" stopColor="rgb(var(--sys-2))" stopOpacity="0.28" />
            </linearGradient>
            <filter id={`${uid}-glow`} x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          <circle cx={cx} cy={cy} r={radius * 1.09} fill={`url(#${uid}-field)`} />

          {[0.2, 0.4, 0.6, 0.8, 1].map((ring, index) => (
            <polygon
              key={ring}
              points={ringPoints(ring)}
              fill={index % 2 ? 'rgb(var(--sys-2) / 0.018)' : 'none'}
              stroke={ring === 1 ? 'rgb(var(--sys))' : 'rgb(var(--sys-2))'}
              strokeOpacity={ring === 1 ? 0.42 : 0.14}
              strokeWidth={ring === 1 ? 1.4 : 0.8}
            />
          ))}

          {points.map((point) => (
            <line key={`spoke-${point.id}`} x1={cx} y1={cy} x2={point.ax} y2={point.ay} stroke="rgb(var(--sys))" strokeOpacity="0.16" strokeWidth="0.8" />
          ))}

          <motion.polygon
            points={polygon}
            fill="none"
            stroke="rgb(var(--sys-2))"
            strokeOpacity="0.28"
            strokeWidth="7"
            filter={`url(#${uid}-glow)`}
            initial={{ opacity: 0, scale: 0.72 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          />
          <motion.polygon
            points={polygon}
            fill={`url(#${uid}-data)`}
            stroke="rgb(var(--sys))"
            strokeWidth="2.2"
            strokeLinejoin="miter"
            initial={{ opacity: 0, scale: 0.72 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          />

          <circle cx={cx} cy={cy} r="4" fill="rgb(var(--sys-deep-2))" stroke="rgb(var(--sys))" strokeWidth="1.5" />

          {points.map((point) => {
            const selected = hovered === point.id;
            const core = CORE.has(point.id);
            const nodeColor = core ? 'var(--sys)' : 'var(--sys-2)';
            return (
              <g key={point.id}>
                <circle cx={point.x} cy={point.y} r="15" fill="transparent" onMouseEnter={() => setHovered(point.id)} onMouseLeave={() => setHovered(null)} onClick={() => setHovered((current) => current === point.id ? null : point.id)} style={{ cursor: 'pointer' }} />
                <motion.rect
                  x={point.x - (selected ? 5 : 3.5)}
                  y={point.y - (selected ? 5 : 3.5)}
                  width={selected ? 10 : 7}
                  height={selected ? 10 : 7}
                  fill={`rgb(${nodeColor})`}
                  stroke="rgb(var(--sys-deep-2))"
                  strokeWidth="1.5"
                  animate={{ rotate: selected ? 135 : 45 }}
                  style={{ transformOrigin: `${point.x}px ${point.y}px`, filter: `drop-shadow(0 0 ${selected ? 7 : 4}px rgb(${nodeColor}))` }}
                />
                <text x={point.lx} y={point.ly - 5} textAnchor="middle" className={core ? 'fill-[rgb(var(--sys))] font-mono text-[9px] font-bold tracking-[0.16em]' : 'fill-[rgb(var(--sys-2))] font-mono text-[9px] font-bold tracking-[0.16em]'}>
                  {point.short}
                </text>
                {showValues && (
                  <text x={point.lx} y={point.ly + 10} textAnchor="middle" className="fill-[rgb(var(--sys-ink))] font-display text-[14px] font-bold">
                    {point.value}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mx-auto mt-1 min-h-[48px] max-w-sm border border-[rgb(var(--sys)/0.18)] bg-[rgb(var(--sys-deep-2)/0.6)] px-3 py-2 text-center text-xs text-[rgb(var(--sys-dim))]">
        {active ? (
          <span><span className="font-semibold text-[rgb(var(--sys-ink))]">{active.name}</span>: {active.blurb}</span>
        ) : (
          <span>Core combat attributes: Strength, Agility, Vitality. Scale 0 / {scale}. Tap an axis for detail.</span>
        )}
      </div>
    </div>
  );
}

export default StatRadar;
