import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronRight, Dumbbell, Flame, Ghost, Play, Skull, Swords, Timer, TrendingUp,
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useWorkout } from '../context/WorkoutContext';
import { SystemWindow, SystemPanel } from '../components/system/SystemWindow';
import { SystemButton } from '../components/system/SystemButton';
import { SystemMeter } from '../components/system/SystemMeter';
import { StatusWindow } from '../components/system/StatusWindow';
import { QuestCard } from '../components/quests/QuestCard';
import { REQUIREMENT_LABELS } from '../engine/shadows';
import { fromKg } from '../engine/constants';
import { formatDuration, relativeTime } from '../lib/date';

export default function Dashboard() {
  const {
    profile, xp, rank, nextRank, streak, readiness, boss, raid,
    shadowProgress, quests, completeQuest, uncompleteQuest,
  } = useGame();
  const { active, elapsed, stats } = useWorkout();

  if (!profile) return null;

  const unit = profile.unit || 'kg';
  const bossPct = raid ? Math.min(100, (raid.damage / raid.hp) * 100) : 0;
  const open = quests.daily.filter((q) => !quests.completed.includes(q.id));
  const recent = profile.recentWorkouts?.[0];

  return (
    <div className="space-y-3">
      {/* ---------------- STATUS ---------------- */}
      <SystemWindow title="Status" subtitle={rank?.name} scan delay={0.02}>
        <StatusWindow profile={profile} xp={xp} rank={rank} streak={streak} readiness={readiness} />

        <div className="sys-rule my-3" />

        <SystemMeter
          label="Experience"
          right={`${xp.xpIntoLevel.toLocaleString()} / ${xp.xpForLevel.toLocaleString()}`}
          value={xp.xpIntoLevel}
          max={xp.xpForLevel}
        />
        {nextRank && (
          <p className="mt-2 text-center text-[11px] text-[rgb(var(--sys-dim))]">
            {nextRank.minLevel - xp.level} levels to{' '}
            <span style={{ color: nextRank.color }}>{nextRank.name}</span>
          </p>
        )}
      </SystemWindow>

      {/* ---------------- primary action ---------------- */}
      {active ? (
        <SystemWindow tone="good" delay={0.06} bodyClassName="p-3">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="sys-label mb-0.5">Session in progress</div>
              <div className="sys-value tnum text-xl leading-tight">{formatDuration(elapsed)}</div>
              <div className="sys-label mt-0.5 normal-case tracking-normal">
                {stats.completedSets} sets · {Math.round(fromKg(stats.volumeKg, unit)).toLocaleString()} {unit}
              </div>
            </div>
            <SystemButton as={Link} to="/workout" variant="primary" icon={Timer}>
              Resume
            </SystemButton>
          </div>
        </SystemWindow>
      ) : (
        <SystemWindow delay={0.06} bodyClassName="p-3">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="sys-label mb-0.5">Readiness</div>
              <div className="sys-value sys-accent sys-glow text-xl leading-tight tnum">
                {Math.round(readiness * 100)}%
              </div>
              <div className="sys-label mt-0.5 normal-case tracking-normal">{readinessCopy(readiness)}</div>
            </div>
            <SystemButton as={Link} to="/workout" variant="primary" icon={Play}>
              Enter Gate
            </SystemButton>
          </div>
        </SystemWindow>
      )}

      {/* ---------------- DAILY QUESTS ---------------- */}
      <SystemWindow
        title="Daily Quest"
        subtitle={open.length ? `${open.length} remaining` : 'All cleared'}
        delay={0.1}
      >
        <div className="space-y-2">
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
            <p className="py-3 text-center text-xs text-[rgb(var(--sys-dim))]">
              The System is calibrating. Log a session and the board fills in.
            </p>
          )}
        </div>

        <Link
          to="/quests"
          className="mt-3 flex items-center justify-center gap-1.5 py-2 text-xs text-[rgb(var(--sys-dim))]"
        >
          Open quest board
          <ChevronRight size={13} />
        </Link>

        {open.length > 0 && (
          <p
            className="mt-1 text-center text-[10px] uppercase tracking-widest"
            style={{ color: 'rgb(var(--sys-danger))' }}
          >
            Failure to complete daily quests carries a penalty
          </p>
        )}
      </SystemWindow>

      {/* ---------------- RAID ---------------- */}
      <Link to="/raid" className="block">
        <SystemWindow title="Weekly Gate" subtitle={raid?.week} delay={0.14} style={{ '--sys': hexToRgb(boss.color) }}>
          <div className="mb-3 flex items-center gap-3">
            <Skull size={26} style={{ color: boss.color }} className="shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="sys-value truncate text-base leading-tight">{boss.name}</div>
              <div className="sys-label truncate normal-case tracking-normal">{boss.title}</div>
            </div>
            <ChevronRight size={16} className="shrink-0 text-[rgb(var(--sys-dim))]" />
          </div>

          <SystemMeter
            label="Integrity"
            right={`${Math.max(0, raid.hp - raid.damage).toLocaleString()} / ${raid.hp.toLocaleString()}`}
            value={raid.hp - raid.damage}
            max={raid.hp}
            color={boss.color}
            height={12}
          />

          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="text-[rgb(var(--sys-dim))]">
              Weak to <span style={{ color: boss.accent }}>{boss.weaknessLabel}</span>
            </span>
            <span className="tnum text-[rgb(var(--sys-dim))]">{Math.round(bossPct)}% cleared</span>
          </div>
        </SystemWindow>
      </Link>

      {/* ---------------- SHADOW / STREAK ---------------- */}
      <SystemWindow title="Shadow Extraction" delay={0.18}>
        <div className="mb-3 flex items-baseline gap-2">
          <Flame size={18} style={{ color: streak.current > 0 ? 'rgb(var(--sys-gold))' : 'rgb(var(--sys-dim))' }} />
          <span
            className="sys-value text-2xl leading-none tnum"
            style={{ color: streak.current > 0 ? 'rgb(var(--sys-gold))' : 'rgb(var(--sys-dim))' }}
          >
            {streak.current}
          </span>
          <span className="sys-label">day streak</span>
          {streak.longest > streak.current && (
            <span className="sys-label ml-auto">best {streak.longest}</span>
          )}
        </div>

        {streak.atRisk && (
          <div
            className="mb-3 p-2 text-center text-[11px]"
            style={{ border: '1px solid rgb(var(--sys-danger)/0.5)', background: 'rgb(var(--sys-danger)/0.1)', color: 'rgb(var(--sys-danger))' }}
          >
            Streak expires today. Log anything to hold it.
          </div>
        )}

        {shadowProgress && (
          <>
            <div className="mb-1.5 flex items-center gap-2">
              <Ghost size={13} style={{ color: `rgb(${shadowProgress.shadow.theme.accent})` }} />
              <span className="sys-value text-sm">{shadowProgress.shadow.name}</span>
              <span className="sys-label ml-auto">
                {Math.floor(shadowProgress.actual).toLocaleString()} / {shadowProgress.target.toLocaleString()}
              </span>
            </div>
            <SystemMeter
              value={shadowProgress.actual}
              max={shadowProgress.target}
              color={`rgb(${shadowProgress.shadow.theme.accent})`}
              height={6}
            />
            <p className="mt-1.5 text-[11px] text-[rgb(var(--sys-dim))]">
              {REQUIREMENT_LABELS[shadowProgress.shadow.requirement.type]?.(shadowProgress.shadow.requirement.value)}
            </p>
          </>
        )}

        {(profile.shadows || []).length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {profile.shadows.map((id) => (
              <span key={id} className="stat-chip">
                <Ghost size={10} />
                {id}
              </span>
            ))}
          </div>
        )}
      </SystemWindow>

      {/* ---------------- LAST SESSION ---------------- */}
      {recent && (
        <SystemWindow title="Last Session" subtitle={relativeTime(recent.finishedAt)} delay={0.22}>
          <div className="mb-3 sys-value text-base">{recent.name}</div>
          <div className="grid grid-cols-2 gap-2">
            <SystemPanel className="px-3 py-2">
              <div className="sys-label mb-0.5">Volume</div>
              <div className="sys-value tnum text-sm">
                {Math.round(fromKg(recent.volumeKg, unit)).toLocaleString()} {unit}
              </div>
            </SystemPanel>
            <SystemPanel className="px-3 py-2">
              <div className="sys-label mb-0.5">Sets</div>
              <div className="sys-value tnum text-sm">{recent.sets}</div>
            </SystemPanel>
            <SystemPanel className="px-3 py-2">
              <div className="sys-label mb-0.5">XP earned</div>
              <div className="sys-value sys-accent tnum text-sm">+{recent.xp}</div>
            </SystemPanel>
            <SystemPanel className="px-3 py-2">
              <div className="sys-label mb-0.5">Duration</div>
              <div className="sys-value tnum text-sm">{formatDuration(recent.durationSec)}</div>
            </SystemPanel>
          </div>

          <Link
            to="/history"
            className="mt-3 flex items-center justify-center gap-1.5 py-1.5 text-xs text-[rgb(var(--sys-dim))]"
          >
            <TrendingUp size={13} />
            Full training log
          </Link>
        </SystemWindow>
      )}

      {/* ---------------- lifetime ---------------- */}
      <SystemWindow title="Career" delay={0.26}>
        <div className="grid grid-cols-2 gap-2">
          <SystemPanel className="px-3 py-2">
            <div className="sys-label mb-0.5 flex items-center gap-1.5">
              <Dumbbell size={10} /> Sessions
            </div>
            <div className="sys-value tnum text-sm">{profile.totals.workouts.toLocaleString()}</div>
          </SystemPanel>
          <SystemPanel className="px-3 py-2">
            <div className="sys-label mb-0.5 flex items-center gap-1.5">
              <TrendingUp size={10} /> Tonnage
            </div>
            <div className="sys-value tnum text-sm">
              {Math.round(fromKg(profile.totals.volumeKg, unit)).toLocaleString()} {unit}
            </div>
          </SystemPanel>
          <SystemPanel className="px-3 py-2">
            <div className="sys-label mb-0.5 flex items-center gap-1.5">
              <Swords size={10} /> Records
            </div>
            <div className="sys-value tnum text-sm">{profile.totals.prCount}</div>
          </SystemPanel>
          <SystemPanel className="px-3 py-2">
            <div className="sys-label mb-0.5 flex items-center gap-1.5">
              <Skull size={10} /> Gates cleared
            </div>
            <div className="sys-value tnum text-sm">{profile.totals.bossKills}</div>
          </SystemPanel>
        </div>
      </SystemWindow>
    </div>
  );
}

/** Boss colours arrive as hex; the System's variables are space-separated RGB. */
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

function readinessCopy(readiness) {
  if (readiness > 0.85) return 'Fully recovered. Go heavy.';
  if (readiness > 0.6) return 'Cleared for full contact.';
  if (readiness > 0.4) return 'Moderate fatigue. Train around it.';
  if (readiness > 0.2) return 'Heavily fatigued. Keep it light.';
  return 'Systemically smoked. Recover.';
}
