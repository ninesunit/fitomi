import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useGame } from './GameContext';
import { useSystem } from './SystemContext';
import { getExercise } from '../data/exercises';
import { estimate1RM } from '../engine/oneRepMax';
import { setVolumeKg } from '../engine/leveling';
import { summarizeExercise } from '../engine/records';

export const WorkoutContext = createContext(null);

const ACTIVE_KEY = 'fitomi:active-workout';

// ---------------------------------------------------------------------------
// The active workout session.
//
// This is the Spark-plan hot path: a hunter logging 25 sets would be 25 writes
// if each set hit Firestore. Instead the whole session lives in React state,
// mirrored to localStorage on every change (so a closed tab, a dead battery or
// an accidental refresh loses nothing), and is written to Firestore exactly
// once when they hit Finish.
// ---------------------------------------------------------------------------

const emptySet = (index, previous) => ({
  id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
  reps: previous?.reps ?? '',
  weight: previous?.weight ?? '',
  rpe: null,
  duration: previous?.duration ?? '',
  distance: previous?.distance ?? '',
  type: 'working',
  completed: false,
  completedAt: null,
});

export function WorkoutProvider({ children }) {
  const { profile, finishWorkout } = useGame();
  const { toast } = useSystem();

  const [session, setSession] = useState(null);
  const [elapsed, setElapsed] = useState(0);

  // Rest timer
  const [rest, setRest] = useState(null); // { total, endsAt, exerciseId }
  const [restRemaining, setRestRemaining] = useState(0);
  const alerted = useRef(false);

  // --- restore an interrupted session -------------------------------------
  useEffect(() => {
    try {
      const raw = localStorage.getItem(ACTIVE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Anything older than 12 hours is a forgotten session, not a live one.
        if (parsed?.startedAt && Date.now() - parsed.startedAt < 12 * 3600000) {
          setSession(parsed);
        } else {
          localStorage.removeItem(ACTIVE_KEY);
        }
      }
    } catch {
      localStorage.removeItem(ACTIVE_KEY);
    }
  }, []);

  // --- mirror every change locally ----------------------------------------
  useEffect(() => {
    if (session) {
      try {
        localStorage.setItem(ACTIVE_KEY, JSON.stringify(session));
      } catch {
        /* ignore quota errors */
      }
    } else {
      localStorage.removeItem(ACTIVE_KEY);
    }
  }, [session]);

  // --- session clock -------------------------------------------------------
  useEffect(() => {
    if (!session) {
      setElapsed(0);
      return undefined;
    }
    const tick = () => setElapsed(Math.floor((Date.now() - session.startedAt) / 1000));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [session]);

  // --- rest timer ----------------------------------------------------------
  useEffect(() => {
    if (!rest) {
      setRestRemaining(0);
      return undefined;
    }
    alerted.current = false;

    // Driven off wall-clock deadlines rather than a decrementing counter, so
    // backgrounding the tab (which throttles timers to once a minute) does not
    // desynchronise the countdown.
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((rest.endsAt - Date.now()) / 1000));
      setRestRemaining(remaining);
      if (remaining === 0 && !alerted.current) {
        alerted.current = true;
        notifyRestComplete();
      }
    };
    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [rest]);

  const notifyRestComplete = useCallback(() => {
    if (profile?.settings?.vibrationEnabled && navigator.vibrate) {
      navigator.vibrate([120, 60, 120]);
    }
    if (profile?.settings?.soundEnabled) playChime();
  }, [profile]);

  // --- session lifecycle ---------------------------------------------------
  const start = useCallback((options = {}) => {
    const next = {
      startedAt: Date.now(),
      name: options.name || defaultSessionName(),
      notes: '',
      entries: (options.entries || []).map((entry) => ({
        ...entry,
        sets: entry.sets?.length ? entry.sets : [emptySet(0)],
      })),
      routineId: options.routineId || null,
    };
    setSession(next);
    return next;
  }, []);

  const discard = useCallback(() => {
    setSession(null);
    setRest(null);
  }, []);

  const addExercise = useCallback(
    (exerciseId) => {
      const exercise = getExercise(exerciseId);
      if (!exercise) return;

      setSession((current) => {
        const base = current || {
          startedAt: Date.now(),
          name: defaultSessionName(),
          notes: '',
          entries: [],
          routineId: null,
        };
        if (base.entries.some((e) => e.exerciseId === exerciseId)) {
          return base;
        }

        // Pre-fill from the last time this exercise was performed so the
        // hunter is confirming numbers rather than typing them from scratch.
        const previous = lastPerformance(profile, exerciseId);
        const sets = previous?.sets?.length
          ? previous.sets.slice(0, 4).map((s, i) => emptySet(i, s))
          : [emptySet(0)];

        return { ...base, entries: [...base.entries, { exerciseId, sets, notes: '' }] };
      });
    },
    [profile],
  );

  const addExercises = useCallback((ids) => ids.forEach((id) => addExercise(id)), [addExercise]);

  const removeExercise = useCallback((exerciseId) => {
    setSession((current) =>
      current ? { ...current, entries: current.entries.filter((e) => e.exerciseId !== exerciseId) } : current,
    );
  }, []);

  const reorderExercise = useCallback((from, to) => {
    setSession((current) => {
      if (!current) return current;
      const entries = [...current.entries];
      const [moved] = entries.splice(from, 1);
      entries.splice(to, 0, moved);
      return { ...current, entries };
    });
  }, []);

  const addSet = useCallback((exerciseId) => {
    setSession((current) => {
      if (!current) return current;
      return {
        ...current,
        entries: current.entries.map((entry) => {
          if (entry.exerciseId !== exerciseId) return entry;
          const last = entry.sets[entry.sets.length - 1];
          return { ...entry, sets: [...entry.sets, emptySet(entry.sets.length, last)] };
        }),
      };
    });
  }, []);

  const removeSet = useCallback((exerciseId, setId) => {
    setSession((current) => {
      if (!current) return current;
      return {
        ...current,
        entries: current.entries.map((entry) =>
          entry.exerciseId === exerciseId
            ? { ...entry, sets: entry.sets.filter((s) => s.id !== setId) }
            : entry,
        ),
      };
    });
  }, []);

  const updateSet = useCallback((exerciseId, setId, patch) => {
    setSession((current) => {
      if (!current) return current;
      return {
        ...current,
        entries: current.entries.map((entry) =>
          entry.exerciseId === exerciseId
            ? { ...entry, sets: entry.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)) }
            : entry,
        ),
      };
    });
  }, []);

  /** Tick a set complete and, per settings, kick off the rest timer. */
  const completeSet = useCallback(
    (exerciseId, setId) => {
      const exercise = getExercise(exerciseId);
      let didComplete = false;

      setSession((current) => {
        if (!current) return current;
        return {
          ...current,
          entries: current.entries.map((entry) => {
            if (entry.exerciseId !== exerciseId) return entry;
            return {
              ...entry,
              sets: entry.sets.map((s) => {
                if (s.id !== setId) return s;
                didComplete = !s.completed;
                return { ...s, completed: !s.completed, completedAt: !s.completed ? Date.now() : null };
              }),
            };
          }),
        };
      });

      if (didComplete && profile?.settings?.autoStartRest) {
        // Compounds get the longer rest — that is what the two settings are for.
        const seconds =
          exercise?.mechanics === 'compound' && exercise?.tier !== 'c'
            ? profile.settings.restSecondsCompound
            : profile.settings.restSeconds;
        startRest(seconds, exerciseId);
      }
    },
    [profile],
  );

  const startRest = useCallback((seconds, exerciseId = null) => {
    const total = Math.max(5, Number(seconds) || 60);
    setRest({ total, endsAt: Date.now() + total * 1000, exerciseId });
  }, []);

  const adjustRest = useCallback((delta) => {
    setRest((current) => {
      if (!current) return current;
      const endsAt = Math.max(Date.now(), current.endsAt + delta * 1000);
      return { ...current, endsAt, total: Math.max(5, current.total + delta) };
    });
  }, []);

  const skipRest = useCallback(() => setRest(null), []);

  const setName = useCallback((name) => setSession((c) => (c ? { ...c, name } : c)), []);
  const setNotes = useCallback((notes) => setSession((c) => (c ? { ...c, notes } : c)), []);
  const setEntryNotes = useCallback((exerciseId, notes) => {
    setSession((c) =>
      c ? { ...c, entries: c.entries.map((e) => (e.exerciseId === exerciseId ? { ...e, notes } : e)) } : c,
    );
  }, []);

  /** Commit the session. Empty sets are dropped so they cannot skew the stats. */
  const finish = useCallback(async () => {
    if (!session) return null;

    const entries = session.entries
      .map((entry) => ({
        ...entry,
        sets: entry.sets.filter((s) => s.completed && (Number(s.reps) > 0 || Number(s.duration) > 0 || Number(s.distance) > 0)),
      }))
      .filter((entry) => entry.sets.length > 0);

    if (!entries.length) {
      toast('No completed sets to log.', { tone: 'warn' });
      return null;
    }

    const result = await finishWorkout({
      name: session.name,
      startedAt: session.startedAt,
      durationSec: Math.floor((Date.now() - session.startedAt) / 1000),
      notes: session.notes,
      entries,
    });

    setSession(null);
    setRest(null);
    return result;
  }, [session, finishWorkout, toast]);

  // --- live session stats --------------------------------------------------
  const stats = useMemo(() => {
    if (!session) return { volumeKg: 0, sets: 0, reps: 0, completedSets: 0, totalSets: 0 };

    let volumeKg = 0;
    let sets = 0;
    let reps = 0;
    let totalSets = 0;

    for (const entry of session.entries) {
      const exercise = getExercise(entry.exerciseId);
      for (const set of entry.sets) {
        totalSets += 1;
        if (!set.completed) continue;
        sets += 1;
        reps += Number(set.reps) || 0;
        volumeKg += setVolumeKg(set, exercise, profile);
      }
    }

    return { volumeKg, sets, reps, completedSets: sets, totalSets };
  }, [session, profile]);

  const value = useMemo(
    () => ({
      session,
      active: Boolean(session),
      elapsed,
      stats,
      rest,
      restRemaining,
      start,
      discard,
      finish,
      addExercise,
      addExercises,
      removeExercise,
      reorderExercise,
      addSet,
      removeSet,
      updateSet,
      completeSet,
      startRest,
      adjustRest,
      skipRest,
      setName,
      setNotes,
      setEntryNotes,
      lastPerformance: (id) => lastPerformance(profile, id),
      bestFor: (id) => profile?.records?.[id] || null,
    }),
    [
      session, elapsed, stats, rest, restRemaining, start, discard, finish,
      addExercise, addExercises, removeExercise, reorderExercise, addSet, removeSet,
      updateSet, completeSet, startRest, adjustRest, skipRest, setName, setNotes, setEntryNotes, profile,
    ],
  );

  return <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>;
}

