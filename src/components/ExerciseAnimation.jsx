import { useId, useMemo } from 'react';
import { clsx } from '../lib/clsx';

// ---------------------------------------------------------------------------
// Exercise form animations, drawn as an articulated SVG figure.
//
// The library needs to *show* movement, but video and GIF are exactly what a
// 360 MB/day hosting budget cannot afford — a single 2 MB demo clip viewed
// 180 times exhausts the day. So each movement is an animated stick rig:
// six joints, two poses, and CSS keyframes between them. The whole system is
// a few kilobytes and covers all 228 exercises.
//
// The rig is nested so rotations compose the way a skeleton does: rotating the
// thigh carries the shin and foot with it. Each animated group sits inside a
// static wrapper that positions the joint, so the CSS rotation is always about
// the group's own origin.
// ---------------------------------------------------------------------------

const SEG = { torso: 38, upperArm: 24, forearm: 22, thigh: 28, shin: 28 };

/** A pose is a rotation (degrees) per joint, plus a whole-body offset. */
const P = (rootY = 0, torso = 0, arm = 0, forearm = 0, thigh = 0, shin = 0, rootX = 0) => ({
  rootX, rootY, torso, arm, forearm, thigh, shin,
});

// Two poses per movement: the start and the finish. Angles are SVG-clockwise,
// with the figure facing right, and limbs drawn pointing down at 0 degrees.
const POSES = {
  squat:     [P(0, 6, 0, 0, 0, 0),          P(20, 28, 0, 0, -60, 100)],
  hinge:     [P(0, 4, 0, 0, 0, 0),          P(6, 68, -66, 0, -16, 12)],
  lunge:     [P(0, 6, 0, 0, 0, 0),          P(16, 12, 0, 0, -52, 88, 4)],
  press:     [P(0, 0, -55, 132, 0, 0),      P(0, 0, -84, 4, 0, 0)],
  overhead:  [P(0, 2, -50, 170, 0, 0),      P(0, -4, -170, 2, 0, 0)],
  pulldown:  [P(0, 6, -166, -6, 0, 0),      P(0, 14, -118, 66, 0, 0)],
  pullup:    [P(20, 2, -176, 2, 10, 14),    P(0, -6, -168, 58, 26, 30)],
  row:       [P(0, 62, -60, 2, -14, 10),    P(0, 62, -62, 108, -14, 10)],
  curl:      [P(0, 0, -6, 4, 0, 0),         P(0, 0, -10, 142, 0, 0)],
  extension: [P(0, 0, -150, 120, 0, 0),     P(0, 0, -156, 6, 0, 0)],
  fly:       [P(0, 0, -88, 8, 0, 0),        P(0, 0, -30, 6, 0, 0)],
  raise:     [P(0, 0, -4, 4, 0, 0),         P(0, 0, -86, 6, 0, 0)],
  calf:      [P(0, 0, 0, 0, 0, 0),          P(-12, 0, 0, 0, 0, 0)],
  crunch:    [P(0, 0, -120, 40, -84, 74),   P(0, 34, -128, 44, -88, 70)],
  plank:     [P(30, 88, -84, 84, -86, 6),   P(30, 88, -84, 84, -86, 6)],
  rotate:    [P(0, 4, -78, 6, 0, 0, -8),    P(0, 4, -78, 6, 0, 0, 8)],
  carry:     [P(0, 2, -2, 2, 0, 0),         P(-3, 2, -2, 2, -12, 16)],
  run:       [P(0, 10, -34, 62, -30, 44),   P(-6, 10, 30, 58, 26, 8)],
  jump:      [P(14, 20, 44, 20, -46, 82),   P(-18, -4, -150, 6, 12, 6)],
  clean:     [P(4, 58, -58, 4, -20, 18),    P(-6, -4, -46, 156, 0, 0)],
  snatch:    [P(4, 58, -58, 4, -20, 18),    P(-6, -2, -172, 2, -8, 10)],
  slam:      [P(0, -6, -172, 2, 0, 0),      P(6, 56, -46, 8, -14, 12)],
};

/** Movement patterns fall back to the closest rig animation. */
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

export function resolveAnim(exercise) {
  if (!exercise) return 'squat';
  return POSES[exercise.anim] ? exercise.anim : PATTERN_FALLBACK[exercise.pattern] || 'squat';
}

/**
 * Renders the rig plus a scoped stylesheet of keyframes.
 * The keyframes are generated per instance and namespaced by a unique id, so
 * several different exercises can animate on the same screen without collision.
 */
