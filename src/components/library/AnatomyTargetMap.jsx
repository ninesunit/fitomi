import { useId } from 'react';
import { clsx } from '../../lib/clsx';

// Coordinates track the generated 1024 by 1536 atlas. Each region follows the
// visible superficial muscle belly instead of painting a generic body segment.
const REGIONS = {
  neck: ['M214 142 Q256 116 298 142 L306 258 Q258 280 210 258Z', 'M704 116 Q768 92 832 116 L842 274 Q768 300 694 274Z'],
  shoulders: [
    'M74 276 Q126 230 190 284 L171 402 Q104 420 58 365Z',
    'M330 284 Q395 230 454 278 L468 365 Q419 420 350 402Z',
    'M562 292 Q620 236 688 286 L669 406 Q601 422 548 366Z',
    'M844 286 Q915 236 974 294 L985 367 Q931 421 861 406Z',
  ],
  chest: ['M146 284 Q207 258 253 309 L248 478 Q181 496 129 435Z', 'M259 309 Q307 258 374 286 L388 436 Q330 496 263 478Z'],
  biceps: ['M67 389 Q118 359 149 417 L125 620 Q77 640 51 577Z', 'M371 417 Q407 359 454 389 L470 577 Q441 640 394 620Z'],
  triceps: ['M560 405 Q610 372 649 426 L628 644 Q576 652 548 589Z', 'M875 426 Q917 372 968 405 L980 589 Q949 652 901 644Z'],
  forearms: [
    'M46 588 Q93 559 126 621 L103 813 Q61 850 30 795Z',
    'M396 621 Q435 559 473 588 L498 795 Q467 850 425 813Z',
    'M546 608 Q588 577 629 642 L609 826 Q570 854 535 801Z',
    'M900 642 Q944 577 982 608 L1015 801 Q976 854 939 826Z',
  ],
  abs: ['M200 452 Q256 426 313 452 L324 776 Q257 811 188 776Z'],
  obliques: ['M143 447 Q185 463 205 518 L189 786 Q148 751 125 619Z', 'M372 447 Q329 463 310 518 L324 786 Q367 751 389 619Z'],
  back: ['M670 308 Q767 268 865 308 L852 657 Q768 730 684 657Z'],
  traps: ['M686 220 Q768 170 848 220 L855 386 Q768 421 678 386Z'],
  lats: ['M629 378 Q698 389 719 467 L684 731 Q628 709 596 568Z', 'M907 378 Q839 389 817 467 L852 731 Q910 709 941 568Z'],
  lowerBack: ['M681 635 Q768 687 854 635 L860 819 Q768 855 674 819Z'],
  hipFlexors: ['M168 762 Q221 745 257 805 L231 906 Q181 894 151 839Z', 'M346 762 Q293 745 258 805 L285 906 Q333 894 365 839Z'],
  adductors: ['M220 822 Q252 814 270 878 L263 1090 Q223 1083 204 978Z', 'M294 822 Q262 814 247 878 L256 1090 Q294 1083 311 978Z'],
  abductors: ['M638 773 Q686 739 728 792 L713 946 Q660 956 625 890Z', 'M900 773 Q852 739 810 792 L825 946 Q878 956 913 890Z'],
  quads: ['M126 820 Q190 777 239 840 L230 1114 Q158 1141 119 1038Z', 'M388 820 Q326 777 278 840 L288 1114 Q360 1141 399 1038Z'],
  glutes: ['M646 760 Q710 720 766 790 L760 946 Q696 978 636 919Z', 'M890 760 Q826 720 770 790 L777 946 Q841 978 901 919Z'],
  hamstrings: ['M632 918 Q697 885 748 949 L733 1180 Q664 1194 622 1098Z', 'M904 918 Q839 885 788 949 L803 1180 Q872 1194 914 1098Z'],
  calves: [
    'M117 1092 Q169 1056 215 1123 L204 1420 Q148 1452 109 1363Z',
    'M399 1092 Q347 1056 301 1123 L312 1420 Q368 1452 407 1363Z',
    'M622 1124 Q677 1080 728 1147 L714 1430 Q655 1450 613 1362Z',
    'M914 1124 Q859 1080 808 1147 L822 1430 Q881 1450 923 1362Z',
  ],
};

