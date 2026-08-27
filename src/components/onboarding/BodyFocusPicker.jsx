import { useId, useState } from 'react';
import { Check, Wind } from 'lucide-react';
import { HEAD, FRONT, BACK } from '../../data/bodyRegions';
import { play } from '../../lib/sound';
import { clsx } from '../../lib/clsx';

// ---------------------------------------------------------------------------
// Focus areas, picked off a body instead of a checkbox list.
//
// "Which parts do you want to prioritise" is a question about anatomy, so it
// is asked anatomically: tap the chest to train the chest. The regions are the
// same polygons the fatigue map uses, so the two screens agree about where a
// lat is.
// ---------------------------------------------------------------------------

/** Which drawn regions belong to each focus area the assessment understands. */
const REGION_TO_FOCUS = {
  chest: 'chest',
  shoulders: 'shoulders',
  biceps: 'arms', triceps: 'arms', forearms: 'arms',
  abs: 'core', obliques: 'core',
  quads: 'legs', hamstrings: 'legs', calves: 'legs', adductors: 'legs', abductors: 'legs',
  glutes: 'glutes',
  back: 'back', lats: 'back', traps: 'back', lowerBack: 'back',
};

const FOCUS_LABEL = {
  chest: 'Chest', back: 'Back', shoulders: 'Shoulders', arms: 'Arms',
  legs: 'Legs', glutes: 'Glutes', core: 'Core / Abs', cardio: 'Conditioning',
};

export function BodyFocusPicker({ value = [], onChange }) {
  const uid = useId().replace(/:/g, '');
  const [view, setView] = useState('front');
  const selected = new Set(value);
  const regions = view === 'front' ? FRONT : BACK;

  const toggle = (focus) => {
    if (!focus) return;
    play('select');
    const next = new Set(selected);
    if (next.has(focus)) next.delete(focus);
    else next.add(focus);
    onChange([...next]);
  };

  const fillFor = (regionId) => {
    const focus = REGION_TO_FOCUS[regionId];
    return selected.has(focus) ? 'rgb(var(--sys) / 0.7)' : 'rgb(var(--sys) / 0.14)';
  };

  return (
    <div>
      {/* The step's own prompt already says to tap; a second instruction here
          would just be more words on a screen meant to have fewer. */}
      <div className="mb-2 flex items-center justify-end">
        <div className="inline-flex border border-[rgb(var(--sys)/0.25)] p-0.5">
          {['front', 'back'].map((side) => (
            <button
              key={side}
              type="button"
              onClick={() => { play('tap'); setView(side); }}
              className={clsx(
                'px-3 py-1 text-[12px] font-semibold capitalize transition',
                view === side ? 'text-[#04070f]' : 'text-[rgb(var(--sys-dim))]',
              )}
              style={view === side ? { background: 'rgb(var(--sys))' } : undefined}
            >
              {side}
            </button>
          ))}
        </div>
      </div>

      <svg viewBox="0 0 100 192" className="mx-auto h-[240px] w-auto">
        <defs>
          <filter id={`${uid}-b`} x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="2.2" />
          </filter>
        </defs>
        <ellipse cx="50" cy="94" rx="52" ry="92" fill="rgb(var(--sys) / 0.05)" />
        <ellipse cx="50" cy="180" rx="26" ry="3.5" fill="rgb(var(--sys) / 0.18)" />

        {/* Selected regions bloom, so the choice is legible at a glance. */}
        <g filter={`url(#${uid}-b)`} opacity="0.8">
          {regions
            .filter((r) => selected.has(REGION_TO_FOCUS[r.id]))
            .map((r) => <path key={`g-${r.id}`} d={r.d} fill="rgb(var(--sys) / 0.6)" />)}
        </g>

        <circle cx={HEAD.cx} cy={HEAD.cy} r={HEAD.r} fill="rgb(var(--sys) / 0.12)" stroke="rgb(var(--sys) / 0.35)" strokeWidth="0.8" />

        {regions.map((region) => {
          const focus = REGION_TO_FOCUS[region.id];
          return (
            <path
              key={`${view}-${region.id}`}
              d={region.d}
              fill={fillFor(region.id)}
              stroke={selected.has(focus) ? 'rgb(var(--sys))' : 'rgb(var(--sys) / 0.3)'}
              strokeWidth={selected.has(focus) ? 1.1 : 0.6}
              strokeLinejoin="round"
              className="cursor-pointer transition-all"
              role="checkbox"
              aria-checked={selected.has(focus)}
              aria-label={FOCUS_LABEL[focus] || region.id}
              onClick={() => toggle(focus)}
            />
          );
        })}
      </svg>

      {/* Conditioning has no place on the body, so it stays a control — and
          doubles as the confirmation of everything currently chosen. */}
      <button
        type="button"
        onClick={() => toggle('cardio')}
        className={clsx(
          'mt-2 flex w-full items-center gap-2.5 border px-3 py-2.5 text-left transition-colors',
          selected.has('cardio')
            ? 'border-[rgb(var(--sys))] bg-[rgb(var(--sys)/0.16)]'
            : 'border-[rgb(var(--sys)/0.25)]',
        )}
      >
        <span
          className={clsx(
            'flex h-5 w-5 shrink-0 items-center justify-center border',
            selected.has('cardio') ? 'border-[rgb(var(--sys))] bg-[rgb(var(--sys)/0.25)]' : 'border-[rgb(var(--sys)/0.35)]',
          )}
        >
          {selected.has('cardio') && <Check size={13} strokeWidth={3} className="sys-accent" />}
        </span>
        <Wind size={15} className="shrink-0 text-[rgb(var(--sys-dim))]" />
        <span className="text-[15px] font-semibold text-[rgb(var(--sys-ink))]">Conditioning</span>
      </button>

      <div className="mt-2 min-h-[24px] text-center">
        {selected.size ? (
          <span className="sys-label normal-case tracking-normal">
            {[...selected].map((f) => FOCUS_LABEL[f]).join(' · ')}
          </span>
        ) : (
          <span className="sys-label normal-case tracking-normal">Nothing selected — pick at least one.</span>
        )}
      </div>
    </div>
  );
}

export default BodyFocusPicker;
