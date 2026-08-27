import { Check } from 'lucide-react';
import { clsx } from '../../lib/clsx';

// ---------------------------------------------------------------------------
// Questionnaire controls, built for a thumb: every target is at least 48px,
// nothing relies on hover, and inputs are 16px so iOS never zooms the viewport
// when one takes focus.
// ---------------------------------------------------------------------------

export function OptionList({ options, value, onChange, multi = false, columns = 1 }) {
  const selected = multi ? new Set(value || []) : null;

  const toggle = (id) => {
    if (!multi) return onChange(id);
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return onChange([...next]);
  };

  return (
    <div className={clsx('grid gap-2', columns === 2 && 'grid-cols-2')}>
      {options.map((option) => {
        const on = multi ? selected.has(option.id) : value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            data-selected={on}
            onClick={() => toggle(option.id)}
            className="sys-option flex items-center gap-3"
          >
            <span
              className={clsx(
                'flex h-5 w-5 shrink-0 items-center justify-center border transition-colors',
                on ? 'border-[rgb(var(--sys))] bg-[rgb(var(--sys)/0.25)]' : 'border-[rgb(var(--sys)/0.35)]',
              )}
            >
              {on && <Check size={13} strokeWidth={3} className="sys-accent" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold leading-tight text-[rgb(var(--sys-ink))]">
                {option.label}
              </span>
              {option.detail && (
                <span className="mt-0.5 block text-xs leading-snug text-[rgb(var(--sys-dim))]">
                  {option.detail}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** A large stepper for counts, sized so it can be driven one-handed. */
export function Stepper({ value, onChange, min = 1, max = 7, suffix, label }) {
  const n = Number(value) || min;
  return (
    <div className="sys-panel flex items-center justify-between gap-3 p-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, n - 1))}
        className="sys-btn h-12 w-12 !min-h-0 !p-0 text-xl"
        aria-label={`Decrease ${label}`}
      >
        −
      </button>
      <div className="text-center">
        <div className="sys-value sys-accent sys-glow text-4xl leading-none">{n}</div>
        {suffix && <div className="sys-label mt-1">{suffix}</div>}
      </div>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, n + 1))}
        className="sys-btn h-12 w-12 !min-h-0 !p-0 text-xl"
        aria-label={`Increase ${label}`}
      >
        +
      </button>
    </div>
  );
}

export function FieldRow({ label, children, hint }) {
  return (
    <label className="block">
      <span className="sys-label mb-1.5 block">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-[rgb(var(--sys-dim))]">{hint}</span>}
    </label>
  );
}

/** Two mutually exclusive pills — used for the unit switch. */
export function Toggle2({ options, value, onChange }) {
  return (
    <div className="flex border border-[rgb(var(--sys)/0.3)]">
      {options.map((option) => {
        const on = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={clsx(
              'flex-1 px-3 py-2.5 font-mono text-xs uppercase tracking-widest transition-colors',
              on ? 'bg-[rgb(var(--sys)/0.22)] text-[rgb(var(--sys-ink))]' : 'text-[rgb(var(--sys-dim))]',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
