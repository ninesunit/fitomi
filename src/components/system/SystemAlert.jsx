import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { play } from '../../lib/sound';
import { SystemButton } from './SystemButton';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

/**
 * Text that types itself in, the way System messages arrive.
 * Skips to the end on tap so a reader is never held hostage by the animation.
 */
export function SystemType({ text, speed = 22, className, onDone }) {
  const [shown, setShown] = useState('');

  // Held in a ref rather than listed as a dependency. Callers pass an inline
  // arrow, so its identity changes on every render — as a dependency it would
  // restart the effect each time the parent re-rendered and the text would
  // type itself forever, never settling.
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    setShown('');
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(id);
        doneRef.current?.();
      }
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);

  return (
    <span className={className} onClick={() => setShown(text)}>
      {shown}
      {shown.length < text.length && <span className="sys-pulse ml-0.5 inline-block">▌</span>}
    </span>
  );
}

/**
 * The [!] notification — the System's own alert chrome, with the exclamation
 * badge above the window and the message typed out beneath it.
 */
export function SystemAlert({
  open,
  onClose,
  title = 'Notification',
  message,
  children,
  tone = 'default',
  confirmLabel = 'Confirm',
  cancelLabel,
  onConfirm,
  onCancel,
  dismissible = true,
}) {
  const closeRef = useRef(onClose);
  const confirmRef = useRef(onConfirm);
  closeRef.current = onClose;
  confirmRef.current = onConfirm;
  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return undefined;
    play(tone === 'danger' ? 'error' : 'notify');
    const onKey = (e) => {
      if (e.key === 'Escape' && dismissible) closeRef.current?.();
      if (e.key === 'Enter') confirmRef.current?.();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, [open, dismissible, tone]);

  const toneVar =
    tone === 'danger'
      ? { '--sys': 'var(--sys-danger)' }
      : tone === 'good'
        ? { '--sys': 'var(--sys-good)' }
        : tone === 'gold'
          ? { '--sys': 'var(--sys-gold)' }
          : undefined;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          style={toneVar}
        >
          <motion.div
            className="absolute inset-0 bg-[#01060f]/90 backdrop-blur-md"
            onClick={dismissible ? onClose : undefined}
          />

          <div className="relative w-full max-w-sm">
            {/* The exclamation badge that precedes every System alert. */}
            <motion.div
              initial={{ opacity: 0, y: 14, scale: 0.6 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.06, type: 'spring', stiffness: 380, damping: 20 }}
              className="mx-auto mb-3 flex h-12 w-12 items-center justify-center"
              style={{
                border: '1px solid rgb(var(--sys) / 0.9)',
                background: 'rgb(var(--sys) / 0.12)',
                boxShadow: '0 0 26px -6px rgb(var(--sys)), inset 0 0 20px -10px rgb(var(--sys))',
                clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
              }}
            >
              <span className="sys-title sys-glow text-2xl leading-none">!</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scaleY: 0.03, filter: 'brightness(2.4)' }}
              animate={{ opacity: 1, scaleY: 1, filter: 'brightness(1)' }}
              exit={{ opacity: 0, scaleY: 0.03 }}
              transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
              className="sys-window sys-brackets"
            >
              <span className="sys-scan" aria-hidden />

              <header className="relative px-4 pt-4">
                <h2 className="sys-title text-center text-sm">{title}</h2>
                <div className="sys-rule mt-2.5" />
              </header>

              <div className="relative px-5 py-5">
                {message && (
                  <p className="text-center text-[15px] leading-relaxed text-[rgb(var(--sys-ink))]">
                    <SystemType text={message} />
                  </p>
                )}
                {children}
              </div>

              {(onConfirm || cancelLabel) && (
                <>
                  <div className="sys-rule" />
                  <div className="relative flex gap-2 p-3">
                    {cancelLabel && (
                      <SystemButton className="flex-1" onClick={onCancel || onClose}>
                        {cancelLabel}
                      </SystemButton>
                    )}
                    {onConfirm && (
                      <SystemButton variant="primary" className="flex-1" onClick={onConfirm}>
                        {confirmLabel}
                      </SystemButton>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default SystemAlert;
