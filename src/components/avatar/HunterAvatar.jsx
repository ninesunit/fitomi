import { useId, useMemo } from 'react';
import { buildFigure } from './figure';
import { figureParams } from '../../engine/physique';
import { clsx } from '../../lib/clsx';

// ---------------------------------------------------------------------------
// THE HUNTER
//
// A shadow-soldier silhouette whose build is computed from the hunter's own
// attributes, so the status screen shows a body instead of describing one.
// Train legs and the thighs thicken; press and the shoulders widen.
//
// Everything is vector and CSS: no images, no sprite sheets, nothing that
// costs hosting bandwidth. The whole figure is about 4 KB of path data
// generated at render time.
// ---------------------------------------------------------------------------

/** Hex -> "r g b" for the space-separated syntax the System's variables use. */
function rgbOf(hex, fallback = '38 189 255') {
  if (typeof hex !== 'string') return fallback;
  const h = hex.replace('#', '').trim();
  if (!/^[0-9a-f]{3}$|^[0-9a-f]{6}$/i.test(h)) return fallback;
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

export function HunterAvatar({
  stats,
  bodyType = 'average',
  sex = '',
  color = '#26bdff',
  aura = true,
  motes = true,
  breathe = true,
  className,
  style,
  title,
}) {
  const uid = useId().replace(/:/g, '');
  const p = useMemo(() => figureParams({ stats, bodyType, sex }), [stats, bodyType, sex]);
  const fig = useMemo(() => buildFigure(p), [p]);
  const rgb = rgbOf(color);

  // Aura strength tracks Intelligence — programming discipline reads as
  // control. The mote count is capped so a maxed hunter is impressive rather
  // than a particle storm on a 360 px phone.
  const moteCount = motes ? 3 + Math.round(p.aura * 5) : 0;
  const rimOpacity = 0.42 + p.tone * 0.34;
  const detailOpacity = Math.max(0, p.tone - 0.28) * 0.62;

  return (
    <svg
      viewBox="0 0 120 200"
      // No sizing here: the caller owns it. Baking in h-full/w-full would
      // collide with any size class passed through `className`.
      className={clsx('block', className)}
      style={{ '--hue': rgb, overflow: 'visible', ...style }}
      role={title ? 'img' : 'presentation'}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        <linearGradient id={`${uid}-body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`rgb(${rgb} / 0.30)`} />
          <stop offset="45%" stopColor="rgb(9 14 26 / 0.96)" />
          <stop offset="100%" stopColor="rgb(4 7 14 / 0.98)" />
        </linearGradient>

        <radialGradient id={`${uid}-aura`} cx="50%" cy="46%" r="52%">
          <stop offset="0%" stopColor={`rgb(${rgb} / 0.30)`} />
          <stop offset="58%" stopColor={`rgb(${rgb} / 0.09)`} />
          <stop offset="100%" stopColor={`rgb(${rgb} / 0)`} />
        </radialGradient>

        <radialGradient id={`${uid}-floor`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={`rgb(${rgb} / 0.55)`} />
          <stop offset="100%" stopColor={`rgb(${rgb} / 0)`} />
        </radialGradient>

        <filter id={`${uid}-glow`} x="-40%" y="-25%" width="180%" height="150%">
          <feGaussianBlur stdDeviation="2.6" />
        </filter>

        {/* Detail lines are authored generously and clipped to the silhouette. */}
        <clipPath id={`${uid}-clip`}>
          {fig.clip.map((d, i) => <path key={i} d={d} />)}
        </clipPath>

        <style>{`
          .${uid}-rig { transform-origin: 60px 190px; }
          ${breathe ? `
          @media (prefers-reduced-motion: no-preference) {
            .${uid}-rig { animation: ${uid}-breathe 4.6s ease-in-out infinite; }
            .${uid}-halo { animation: ${uid}-halo 6.2s ease-in-out infinite; }
            .${uid}-mote { animation: ${uid}-rise 4.4s linear infinite; }
          }` : ''}
          @keyframes ${uid}-breathe {
            0%, 100% { transform: scaleY(1) scaleX(1); }
            50%      { transform: scaleY(1.012) scaleX(1.006); }
          }
          @keyframes ${uid}-halo {
            0%, 100% { opacity: 0.75; }
            50%      { opacity: 1; }
          }
          @keyframes ${uid}-rise {
            0%   { opacity: 0; transform: translateY(0); }
            18%  { opacity: 0.85; }
            80%  { opacity: 0.5; }
            100% { opacity: 0; transform: translateY(-96px); }
          }
        `}</style>
      </defs>

      {aura && (
        <g className={`${uid}-halo`}>
          <ellipse cx="60" cy="96" rx="62" ry="88" fill={`url(#${uid}-aura)`} />
        </g>
      )}

      {/* Motes drift up out of the floor sigil. */}
      {moteCount > 0 && (
        <g>
          {Array.from({ length: moteCount }, (_, i) => {
            const x = 22 + ((i * 37) % 76);
            const delay = (i * 0.72) % 4.4;
            const r = 0.9 + ((i * 7) % 3) * 0.35;
            return (
              <circle
                key={i}
                className={`${uid}-mote`}
                cx={x}
                cy={182 - ((i * 13) % 22)}
                r={r}
                fill={`rgb(${rgb})`}
                opacity="0"
                style={{ animationDelay: `${delay}s` }}
              />
            );
          })}
        </g>
      )}

      {/* Floor sigil the hunter stands on. */}
      <ellipse cx={fig.ground.cx} cy={fig.ground.cy} rx={fig.ground.rx} ry={fig.ground.ry} fill={`url(#${uid}-floor)`} />
      <ellipse
        cx={fig.ground.cx}
        cy={fig.ground.cy}
        rx={fig.ground.rx * 0.72}
        ry={fig.ground.ry * 0.72}
        fill="none"
        stroke={`rgb(${rgb} / 0.5)`}
        strokeWidth="0.7"
      />

      <g className={`${uid}-rig`}>
        {/* Rim glow: the whole body redrawn fat and blurred underneath. */}
        <g filter={`url(#${uid}-glow)`} opacity={0.5 + p.tone * 0.25}>
          <g fill="none" stroke={`rgb(${rgb} / 0.75)`} strokeWidth="2" strokeLinejoin="round">
            <path d={fig.legL} />
            <path d={fig.legR} />
            <path d={fig.torso} />
            <path d={fig.armL} />
            <path d={fig.armR} />
            <ellipse cx={fig.head.cx} cy={fig.head.cy} rx={fig.head.rx} ry={fig.head.ry} />
          </g>
        </g>

        {/* Solid body. */}
        <g fill={`url(#${uid}-body)`} stroke={`rgb(${rgb} / ${rimOpacity})`} strokeWidth="0.9" strokeLinejoin="round">
          <path d={fig.footL} />
          <path d={fig.footR} />
          <path d={fig.legL} />
          <path d={fig.legR} />
          {/* Unstroked: an outlined neck reads as a collar box under a round head. */}
          <path d={fig.neck} stroke="none" fill="rgb(9 14 26)" />
          <path d={fig.torso} />
          <path d={fig.armL} />
          <path d={fig.armR} />
          <ellipse cx={fig.head.cx} cy={fig.head.cy} rx={fig.head.rx} ry={fig.head.ry} />
        </g>

        {/* Gear: the hem where the torso outline crosses the legs. */}
        <g
          clipPath={`url(#${uid}-clip)`}
          fill="none"
          stroke={`rgb(${rgb} / 0.5)`}
          strokeWidth="0.7"
        >
          <path d={fig.hem} />
          <path d={fig.belt} />
        </g>

        {/* Musculature, revealed as tone climbs. */}
        {detailOpacity > 0.02 && (
          <g
            clipPath={`url(#${uid}-clip)`}
            fill="none"
            stroke={`rgb(${rgb})`}
            strokeWidth="0.6"
            strokeLinecap="round"
            opacity={detailOpacity}
          >
            {fig.detail.map((d, i) => <path key={i} d={d} />)}
          </g>
        )}

        {/* Visor. Perception drives how hard the eyes burn. */}
        <g opacity={0.55 + p.visor * 0.45}>
          <rect
            x={fig.head.cx - fig.head.rx * 0.66}
            y={fig.head.cy - 2.4}
            width={fig.head.rx * 1.32}
            height="3"
            rx="1.5"
            fill={`rgb(${rgb} / 0.22)`}
          />
          <circle cx={fig.head.cx - fig.head.rx * 0.4} cy={fig.head.cy - 0.9} r="1.5" fill={`rgb(${rgb})`} />
          <circle cx={fig.head.cx + fig.head.rx * 0.4} cy={fig.head.cy - 0.9} r="1.5" fill={`rgb(${rgb})`} />
        </g>
      </g>
    </svg>
  );
}

export default HunterAvatar;
