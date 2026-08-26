import { motion } from 'framer-motion';
import { clsx } from '../../lib/clsx';

/**
 * A System window. The corner notch, hairline border and interior glow are the
 * app's single most repeated visual motif, so they live in one place.
 */
export function Panel({ children, className, accent = false, notch = false, as = 'div', ...rest }) {
  const Component = as;
  return (
    <Component
      className={clsx('panel', accent && 'panel-accent', notch && 'clip-notch', className)}
      {...rest}
    >
      {children}
    </Component>
  );
}

export function MotionPanel({ children, className, accent, notch, delay = 0, ...rest }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34, delay, ease: [0.22, 1, 0.36, 1] }}
      className={clsx('panel', accent && 'panel-accent', notch && 'clip-notch', className)}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** Section header with the small monospace label the System uses everywhere. */
export function PanelHeader({ label, title, action, icon: Icon, className }) {
  return (
    <div className={clsx('flex items-start justify-between gap-3', className)}>
      <div className="min-w-0">
        {label && <div className="hud-label mb-1">{label}</div>}
        {title && (
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold tracking-wide text-slate-100">
            {Icon && <Icon size={18} className="accent-text shrink-0" />}
            <span className="truncate">{title}</span>
          </h2>
        )}
      </div>
      {action}
    </div>
  );
}

export default Panel;
