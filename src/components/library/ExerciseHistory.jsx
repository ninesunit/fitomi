import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { SystemPanel } from '../system/SystemWindow';
import { fromKg } from '../../engine/constants';
import { relativeTime, formatDate } from '../../lib/date';

// ---------------------------------------------------------------------------
// Per-exercise strength trend.
//
// One series, one hue, no gridlines: the shape is the message and the exact
// numbers are printed beside it. Points are dots on a line rather than bars
// because these are readings of the same quantity over time, and a line is
// what makes the direction legible at this size.
// ---------------------------------------------------------------------------

export function ExerciseHistory({ record, unit = 'kg' }) {
  const [active, setActive] = useState(null);

  const points = useMemo(() => {
    const raw = (record?.history || []).filter((p) => p.e1rm > 0);
    if (raw.length < 2) return null;
    const values = raw.map((p) => fromKg(p.e1rm, unit));
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    return raw.map((p, i) => ({
      ...p,
      value: values[i],
      x: (i / (raw.length - 1)) * 100,
      // 8% padding top and bottom so the extremes are not clipped by the frame.
      y: 92 - ((values[i] - min) / span) * 84,
    }));
  }, [record, unit]);

  if (!record?.lastSets?.length && !points) return null;

  const shown = active !== null && points ? points[active] : points?.[points.length - 1];
  const first = points?.[0];
  const change = shown && first ? shown.value - first.value : 0;

  return (
    <div className="space-y-3">
      {points && (
        <SystemPanel className="p-3">
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <span className="sys-label">Estimated 1RM</span>
            <span className="sys-value tnum text-sm">
              {shown.value.toFixed(1)} {unit}
              {change !== 0 && (
                <span
                  className="ml-2 font-mono text-[11px]"
                  style={{ color: change > 0 ? 'rgb(var(--sys-good))' : 'rgb(var(--sys-danger))' }}
                >
                  {change > 0 ? '+' : ''}
                  {change.toFixed(1)}
                </span>
              )}
            </span>
          </div>

          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-24 w-full" role="img" aria-label="Estimated 1RM over time">
            <motion.polyline
              points={points.map((p) => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke="rgb(var(--sys))"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            />
            <polygon
              points={`0,100 ${points.map((p) => `${p.x},${p.y}`).join(' ')} 100,100`}
              fill="rgb(var(--sys) / 0.12)"
            />
            {points.map((p, i) => (
              <circle
                key={p.at}
                cx={p.x}
                cy={p.y}
                r={active === i ? 3 : 2}
                fill="rgb(var(--sys))"
                vectorEffect="non-scaling-stroke"
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                style={{ cursor: 'pointer' }}
              />
            ))}
          </svg>

          <div className="mt-1 flex justify-between font-mono text-[10px] text-[rgb(var(--sys-dim))]">
            <span>{formatDate(first.at)}</span>
            <span>{active !== null ? formatDate(shown.at) : `${points.length} sessions`}</span>
            <span>{formatDate(points[points.length - 1].at)}</span>
          </div>
        </SystemPanel>
      )}

      {record?.lastSets?.length > 0 && (
        <SystemPanel className="p-3">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="sys-label">Last session</span>
            <span className="sys-label">{relativeTime(record.lastPerformed)}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {record.lastSets.map((set, i) => (
              <span key={i} className="stat-chip">
                {set.duration
                  ? `${set.duration}s`
                  : `${Number(fromKg(set.weightKg, unit).toFixed(1))}${unit} × ${set.reps}`}
                {set.rpe && <span className="text-[rgb(var(--sys-dim))]">@{set.rpe}</span>}
              </span>
            ))}
          </div>
          {record.sessions > 0 && (
            <p className="sys-label mt-2 normal-case tracking-normal">
              {record.sessions} session{record.sessions === 1 ? '' : 's'} logged
            </p>
          )}
        </SystemPanel>
      )}
    </div>
  );
}

export default ExerciseHistory;
