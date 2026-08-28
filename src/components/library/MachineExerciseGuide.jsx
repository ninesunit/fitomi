import { LottieExerciseGuide, exerciseAnimationUrl } from './LottieExerciseGuide';
import { AnatomyTargetMap } from './AnatomyTargetMap';
import { MUSCLES } from '../../engine/constants';
import { clsx } from '../../lib/clsx';

export function MachineExerciseGuide({ exercise, compact = false, className }) {
  if (!exercise) return null;
  const primaryNames = exercise.primary.map((id) => MUSCLES[id]?.name || id);
  const secondaryNames = exercise.secondary.map((id) => MUSCLES[id]?.name || id);

  return (
    <div
      className={clsx(
        'exercise-machine-guide relative grid h-full w-full overflow-hidden bg-[#030816]',
        compact ? 'grid-cols-[minmax(0,1fr)_38%]' : 'grid-cols-[minmax(0,1.35fr)_minmax(94px,0.65fr)]',
        className,
      )}
    >
      <div className="relative min-w-0 border-r border-[rgb(var(--sys)/0.18)]">
        <LottieExerciseGuide
          animationUrl={exerciseAnimationUrl(exercise)}
          name={exercise.name}
          primaryMuscles={primaryNames}
          secondaryMuscles={secondaryNames}
          instructions={exercise.steps}
          compact
        />
        {!compact && (
          <span className="absolute left-2 top-2 border border-[rgb(var(--sys)/0.35)] bg-[#020713]/85 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.18em] text-[rgb(var(--sys))]">
            Motion path
          </span>
        )}
      </div>
      <div className="relative min-w-0 bg-[radial-gradient(circle_at_50%_45%,rgb(var(--sys)/0.08),transparent_70%)] p-0.5">
        <AnatomyTargetMap primary={exercise.primary} secondary={exercise.secondary} showLegend={!compact} />
        {!compact && (
          <span className="absolute right-2 top-2 font-mono text-[7px] uppercase tracking-[0.15em] text-[rgb(var(--sys-dim))]">
            Muscle scan
          </span>
        )}
      </div>
      <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgb(var(--sys))] to-transparent opacity-65" />
    </div>
  );
}

export default MachineExerciseGuide;
