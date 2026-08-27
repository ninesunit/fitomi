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
          <Icon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--sys-dim))]" />
        )}
        <input
          ref={ref}
 className={clsx(
            'field',
            Icon && 'pl-9',
            error && 'border-[rgb(var(--sys-danger)/0.45)]',
 className,
          )}
          style={{ outlineColor: 'rgb(var(--sys))' }}
          {...rest}
        />
      </span>
      {error ? (
        <span className="mt-1.5 block text-xs text-[rgb(var(--sys-danger))]">{error}</span>
      ) : (
        hint && <span className="mt-1.5 block text-xs text-[rgb(var(--sys-dim))]">{hint}</span>
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
      {hint && <span className="mt-1.5 block text-xs text-[rgb(var(--sys-dim))]">{hint}</span>}
    </label>
  );
}

/** Segmented control — used for units, filters and difficulty pickers. */
export function Segmented({ options, value, onChange, className, size = 'md' }) {
  const pad = size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs';
  return (
    <div className={clsx('inline-flex  border border-[rgb(var(--sys)/0.25)] bg-[rgb(var(--sys-deep-2)/0.6)] p-0.5', className)}>
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
              active ? 'text-void-950' : 'text-[rgb(var(--sys-dim))] hover:text-[rgb(var(--sys-ink))]',
            )}
            style={active ? { backgroundColor: 'rgb(var(--sys))' } : undefined}
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
        <span className="block text-sm font-medium text-[rgb(var(--sys-ink))]">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-[rgb(var(--sys-dim))]">{hint}</span>}
      </span>
      <span
 className={clsx(
          'relative h-6 w-11 shrink-0  border transition-colors',
          checked ? 'border-transparent' : 'border-[rgb(var(--sys)/0.25)] bg-void-700',
        )}
        style={checked ? { backgroundColor: 'rgb(var(--sys))' } : undefined}
      >
        <span
 className={clsx(
            'absolute top-0.5 h-5 w-5  bg-white shadow transition-transform',
            checked ? 'translate-x-[22px]' : 'translate-x-0.5',
          )}
        />
      </span>
    </button>
  );
}
