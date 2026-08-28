import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { useSystem } from './SystemContext';
import { commitWorkout, loadProfile, saveProfile, saveRoutines } from '../lib/firestore';
import { clearAnswers, loadAnswers, seedProfileFromAssessment } from '../lib/onboarding';
import { assess, programToRoutines } from '../engine/assessment';
import { createProfile, hydrateProfile } from '../lib/profile';
import { getExercise } from '../data/exercises';
import { progressWorkout, grantXp } from '../engine/progression';
import { capAward, recordDailyXp } from '../engine/integrity';
import { levelFromXp } from '../engine/leveling';
import { rankForLevel, nextRank, rankProgress } from '../engine/ranks';
import { computeStreak, streakDeadline, nextShadow, themeById } from '../engine/shadows';
import { estimateSoreness, systemicReadiness } from '../engine/soreness';
import { generateQuests, generateWeeklyQuests, questProgress } from '../engine/quests';
import { bossForWeek, createRaid, applyDamage } from '../engine/raid';
import { dayKey, weekKey } from '../lib/date';
import { getCosmetic } from '../data/shop';

export const GameContext = createContext(null);

const LOCAL_KEY = 'fitomi:profile:';

function rewardVerifiedQuests(profile, questBoard, now = Date.now()) {
  const today = dayKey(new Date(now));
  const week = weekKey(new Date(now));
  const dailyState = profile.questState?.day === today ? profile.questState : {};
  const weeklyState = profile.weeklyQuestState?.week === week ? profile.weeklyQuestState : {};
  const dailyDone = new Set(dailyState.completed || []);
  const weeklyDone = new Set(weeklyState.completed || []);
  const evidence = { history: profile.recentWorkouts || [], now };
  const clearedDaily = (questBoard.daily || []).filter(
    (quest) => !dailyDone.has(quest.id) && questProgress(quest, evidence).complete,
  );
  const clearedWeekly = (questBoard.weekly || []).filter(
    (quest) => !weeklyDone.has(quest.id) && questProgress(quest, evidence).complete,
  );
  const cleared = [...clearedDaily, ...clearedWeekly];

  let next = profile;
  const events = [];
  const hits = [];
  const dailyReceipts = { ...(dailyState.receipts || {}) };
  const weeklyReceipts = { ...(weeklyState.receipts || {}) };

  for (const [index, quest] of cleared.entries()) {
    const allowed = capAward(next, today, quest.xp, quest.xp).granted;
    let receipt = { amount: 0 };
    if (allowed > 0) {
      const granted = grantXp(next, allowed, `Verified quest: ${quest.title}`);
      next = granted.profile;
      receipt = granted.receipt;
      events.push(...granted.events);
      next = { ...next, xpLedger: recordDailyXp(next, today, allowed) };
    }

    const gold = Math.max(0, Number(quest.gold) || 0);
    next = {
      ...next,
      wallet: {
        gold: (next.wallet?.gold || 0) + gold,
        lifetimeGold: (next.wallet?.lifetimeGold || 0) + gold,
      },
    };
    const at = now + index;
    hits.push({ amount: quest.damage, source: 'quest', label: quest.title, at });
    const questReceipt = { ...receipt, gold, damage: quest.damage, at, week, evidence: quest.auto };
    if (quest.week) weeklyReceipts[quest.id] = questReceipt;
    else dailyReceipts[quest.id] = questReceipt;
  }

  const raidState = next.raid && next.raid.week === week
    ? next.raid
    : createRaid(next.level || 1, week);

  return {
    profile: {
      ...next,
      raid: applyDamage(raidState, hits),
      questState: {
        day: today,
        completed: [...dailyDone, ...clearedDaily.map((quest) => quest.id)],
        receipts: dailyReceipts,
        board: questBoard.daily,
        generated: today,
      },
      weeklyQuestState: {
        week,
        completed: [...weeklyDone, ...clearedWeekly.map((quest) => quest.id)],
        receipts: weeklyReceipts,
        board: questBoard.weekly,
      },
    },
    events,
    cleared,
  };
}

