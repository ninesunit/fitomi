import { LottieExerciseGuide, exerciseAnimationUrl } from './LottieExerciseGuide';
import { AnatomyTargetMap } from './AnatomyTargetMap';
import { MUSCLES } from '../../engine/constants';
import { clsx } from '../../lib/clsx';

export function MachineExerciseGuide({ exercise, compact = false, className }) {
  if (!exercise) return null;
  const primaryNames = exercise.primary.map((id) => MUSCLES[id]?.name || id);
  const secondaryNames = exercise.secondary.map((id) => MUSCLES[id]?.name || id);

  if (compact) {
    return (
      <div className={clsx('relative h-full w-full overflow-hidden bg-[#020713]', className)}>
        <AnatomyTargetMap primary={exercise.primary} secondary={exercise.secondary} animated={false} />
        <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgb(var(--sys))] to-transparent opacity-65" />
      </div>
    );
  }

  return (
    <div
      className={clsx(
        'exercise-machine-guide relative grid h-full w-full overflow-hidden bg-[#030816]',
        'grid-cols-[minmax(0,1.1fr)_minmax(120px,0.9fr)]',
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
          compact={false}
        />
        <span className="absolute left-2 top-2 border border-[rgb(var(--sys)/0.35)] bg-[#020713]/85 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.18em] text-[rgb(var(--sys))]">
          Motion path
        </span>
      </div>
      <div className="relative min-w-0 bg-[radial-gradient(circle_at_50%_45%,rgb(var(--sys)/0.08),transparent_70%)] p-0.5">
        <AnatomyTargetMap primary={exercise.primary} secondary={exercise.secondary} showLegend />
        <span className="absolute right-2 top-2 bg-[#020713]/70 px-1 font-mono text-[7px] uppercase tracking-[0.15em] text-[rgb(var(--sys-dim))]">
          Muscle scan
        </span>
      </div>
      <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgb(var(--sys))] to-transparent opacity-65" />
    </div>
  );
}

export default MachineExerciseGuide;