export function ExerciseAnimation({ exercise, anim, className, speed = 2.6, paused = false, showGround = true }) {
  const uid = useId().replace(/[:]/g, '');
  const key = anim || resolveAnim(exercise);
  const [a, b] = POSES[key] || POSES.squat;

  const css = useMemo(() => {
    const joints = ['root', 'torso', 'arm', 'forearm', 'thigh', 'shin'];
    const frames = joints
      .map((joint) => {
        const from = joint === 'root' ? `translate(${a.rootX}px, ${a.rootY}px)` : `rotate(${a[joint]}deg)`;
        const to = joint === 'root' ? `translate(${b.rootX}px, ${b.rootY}px)` : `rotate(${b[joint]}deg)`;
        return `@keyframes ${uid}-${joint}{0%,8%{transform:${from}}50%,58%{transform:${to}}100%{transform:${from}}}
.${uid} .j-${joint}{transform-box:view-box;transform-origin:0 0;animation:${uid}-${joint} ${speed}s cubic-bezier(.45,.05,.35,1) infinite;animation-play-state:${paused ? 'paused' : 'running'};}`;
      })
      .join('\n');
    return frames;
  }, [uid, a, b, speed, paused]);

  // The wrapper must carry a definite height: callers size the *parent* box
  // (a 56px tile, a 176px detail panel), and a percentage height on the SVG
  // resolves against `auto` unless every element between them fills its parent.
  // Without this the figure overflows its tile instead of scaling into it.
  return (
    <div className={clsx('relative h-full w-full', className)}>
      <style>{css}</style>
      <svg viewBox="0 0 140 150" className={clsx('h-full w-full', uid)} role="img" aria-label={`${exercise?.name || key} animation`}>
        <defs>
          {/*
            userSpaceOnUse is required, not stylistic: the default
            objectBoundingBox units cannot resolve against a shape whose
            bounding box is zero in one axis, and every limb here is a straight
            <line>. With the default units the limbs simply do not paint.
          */}
          <linearGradient
            id={`${uid}-limb`}
            gradientUnits="userSpaceOnUse"
            x1="20"
            y1="10"
            x2="120"
            y2="140"
          >
            <stop offset="0%" stopColor="rgb(var(--sys))" />
            <stop offset="100%" stopColor="rgb(var(--sys-2))" />
          </linearGradient>
        </defs>

        {showGround && (
          <>
            <line x1="18" y1="136" x2="122" y2="136" stroke="rgb(var(--sys))" strokeOpacity="0.28" strokeWidth="1.5" />
            <line x1="18" y1="136" x2="122" y2="136" stroke="rgb(var(--sys))" strokeOpacity="0.1" strokeWidth="7" />
          </>
        )}

        <g
          stroke={`url(#${uid}-limb)`}
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
          opacity="0.95"
        >
          {/* Static wrapper positions the hip; the animated root only translates. */}
          <g transform="translate(70,78)">
            <g className="j-root">
              {/* --- lower body ------------------------------------------- */}
              <g className="j-thigh">
                <line x1="0" y1="0" x2="0" y2={SEG.thigh} />
                <g transform={`translate(0,${SEG.thigh})`}>
                  <g className="j-shin">
                    <line x1="0" y1="0" x2="0" y2={SEG.shin} />
                    <g transform={`translate(0,${SEG.shin})`}>
                      <line x1="-3" y1="0" x2="13" y2="0" strokeWidth="4" />
                    </g>
                  </g>
                </g>
              </g>

              {/* --- upper body ------------------------------------------- */}
              <g className="j-torso">
                <line x1="0" y1="0" x2="0" y2={-SEG.torso} />
                <circle cx="0" cy={-SEG.torso - 12} r="9" fill="rgb(var(--sys))" fillOpacity="0.16" strokeWidth="4" />
                <g transform={`translate(0,${-SEG.torso + 3})`}>
                  <g className="j-arm">
                    <line x1="0" y1="0" x2="0" y2={SEG.upperArm} />
                    <g transform={`translate(0,${SEG.upperArm})`}>
                      <g className="j-forearm">
                        <line x1="0" y1="0" x2="0" y2={SEG.forearm} />
                        <circle cx="0" cy={SEG.forearm} r="3.5" fill="rgb(var(--sys))" strokeWidth="0" />
                      </g>
                    </g>
                  </g>
                </g>
              </g>
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
}

export default ExerciseAnimation;