export function GameProvider({ children }) {
  const { user } = useAuth();
  const { announce, toast } = useSystem();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  // Set when Firestore cannot be reached — a dead connection on gym wi-fi, or a
  // project where the database has not been created yet. The app keeps working
  // against the local mirror either way; nothing is lost, it just is not synced.
  const [offline, setOffline] = useState(false);

  // Debounced background saves. Cheap preference edits (rest timer, unit) must
  // never each cost a Firestore write on a 20k/day budget.
  const saveTimer = useRef(null);
  const pending = useRef(null);

  // --- load ---------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    if (!user) {
      setProfile(null);
      setLoading(false);
      return undefined;
    }

    setLoading(true);

    // Paint immediately from the local mirror, then reconcile with Firestore.
    // The app is usable offline and on a cold cache without a loading spinner.
    try {
      const cached = localStorage.getItem(LOCAL_KEY + user.uid);
      if (cached) setProfile(hydrateProfile(JSON.parse(cached), { uid: user.uid, email: user.email }));
    } catch {
      /* corrupted cache is not worth crashing over */
    }

    loadProfile(user)
      .then(async (loaded) => {
        if (cancelled) return;

        // First sign-in after the awakening: fold the assessment into the
        // fresh profile and persist the programme it generated. Guarded on
        // `awakening` so it can only ever run once per account.
        const answers = loadAnswers();
        if (!loaded.awakening && answers?.completedAt) {
          const assessment = assess(answers);
          const seeded = seedProfileFromAssessment(loaded, answers, assessment);
          setProfile(seeded);
          try {
            await saveProfile(user.uid, seeded);
            await saveRoutines(user.uid, programToRoutines(assessment.program, user.uid));
            clearAnswers();
          } catch {
            // Keep the local copy; it will be rewritten on the next save.
          }
          setError(null);
          setOffline(false);
          return;
        }

        // Already awakened: the assessment on this device is stale and must
        // never be applied over real progress. Drop it.
        if (loaded.awakening && answers?.completedAt) clearAnswers();

        setProfile(loaded);
        setError(null);
        setOffline(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err);
        setOffline(true);
        // Never strand the hunter on a spinner because the database is
        // unreachable: fall back to whatever is cached, or a fresh profile.
        setProfile((current) =>
          current ||
          createProfile({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email?.split('@')[0] || 'Unnamed Hunter',
            photoURL: user.photoURL,
          }),
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  // --- local mirror --------------------------------------------------------
  useEffect(() => {
    if (!user || !profile) return;
    try {
      localStorage.setItem(LOCAL_KEY + user.uid, JSON.stringify(profile));
    } catch {
      /* quota exceeded — the Firestore copy is authoritative anyway */
    }
  }, [user, profile]);

  const flush = useCallback(async () => {
    if (!user || !pending.current) return;
    const snapshot = pending.current;
    pending.current = null;
    setSaving(true);
    try {
      await saveProfile(user.uid, snapshot);
      setOffline(false);
    } catch (err) {
      setError(err);
      setOffline(true);
    } finally {
      setSaving(false);
    }
  }, [user]);

  /**
   * Update the profile locally and schedule one coalesced write.
   * `immediate` forces the write now — used after workouts and boss kills where
   * losing the update would cost real progress.
   */
  const update = useCallback(
    (updater, { immediate = false } = {}) => {
      setProfile((current) => {
        if (!current) return current;
        const next = typeof updater === 'function' ? updater(current) : { ...current, ...updater };
        pending.current = next;

        if (saveTimer.current) clearTimeout(saveTimer.current);
        if (immediate) {
          flush();
        } else {
          saveTimer.current = setTimeout(flush, 2500);
        }
        return next;
      });
    },
    [flush],
  );

  // Never lose a pending write to a closed tab.
  useEffect(() => {
    const onHide = () => {
      if (pending.current && user) {
        saveProfile(user.uid, pending.current).catch(() => {});
        pending.current = null;
      }
    };
    window.addEventListener('pagehide', onHide);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') onHide();
    });
    return () => window.removeEventListener('pagehide', onHide);
  }, [user]);

  // --- derived state -------------------------------------------------------
  const derived = useMemo(() => {
    if (!profile) return null;

    const xp = levelFromXp(profile.totalXp || 0);
    const rank = rankForLevel(xp.level);
    const upcoming = nextRank(xp.level);
    const graceDays = profile.settings?.graceDays ?? 1;
    const streak = computeStreak(profile.trainingDays || [], graceDays);
    const soreness = estimateSoreness(profile.recentWorkouts || []);
    const readiness = systemicReadiness(soreness);
    const week = weekKey();
    const boss = bossForWeek(week);
    const raid = profile.raid && profile.raid.week === week ? profile.raid : createRaid(xp.level, week);

    const shadowProgress = nextShadow(
      {
        streak: streak.current,
        bossKills: profile.totals?.bossKills || 0,
        prCount: profile.totals?.prCount || 0,
        volumeKg: profile.totals?.volumeKg || 0,
        workouts: profile.totals?.workouts || 0,
      },
      profile.shadows || [],
    );

    return {
      xp,
      rank,
      nextRank: upcoming,
      rankProgress: rankProgress(xp.level),
      streak,
      streakDeadline: streakDeadline(streak.lastDay, graceDays),
      soreness,
      readiness,
      week,
      boss,
      raid,
      shadowProgress,
      theme: themeById(profile.activeTheme),
    };
  }, [profile]);

  // --- quests --------------------------------------------------------------
  const quests = useMemo(() => {
    if (!profile || !derived) return { daily: [], weekly: [], completed: [], weeklyCompleted: [] };

    const today = dayKey();
    const generatedDaily = generateQuests({
      history: profile.recentWorkouts || [],
      profile,
      streak: derived.streak,
      records: profile.records || {},
      userId: profile.uid || 'anon',
    });
    const generatedWeekly = generateWeeklyQuests({
      history: profile.recentWorkouts || [],
      streak: derived.streak,
      week: derived.week,
      userId: profile.uid || 'anon',
    });

    const completed = profile.questState?.day === today ? profile.questState.completed || [] : [];
    const weeklyCompleted =
      profile.weeklyQuestState?.week === derived.week ? profile.weeklyQuestState.completed || [] : [];
    const daily = profile.questState?.day === today && profile.questState.board?.length
      ? profile.questState.board
      : generatedDaily;
    const weekly = profile.weeklyQuestState?.week === derived.week && profile.weeklyQuestState.board?.length
      ? profile.weeklyQuestState.board
      : generatedWeekly;

    return { daily, weekly, completed, weeklyCompleted, today };
  }, [profile, derived]);

  // --- actions -------------------------------------------------------------

  /** Commit a finished session. This is the only place a workout ever writes. */
  const finishWorkout = useCallback(
    async (workout, options = {}) => {
      if (!user || !profile) return null;

      const result = progressWorkout({
        profile,
        workout,
        lookup: getExercise,
        multiplier: options.multiplier || 1,
      });
      const verified = rewardVerifiedQuests(result.profile, quests);
      const finalProfile = verified.profile;
      const record = {
        name: workout.name || 'Session',
        startedAt: workout.startedAt || Date.now(),
        finishedAt: Date.now(),
        durationSec: workout.durationSec || 0,
        notes: workout.notes || '',
        entries: workout.entries || [],
        volumeKg: result.score.volumeKg,
        sets: result.score.sets,
        reps: result.score.reps,
        xp: result.summary.xp,
        prCount: result.prs.length,
        muscleVolume: result.score.muscleVolume,
        patternVolume: result.score.patternVolume,
        muscleSets: result.score.muscleSets,
        patternSets: result.score.patternSets,
      };

      setProfile(finalProfile);
      pending.current = null;
      if (saveTimer.current) clearTimeout(saveTimer.current);

      setSaving(true);
      try {
        const saved = await commitWorkout(user.uid, record, finalProfile);
        setProfile(saved.profile);
      } catch (err) {
        setError(err);
        setOffline(true);
        // The local mirror still holds it, so nothing is lost — it will be
        // rewritten on the next successful save.
        toast('Saved locally — will sync when the connection returns.', { tone: 'warn' });
      } finally {
        setSaving(false);
      }

      announce([...result.events, ...verified.events]);
      if (verified.cleared.length) {
        const gold = verified.cleared.reduce((sum, quest) => sum + (quest.gold || 0), 0);
        toast(`${verified.cleared.length} verified quest${verified.cleared.length === 1 ? '' : 's'} cleared · +${gold} gold`, { tone: 'success' });
      }
      return { ...result, profile: finalProfile, verifiedQuests: verified.cleared };
    },
    [user, profile, quests, announce, toast],
  );

  const setTheme = useCallback(
    (shadowId) => {
      update({ activeTheme: shadowId });
    },
    [update],
  );

  const buyCosmetic = useCallback(
    (itemId) => {
      const item = getCosmetic(itemId);
      if (!item || !profile) return false;
      if ((profile.inventory || []).includes(itemId)) {
        toast('Cosmetic already owned.', { tone: 'info' });
        return false;
      }
      if ((profile.wallet?.gold || 0) < item.price) {
        toast('Insufficient gold.', { tone: 'warn' });
        return false;
      }
      update((current) => {
        if ((current.inventory || []).includes(itemId) || (current.wallet?.gold || 0) < item.price) {
          return current;
        }
        return {
          ...current,
          wallet: { ...current.wallet, gold: Math.max(0, (current.wallet?.gold || 0) - item.price) },
          inventory: [...new Set([...(current.inventory || []), itemId])],
        };
      });
      toast(`${item.name} acquired.`, { tone: 'success' });
      return true;
    },
    [profile, update, toast],
  );

  const equipCosmetic = useCallback(
    (itemId) => {
      const item = getCosmetic(itemId);
      if (!item || !(profile?.inventory || []).includes(itemId)) return false;
      update((current) => ({
        ...current,
        equippedCosmetics: { ...(current.equippedCosmetics || {}), [item.slot]: item.id },
      }));
      toast(`${item.name} equipped.`, { tone: 'success' });
      return true;
    },
    [profile, update, toast],
  );

  const unequipCosmetic = useCallback(
    (slot) => update((current) => {
      const equippedCosmetics = { ...(current.equippedCosmetics || {}) };
      delete equippedCosmetics[slot];
      return { ...current, equippedCosmetics };
    }),
    [update],
  );

  const updateSettings = useCallback(
    (patch) => update((current) => ({ ...current, settings: { ...current.settings, ...patch } })),
    [update],
  );

  const updateProfileFields = useCallback((patch) => update((current) => ({ ...current, ...patch })), [update]);

  const value = useMemo(
    () => ({
      profile,
      loading,
      saving,
      error,
      offline,
      ...(derived || {}),
      quests,
      finishWorkout,
      buyCosmetic,
      equipCosmetic,
      unequipCosmetic,
      setTheme,
      updateSettings,
      updateProfile: updateProfileFields,
      update,
      flush,
    }),
    [
      profile, loading, saving, error, offline, derived, quests,
      finishWorkout, buyCosmetic, equipCosmetic, unequipCosmetic,
      setTheme, updateSettings, updateProfileFields, update, flush,
    ],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside a GameProvider');
  return ctx;
}
