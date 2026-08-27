import { useId, useState } from 'react';
import { MUSCLES } from '../../engine/constants';
import { HEAD, FRONT, BACK } from '../../data/bodyRegions';
import { SORENESS_STATES } from '../../engine/soreness';

// ---------------------------------------------------------------------------
// Front/back body map shaded by inferred fatigue.
//
// Colour comes from the single-hue sequential ramp in soreness.js, and the
// selected muscle always shows its state *name* alongside — colour is never the
// only encoding of how cooked something is.
// ---------------------------------------------------------------------------

export function MuscleMap({ soreness, className, onSelect }) {
  const uid = useId().replace(/:/g, '');
  const [view, setView] = useState('front');
  const [active, setActive] = useState(null);
  const regions = view === 'front' ? FRONT : BACK;

  const fillFor = (id) => {
    const entry = soreness?.[id];
    if (!entry) return 'rgba(148,163,184,0.26)';
    const state = entry.state || SORENESS_STATES.fresh;
    // Opacity carries a second, redundant channel of the same magnitude. The
    // floor is high enough that an untrained limb still reads as part of a
    // body rather than fading out of the figure entirely.
    return `${state.color}${Math.round(78 + entry.value * 160).toString(16).padStart(2, '0')}`;
  };

  const activeEntry = active ? soreness?.[active] : null;

  return (
    <div className={className}>
      <div className="mb-2 flex items-center justify-between">
        <span className="hud-label">Fatigue map</span>
        <div className="inline-flex  border border-[rgb(var(--sys)/0.25)] bg-[rgb(var(--sys-deep-2)/0.6)] p-0.5">
          {['front', 'back'].map((side) => (
            <button
              key={side}
              onClick={() => setView(side)}
 className={`rounded-md px-2.5 py-1 text-[11px] font-semibold capitalize transition ${
                view === side ? 'text-void-950' : 'text-[rgb(var(--sys-dim))] hover:text-[rgb(var(--sys-ink))]'
              }`}
              style={view === side ? { backgroundColor: 'rgb(var(--sys))' } : undefined}
            >
              {side}
            </button>
          ))}
        </div>
      </div>

      <svg viewBox="0 0 100 186" className="mx-auto h-60 w-auto" role="img" aria-label={`${view} fatigue map`}>
        <defs>
          <filter id={`${uid}-heat`} x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="2.4" />
          </filter>
        </defs>

        {/* Aura and footing, so the regions read as a body standing in the
            System's light rather than a diagram of loose panels. */}
        <ellipse cx="50" cy="92" rx="52" ry="90" fill="rgb(var(--sys) / 0.05)" />
        <ellipse cx="50" cy="176" rx="26" ry="3.5" fill="rgb(var(--sys) / 0.18)" />

        {/* Heat bloom: the same regions, blurred, underneath. Fatigue should
            glow off the body before any individual panel is read. */}
        <g filter={`url(#${uid}-heat)`} opacity="0.75">
          {regions.map((region) => (
            <path key={`h-${view}-${region.id}`} d={region.d} fill={fillFor(region.id)} />
          ))}
        </g>

        <circle
          cx={HEAD.cx}
          cy={HEAD.cy}
          r={HEAD.r}
          fill="rgba(148,163,184,0.12)"
          stroke="rgb(var(--sys) / 0.35)"
          strokeWidth="0.8"
        />
        {regions.map((region) => (
          <path
            key={`${view}-${region.id}`}
            d={region.d}
            fill={fillFor(region.id)}
            stroke={active === region.id ? 'rgb(var(--sys))' : 'rgb(var(--sys) / 0.28)'}
            strokeWidth={active === region.id ? 1.3 : 0.6}
            strokeLinejoin="round"
            className="cursor-pointer transition-all"
            // Hover is desktop-only; on a phone the same region has to answer
            // to a tap, or the "tap a muscle" hint below describes nothing.
            onMouseEnter={() => setActive(region.id)}
            onMouseLeave={() => setActive(null)}
            onClick={() => {
              setActive((cur) => (cur === region.id ? null : region.id));
              onSelect?.(region.id);
            }}
          />
        ))}
      </svg>

      <div className="mt-1 min-h-[34px] text-center">
        {activeEntry ? (
          <>
            <div className="text-sm font-semibold text-[rgb(var(--sys-ink))]">{MUSCLES[active]?.name}</div>
            <div className="font-mono text-[11px]" style={{ color: activeEntry.state.color }}>
              {activeEntry.state.label} · {Math.round(activeEntry.value * 100)}% fatigue
              {Number.isFinite(activeEntry.daysSince) && ` · ${Math.floor(activeEntry.daysSince)}d ago`}
            </div>
          </>
        ) : (
          <div className="text-xs text-[rgb(var(--sys-dim))]">Tap a muscle for its recovery state.</div>
        )}
      </div>

      {/* Ordered legend — the ramp reads as a scale, and each step is named. */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5">
        {Object.values(SORENESS_STATES).map((state) => (
          <span key={state.id} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: state.color }} />
            <span className="font-mono text-[10px] uppercase tracking-wider text-[rgb(var(--sys-dim))]">{state.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export default MuscleMap;
