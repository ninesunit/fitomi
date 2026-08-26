import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const SystemContext = createContext(null);

// ---------------------------------------------------------------------------
// The System's notification queue.
//
// Progression events (level-ups, PRs, shadow extractions, boss kills) arrive as
// a burst when a workout is committed. They are queued and shown one at a time
// as full-screen System windows, because six overlapping modals is not a reward.
// Lighter feedback goes out as toasts.
// ---------------------------------------------------------------------------

export function SystemProvider({ children }) {
  const [queue, setQueue] = useState([]);
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const nextId = useCallback(() => {
    idRef.current += 1;
    return idRef.current;
  }, []);

  const announce = useCallback(
    (events) => {
      const list = Array.isArray(events) ? events : [events];
      // Order matters dramatically for how the sequence feels: records first,
      // then the level-up payoff, then the rarest reward last.
      const weight = { pr: 0, raidDamage: 1, streak: 2, levelUp: 3, bossDefeated: 4, shadowExtracted: 5 };
      const modal = list
        .filter((e) => e.type in weight)
        .sort((a, b) => (weight[a.type] ?? 9) - (weight[b.type] ?? 9))
        .map((e) => ({ ...e, key: nextId() }));

      if (modal.length) setQueue((q) => [...q, ...modal]);
    },
    [nextId],
  );

  const dismiss = useCallback(() => setQueue((q) => q.slice(1)), []);

  const toast = useCallback(
    (message, options = {}) => {
      const id = nextId();
      const entry = { id, message, tone: options.tone || 'info', icon: options.icon || null };
      setToasts((t) => [...t, entry]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), options.duration || 3200);
      return id;
    },
    [nextId],
  );

  const dismissToast = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const value = useMemo(
    () => ({ queue, current: queue[0] || null, announce, dismiss, toasts, toast, dismissToast }),
    [queue, announce, dismiss, toasts, toast, dismissToast],
  );

  return <SystemContext.Provider value={value}>{children}</SystemContext.Provider>;
}

export function useSystem() {
  const ctx = useContext(SystemContext);
  if (!ctx) throw new Error('useSystem must be used inside a SystemProvider');
  return ctx;
}
