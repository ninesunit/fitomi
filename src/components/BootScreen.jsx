import { motion } from 'framer-motion';

/** Full-screen boot state. Deliberately fast and quiet — it should barely register. */
export function BootScreen({ message = 'Initialising' }) {
  return (
    <div className="grid-bg flex min-h-screen flex-col items-center justify-center gap-6 bg-void-950">
      <motion.svg
        viewBox="0 0 64 64"
 className="h-16 w-16"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <defs>
          <linearGradient id="boot-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#5fd3ff" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        <motion.path
          d="M32 7 55 19v14c0 12-9.6 20.6-23 25C18.6 53.6 9 45 9 33V19L32 7Z"
          fill="none"
          stroke="url(#boot-g)"
          strokeWidth="2.4"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.1, ease: 'easeInOut' }}
        />
        <path d="M22 21h20l-2.6 6H27.2l-1 4.6h11l-2.5 6h-9.8L23 46h-6.4L22 21Z" fill="url(#boot-g)" />
      </motion.svg>

      <div className="text-center">
        <div className="font-display text-2xl font-bold tracking-[0.3em] text-[rgb(var(--sys-ink))]">FITOMI</div>
        <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.25em] text-[rgb(var(--sys))]">
          {message}
          <span className="animate-pulse">…</span>
        </div>
      </div>
    </div>
  );
}

export default BootScreen;
