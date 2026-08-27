import { useId, useMemo } from 'react';
import { buildBoss, fractures } from './bossShapes';
import { clsx } from '../../lib/clsx';

// ---------------------------------------------------------------------------
// THE GATE'S OCCUPANT
//
// The raid page used to describe a monster in three lines of text. This draws
// it — and, more usefully, draws the damage: fractures spread across the body
// and the aura dims as the week's tonnage lands, so the boss's condition is
// visible before the integrity bar is read.
// ---------------------------------------------------------------------------

export function BossFigure({ boss, damage = 0, hp = 1, className, defeated = false }) {
  const uid = useId().replace(/:/g, '');
  const shapes = useMemo(() => buildBoss(boss), [boss?.id]);
  const cracks = useMemo(() => fractures(boss), [boss?.id]);

  const wounded = Math.max(0, Math.min(1, damage / (hp || 1)));
  // Cracks are all on the body by ~85% damage, so the last stretch of the
  // fight reads as a boss that is visibly coming apart rather than one that
  // gains its final fracture on the killing blow.
  const shown = Math.round(Math.min(1, wounded / 0.85) * cracks.length);
  const color = boss?.color || '#f97316';
  const accent = boss?.accent || '#fbbf24';
  // A boss on its last legs burns low; a fresh one is at full menace.
  const vitality = defeated ? 0.12 : 1 - wounded * 0.55;

  return (
    <svg
      viewBox="0 0 200 200"
      className={clsx('block', className)}
      role="img"
      aria-label={`${boss?.name || 'Boss'}${defeated ? ', defeated' : `, ${Math.round(wounded * 100)}% damaged`}`}
    >
      <defs>
        <radialGradient id={`${uid}-aura`} cx="50%" cy="52%" r="52%">
          <stop offset="0%" stopColor={color} stopOpacity={0.34 * vitality} />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${uid}-body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.42 * vitality} />
          <stop offset="55%" stopColor="#070c18" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#04070f" stopOpacity="0.98" />
        </linearGradient>
        <filter id={`${uid}-glow`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <style>{`
          @media (prefers-reduced-motion: no-preference) {
            .${uid}-breathe { animation: ${uid}-b 5.2s ease-in-out infinite; transform-origin: 100px 182px; }
            .${uid}-eye { animation: ${uid}-e 3.4s ease-in-out infinite; }
          }
          @keyframes ${uid}-b { 0%,100% { transform: scale(1); } 50% { transform: scale(1.018); } }
          @keyframes ${uid}-e { 0%,100% { opacity: 1; } 46% { opacity: 0.55; } }
        `}</style>
      </defs>

      <ellipse cx="100" cy="106" rx="96" ry="92" fill={`url(#${uid}-aura)`} />

      {/* Ground the creature stands on. */}
      <ellipse cx="100" cy="184" rx="62" ry="8" fill={color} opacity={0.2 * vitality} />

      <g className={`${uid}-breathe`} opacity={defeated ? 0.45 : 1}>
        {/* Rim glow. */}
        <g filter={`url(#${uid}-glow)`} opacity={0.55 * vitality}>
          <g fill="none" stroke={color} strokeWidth="3" strokeLinejoin="round">
            {shapes.spikes.map((d, i) => <path key={`gs${i}`} d={d} />)}
            {shapes.body.map((d, i) => <path key={`gb${i}`} d={d} />)}
          </g>
        </g>

        <g
          fill={`url(#${uid}-body)`}
          stroke={color}
          strokeOpacity={0.35 + 0.35 * vitality}
          strokeWidth="1.2"
          strokeLinejoin="round"
        >
          {shapes.spikes.map((d, i) => <path key={`s${i}`} d={d} />)}
          {shapes.body.map((d, i) => <path key={`b${i}`} d={d} />)}
        </g>

        {/* Fractures: one more appears with every ~14% of health taken. */}
        {shown > 0 && (
          <g fill="none" stroke={accent} strokeWidth="1.6" strokeLinecap="round" opacity="0.9"
             style={{ filter: `drop-shadow(0 0 4px ${accent})` }}>
            {cracks.slice(0, shown).map((d, i) => <path key={`c${i}`} d={d} />)}
          </g>
        )}

        {/* Eyes. They go out when the gate is cleared. */}
        {!defeated && (
          <g className={`${uid}-eye`}>
            {shapes.eyes.map((e, i) => (
              <circle
                key={i}
                cx={e.x}
                cy={e.y}
                r={e.r}
                fill={accent}
                style={{ filter: `drop-shadow(0 0 5px ${accent})` }}
              />
            ))}
          </g>
        )}
      </g>
    </svg>
  );
}

export default BossFigure;
