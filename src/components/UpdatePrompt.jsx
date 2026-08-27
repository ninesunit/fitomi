import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Download } from 'lucide-react';
import { applyUpdate, onUpdateReady } from '../lib/pwa';
import { SystemButton } from './system/SystemButton';

/**
 * Offers a downloaded update rather than applying it silently.
 *
 * Swapping the asset set underneath someone mid-set would be worse than a
 * stale build, so the new worker waits until this is accepted.
 */
export function UpdatePrompt() {
  const [ready, setReady] = useState(false);

  useEffect(() => onUpdateReady(() => setReady(true)), []);

  return (
    <AnimatePresence>
      {ready && (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          className="fixed inset-x-3 z-[70] mt-safe lg:inset-x-auto lg:right-4 lg:w-96"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)' }}
        >
          <div className="sys-window sys-brackets p-3.5">
            <div className="flex items-center gap-3">
              <Download size={17} className="sys-accent shrink-0" />
              <div className="min-w-0 flex-1">
                <h3 className="sys-title text-[11px]">Update ready</h3>
                <p className="mt-0.5 text-xs text-[rgb(var(--sys-dim))]">
                  A newer build of the System has downloaded.
                </p>
              </div>
              <SystemButton size="sm" variant="primary" onClick={applyUpdate}>
                Reload
              </SystemButton>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default UpdatePrompt;
