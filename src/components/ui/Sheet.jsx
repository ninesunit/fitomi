import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { clsx } from '../../lib/clsx';

/**
 * Modal surface. Renders as a bottom sheet on phones and a centred dialog on
 * larger screens, because a centred modal on a phone during a workout means
 * reaching for the top of the screen with one hand full of barbell.
 */
export function Sheet({ open, onClose, title, subtitle, children, footer, size = 'md', className }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  const widths = { sm: 'sm:max-w-md', md: 'sm:max-w-xl', lg: 'sm:max-w-3xl', xl: 'sm:max-w-5xl' };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <div className="absolute inset-0 bg-void-950/80 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            className={clsx(
              'panel panel-accent relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl',
              widths[size],
              className,
            )}
          >
            {(title || onClose) && (
              <header className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
                <div className="min-w-0">
                  {subtitle && <div className="hud-label mb-1">{subtitle}</div>}
                  {title && (
                    <h2 className="truncate font-display text-lg font-semibold tracking-wide text-slate-100">
                      {title}
                    </h2>
                  )}
                </div>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="-mr-1 rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-slate-100"
                >
                  <X size={18} />
                </button>
              </header>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">{children}</div>

            {footer && <footer className="border-t border-white/10 px-5 py-3.5 safe-bottom">{footer}</footer>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default Sheet;
