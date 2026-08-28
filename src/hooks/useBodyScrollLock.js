import { useEffect } from 'react';

// A modal can open another modal. Each surface therefore owns one lock and the
// document is released only after the final owner closes. Saving overflow in
// every component independently lets nested cleanup restore a stale "hidden"
// value, which leaves the application untouchable after both surfaces close.
let lockOwners = 0;
let savedOverflow = '';
let savedPaddingRight = '';

function acquireBodyScrollLock() {
  if (typeof document === 'undefined') return () => {};

  if (lockOwners === 0) {
    savedOverflow = document.body.style.overflow;
    savedPaddingRight = document.body.style.paddingRight;

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
    document.body.style.overflow = 'hidden';
  }

  lockOwners += 1;
  let released = false;

  return () => {
    if (released) return;
    released = true;
    lockOwners = Math.max(0, lockOwners - 1);

    if (lockOwners === 0) {
      document.body.style.overflow = savedOverflow;
      document.body.style.paddingRight = savedPaddingRight;
    }
  };
}

export function useBodyScrollLock(locked) {
  useEffect(() => {
    if (!locked) return undefined;
    return acquireBodyScrollLock();
  }, [locked]);
}

export default useBodyScrollLock;