export function useWorkout() {
  const ctx = useContext(WorkoutContext);
  if (!ctx) throw new Error('useWorkout must be used inside a WorkoutProvider');
  return ctx;
}

// --- helpers ---------------------------------------------------------------

function defaultSessionName() {
  const hour = new Date().getHours();
  if (hour < 11) return 'Morning Raid';
  if (hour < 17) return 'Afternoon Gate';
  if (hour < 22) return 'Evening Dungeon';
  return 'Midnight Run';
}

/** Last logged sets for an exercise, from the rolling profile summaries. */
function lastPerformance(profile, exerciseId) {
  const record = profile?.records?.[exerciseId];
  if (!record) return null;
  return {
    e1rm: record.e1rm,
    weight: record.weight,
    reps: record.reps,
    volume: record.volume,
    lastPerformed: record.lastPerformed,
    sets: record.lastSets || null,
  };
}

/**
 * A short two-tone chime via the Web Audio API.
 * Synthesised rather than shipped as an audio file — a 30 KB mp3 downloaded by
 * every visitor is real money against a 360 MB/day bandwidth budget.
 */
let audioContext = null;
function playChime() {
  try {
    audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') audioContext.resume();

    const now = audioContext.currentTime;
    [880, 1174.66].forEach((frequency, i) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.type = 'sine';
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0, now + i * 0.16);
      gain.gain.linearRampToValueAtTime(0.22, now + i * 0.16 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.16 + 0.35);
      osc.connect(gain).connect(audioContext.destination);
      osc.start(now + i * 0.16);
      osc.stop(now + i * 0.16 + 0.4);
    });
  } catch {
    /* audio is a nicety, never a failure mode */
  }
}

export { estimate1RM, summarizeExercise };
