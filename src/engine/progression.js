import {
  scoreWorkout,
  levelFromXp,
  statPointsForLevel,
  statDistribution,
  applyDisciplineBias,
  allocatePointsWithCarry,
} from './leveling';
import { detectPRs } from './records';
import { rankForLevel } from './ranks';
import { computeStreak, evaluateShadows } from './shadows';
import {
  createRaid,
  applyDamage,
  prDamage,
  volumeDamage,
  streakDamage,
  bossForWeek,
  bossHp,
  bossReward,
} from './raid';
import { dayKey, weekKey } from '../lib/date';
import { STAT_IDS } from './constants';

// ---------------------------------------------------------------------------
// The single entry point the app calls when a hunter hits "Finish Workout".
//
// It is a pure function: given the old profile and the session, it returns the
// new profile plus a list of "events" (level-ups, PRs, shadows extracted, boss
// damage, boss kills) for the UI to play back as System notifications.
//
// Being pure matters — it means the whole progression pipeline is testable
// without Firebase, React or a browser anywhere near it.
// ---------------------------------------------------------------------------

export function progressWorkout({ profile, workout, lookup, now = Date.now() }) {
  const events = [];
  const entries = workout.entries || [];

  // --- 1. Records first: PR count feeds the XP multiplier and raid damage ---
  const { prs, nextRecords } = detectPRs({
    entries,
    records: profile.records || {},
    profile,
    lookup,
  });

  // --- 2. Streak, computed with today included -----------------------------
  const today = dayKey(new Date(now));
  const trainingDays = [...new Set([...(profile.trainingDays || []), today])];
  const graceDays = profile.settings?.graceDays ?? 1;
  const streak = computeStreak(trainingDays, graceDays, new Date(now));
  const previousStreak = profile.streak?.current || 0;

  // --- 3. Score the session ------------------------------------------------
  const score = scoreWorkout({
    entries,
    profile,
    lookup,
    prCount: prs.length,
    streak: streak.current,
  });

  const loggedRpe = entries.reduce(
    (count, e) => count + (e.sets || []).filter((s) => s.rpe && s.completed !== false).length,
    0,
  );

  // --- 4. Level up ---------------------------------------------------------
  const before = levelFromXp(profile.totalXp || 0);
  const totalXp = (profile.totalXp || 0) + score.xp;
  const after = levelFromXp(totalXp);

  const stats = { ...profile.stats };
  let statCarry = { ...(profile.statCarry || {}) };
  let gainedPoints = 0;

  if (after.level > before.level) {
    // Points are allocated by *what was actually trained*, weighted toward this
    // session but grounded in the trailing profile so one leg day does not
    // permanently define a hunter's build.
    const trailing = trailingMuscleVolume(profile.recentWorkouts, score.muscleVolume);
    const distribution = applyDisciplineBias(statDistribution(trailing), {
      streak: streak.current,
      prCount: prs.length,
      loggedRpe,
    });

    for (let lvl = before.level + 1; lvl <= after.level; lvl += 1) {
      const points = statPointsForLevel(lvl);
      gainedPoints += points;
      const { award, carry } = allocatePointsWithCarry(points, distribution, statCarry);
      statCarry = carry;
      for (const id of STAT_IDS) stats[id] = (stats[id] || 0) + award[id];

      events.push({
        type: 'levelUp',
        level: lvl,
        points,
        award,
        rank: rankForLevel(lvl),
        rankUp: rankForLevel(lvl).id !== rankForLevel(lvl - 1).id,
      });
    }
  }

  // --- 5. Raid ------------------------------------------------------------
  const week = weekKey(new Date(now));
  let raid =
    profile.raid && profile.raid.week === week
      ? { ...profile.raid }
      : createRaid(after.level, week);

  // A hunter who levels mid-week does not get an easier boss retroactively.
  raid.hp = Math.max(raid.hp, bossHp(bossForWeek(week), after.level));

  const boss = bossForWeek(week);
  const wasDefeated = raid.defeated;
  const hits = [];

  for (const pr of prs) {
    const exercise = lookup?.(pr.exerciseId);
    const hit = prDamage(pr, boss, exercise);
    hits.push({ ...hit, source: 'pr', label: `${pr.name} · ${pr.type.toUpperCase()}`, at: now });
  }

  const volHit = volumeDamage(score.volumeKg, score.patternVolume, boss);
  if (volHit.amount > 0) {
    hits.push({ ...volHit, source: 'volume', label: `${Math.round(score.volumeKg).toLocaleString()} kg moved`, at: now });
  }

  if (streak.current > 0) {
    const sHit = streakDamage(streak.current);
    if (sHit.amount > 0) hits.push({ ...sHit, label: `${streak.current}-day streak`, at: now });
  }

  raid = applyDamage(raid, hits);
  const totalDamage = hits.reduce((sum, h) => sum + h.amount, 0);
  if (totalDamage > 0) {
    events.push({ type: 'raidDamage', amount: totalDamage, boss, hits, raid });
  }

  let bossKills = profile.totals?.bossKills || 0;
  let bossXp = 0;
  if (raid.defeated && !wasDefeated) {
    bossKills += 1;
    const reward = bossReward(boss, after.level);
    bossXp = reward.xp;
    events.push({ type: 'bossDefeated', boss, reward, raid });
  }

  // --- 6. Totals ----------------------------------------------------------
  const totals = {
    workouts: (profile.totals?.workouts || 0) + 1,
    volumeKg: (profile.totals?.volumeKg || 0) + score.volumeKg,
    sets: (profile.totals?.sets || 0) + score.sets,
    reps: (profile.totals?.reps || 0) + score.reps,
    prCount: (profile.totals?.prCount || 0) + prs.length,
    bossKills,
    durationSec: (profile.totals?.durationSec || 0) + (workout.durationSec || 0),
  };

  // --- 7. Shadow extraction ------------------------------------------------
  const unlocked = profile.shadows || [];
  const newShadows = evaluateShadows(
    {
      streak: streak.current,
      bossKills: totals.bossKills,
      prCount: totals.prCount,
      volumeKg: totals.volumeKg,
      workouts: totals.workouts,
    },
    unlocked,
  );

  for (const shadow of newShadows) {
    events.push({ type: 'shadowExtracted', shadow });
  }

  // Boss XP is folded in after level-up so a kill never silently skips the
  // level-up animation for the level it pushes you into.
  const finalXp = totalXp + bossXp;
  const finalLevel = levelFromXp(finalXp);
  if (bossXp > 0 && finalLevel.level > after.level) {
    for (let lvl = after.level + 1; lvl <= finalLevel.level; lvl += 1) {
      const points = statPointsForLevel(lvl);
      gainedPoints += points;
      const { award, carry } = allocatePointsWithCarry(
        points,
        statDistribution(score.muscleVolume),
        statCarry,
      );
      statCarry = carry;
      for (const id of STAT_IDS) stats[id] = (stats[id] || 0) + award[id];
      events.push({ type: 'levelUp', level: lvl, points, award, rank: rankForLevel(lvl), rankUp: rankForLevel(lvl).id !== rankForLevel(lvl - 1).id });
    }
  }

  for (const pr of prs) events.push({ type: 'pr', pr });
  if (streak.current > previousStreak) {
    events.push({ type: 'streak', current: streak.current, previous: previousStreak });
  }

  // --- 8. Session summary for the soreness + quest engines ------------------
  const summary = {
    id: workout.id || null,
    finishedAt: now,
    name: workout.name || 'Session',
    volumeKg: score.volumeKg,
    sets: score.sets,
    reps: score.reps,
    xp: score.xp + bossXp,
    durationSec: workout.durationSec || 0,
    prCount: prs.length,
    muscleVolume: score.muscleVolume,
    patternVolume: score.patternVolume,
    exerciseIds: entries.map((e) => e.exerciseId),
  };

  const nextProfile = {
    ...profile,
    totalXp: finalXp,
    level: finalLevel.level,
    stats,
    statCarry,
    statPoints: (profile.statPoints || 0) + gainedPoints,
    trainingDays,
    streak: { current: streak.current, longest: streak.longest, lastDay: streak.lastDay },
    shadows: [...unlocked, ...newShadows.map((s) => s.id)],
    records: nextRecords,
    raid,
    totals,
    recentWorkouts: [summary, ...(profile.recentWorkouts || [])],
    title: newShadows.length ? newShadows[newShadows.length - 1].title : profile.title,
  };

  return { profile: nextProfile, events, score, summary, prs, streak, raid };
}

