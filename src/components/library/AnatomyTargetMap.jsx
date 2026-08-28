import { useId } from 'react';
import { clsx } from '../../lib/clsx';

const FRONT = {
  shoulders: ['M34 32 Q26 34 24 42 L30 45 Q34 41 38 36Z', 'M66 32 Q74 34 76 42 L70 45 Q66 41 62 36Z'],
  chest: ['M39 37 Q49 34 49 49 Q42 51 35 47Z', 'M51 37 Q61 34 65 47 Q58 51 51 49Z'],
  biceps: ['M25 44 Q20 51 22 63 Q27 61 30 48Z', 'M75 44 Q80 51 78 63 Q73 61 70 48Z'],
  forearms: ['M22 63 L17 82 Q20 86 24 82 L28 63Z', 'M78 63 L83 82 Q80 86 76 82 L72 63Z'],
  abs: ['M42 51 Q50 48 58 51 L57 79 Q50 83 43 79Z'],
  obliques: ['M35 48 Q40 54 42 79 L36 76 L32 55Z', 'M65 48 Q60 54 58 79 L64 76 L68 55Z'],
  hipFlexors: ['M40 78 L49 84 L43 94 L36 86Z', 'M60 78 L51 84 L57 94 L64 86Z'],
  adductors: ['M45 88 L49 91 L47 123 L40 112Z', 'M55 88 L51 91 L53 123 L60 112Z'],
  quads: ['M36 86 Q43 83 48 91 L46 124 Q37 121 34 106Z', 'M64 86 Q57 83 52 91 L54 124 Q63 121 66 106Z'],
  calves: ['M35 125 Q42 122 46 132 L43 157 L36 157 L32 141Z', 'M65 125 Q58 122 54 132 L57 157 L64 157 L68 141Z'],
};

const BACK = {
  traps: ['M41 32 Q50 27 59 32 L56 44 L50 49 L44 44Z'],
  shoulders: FRONT.shoulders,
  back: ['M37 39 Q50 45 63 39 L60 70 Q50 79 40 70Z'],
  lats: ['M35 43 Q41 48 42 72 L36 79 L31 55Z', 'M65 43 Q59 48 58 72 L64 79 L69 55Z'],
  triceps: ['M25 44 Q20 53 23 66 L29 62 L31 47Z', 'M75 44 Q80 53 77 66 L71 62 L69 47Z'],
  forearms: FRONT.forearms,
  lowerBack: ['M42 69 Q50 76 58 69 L59 82 Q50 88 41 82Z'],
  glutes: ['M36 81 Q43 78 49 86 L48 98 Q40 101 34 94Z', 'M64 81 Q57 78 51 86 L52 98 Q60 101 66 94Z'],
  hamstrings: ['M35 98 Q42 95 47 100 L46 125 Q38 127 34 116Z', 'M65 98 Q58 95 53 100 L54 125 Q62 127 66 116Z'],
  abductors: ['M33 82 L41 78 L39 98 L33 94Z', 'M67 82 L59 78 L61 98 L67 94Z'],
  calves: FRONT.calves,
};

function regionTone(id, primary, secondary) {
  if (primary.has(id)) return 'primary';
  if (secondary.has(id)) return 'secondary';
  return 'idle';
}

function Figure({ regions, primary, secondary, offset = 0, label }) {
  return (
    <g transform={`translate(${offset} 0)`}>
      <g fill="#111a2a" stroke="rgb(var(--sys) / 0.24)" strokeWidth="0.9">
        <ellipse cx="50" cy="18" rx="9" ry="12" />
        <path d="M43 29 Q50 26 57 29 L66 43 L62 80 L66 92 L64 124 L68 141 L64 161 L55 161 L52 128 L50 96 L48 128 L45 161 L36 161 L32 141 L36 124 L34 92 L38 80 L34 43Z" />
        <path d="M35 38 L24 43 L16 82 L23 86 L31 61Z" />
        <path d="M65 38 L76 43 L84 82 L77 86 L69 61Z" />
      </g>
      {Object.entries(regions).flatMap(([id, paths]) => paths.map((d, index) => {
        const tone = regionTone(id, primary, secondary);
        const fill = tone === 'primary'
          ? 'rgb(var(--sys))'
          : tone === 'secondary'
            ? 'rgb(var(--sys-2))'
            : 'rgb(37 50 71 / 0.72)';
        return (
          <path
            key={`${id}-${index}`}
            d={d}
            fill={fill}
            stroke={tone === 'idle' ? 'rgb(148 163 184 / 0.08)' : fill}
            strokeWidth={tone === 'idle' ? 0.35 : 0.75}
            opacity={tone === 'idle' ? 0.56 : 0.96}
            style={tone === 'idle' ? undefined : { filter: `drop-shadow(0 0 3px ${fill})` }}
          />
        );
      }))}
      <text x="50" y="170" textAnchor="middle" fill="rgb(var(--sys-dim))" fontSize="5" letterSpacing="1.2">{label}</text>
    </g>
  );
}

export function AnatomyTargetMap({ primary = [], secondary = [], className, showLegend = false }) {
  const uid = useId().replace(/:/g, '');
  const primarySet = new Set(primary);
  const secondarySet = new Set(secondary.filter((id) => !primarySet.has(id)));

  return (
    <figure className={clsx('relative h-full w-full', className)} aria-label="Primary and secondary muscle anatomy map">
      <svg viewBox="0 0 205 178" className="h-full w-full" role="img">
        <defs>
          <linearGradient id={`${uid}-scan`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="rgb(var(--sys) / 0.14)" />
            <stop offset="1" stopColor="rgb(var(--sys-2) / 0.03)" />
          </linearGradient>
        </defs>
        <rect x="1" y="1" width="203" height="176" fill={`url(#${uid}-scan)`} stroke="rgb(var(--sys) / 0.16)" />
        <Figure regions={FRONT} primary={primarySet} secondary={secondarySet} label="FRONT" />
        <Figure regions={BACK} primary={primarySet} secondary={secondarySet} offset={104} label="BACK" />
        <path d="M102.5 8V168" stroke="rgb(var(--sys) / 0.12)" strokeDasharray="2 4" />
      </svg>
      {showLegend && (
        <figcaption className="absolute inset-x-1 bottom-1 flex justify-center gap-2 font-mono text-[7px] uppercase tracking-wider text-[rgb(var(--sys-dim))]">
          <span><i className="mr-1 inline-block h-1.5 w-1.5 bg-[rgb(var(--sys))]" />Primary</span>
          <span><i className="mr-1 inline-block h-1.5 w-1.5 bg-[rgb(var(--sys-2))]" />Assist</span>
        </figcaption>
      )}
    </figure>
  );
}

export default AnatomyTargetMap;
