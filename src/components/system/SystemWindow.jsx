import { motion } from 'framer-motion';
import { clsx } from '../../lib/clsx';

// ---------------------------------------------------------------------------
// The System window.
//
// Every surface in the app is one of these. It opens the way a System window
// opens — unfolding from a horizontal line of light — and carries the header
// bar, the inner rule and the corner brackets that make it read as the System
// rather than as a card with a blue border.
// ---------------------------------------------------------------------------

export function SystemWindow({
  children,
  title,
  subtitle,
  className,
  bodyClassName,
  brackets = true,
  scan = false,
  animate = true,
  delay = 0,
  tone = 'default',
  style,
  ...rest
}) {
  const Component = animate ? motion.div : 'div';

  // Retoning a window only rewrites --sys; every rule, glow and fill inside it
  // derives from that one variable, so the whole surface shifts together.
  const toneVars =
    tone === 'danger'
      ? { '--sys': 'var(--sys-danger)' }
      : tone === 'good'
        ? { '--sys': 'var(--sys-good)' }
        : tone === 'gold'
          ? { '--sys': 'var(--sys-gold)' }
          : undefined;

  const motionProps = animate
    ? {
        initial: { opacity: 0, scaleY: 0.04, filter: 'brightness(2.2)' },
        animate: { opacity: 1, scaleY: 1, filter: 'brightness(1)' },
        transition: { duration: 0.36, delay, ease: [0.16, 1, 0.3, 1] },
      }
    : {};

  return (
    <Component
      className={clsx('sys-window', brackets && 'sys-brackets', className)}
      style={{ ...toneVars, ...style }}
      {...motionProps}
      {...rest}
    >
      {scan && <span className="sys-scan" aria-hidden />}

      {(title || subtitle) && (
        <header className="relative px-4 pt-3.5">
          {subtitle && <div className="sys-label mb-1 text-center">{subtitle}</div>}
          {title && <h2 className="sys-title text-center text-sm sm:text-base">{title}</h2>}
          <div className="sys-rule mt-2.5" />
        </header>
      )}

      <div className={clsx('relative', bodyClassName ?? 'p-4')}>{children}</div>
    </Component>
  );
}

/** A quieter nested surface — used for rows and cells inside a window. */
export function SystemPanel({ children, className, accent = false, ...rest }) {
  return (
    <div className={clsx('sys-panel', accent && 'sys-panel-accent', className)} {...rest}>
      {children}
    </div>
  );
}

export function SystemRule({ className }) {
  return <div className={clsx('sys-rule', className)} />;
}

/** A labelled readout — the System states a value, it does not decorate it. */
export function SystemStat({ label, value, accent = false, className, sub }) {
  return (
    <div className={clsx('sys-panel px-3 py-2', className)}>
      <div className="sys-label mb-0.5 truncate">{label}</div>
      <div className={clsx('sys-value truncate text-base leading-tight', accent && 'sys-accent sys-glow')}>
        {value}
      </div>
      {sub && <div className="sys-label mt-0.5 truncate normal-case tracking-normal">{sub}</div>}
    </div>
  );
}

export default SystemWindow;
