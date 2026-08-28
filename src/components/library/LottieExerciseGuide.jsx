import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import { clsx } from '../../lib/clsx';

const SUPPORTED = new Set([
  'squat', 'hinge', 'lunge', 'press', 'overhead', 'pulldown', 'pullup', 'row',
  'curl', 'extension', 'fly', 'raise', 'calf', 'crunch', 'plank', 'rotate',
  'carry', 'run', 'jump', 'clean', 'snatch', 'slam',
]);

const PATTERN_FALLBACK = {
  horizontalPush: 'press',
  verticalPush: 'overhead',
  horizontalPull: 'row',
  verticalPull: 'pullup',
  isolation: 'curl',
  conditioning: 'run',
  mobility: 'hinge',
  rotation: 'rotate',
  squat: 'squat',
  hinge: 'hinge',
  lunge: 'lunge',
  carry: 'carry',
};

export function exerciseAnimationUrl(exercise) {
  const key = SUPPORTED.has(exercise?.anim)
    ? exercise.anim
    : PATTERN_FALLBACK[exercise?.pattern] || 'squat';
  return `/lottie/exercises/${key}.json`;
}

function LoadingFigure({ label }) {
  return (
    <div className="flex h-full w-full items-center justify-center" role="status" aria-label={`Loading ${label}`}>
      <motion.span
        animate={{ opacity: [0.35, 1, 0.35], scale: [0.94, 1, 0.94] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        className="flex h-10 w-10 items-center justify-center border border-[rgb(var(--sys)/0.35)] text-[rgb(var(--sys))]"
      >
        <Activity size={18} />
      </motion.span>
    </div>
  );
}

export function LottieExerciseGuide({
  animationUrl,
  name = 'Exercise',
  primaryMuscles = [],
  secondaryMuscles = [],
  instructions = [],
  className,
  compact = false,
}) {
  const hostRef = useRef(null);
  const playerRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [animationData, setAnimationData] = useState(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [failed, setFailed] = useState(false);

  const reducedMotion = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    if (!('IntersectionObserver' in window)) {
      setVisible(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '160px' },
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || !animationUrl) return undefined;
    const controller = new AbortController();
    setAnimationData(null);
    setPlayerReady(false);
    setFailed(false);
    fetch(animationUrl, { signal: controller.signal, cache: 'force-cache' })
      .then((response) => {
        if (!response.ok) throw new Error(`Animation request failed: ${response.status}`);
        return response.json();
      })
      .then(setAnimationData)
      .catch((error) => {
        if (error.name !== 'AbortError') setFailed(true);
      });
    return () => controller.abort();
  }, [visible, animationUrl]);

  useEffect(() => {
    if (!animationData || !playerRef.current) return undefined;
    let disposed = false;
    let instance = null;
    import('lottie-web/build/player/lottie_light')
      .then(({ default: lottie }) => {
        if (disposed || !playerRef.current) return;
        instance = lottie.loadAnimation({
          container: playerRef.current,
          renderer: 'svg',
          loop: !reducedMotion,
          autoplay: !reducedMotion,
          animationData,
          rendererSettings: { preserveAspectRatio: 'xMidYMid meet', progressiveLoad: true },
        });
        setPlayerReady(true);
      })
      .catch(() => setFailed(true));
    return () => {
      disposed = true;
      instance?.destroy();
    };
  }, [animationData, reducedMotion]);

  const description = [
    primaryMuscles.length ? `Primary: ${primaryMuscles.join(', ')}` : '',
    secondaryMuscles.length ? `Secondary: ${secondaryMuscles.join(', ')}` : '',
    instructions.length ? `${instructions.length} form steps` : '',
  ].filter(Boolean).join('. ');

  return (
    <figure
      ref={hostRef}
      className={clsx('exercise-lottie relative h-full w-full overflow-hidden', className)}
      aria-label={`${name} movement guide. ${description}`}
    >
      <div className="exercise-lottie-grid absolute inset-0" aria-hidden />
      <div className="absolute inset-x-[12%] bottom-[7%] h-px bg-[rgb(var(--sys)/0.35)] shadow-[0_0_12px_rgb(var(--sys))]" aria-hidden />

      <div className="relative h-full w-full">
        {!playerReady && !failed && <LoadingFigure label={name} />}
        {failed && (
          <div className="flex h-full items-center justify-center text-[rgb(var(--sys-dim))]">
            <Activity size={compact ? 18 : 26} />
          </div>
        )}
        {animationData && (
          <div
            ref={playerRef}
            className="absolute inset-0 h-full w-full [filter:drop-shadow(0_0_8px_rgb(var(--sys)/0.55))]"
            aria-hidden
          />
        )}
      </div>

      {!compact && (
        <figcaption className="pointer-events-none absolute inset-x-2 bottom-2 flex flex-wrap justify-center gap-1">
          {primaryMuscles.slice(0, 3).map((muscle) => (
            <span key={muscle} className="border border-[rgb(var(--sys)/0.42)] bg-[#030918]/85 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider text-[rgb(var(--sys))]">
              {muscle}
            </span>
          ))}
          {secondaryMuscles.slice(0, 2).map((muscle) => (
            <span key={muscle} className="border border-violet-400/30 bg-[#030918]/85 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider text-violet-300">
              {muscle}
            </span>
          ))}
        </figcaption>
      )}
    </figure>
  );
}

export default LottieExerciseGuide;
