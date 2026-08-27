import { motion } from 'framer-motion';
import { clsx } from '../../lib/clsx';

/** The XP bar. Animated fill with a travelling shimmer along the leading edge. */
export function XpBar({ progress = 0, height = 'h-2.5', showShimmer = true, className, color }) {
  const pct = Math.max(0, Math.min(1, progress)) * 100;
  return (
    <div className={clsx('relative w-full overflow-hidden  bg-[rgb(var(--sys-deep-2)/0.9)]', height, className)}>
      <motion.div
 className="relative h-full "
        style={{
          backgroundImage: color
            ? `linear-gradient(90deg, ${color}, ${color})`
            : 'linear-gradient(90deg, rgb(var(--sys)), rgb(var(--sys-2)))',
          boxShadow: '0 0 14px -2px rgb(var(--sys) / 0.85)',
        }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        {showShimmer && pct > 3 && (
          <span className="absolute inset-y-0 right-0 w-8 bg-gradient-to-r from-transparent to-white/45" />
        )}
      </motion.div>
    </div>
  );
}

/** Generic labelled meter used for stats, soreness and boss health. */
export function Meter({ value = 0, max = 100, color = '#26bdff', label, right, height = 'h-2', className }) {
  const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) * 100 : 0;
  return (
    <div className={className}>
      {(label || right) && (
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          {label && <span className="hud-label">{label}</span>}
          {right && <span className="tnum font-mono text-xs text-[rgb(var(--sys-ink))]">{right}</span>}
        </div>
      )}
      <div className={clsx('w-full overflow-hidden  bg-[rgb(var(--sys-deep-2)/0.9)]', height)}>
        <motion.div
 className="h-full "
          style={{ backgroundColor: color, boxShadow: `0 0 12px -3px ${color}` }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

/** Segmented bar — reads as a game resource rather than a progress indicator. */
export function SegmentedBar({ value = 0, segments = 10, color = '#26bdff', className }) {
  const filled = Math.round(Math.max(0, Math.min(1, value)) * segments);
  return (
    <div className={clsx('flex gap-1', className)}>
      {Array.from({ length: segments }, (_, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0.2, scaleY: 0.6 }}
          animate={{ opacity: i < filled ? 1 : 0.18, scaleY: 1 }}
          transition={{ delay: i * 0.025, duration: 0.25 }}
 className="h-3 flex-1 rounded-[2px]"
          style={{
            backgroundColor: i < filled ? color : 'rgba(148,163,184,0.25)',
            boxShadow: i < filled ? `0 0 8px -2px ${color}` : 'none',
          }}
        />
      ))}
    </div>
  );
}
