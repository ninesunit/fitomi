import { motion } from 'framer-motion';
import { Minus, Plus, X } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import { formatClock } from '../../lib/date';
import { getExercise } from '../../data/exercises';

// ---------------------------------------------------------------------------
// The rest timer.
//
// Pinned above the tab bar so it is visible from any screen, and built around
// a draining ring rather than a line of text: this is the one surface a hunter
// looks at from two metres away with a bar in their hands, so the remaining
// time has to be readable at a glance and the shape has to say "nearly there"
// before the digits are read at all.
// ---------------------------------------------------------------------------

const RING = 26;
const CIRCUMFERENCE = 2 * Math.PI * RING;

export function RestTimerBar() {
  const { rest, restRemaining, adjustRest, skipRest } = useWorkout();
  if (!rest) return null;

  const elapsed = rest.total > 0 ? 1 - restRemaining / rest.total : 1;
  const done = restRemaining === 0;
  const exercise = rest.exerciseId ? getExercise(rest.exerciseId) : null;
  const tint = done ? 'var(--sys-good)' : restRemaining <= 10 ? 'var(--sys-gold)' : 'var(--sys)';

  return (
    <motion.div
      initial={{ y: 70, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 70, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 34 }}
      className="fixed inset-x-0 bottom-[62px] z-40 px-3 lg:bottom-4 lg:left-auto lg:right-4 lg:w-96 lg:px-0"
    >
      <div
        className="sys-window relative overflow-hidden px-3 py-2.5"
        style={{
          borderColor: `rgb(${tint} / 0.55)`,
          boxShadow: `0 0 34px -10px rgb(${tint} / 0.9)`,
        }}
      >
        <div className="relative flex items-center gap-3">
          {/* The ring drains anticlockwise from full. */}
          <div className="relative h-[62px] w-[62px] shrink-0">
            <svg viewBox="0 0 62 62" className="h-full w-full -rotate-90">
              <circle cx="31" cy="31" r={RING} fill="none" stroke={`rgb(${tint} / 0.16)`} strokeWidth="5" />
              <motion.circle
                cx="31"
                cy="31"
                r={RING}
                fill="none"
                stroke={`rgb(${tint})`}
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                animate={{ strokeDashoffset: CIRCUMFERENCE * elapsed }}
                transition={{ ease: 'linear', duration: 0.3 }}
                style={{ filter: `drop-shadow(0 0 6px rgb(${tint} / 0.9))` }}
              />
            </svg>
            {done && (
              <motion.span
                className="absolute inset-0 rounded-full"
                style={{ border: `2px solid rgb(${tint})` }}
                animate={{ scale: [1, 1.25], opacity: [0.7, 0] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
              />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div
              className="tnum font-display text-[30px] font-bold leading-none"
              style={{ color: `rgb(${tint})`, textShadow: `0 0 16px rgb(${tint} / 0.55)` }}
            >
              {done ? 'GO' : formatClock(restRemaining)}
            </div>
            <div className="sys-label mt-1 truncate normal-case tracking-normal">
              {done ? 'Rest complete' : exercise?.name || 'Resting'}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <TimerButton onClick={() => adjustRest(-15)} label="Subtract 15 seconds">
              <Minus size={16} />
            </TimerButton>
            <TimerButton onClick={() => adjustRest(15)} label="Add 15 seconds">
              <Plus size={16} />
            </TimerButton>
            <TimerButton onClick={skipRest} label="Skip rest" strong>
              <X size={16} />
            </TimerButton>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/** 44px square, which is Apple's minimum and about the size of a thumb. */
function TimerButton({ onClick, label, children, strong }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="flex h-11 w-11 items-center justify-center text-[rgb(var(--sys-ink))] transition active:scale-90"
      style={{
        border: `1px solid rgb(var(--sys) / ${strong ? 0.5 : 0.28})`,
        background: strong ? 'rgb(var(--sys) / 0.14)' : 'transparent',
        clipPath: 'polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px)',
      }}
    >
      {children}
    </button>
  );
}

export default RestTimerBar;
