import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { BARS, PLATE_SETS, calculatePlates, warmupRamp } from '../../engine/plates';
import { clsx } from '../../lib/clsx';

const CENTER = 170;
const COLLAR_L = 112;
const COLLAR_R = 228;

/**
 * The plate calculator. Draws the bar as it will actually look loaded, because
 * "2x20 + 1x5 + 1x2.5" is much slower to parse mid-session than a picture of
 * the sleeve.
 */
export function PlateVisual({ embedded = false }) {
  const { profile, updateSettings } = useGame();
  const unit = profile?.unit || 'kg';

  const bars = BARS[unit];
  const [barId, setBarId] = useState(bars[0].id);
  const [target, setTarget] = useState(unit === 'kg' ? 100 : 225);

  const bar = bars.find((b) => b.id === barId) || bars[0];
  const available = profile?.settings?.availablePlates?.[unit] || PLATE_SETS[unit].map((p) => p.weight);

  const result = useMemo(
    () => calculatePlates(Number(target) || 0, bar.weight, available, unit),
    [target, bar.weight, available, unit],
  );

  const ramp = useMemo(
    () => warmupRamp(Number(target) || 0, bar.weight, available, unit),
    [target, bar.weight, available, unit],
  );

  // Flatten the per-side result into individual plates with their x offsets,
  // measured outward from the collar. Widths taper slightly so a deep stack
  // still fits the viewBox.
  const drawn = useMemo(() => {
    const out = [];
    let offset = 0;
    let index = 0;
    for (const plate of result.perSide) {
      for (let i = 0; i < plate.count; i += 1) {
        const width = Math.max(5, 13 - index * 0.55);
        out.push({ ...plate, width, offset, index });
        offset += width + 2.5;
        index += 1;
      }
    }
    return out;
  }, [result.perSide]);

  const togglePlate = (weight) => {
    const current = new Set(available);
    if (current.has(weight)) current.delete(weight);
    else current.add(weight);
    updateSettings({
      availablePlates: {
        ...profile.settings.availablePlates,
        [unit]: [...current].sort((a, b) => b - a),
      },
    });
  };

  return (
    <div className={clsx('space-y-4', !embedded && 'p-5')}>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="hud-label mb-1.5 block">Target weight ({unit})</span>
          <input
            type="number"
            inputMode="decimal"
            step="2.5"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="field text-center font-mono text-xl font-bold"
            style={{ outlineColor: 'rgb(var(--accent))' }}
          />
        </label>

        <label className="block">
          <span className="hud-label mb-1.5 block">Bar</span>
          <select value={barId} onChange={(e) => setBarId(e.target.value)} className="field">
            {bars.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.weight} {unit})
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="rounded-xl border border-white/[0.07] bg-void-950/60 p-4">
        <svg viewBox="0 0 340 120" className="w-full" role="img" aria-label="Loaded barbell">
          <rect x="10" y="56" width="320" height="8" rx="4" fill="#475569" />
          <rect x={COLLAR_L + 6} y="54" width={COLLAR_R - COLLAR_L - 12} height="12" rx="6" fill="#64748b" />
          <rect x={COLLAR_L} y="48" width="7" height="24" rx="2" fill="#334155" />
          <rect x={COLLAR_R - 7} y="48" width="7" height="24" rx="2" fill="#334155" />

          {drawn.map((plate) => {
            const h = plate.height * 0.92;
            const y = 60 - h / 2;
            return (
              <g key={`${plate.weight}-${plate.index}`}>
                <motion.rect
                  initial={{ opacity: 0, scaleY: 0.35 }}
                  animate={{ opacity: 1, scaleY: 1 }}
                  transition={{ delay: plate.index * 0.04 }}
                  x={COLLAR_R + plate.offset}
                  y={y}
                  width={plate.width}
                  height={h}
                  rx="3"
                  fill={plate.color}
                  stroke="rgba(0,0,0,0.45)"
                  strokeWidth="1"
                  style={{ transformOrigin: 'center' }}
                />
                <motion.rect
                  initial={{ opacity: 0, scaleY: 0.35 }}
                  animate={{ opacity: 1, scaleY: 1 }}
                  transition={{ delay: plate.index * 0.04 }}
                  x={COLLAR_L - plate.offset - plate.width}
                  y={y}
                  width={plate.width}
                  height={h}
                  rx="3"
                  fill={plate.color}
                  stroke="rgba(0,0,0,0.45)"
                  strokeWidth="1"
                  style={{ transformOrigin: 'center' }}
                />
              </g>
            );
          })}

          <text x={CENTER} y="104" textAnchor="middle" className="fill-slate-500 font-mono text-[10px]">
            {bar.name} · {bar.weight} {unit}
          </text>
        </svg>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          {result.perSide.length ? (
            result.perSide.map((plate) => (
              <span
                key={plate.weight}
                className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-xs font-bold"
                style={{ borderColor: `${plate.color}66`, color: plate.color }}
              >
                {plate.count} × {plate.weight}
              </span>
            ))
          ) : (
            <span className="font-mono text-xs text-slate-500">Empty bar</span>
          )}
          <span className="font-mono text-xs text-slate-500">per side</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Readout label="Per side" value={`${result.perSideWeight ?? 0} ${unit}`} />
        <Readout label="Total loaded" value={`${result.achieved} ${unit}`} accent={result.exact} />
        <Readout
          label="Difference"
          value={`${result.remainder > 0 ? '+' : ''}${result.remainder} ${unit}`}
        />
      </div>

      {(!result.exact || result.error) && (
        <div className="flex items-start gap-2 rounded-lg border border-gold-500/30 bg-gold-500/10 px-3 py-2 text-xs text-gold-300">
          <AlertTriangle size={13} className="mt-0.5 shrink-0" />
          <span>
            {result.error ||
              `That exact weight is not loadable with the plates selected — nearest is ${result.achieved} ${unit}.`}
          </span>
        </div>
      )}

      {ramp.length > 0 && Number(target) > bar.weight && (
        <div>
          <div className="hud-label mb-2">Suggested warm-up ramp</div>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {ramp.map((step) => (
              <button
                key={step.pct}
                onClick={() => setTarget(step.weight)}
                className="rounded-lg border border-white/[0.07] bg-void-950/50 px-2 py-2 text-center transition hover:bg-white/[0.05]"
              >
                <div className="hud-label mb-0.5">{step.pct}%</div>
                <div className="tnum font-mono text-sm font-bold text-slate-100">
                  {step.weight} {unit}
                </div>
                <div className="font-mono text-[10px] text-slate-500">× {step.reps}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="hud-label mb-2">Plates available in your gym</div>
        <div className="flex flex-wrap gap-1.5">
          {PLATE_SETS[unit].map((plate) => {
            const on = available.includes(plate.weight);
            return (
              <button
                key={plate.weight}
                onClick={() => togglePlate(plate.weight)}
                className={clsx(
                  'rounded-md border px-2.5 py-1 font-mono text-xs font-bold transition',
                  on ? 'text-void-950' : 'border-white/10 text-slate-500 hover:bg-white/5',
                )}
                style={on ? { backgroundColor: plate.color, borderColor: plate.color } : undefined}
              >
                {plate.weight}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Deselect anything your gym does not stock — the calculator solves exactly for what is left.
        </p>
      </div>
    </div>
  );
}

function Readout({ label, value, accent }) {
  return (
    <div className="rounded-lg border border-white/[0.07] bg-void-950/50 px-3 py-2 text-center">
      <div className="hud-label mb-0.5">{label}</div>
      <div className={clsx('tnum font-mono text-sm font-bold', accent ? 'accent-text' : 'text-slate-100')}>
        {value}
      </div>
    </div>
  );
}

export default PlateVisual;
