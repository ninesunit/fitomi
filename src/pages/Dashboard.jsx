import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity, ArrowRight, ChevronRight, Dumbbell, Flame, Ghost, ListChecks,
  Play, Skull, Sparkles, Timer, TrendingUp, Trophy, Zap,
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useWorkout } from '../context/WorkoutContext';
import { MotionPanel, PanelHeader } from '../components/ui/Panel';
import { Button } from '../components/ui/Button';
import { XpBar, Meter } from '../components/ui/Bars';
import { RankBadge } from '../components/ui/RankBadge';
import { StatRadar } from '../components/dashboard/StatRadar';
import { MuscleMap } from '../components/dashboard/MuscleMap';
import { QuestCard } from '../components/quests/QuestCard';
import { REQUIREMENT_LABELS } from '../engine/shadows';
import { getExercise } from '../data/exercises';
import { fromKg } from '../engine/constants';
import { formatDuration, relativeTime } from '../lib/date';

export default function Dashboard() {
  const {
    profile, xp, rank, nextRank, rankProgress, streak, readiness, soreness,
    boss, raid, shadowProgress, quests, completeQuest, uncompleteQuest,
  } = useGame();
  const { active, elapsed, stats } = useWorkout();

  if (!profile) return null;

  const unit = profile.unit || 'kg';
  const bossPct = raid ? Math.min(100, (raid.damage / raid.hp) * 100) : 0;
  const openQuests = quests.daily.filter((q) => !quests.completed.includes(q.id));
  const recent = profile.recentWorkouts?.[0];

  return (
    <div className="space-y-4">
      {/* ---------------- Hunter status ---------------- */}
      <MotionPanel accent notch className="overflow-hidden">
        <div className="relative p-5">
          <span
            className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-30 blur-3xl"
            style={{ background: `radial-gradient(circle, ${rank.color}66, transparent 70%)` }}
          />

          <div className="relative flex items-start gap-4">
            <RankBadge rank={rank} size={72} pulse />

            <div className="min-w-0 flex-1">
              <div className="hud-label mb-1">Hunter Status</div>
              <h1 className="truncate font-display text-2xl font-bold text-slate-100">
                {profile.displayName}
              </h1>
              <p className="mt-0.5 text-sm" style={{ color: rank.color }}>
                {rank.name} · {profile.title || rank.title}
              </p>
            </div>

            <div className="hidden text-right sm:block">
              <div className="hud-label mb-1">Level</div>
              <div className="font-display text-4xl font-bold leading-none tnum accent-text glow-text">
                {xp.level}
              </div>
            </div>
          </div>

          <div className="relative mt-5">
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="hud-label">Experience</span>
              <span className="tnum font-mono text-xs text-slate-400">
                {xp.xpIntoLevel.toLocaleString()} / {xp.xpForLevel.toLocaleString()} XP
              </span>
            </div>
            <XpBar progress={xp.progress} />
            <p className="mt-1.5 text-xs text-slate-500">
              {nextRank ? (
                <>
                  {xp.xpRemaining.toLocaleString()} XP to level {xp.level + 1} ·{' '}
                  <span style={{ color: nextRank.color }}>
                    {nextRank.name} at level {nextRank.minLevel}
                  </span>{' '}
                  ({Math.round(rankProgress * 100)}%)
                </>
              ) : (
                'Maximum rank achieved. There is nothing above this.'
              )}
            </p>
          </div>

          <div className="relative mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Workouts" value={profile.totals.workouts} icon={Dumbbell} />
            <Stat
              label="Total volume"
              value={`${Math.round(fromKg(profile.totals.volumeKg, unit)).toLocaleString()} ${unit}`}
              icon={TrendingUp}
            />
            <Stat label="Records" value={profile.totals.prCount} icon={Trophy} />
            <Stat label="Bosses felled" value={profile.totals.bossKills} icon={Skull} />
          </div>
        </div>
      </MotionPanel>

      {/* ---------------- Primary action ---------------- */}
      <MotionPanel delay={0.05} className="p-4" accent={active}>
        {active ? (
          <div className="flex flex-wrap items-center gap-4">
            <div className="min-w-0 flex-1">
              <div className="hud-label mb-1 flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mana-400 opacity-70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-mana-400" />
                </span>
                Session live
              </div>
              <div className="flex items-baseline gap-3">
                <span className="tnum font-display text-2xl font-bold text-slate-100">
                  {formatDuration(elapsed)}
                </span>
                <span className="text-sm text-slate-500 tnum">
                  {stats.completedSets} sets · {Math.round(fromKg(stats.volumeKg, unit)).toLocaleString()} {unit}
                </span>
              </div>
            </div>
            <Button as={Link} to="/workout" variant="primary" icon={Timer}>
              Resume session
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-4">
            <div className="min-w-0 flex-1">
              <div className="hud-label mb-1">Readiness</div>
              <div className="flex items-baseline gap-2">
                <span className="tnum font-display text-2xl font-bold accent-text">
                  {Math.round(readiness * 100)}%
                </span>
                <span className="text-sm text-slate-500">{readinessCopy(readiness)}</span>
              </div>
            </div>
            <Button as={Link} to="/workout" variant="primary" icon={Play}>
              Start workout
            </Button>
          </div>
        )}
      </MotionPanel>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* ---------------- Raid boss ---------------- */}
        <MotionPanel delay={0.1} className="lg:col-span-2">
          <Link to="/raid" className="block p-5 transition hover:bg-white/[0.02]">
            <PanelHeader
              label={`Weekly raid · ${raid?.week || ''}`}
              title={boss.name}
              icon={Skull}
              action={<ChevronRight size={18} className="mt-1 shrink-0 text-slate-600" />}
            />

            <p className="mt-1 text-xs text-slate-500">{boss.title}</p>

            <div className="mt-4">
              <div className="mb-1.5 flex items-baseline justify-between">
                <span className="hud-label">Integrity</span>
                <span className="tnum font-mono text-xs" style={{ color: boss.color }}>
                  {Math.max(0, raid.hp - raid.damage).toLocaleString()} / {raid.hp.toLocaleString()}
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-void-700/70">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: boss.color, boxShadow: `0 0 16px -3px ${boss.color}` }}
                  initial={{ width: '100%' }}
                  animate={{ width: `${100 - bossPct}%` }}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  Weak to <span style={{ color: boss.accent }}>{boss.weaknessLabel}</span>
                </span>
                <span className="tnum text-slate-400">{Math.round(bossPct)}% cleared</span>
              </div>
            </div>

            {raid.defeated && (
              <div className="mt-3 rounded-lg border border-mana-500/30 bg-mana-500/10 px-3 py-2 text-sm text-mana-300">
                Gate cleared. A new boss arrives Monday.
              </div>
            )}
          </Link>
        </MotionPanel>

        {/* ---------------- Streak / shadow ---------------- */}
        <MotionPanel delay={0.15} className="p-5">
          <PanelHeader label="Shadow extraction" title="Streak" icon={Flame} />

          <div className="mt-4 flex items-baseline gap-2">
            <span
              className="tnum font-display text-4xl font-bold"
              style={{ color: streak.current > 0 ? '#fb923c' : '#475569' }}
            >
              {streak.current}
            </span>
            <span className="text-sm text-slate-500">day{streak.current === 1 ? '' : 's'}</span>
            {streak.longest > streak.current && (
              <span className="ml-auto text-xs text-slate-600 tnum">best {streak.longest}</span>
            )}
          </div>

          {streak.atRisk && (
            <div className="mt-3 rounded-lg border border-blood-500/40 bg-blood-500/10 px-3 py-2 text-xs text-blood-300">
              Streak lapses today. Log anything to hold it.
            </div>
          )}

          {shadowProgress && (
            <div className="mt-4">
              <div className="mb-2 flex items-center gap-2">
                <Ghost size={14} style={{ color: `rgb(${shadowProgress.shadow.theme.accent})` }} />
                <span className="text-sm font-medium text-slate-200">{shadowProgress.shadow.name}</span>
              </div>
              <Meter
                value={shadowProgress.actual}
                max={shadowProgress.target}
                color={`rgb(${shadowProgress.shadow.theme.accent})`}
                right={`${Math.floor(shadowProgress.actual).toLocaleString()} / ${shadowProgress.target.toLocaleString()}`}
                label={REQUIREMENT_LABELS[shadowProgress.shadow.requirement.type]?.(
                  shadowProgress.shadow.requirement.value,
                )}
              />
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-1.5">
            {(profile.shadows || []).slice(-6).map((id) => (
              <span key={id} className="stat-chip">
                <Ghost size={11} />
                {id}
              </span>
            ))}
            {!profile.shadows?.length && (
              <p className="text-xs text-slate-600">
                No shadows extracted. A three-day streak unlocks the first.
              </p>
            )}
          </div>
        </MotionPanel>
      </div>

      {/* ---------------- Quests ---------------- */}
      <MotionPanel delay={0.2} className="p-5">
        <PanelHeader
          label="Daily quest board"
          title={openQuests.length ? `${openQuests.length} quests remaining` : 'All quests cleared'}
          icon={ListChecks}
          action={
            <Button as={Link} to="/quests" variant="subtle" size="sm" iconRight={ArrowRight}>
              Board
            </Button>
          }
        />

        <div className="mt-4 space-y-2.5">
          {quests.daily.slice(0, 3).map((quest) => (
            <QuestCard
              key={quest.id}
              quest={quest}
              completed={quests.completed.includes(quest.id)}
              onComplete={completeQuest}
              onUndo={uncompleteQuest}
              compact
            />
          ))}
          {!quests.daily.length && (
            <p className="text-sm text-slate-500">
              The System is still calibrating. Log a workout and the board fills in.
            </p>
          )}
        </div>
      </MotionPanel>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* ---------------- Attributes ---------------- */}
        <MotionPanel delay={0.25} className="p-5">
          <PanelHeader
            label="Attributes"
            title={`${Object.values(profile.stats).reduce((a, b) => a + b, 0)} total points`}
            icon={Sparkles}
            action={
              <Button as={Link} to="/profile" variant="subtle" size="sm" iconRight={ArrowRight}>
                Profile
              </Button>
            }
          />
          <StatRadar stats={profile.stats} className="mt-2" />
        </MotionPanel>

        {/* ---------------- Recovery ---------------- */}
        <MotionPanel delay={0.3} className="p-5">
          <PanelHeader label="Recovery" title={`${Math.round(readiness * 100)}% readiness`} icon={Activity} />
          <MuscleMap soreness={soreness} className="mt-3" />
        </MotionPanel>
      </div>

      {/* ---------------- Last session ---------------- */}
      {recent && (
        <MotionPanel delay={0.35} className="p-5">
          <PanelHeader
            label="Last session"
            title={recent.name}
            icon={Zap}
            action={
              <Button as={Link} to="/history" variant="subtle" size="sm" iconRight={ArrowRight}>
                History
              </Button>
            }
          />
          <p className="mt-1 text-xs text-slate-500">{relativeTime(recent.finishedAt)}</p>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Volume" value={`${Math.round(fromKg(recent.volumeKg, unit)).toLocaleString()} ${unit}`} />
            <Stat label="Sets" value={recent.sets} />
            <Stat label="XP earned" value={`+${recent.xp}`} />
            <Stat label="Duration" value={formatDuration(recent.durationSec)} />
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {recent.exerciseIds?.slice(0, 8).map((id) => {
              const exercise = getExercise(id);
              return exercise ? (
                <span key={id} className="stat-chip">
                  {exercise.name}
                </span>
              ) : null;
            })}
          </div>
        </MotionPanel>
      )}
    </div>
  );
}

function Stat({ label, value, icon: Icon }) {
  return (
    <div className="rounded-lg border border-white/[0.07] bg-void-950/50 px-3 py-2.5">
      <div className="hud-label mb-1 flex items-center gap-1.5">
        {Icon && <Icon size={11} />}
        {label}
      </div>
      <div className="tnum truncate font-mono text-sm font-bold text-slate-100">{value}</div>
    </div>
  );
}

function readinessCopy(readiness) {
  if (readiness > 0.85) return 'Fully recovered. Go heavy.';
  if (readiness > 0.6) return 'Cleared for full contact.';
  if (readiness > 0.4) return 'Moderate fatigue. Train around it.';
  if (readiness > 0.2) return 'Heavily fatigued. Keep it light.';
  return 'Systemically smoked. Recover.';
}
