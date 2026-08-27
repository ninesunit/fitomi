import { motion } from 'framer-motion';
import { Minus, Plus, X } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import { formatClock } from '../../lib/date';
import { getExercise } from '../../data/exercises';

/** The rest timer. Pinned above the tab bar so it is visible from any screen. */
export function RestTimerBar() {
  const { rest, restRemaining, adjustRest, skipRest } = useWorkout();
  if (!rest) return null;

  const progress = rest.total > 0 ? 1 - restRemaining / rest.total : 1;
  const done = restRemaining === 0;
  const exercise = rest.exerciseId ? getExercise(rest.exerciseId) : null;

  return (
    <motion.div
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 60, opacity: 0 }}
 className="fixed inset-x-0 bottom-[62px] z-40 px-3 lg:bottom-4 lg:left-auto lg:right-4 lg:w-80 lg:px-0"
    >
      <div
 className="panel relative overflow-hidden px-4 py-3"
        style={{
          borderColor: done ? 'rgba(74,222,128,0.5)' : 'rgb(var(--sys) / 0.4)',
          boxShadow: done ? '0 0 30px -10px rgba(74,222,128,0.8)' : '0 0 30px -12px rgb(var(--sys))',
        }}
      >
        {/* The fill sweeps left to right as the rest elapses. */}
        <motion.span
 className="absolute inset-y-0 left-0"
          style={{ backgroundColor: done ? 'rgba(74,222,128,0.14)' : 'rgb(var(--sys) / 0.12)' }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ ease: 'linear', duration: 0.25 }}
        />

        <div className="relative flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="hud-label truncate">
              {done ? 'Rest complete — go' : `Resting${exercise ? ` · ${exercise.name}` : ''}`}
            </div>
            <div
 className="tnum font-display text-2xl font-bold leading-tight"
              style={{ color: done ? '#4ade80' : 'rgb(var(--sys))' }}
            >
              {formatClock(restRemaining)}
            </div>
          </div>

          <button
            onClick={() => adjustRest(-15)}
 className="rounded-lg border border-[rgb(var(--sys)/0.25)] p-2 text-[rgb(var(--sys-ink))] transition hover:bg-[rgb(var(--sys)/0.12)]"
            aria-label="Subtract 15 seconds"
          >
            <Minus size={15} />
          </button>
          <button
            onClick={() => adjustRest(15)}
 className="rounded-lg border border-[rgb(var(--sys)/0.25)] p-2 text-[rgb(var(--sys-ink))] transition hover:bg-[rgb(var(--sys)/0.12)]"
            aria-label="Add 15 seconds"
          >
            <Plus size={15} />
          </button>
          <button
            onClick={skipRest}
 className="rounded-lg border border-[rgb(var(--sys)/0.25)] p-2 text-[rgb(var(--sys-ink))] transition hover:bg-[rgb(var(--sys)/0.12)]"
            aria-label="Skip rest"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default RestTimerBar;
