import { useState } from 'react';
import { Check, Trash2 } from 'lucide-react';
import { clsx } from '../../lib/clsx';
import { RPE_DESCRIPTIONS, estimate1RM } from '../../engine/oneRepMax';
import { fromKg, toKg } from '../../engine/constants';

const SET_TYPES = {
  warmup: { label: 'W', color: 'rgb(var(--sys-gold))', title: 'Warm-up set (quarter XP)' },
  working: { label: null, color: 'rgb(var(--sys-dim))', title: 'Working set' },
  drop: { label: 'D', color: 'rgb(var(--sys-2))', title: 'Drop set' },
  failure: { label: 'F', color: 'rgb(var(--sys-danger))', title: 'Taken to failure' },
};
const TYPE_CYCLE = ['working', 'warmup', 'drop', 'failure'];

/**
 * One logged set.
 *
 * Sized for a thumb between sets: 44px controls, 16px inputs so iOS never
 * zooms the viewport on focus, and the complete button on the right where the
 * hand already is.
 */
export function SetRow({ set, index, exercise, unit, previous, showRpe, onChange, onComplete, onRemove }) {
  const [rpeOpen, setRpeOpen] = useState(false);
  const type = SET_TYPES[set.type] || SET_TYPES.working;

  const isTimed = exercise?.tracking === 'duration';
  const isDistance = exercise?.tracking === 'distance';

  const e1rm =
    !isTimed && !isDistance && Number(set.weight) > 0 && Number(set.reps) > 0
      ? estimate1RM(toKg(Number(set.weight), unit), Number(set.reps), set.rpe)
      : 0;

  const cycleType = () =>
    onChange({ type: TYPE_CYCLE[(TYPE_CYCLE.indexOf(set.type) + 1) % TYPE_CYCLE.length] });

  return (
    <div
      className="px-2 py-2 transition-colors"
      style={{
        border: set.completed ? '1px solid rgb(var(--sys-good)/0.4)' : '1px solid rgb(var(--sys)/0.16)',
        background: set.completed ? 'rgb(var(--sys-good)/0.09)' : 'rgb(var(--sys-deep-2)/0.45)',
      }}
    >
      <div className="flex items-center gap-1.5">
        <button
          onClick={cycleType}
          title={type.title}
          className="flex h-11 w-9 shrink-0 items-center justify-center font-mono text-xs font-bold"
          style={{ border: '1px solid rgb(var(--sys)/0.2)', color: type.color }}
        >
          {type.label || index + 1}
        </button>

        <span className="hidden w-14 shrink-0 truncate text-center font-mono text-[10px] text-[rgb(var(--sys-dim))] xs:block">
          {previous || '—'}
        </span>

        {isTimed ? (
          <NumField value={set.duration} onChange={(v) => onChange({ duration: v })} placeholder="sec" label="Time" />
        ) : isDistance ? (
          <NumField value={set.distance} onChange={(v) => onChange({ distance: v })} placeholder="m" label="Distance" />
        ) : (
          <>
            <NumField value={set.weight} onChange={(v) => onChange({ weight: v })} placeholder={unit} label="Weight" step="0.5" />
            <NumField value={set.reps} onChange={(v) => onChange({ reps: v })} placeholder="reps" label="Reps" />
          </>
        )}

        {showRpe && !isDistance && (
          <button
            onClick={() => setRpeOpen((v) => !v)}
            className="h-11 w-11 shrink-0 font-mono text-xs font-bold transition-colors"
            style={{
              border: set.rpe ? '1px solid rgb(var(--sys))' : '1px solid rgb(var(--sys)/0.2)',
              background: set.rpe ? 'rgb(var(--sys)/0.2)' : 'transparent',
              color: set.rpe ? 'rgb(var(--sys-ink))' : 'rgb(var(--sys-dim))',
            }}
            title="Rate of perceived exertion"
          >
            {set.rpe || 'RPE'}
          </button>
        )}

        <button
          onClick={onComplete}
          aria-label={set.completed ? 'Mark set incomplete' : 'Complete set'}
          className="flex h-11 w-11 shrink-0 items-center justify-center transition-all active:scale-90"
          style={{
            border: set.completed ? '1px solid rgb(var(--sys-good))' : '1px solid rgb(var(--sys)/0.3)',
            background: set.completed ? 'rgb(var(--sys-good)/0.25)' : 'transparent',
            color: set.completed ? 'rgb(var(--sys-good))' : 'rgb(var(--sys-dim))',
          }}
        >
          <Check size={17} strokeWidth={3} />
        </button>

        <button
          onClick={onRemove}
          aria-label="Remove set"
          className="hidden h-11 w-8 shrink-0 items-center justify-center text-[rgb(var(--sys-dim))] sm:flex"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {e1rm > 0 && (
        <div className="mt-1 pl-11 font-mono text-[10px] text-[rgb(var(--sys-dim))] opacity-70">
          e1RM ≈ {fromKg(e1rm, unit).toFixed(1)} {unit}
        </div>
      )}

      {rpeOpen && (
        <div className="mt-2 p-2" style={{ border: '1px solid rgb(var(--sys)/0.25)' }}>
          <div className="mb-2 grid grid-cols-5 gap-1">
            {[6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10].map((value) => (
              <button
                key={value}
                onClick={() => {
                  onChange({ rpe: set.rpe === value ? null : value });
                  setRpeOpen(false);
                }}
                className="py-2.5 font-mono text-xs font-bold transition-colors"
                style={{
                  border: set.rpe === value ? '1px solid rgb(var(--sys))' : '1px solid rgb(var(--sys)/0.2)',
                  background: set.rpe === value ? 'rgb(var(--sys)/0.25)' : 'transparent',
                  color: set.rpe === value ? 'rgb(var(--sys-ink))' : 'rgb(var(--sys-dim))',
                }}
              >
                {value}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-[rgb(var(--sys-dim))]">
            {RPE_DESCRIPTIONS[set.rpe] || 'How many reps were left in the tank?'}
          </p>
        </div>
      )}
    </div>
  );
}

function NumField({ value, onChange, placeholder, label, step }) {
  return (
    <input
      type="number"
      inputMode="decimal"
      step={step}
      aria-label={label}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-11 min-w-0 flex-1 px-1 text-center font-mono text-base text-[rgb(var(--sys-ink))]"
      style={{
        border: '1px solid rgb(var(--sys)/0.22)',
        background: 'rgb(var(--sys-deep-2)/0.85)',
      }}
    />
  );
}

export default SetRow;