/**
 * Blend this session's muscle volume with the trailing profile so stat
 * allocation reflects a hunter's overall training, not just today.
 * The current session is weighted double.
 */
function trailingMuscleVolume(recentWorkouts = [], sessionVolume = {}) {
  const acc = {};
  for (const [muscle, volume] of Object.entries(sessionVolume)) {
    acc[muscle] = (acc[muscle] || 0) + volume * 2;
  }
  for (const workout of recentWorkouts.slice(0, 12)) {
    for (const [muscle, volume] of Object.entries(workout.muscleVolume || {})) {
      acc[muscle] = (acc[muscle] || 0) + volume;
    }
  }
  return acc;
}

/** Award XP outside a workout — quest clears and boss kills use this. */
export function grantXp(profile, amount, reason) {
  const before = levelFromXp(profile.totalXp || 0);
  const totalXp = (profile.totalXp || 0) + amount;
  const after = levelFromXp(totalXp);
  const events = [];
  const stats = { ...profile.stats };
  let statCarry = { ...(profile.statCarry || {}) };
  let gainedPoints = 0;

  if (after.level > before.level) {
    const distribution = statDistribution(
      (profile.recentWorkouts || []).reduce((acc, w) => {
        for (const [m, v] of Object.entries(w.muscleVolume || {})) acc[m] = (acc[m] || 0) + v;
        return acc;
      }, {}),
    );
    for (let lvl = before.level + 1; lvl <= after.level; lvl += 1) {
      const points = statPointsForLevel(lvl);
      gainedPoints += points;
      const { award, carry } = allocatePointsWithCarry(points, distribution, statCarry);
      statCarry = carry;
      for (const id of STAT_IDS) stats[id] = (stats[id] || 0) + award[id];
      events.push({ type: 'levelUp', level: lvl, points, award, rank: rankForLevel(lvl), rankUp: rankForLevel(lvl).id !== rankForLevel(lvl - 1).id });
    }
  }

  events.push({ type: 'xp', amount, reason });

  return {
    profile: {
      ...profile,
      totalXp,
      level: after.level,
      stats,
      statCarry,
      statPoints: (profile.statPoints || 0) + gainedPoints,
    },
    events,
  };
}
