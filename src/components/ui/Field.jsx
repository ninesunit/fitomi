import { forwardRef } from 'react';
import { clsx } from '../../lib/clsx';

export const TextField = forwardRef(function TextField(
  { label, hint, error, icon: Icon, className, containerClassName, ...rest },
  ref,
) {
  return (
    <label className={clsx('block', containerClassName)}>
      {label && <span className="hud-label mb-1.5 block">{label}</span>}
      <span className="relative block">
        {Icon && (
          <Icon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        )}
        <input
          ref={ref}
          className={clsx(
            'field',
            Icon && 'pl-9',
            error && 'border-blood-500/60',
            className,
          )}
          style={{ outlineColor: 'rgb(var(--accent))' }}
          {...rest}
        />
      </span>
      {error ? (
        <span className="mt-1.5 block text-xs text-blood-400">{error}</span>
      ) : (
        hint && <span className="mt-1.5 block text-xs text-slate-500">{hint}</span>
      )}
    </label>
  );
});

export function SelectField({ label, hint, children, className, containerClassName, ...rest }) {
  return (
    <label className={clsx('block', containerClassName)}>
      {label && <span className="hud-label mb-1.5 block">{label}</span>}
      <select className={clsx('field appearance-none pr-8', className)} {...rest}>
        {children}
      </select>
      {hint && <span className="mt-1.5 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

/** Segmented control — used for units, filters and difficulty pickers. */
export function Segmented({ options, value, onChange, className, size = 'md' }) {
  const pad = size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs';
  return (
    <div className={clsx('inline-flex rounded-lg border border-white/10 bg-void-950/60 p-0.5', className)}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={clsx(
              'rounded-md font-semibold transition-all',
              pad,
              active ? 'text-void-950' : 'text-slate-400 hover:text-slate-100',
            )}
            style={active ? { backgroundColor: 'rgb(var(--accent))' } : undefined}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function Toggle({ checked, onChange, label, hint }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 py-2 text-left"
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium text-slate-200">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-slate-500">{hint}</span>}
      </span>
      <span
        className={clsx(
          'relative h-6 w-11 shrink-0 rounded-full border transition-colors',
          checked ? 'border-transparent' : 'border-white/15 bg-void-700',
        )}
        style={checked ? { backgroundColor: 'rgb(var(--accent))' } : undefined}
      >
        <span
          className={clsx(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-[22px]' : 'translate-x-0.5',
          )}
        />
      </span>
    </button>
  );
}
