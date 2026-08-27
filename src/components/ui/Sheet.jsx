import { useEffect } from 'react';
import { AnimatePresence, motion, useDragControls } from 'framer-motion';
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

  // Drag-to-dismiss, driven only from the handle and header. Making the whole
  // sheet draggable fights the content's own scrolling — the gesture that
  // should scroll a long exercise list would instead drag the sheet shut.
  const dragControls = useDragControls();

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
          <div className="absolute inset-0 bg-[#01060f]/88 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.55 }}
            onDragEnd={(_, info) => {
              // Either a decisive flick or a long pull dismisses, which is how
              // a native sheet behaves — you should not have to drag it all
              // the way off the screen.
              if (info.offset.y > 110 || info.velocity.y > 550) onClose?.();
            }}
 className={clsx(
              'sys-window relative flex max-h-[92dvh] w-full flex-col overflow-hidden',
              widths[size],
 className,
            )}
          >
            {/* Grab handle. Also the drag surface, alongside the header. */}
            <div
              onPointerDown={(e) => dragControls.start(e)}
              className="flex touch-none justify-center pb-1 pt-2.5 sm:hidden"
              aria-hidden
            >
              <span className="h-1 w-10 rounded-full" style={{ background: 'rgb(var(--sys)/0.4)' }} />
            </div>

            {(title || onClose) && (
              <header
                onPointerDown={(e) => dragControls.start(e)}
 className="flex touch-none items-start justify-between gap-4 px-5 pb-4 pt-3 sm:pt-4"
                style={{ borderBottom: '1px solid rgb(var(--sys)/0.25)' }}
              >
                <div className="min-w-0">
                  {subtitle && <div className="sys-label mb-1">{subtitle}</div>}
                  {title && <h2 className="sys-title truncate text-sm">{title}</h2>}
                </div>
                <button
                  onClick={onClose}
                  // The header is a drag surface; without this the gesture
                  // starts under the finger and swallows the tap.
                  onPointerDown={(e) => e.stopPropagation()}
                  aria-label="Close"
 className="-mr-1 p-2 text-[rgb(var(--sys-dim))]"
                >
                  <X size={18} />
                </button>
              </header>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">{children}</div>

            {footer && (
              <footer
 className="px-5 py-3.5 safe-bottom"
                style={{ borderTop: '1px solid rgb(var(--sys)/0.25)' }}
              >
                {footer}
              </footer>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default Sheet;
