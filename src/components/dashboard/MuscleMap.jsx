import { useState } from 'react';
import { MUSCLES } from '../../engine/constants';
import { SORENESS_STATES } from '../../engine/soreness';

// ---------------------------------------------------------------------------
// Front/back body map shaded by inferred fatigue.
//
// Colour comes from the single-hue sequential ramp in soreness.js, and the
// selected muscle always shows its state *name* alongside — colour is never the
// only encoding of how cooked something is.
// ---------------------------------------------------------------------------

// Anatomical regions, in a 100x210 viewBox.
//
// The body *is* the sum of these polygons — there is no separate silhouette
// path behind them to drift out of alignment. Each region is a closed polygon
// sized to its real proportion, so the map reads as a figure rather than a
// diagram of boxes.
const HEAD = { cx: 50, cy: 17, r: 10 };

const FRONT = [
  { id: 'neck', d: 'M44 27 L56 27 L56 34 L44 34 Z' },
  { id: 'shoulders', d: 'M27 38 L39 33 L41 46 L28 51 Z M73 38 L61 33 L59 46 L72 51 Z' },
  { id: 'chest', d: 'M39 34 L61 34 L64 47 L62 57 L38 57 L36 47 Z' },
  { id: 'abs', d: 'M41 59 L59 59 L58 88 L42 88 Z' },
  { id: 'obliques', d: 'M35 59 L40 59 L41 87 L36 83 Z M65 59 L60 59 L59 87 L64 83 Z' },
  { id: 'biceps', d: 'M26 53 L37 56 L35 74 L24 71 Z M74 53 L63 56 L65 74 L76 71 Z' },
  { id: 'forearms', d: 'M24 73 L35 76 L33 97 L22 94 Z M76 73 L65 76 L67 97 L78 94 Z' },
  { id: 'quads', d: 'M38 91 L48 91 L47 133 L36 131 Z M62 91 L52 91 L53 133 L64 131 Z' },
  { id: 'adductors', d: 'M49 91 L51 91 L51 118 L49 118 Z' },
  { id: 'calves', d: 'M37 135 L47 135 L45 170 L38 168 Z M63 135 L53 135 L55 170 L62 168 Z' },
];

const BACK = [
  { id: 'neck', d: 'M44 27 L56 27 L56 34 L44 34 Z' },
  { id: 'traps', d: 'M39 32 L61 32 L67 50 L33 50 Z' },
  { id: 'shoulders', d: 'M27 38 L39 34 L40 47 L28 51 Z M73 38 L61 34 L60 47 L72 51 Z' },
  { id: 'back', d: 'M35 51 L65 51 L64 64 L36 64 Z' },
  { id: 'lats', d: 'M34 52 L38 52 L41 78 L37 76 Z M66 52 L62 52 L59 78 L63 76 Z' },
  { id: 'lowerBack', d: 'M38 65 L62 65 L60 90 L40 90 Z' },
  { id: 'triceps', d: 'M26 53 L37 56 L35 74 L24 71 Z M74 53 L63 56 L65 74 L76 71 Z' },
  { id: 'forearms', d: 'M24 73 L35 76 L33 97 L22 94 Z M76 73 L65 76 L67 97 L78 94 Z' },
  { id: 'glutes', d: 'M37 92 L63 92 L62 113 L38 113 Z' },
  { id: 'hamstrings', d: 'M38 115 L49 115 L48 152 L37 150 Z M62 115 L51 115 L52 152 L63 150 Z' },
  { id: 'abductors', d: 'M35 93 L38 93 L38 112 L35 110 Z M65 93 L62 93 L62 112 L65 110 Z' },
  { id: 'calves', d: 'M37 154 L47 154 L45 186 L38 184 Z M63 154 L53 154 L55 186 L62 184 Z' },
];

export function MuscleMap({ soreness, className, onSelect }) {
  const [view, setView] = useState('front');
  const [active, setActive] = useState(null);
  const regions = view === 'front' ? FRONT : BACK;

  const fillFor = (id) => {
    const entry = soreness?.[id];
    if (!entry) return 'rgba(148,163,184,0.14)';
    const state = entry.state || SORENESS_STATES.fresh;
    // Opacity carries a second, redundant channel of the same magnitude.
    return `${state.color}${Math.round(40 + entry.value * 190).toString(16).padStart(2, '0')}`;
  };

  const activeEntry = active ? soreness?.[active] : null;

  return (
    <div className={className}>
      <div className="mb-2 flex items-center justify-between">
        <span className="hud-label">Fatigue map</span>
        <div className="inline-flex rounded-lg border border-white/10 bg-void-950/60 p-0.5">
          {['front', 'back'].map((side) => (
            <button
              key={side}
              onClick={() => setView(side)}
              className={`rounded-md px-2.5 py-1 text-[11px] font-semibold capitalize transition ${
                view === side ? 'text-void-950' : 'text-slate-400 hover:text-slate-200'
              }`}
              style={view === side ? { backgroundColor: 'rgb(var(--accent))' } : undefined}
            >
              {side}
            </button>
          ))}
        </div>
      </div>

      <svg viewBox="0 0 100 200" className="mx-auto h-60 w-auto" role="img" aria-label={`${view} fatigue map`}>
        <circle
          cx={HEAD.cx}
          cy={HEAD.cy}
          r={HEAD.r}
          fill="rgba(148,163,184,0.1)"
          stroke="rgb(var(--accent) / 0.3)"
          strokeWidth="0.8"
        />
        {regions.map((region) => (
          <path
            key={`${view}-${region.id}`}
            d={region.d}
            fill={fillFor(region.id)}
            stroke={active === region.id ? 'rgb(var(--accent))' : 'rgba(255,255,255,0.16)'}
            strokeWidth={active === region.id ? 1.3 : 0.5}
            strokeLinejoin="round"
            className="cursor-pointer transition-all"
            onMouseEnter={() => setActive(region.id)}
            onMouseLeave={() => setActive(null)}
            onClick={() => onSelect?.(region.id)}
          />
        ))}
      </svg>

      <div className="mt-1 min-h-[34px] text-center">
        {activeEntry ? (
          <>
            <div className="text-sm font-semibold text-slate-200">{MUSCLES[active]?.name}</div>
            <div className="font-mono text-[11px]" style={{ color: activeEntry.state.color }}>
              {activeEntry.state.label} · {Math.round(activeEntry.value * 100)}% fatigue
              {Number.isFinite(activeEntry.daysSince) && ` · ${Math.floor(activeEntry.daysSince)}d ago`}
            </div>
          </>
        ) : (
          <div className="text-xs text-slate-500">Tap a muscle for its recovery state.</div>
        )}
      </div>

      {/* Ordered legend — the ramp reads as a scale, and each step is named. */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5">
        {Object.values(SORENESS_STATES).map((state) => (
          <span key={state.id} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: state.color }} />
            <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">{state.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export default MuscleMap;
