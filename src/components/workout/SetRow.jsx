import { useState } from 'react';
import { Check, Trash2 } from 'lucide-react';
import { clsx } from '../../lib/clsx';
import { RPE_DESCRIPTIONS, estimate1RM } from '../../engine/oneRepMax';
import { fromKg, toKg } from '../../engine/constants';

const SET_TYPES = {
  warmup: { label: 'W', color: '#fbbf24', title: 'Warm-up set (quarter XP)' },
  working: { label: null, color: '#94a3b8', title: 'Working set' },
  drop: { label: 'D', color: '#a78bfa', title: 'Drop set' },
  failure: { label: 'F', color: '#ef4444', title: 'Taken to failure' },
};

const TYPE_CYCLE = ['working', 'warmup', 'drop', 'failure'];

/**
 * One logged set. Inputs stay uncontrolled-feeling (string state) so a hunter
 * can clear a field and retype without the value fighting them.
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

  const cycleType = () => {
    const next = TYPE_CYCLE[(TYPE_CYCLE.indexOf(set.type) + 1) % TYPE_CYCLE.length];
    onChange({ type: next });
  };

  return (
    <div
      className={clsx(
        'group relative rounded-lg border px-2 py-2 transition-colors',
        set.completed ? 'border-mana-500/30 bg-mana-500/[0.08]' : 'border-white/[0.06] bg-void-950/40',
      )}
    >
      <div className="flex items-center gap-2">
        <button
          onClick={cycleType}
          title={type.title}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/10 font-mono text-[11px] font-bold transition hover:bg-white/10"
          style={{ color: type.color }}
        >
          {type.label || index + 1}
        </button>

        {previous ? (
          <span className="hidden w-16 shrink-0 truncate text-center font-mono text-[10px] text-slate-600 sm:block">
            {previous}
          </span>
        ) : (
          <span className="hidden w-16 shrink-0 text-center font-mono text-[10px] text-slate-700 sm:block">—</span>
        )}

        {isTimed ? (
          <NumField
            value={set.duration}
            onChange={(v) => onChange({ duration: v })}
            placeholder="sec"
            label="Time"
          />
        ) : isDistance ? (
          <NumField
            value={set.distance}
            onChange={(v) => onChange({ distance: v })}
            placeholder="m"
            label="Distance"
          />
        ) : (
          <>
            <NumField
              value={set.weight}
              onChange={(v) => onChange({ weight: v })}
              placeholder={unit}
              label="Weight"
              step="0.5"
            />
            <NumField
              value={set.reps}
              onChange={(v) => onChange({ reps: v })}
              placeholder="reps"
              label="Reps"
            />
          </>
        )}

        {showRpe && !isDistance && (
          <button
            onClick={() => setRpeOpen((v) => !v)}
            className={clsx(
              'h-9 w-11 shrink-0 rounded-md border font-mono text-xs font-bold transition',
              set.rpe
                ? 'border-transparent text-void-950'
                : 'border-white/10 text-slate-600 hover:bg-white/5',
            )}
            style={set.rpe ? { backgroundColor: 'rgb(var(--accent))' } : undefined}
            title="Rate of perceived exertion"
          >
            {set.rpe || 'RPE'}
          </button>
        )}

        <button
          onClick={onComplete}
          aria-label={set.completed ? 'Mark set incomplete' : 'Complete set'}
          className={clsx(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-md border transition-all active:scale-90',
            set.completed
              ? 'border-mana-500/50 bg-mana-500/25 text-mana-300'
              : 'border-white/15 text-slate-600 hover:border-white/30 hover:text-slate-200',
          )}
        >
          <Check size={16} strokeWidth={3} />
        </button>

        <button
          onClick={onRemove}
          aria-label="Remove set"
          className="hidden h-9 w-8 shrink-0 items-center justify-center rounded-md text-slate-700 transition hover:text-blood-400 group-hover:flex"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {e1rm > 0 && (
        <div className="mt-1 pl-9 font-mono text-[10px] text-slate-600">
          e1RM ≈ {fromKg(e1rm, unit).toFixed(1)} {unit}
        </div>
      )}

      {rpeOpen && (
        <div className="mt-2 rounded-lg border border-white/10 bg-void-900 p-2">
          <div className="mb-2 grid grid-cols-5 gap-1">
            {[6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10].map((value) => (
              <button
                key={value}
                onClick={() => {
                  onChange({ rpe: set.rpe === value ? null : value });
                  setRpeOpen(false);
                }}
                className={clsx(
                  'rounded-md border py-1.5 font-mono text-xs font-bold transition',
                  set.rpe === value
                    ? 'border-transparent text-void-950'
                    : 'border-white/10 text-slate-400 hover:bg-white/10',
                )}
                style={set.rpe === value ? { backgroundColor: 'rgb(var(--accent))' } : undefined}
              >
                {value}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-500">
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
      className="h-9 min-w-0 flex-1 rounded-md border border-white/10 bg-void-950/70 px-2 text-center font-mono text-sm text-slate-100 placeholder:text-slate-700 focus:border-transparent"
      style={{ outlineColor: 'rgb(var(--accent))' }}
    />
  );
}

export default SetRow;
