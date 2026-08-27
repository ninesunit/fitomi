import { motion } from 'framer-motion';

/** Step counter and bar. Kept compact so it never crowds a small screen. */
export function Progress({ step, total }) {
  const pct = ((step + 1) / total) * 100;
  return (
    <div className="px-1">
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="sys-label">Assessment</span>
        <span className="sys-label tnum">
          {String(step + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </span>
      </div>
      <div className="sys-meter h-[3px]">
        <motion.div
          className="sys-meter-fill"
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}

export default Progress;