function toneFor(id, primary, secondary) {
  if (primary.has(id)) return 'primary';
  if (secondary.has(id)) return 'secondary';
  return null;
}

export function AnatomyTargetMap({ primary = [], secondary = [], className, showLegend = false, animated = true }) {
  const uid = useId().replace(/:/g, '');
  const primarySet = new Set(primary);
  const secondarySet = new Set(secondary.filter((id) => !primarySet.has(id)));
  const cardio = primarySet.has('cardio') || secondarySet.has('cardio');

  return (
    <figure className={clsx('relative h-full w-full overflow-hidden bg-[#020713]', className)} aria-label="Detailed front and rear muscle anatomy map">
      <img
        src="/art/anatomy/anatomy-atlas-v2.webp"
        alt=""
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-contain"
      />
      <svg viewBox="0 0 1024 1536" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <filter id={`${uid}-primary`} x="-45%" y="-45%" width="190%" height="190%">
            <feGaussianBlur stdDeviation="13" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id={`${uid}-secondary`} x="-35%" y="-35%" width="170%" height="170%">
            <feGaussianBlur stdDeviation="9" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <linearGradient id={`${uid}-scan`} x1="0" y1="0" x2="1" y2="0">
            <stop stopColor="transparent" />
            <stop offset=".5" stopColor="rgb(var(--sys) / .7)" />
            <stop offset="1" stopColor="transparent" />
          </linearGradient>
          <style>{`
            @media (prefers-reduced-motion: no-preference) {
              .${uid}-primary { animation: ${uid}-pulse 1.8s ease-in-out infinite; }
              .${uid}-scan { animation: ${uid}-scan 3.4s linear infinite; }
            }
            @keyframes ${uid}-pulse { 0%,100% { opacity:.52 } 50% { opacity:.88 } }
            @keyframes ${uid}-scan { from { transform:translateY(-90px) } to { transform:translateY(1620px) } }
          `}</style>
        </defs>

        {cardio && <rect width="1024" height="1536" fill="rgb(var(--sys) / .08)" />}
        {Object.entries(REGIONS).flatMap(([id, paths]) => {
          const tone = toneFor(id, primarySet, secondarySet);
          if (!tone) return [];
          const primaryTone = tone === 'primary';
          return paths.map((d, index) => (
            <path
              key={`${id}-${index}`}
              d={d}
              className={primaryTone && animated ? `${uid}-primary` : undefined}
              fill={primaryTone ? 'rgb(var(--sys) / .56)' : 'rgb(var(--sys-2) / .42)'}
              stroke={primaryTone ? 'rgb(var(--sys))' : 'rgb(var(--sys-2))'}
              strokeWidth={primaryTone ? 5 : 3}
              filter={animated ? `url(#${uid}-${tone})` : undefined}
            />
          ));
        })}
        {animated ? <rect className={`${uid}-scan`} x="0" y="-90" width="1024" height="5" fill={`url(#${uid}-scan)`} opacity=".7" /> : null}
      </svg>

      <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,transparent_49.85%,rgb(var(--sys)/0.18)_50%,transparent_50.15%)]" aria-hidden />
      {showLegend && (
        <figcaption className="absolute inset-x-1 bottom-1 flex justify-center gap-2 font-mono text-[7px] uppercase tracking-wider text-[rgb(var(--sys-dim))]">
          <span className="bg-[#020713]/85 px-1"><i className="mr-1 inline-block h-1.5 w-1.5 bg-[rgb(var(--sys))]" />Primary</span>
          <span className="bg-[#020713]/85 px-1"><i className="mr-1 inline-block h-1.5 w-1.5 bg-[rgb(var(--sys-2))]" />Assist</span>
        </figcaption>
      )}
    </figure>
  );
}

export default AnatomyTargetMap;
