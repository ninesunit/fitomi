import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import { motion } from 'framer-motion';

// ---------------------------------------------------------------------------
// Native-feeling navigation.
//
// Two things a web app has to do by hand that a native one gets for free:
//
//   1. Scroll position. Tapping from a library scrolled halfway down into the
//      profile should land at the top of the profile — and pressing back
//      should return to exactly where the library was left.
//   2. A transition. Screens that swap instantly read as a page reload; a
//      short fade-and-rise reads as a screen change.
//
// Exit animations are deliberately not used: the routes are lazy-loaded, so
// holding the outgoing tree mounted while the incoming chunk downloads is what
// actually produces jank. Fading the new screen in is enough.
// ---------------------------------------------------------------------------

/** Remembered scroll offsets, keyed by history entry. Lives for the session. */
const positions = new Map();

/** `/library/bench-press` and `/library` are the same screen. */
const screenOf = (pathname) => pathname.split('/')[1] || '';

export function RouteTransition({ children }) {
  const location = useLocation();
  const navigationType = useNavigationType();

  // The live scroll offset, sampled from the scroll event rather than read at
  // teardown: by the time an effect cleanup runs the DOM already belongs to the
  // incoming screen, and the browser may have clamped scrollY to its height.
  const offset = useRef(0);
  const key = useRef(location.key);
  const screen = useRef(screenOf(location.pathname));

  useEffect(() => {
    const onScroll = () => { offset.current = window.scrollY; };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    positions.set(key.current, offset.current);
    const cameFrom = screen.current;
    key.current = location.key;
    screen.current = screenOf(location.pathname);

    if (navigationType === 'POP') {
      const saved = positions.get(location.key);
      if (saved != null) {
        // The incoming screen has to be laid out before it can be scrolled.
        requestAnimationFrame(() => window.scrollTo(0, saved));
        return;
      }
    }
    // Opening a detail route over the screen you are already on (a library
    // entry, say) must not yank the page behind the sheet to the top.
    if (screen.current !== cameFrom) window.scrollTo(0, 0);
  }, [location.key, location.pathname, navigationType]);

  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

export default RouteTransition;
