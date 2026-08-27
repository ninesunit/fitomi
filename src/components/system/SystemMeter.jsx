import { motion } from 'framer-motion';
import { clsx } from '../../lib/clsx';

/**
 * A System bar — HP/MP/FATIGUE styling: hard edges, a bright fill, and the
 * value printed alongside rather than inside.
 */
export function SystemMeter({ value = 0, max = 100, label, right, color, className, height = 10 }) {
  const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) * 100 : 0;
  return (
    <div className={className}>
      {(label || right) && (
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          {label && <span className="sys-label">{label}</span>}
          {right && <span className="tnum font-mono text-[11px] text-[rgb(var(--sys-ink))]">{right}</span>}
        </div>
      )}
      <div className="sys-meter" style={{ height }}>
        <motion.div
          className="sys-meter-fill"
          style={color ? { background: color, boxShadow: `0 0 14px -2px ${color}` } : undefined}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}

/** Segmented variant — reads as a game resource rather than a progress bar. */
export function SystemSegments({ value = 0, segments = 12, className, color }) {
  const filled = Math.round(Math.max(0, Math.min(1, value)) * segments);
  return (
    <div className={clsx('flex gap-[3px]', className)}>
      {Array.from({ length: segments }, (_, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0.15 }}
          animate={{ opacity: i < filled ? 1 : 0.15 }}
          transition={{ delay: i * 0.02 }}
          className="h-2.5 flex-1"
          style={{
            background: i < filled ? color || 'rgb(var(--sys))' : 'rgb(var(--sys) / 0.2)',
            boxShadow: i < filled ? `0 0 8px -2px ${color || 'rgb(var(--sys))'}` : 'none',
          }}
        />
      ))}
    </div>
  );
}

export default SystemMeter;
