import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Share, X } from 'lucide-react';
import {
  dismissInstallPrompt, installPromptDismissed, isIos, isSafari, isStandalone,
} from '../lib/pwa';
import { SystemButton } from './system/SystemButton';

/**
 * Add-to-home-screen nudge.
 *
 * On Android/desktop the browser fires `beforeinstallprompt` and we can install
 * with one tap. On iOS no such event exists, so the only honest thing is to
 * show the exact gesture: Share, then Add to Home Screen.
 */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isStandalone() || installPromptDismissed()) return undefined;

    const onPrompt = (e) => {
      e.preventDefault();
      setDeferred(e);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);

    // iOS never fires it, so surface the manual instructions on a delay —
    // long enough that it does not interrupt the first thing they came to do.
    let timer;
    if (isIos() && isSafari()) timer = setTimeout(() => setShow(true), 12000);

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      clearTimeout(timer);
    };
  }, []);

  const close = () => {
    setShow(false);
    dismissInstallPrompt();
  };

  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    close();
  };

  const ios = isIos();

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 90, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom,0px)+76px)] z-[65] lg:inset-x-auto lg:right-4 lg:w-96"
        >
          <div className="sys-window sys-brackets p-4">
            <button
              onClick={close}
              aria-label="Dismiss"
              className="absolute right-2 top-2 p-1.5 text-[rgb(var(--sys-dim))]"
            >
              <X size={15} />
            </button>

            <div className="flex items-start gap-3">
              <img src="/icon-192.png" alt="" className="h-11 w-11 shrink-0" />
              <div className="min-w-0 flex-1">
                <h3 className="sys-title text-xs">Install Fitomi</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-[rgb(var(--sys-dim))]">
                  {ios ? (
                    <>
                      Tap <Share size={11} className="inline align-[-1px]" /> then{' '}
                      <span className="text-[rgb(var(--sys-ink))]">Add to Home Screen</span> to run
                      Fitomi full screen, with the rest timer and your session available offline.
                    </>
                  ) : (
                    'Run Fitomi full screen with offline access to your sessions and rest timer.'
                  )}
                </p>

                {!ios && deferred && (
                  <SystemButton variant="primary" size="sm" icon={Plus} className="mt-3" onClick={install}>
                    Install
                  </SystemButton>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default InstallPrompt;
