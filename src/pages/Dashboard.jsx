import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronRight, Dumbbell, Flame, Ghost, Heart, Play, Skull, Sparkles, Swords,
  Timer, TrendingUp, Zap,
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useWorkout } from '../context/WorkoutContext';
import { SystemWindow, SystemPanel } from '../components/system/SystemWindow';
import { SystemButton } from '../components/system/SystemButton';
import { SystemMeter } from '../components/system/SystemMeter';
import { HunterPortrait } from '../components/avatar/HunterPortrait';
import { BossFigure } from '../components/raid/BossFigure';
import { QuestCard } from '../components/quests/QuestCard';
import { QuestTimer } from '../components/quests/QuestTimer';
import { fromKg } from '../engine/constants';
import { formatDuration, relativeTime } from '../lib/date';

// ---------------------------------------------------------------------------
// STATUS
//
// The hunter's home screen. It leads with the *figure* — the body they are
// building — and keeps everything below it to a glanceable number and an
// icon. The full character sheet, attribute radar and history live one tap
// away on the profile; this screen exists to answer "how am I doing, and what
// do I do next" without reading a paragraph.
// ---------------------------------------------------------------------------

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
  const s = profile.stats || {};
  const hp = 100 + (s.vit || 0) * 12;
  const mp = 50 + (s.int || 0) * 8 + (s.per || 0) * 4;
  const fatigue = Math.round((1 - (readiness ?? 1)) * 100);

  return (
    <div className="space-y-3">
      {/* ---------------- STATUS: the hunter, seen ---------------- */}
      <SystemWindow title="Status" subtitle={rank?.name} scan delay={0.02} bodyClassName="p-3">
        <Link to="/profile" className="tap flex items-stretch gap-3.5">
          <HunterPortrait profile={profile} rank={rank} size={112} />

          <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="sys-label">Lv</span>
                <span className="sys-value sys-accent sys-glow tnum text-3xl leading-none">
                  {xp.level}
                </span>
              </div>
              <div className="sys-value mt-1 truncate text-sm">{profile.displayName || 'Hunter'}</div>
              <div className="sys-label mt-0.5 truncate normal-case tracking-normal">
                {profile.title || rank?.title}
              </div>
            </div>

            {/* Vitals as bars, not "HP: 220 / 220" rows. */}
            <div className="mt-2.5 space-y-[5px]">
              <Vital icon={Heart} value={hp} max={hp} color="99 245 165" />
              <Vital icon={Sparkles} value={mp} max={mp} color="122 190 255" />
              <Vital
                icon={Flame}
                value={fatigue}
                max={100}
                color={fatigue > 60 ? '255 77 94' : '255 215 110'}
              />
            </div>
          </div>
        </Link>

        <div className="sys-rule my-3" />

        <SystemMeter
          label={`Level ${xp.level}`}
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
            <ReadinessDial value={readiness} />
            <div className="min-w-0 flex-1">
              <div className="sys-label mb-0.5">Readiness</div>
              <div className="sys-label normal-case tracking-normal">{readinessCopy(readiness)}</div>
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

        <div className="sys-rule my-3" />
        <QuestTimer open={open.length} compact />

        <Link
          to="/quests"
          className="mt-2 flex items-center justify-center gap-1.5 py-2 text-xs text-[rgb(var(--sys-dim))]"
        >
          Open quest board
          <ChevronRight size={13} />
        </Link>
      </SystemWindow>

      {/* ---------------- RAID ---------------- */}
      <Link to="/raid" className="tap block">
        <SystemWindow title="Weekly Gate" subtitle={raid?.week} delay={0.14} style={{ '--sys': hexToRgb(boss.color) }}>
          <div className="mb-2 flex items-center gap-2">
            <BossFigure
              boss={boss}
              damage={raid.damage}
              hp={raid.hp}
              defeated={raid.damage >= raid.hp}
              className="-my-2 h-[76px] w-[76px] shrink-0"
            />
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
        <div className="flex items-center gap-3">
          <StreakFlame count={streak.current} atRisk={streak.atRisk} />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-1.5">
              <span
                className="sys-value tnum text-3xl leading-none"
                style={{ color: streak.current > 0 ? 'rgb(var(--sys-gold))' : 'rgb(var(--sys-dim))' }}
              >
                {streak.current}
              </span>
              <span className="sys-label">day streak</span>
            </div>
            {streak.atRisk ? (
              <div className="sys-label mt-1 normal-case tracking-normal" style={{ color: 'rgb(var(--sys-danger))' }}>
                Expires today — log anything to hold it.
              </div>
            ) : (
              <div className="sys-label mt-1 normal-case tracking-normal">
                Best {streak.longest} · {(profile.shadows || []).length} extracted
              </div>
            )}
          </div>
        </div>

        {shadowProgress && (
          <>
            <div className="sys-rule my-3" />
            <div className="mb-1.5 flex items-center gap-2">
              <Ghost size={13} style={{ color: `rgb(${shadowProgress.shadow.theme.accent})` }} />
              <span className="sys-value text-sm">{shadowProgress.shadow.name}</span>
              <span className="sys-label ml-auto tnum">
                {Math.floor(shadowProgress.actual).toLocaleString()} / {shadowProgress.target.toLocaleString()}
              </span>
            </div>
            <SystemMeter
              value={shadowProgress.actual}
              max={shadowProgress.target}
              color={`rgb(${shadowProgress.shadow.theme.accent})`}
              height={6}
            />
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
        <Link to="/history" className="tap block">
          <SystemWindow title="Last Session" subtitle={relativeTime(recent.finishedAt)} delay={0.22}>
            <div className="mb-3 flex items-center gap-2">
              <div className="sys-value min-w-0 flex-1 truncate text-base">{recent.name}</div>
              <ChevronRight size={16} className="shrink-0 text-[rgb(var(--sys-dim))]" />
            </div>
            <div className="grid grid-cols-4 gap-2">
              <Tile icon={TrendingUp} value={Math.round(fromKg(recent.volumeKg, unit)).toLocaleString()} label={unit} />
              <Tile icon={Dumbbell} value={recent.sets} label="sets" />
              <Tile icon={Zap} value={`+${recent.xp}`} label="xp" accent />
              <Tile icon={Timer} value={formatDuration(recent.durationSec)} label="time" />
            </div>
          </SystemWindow>
        </Link>
      )}

      {/* ---------------- lifetime ---------------- */}
      <SystemWindow title="Career" delay={0.26}>
        <div className="grid grid-cols-4 gap-2">
          <Tile icon={Dumbbell} value={profile.totals.workouts.toLocaleString()} label="sessions" />
          <Tile
            icon={TrendingUp}
            value={compact(fromKg(profile.totals.volumeKg, unit))}
            label={`${unit} lifted`}
          />
          <Tile icon={Swords} value={profile.totals.prCount} label="records" />
          <Tile icon={Skull} value={profile.totals.bossKills} label="gates" />
        </div>
      </SystemWindow>
    </div>
  );
}

/** A thin vitals bar: an icon and a fill, no numbers to read. */
function Vital({ icon: Icon, value, max, color }) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={11} style={{ color: `rgb(${color})` }} className="shrink-0" />
      <div className="sys-meter h-[3px] flex-1">
        <motion.div
          className="h-full"
          style={{ background: `rgb(${color})`, boxShadow: `0 0 6px rgb(${color}/0.6)` }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, (value / (max || 1)) * 100)}%` }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}

/** Readiness as a ring rather than a percentage nobody reads twice. */
function ReadinessDial({ value = 1 }) {
  const pct = Math.max(0, Math.min(1, value));
  const r = 20;
  const circumference = 2 * Math.PI * r;
  const tint = pct > 0.6 ? 'var(--sys-good)' : pct > 0.35 ? 'var(--sys-gold)' : 'var(--sys-danger)';

  return (
    <div className="relative h-[52px] w-[52px] shrink-0">
      <svg viewBox="0 0 52 52" className="h-full w-full -rotate-90">
        <circle cx="26" cy="26" r={r} fill="none" stroke="rgb(var(--sys)/0.15)" strokeWidth="4" />
        <motion.circle
          cx="26"
          cy="26"
          r={r}
          fill="none"
          stroke={`rgb(${tint})`}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - pct) }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          style={{ filter: `drop-shadow(0 0 5px rgb(${tint}/0.8))` }}
        />
      </svg>
      <span
        className="sys-value tnum absolute inset-0 flex items-center justify-center text-sm"
        style={{ color: `rgb(${tint})` }}
      >
        {Math.round(pct * 100)}
      </span>
    </div>
  );
}

/** The streak, drawn as a flame that grows with the count. */
function StreakFlame({ count = 0, atRisk }) {
  const lit = count > 0;
  const scale = Math.min(1, 0.45 + count * 0.045);
  const color = atRisk ? 'var(--sys-danger)' : lit ? 'var(--sys-gold)' : 'var(--sys-dim)';

  return (
    <div className="relative flex h-[52px] w-[52px] shrink-0 items-center justify-center">
      {lit && (
        <motion.span
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle, rgb(${color}/0.35), transparent 68%)`,
          }}
          animate={{ opacity: [0.55, 1, 0.55] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      <motion.span
        style={{ color: `rgb(${color})`, filter: lit ? `drop-shadow(0 0 8px rgb(${color}/0.9))` : undefined }}
        animate={lit ? { scale: [scale, scale * 1.08, scale] } : { scale }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Flame size={44} strokeWidth={1.5} />
      </motion.span>
    </div>
  );
}

/** A number under an icon. The unit is the caption, so nothing needs a sentence. */
function Tile({ icon: Icon, value, label, accent }) {
  return (
    <SystemPanel className="flex flex-col items-center gap-1 px-1 py-2.5">
      <Icon size={13} className={accent ? 'sys-accent' : 'text-[rgb(var(--sys-dim))]'} />
      <span className={`sys-value tnum text-sm leading-none ${accent ? 'sys-accent' : ''}`}>{value}</span>
      <span className="sys-label text-[9px] leading-none">{label}</span>
    </SystemPanel>
  );
}

/** Lifetime tonnage runs to seven figures; a tile has room for four characters. */
function compact(n) {
  const v = Math.round(n) || 0;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 10_000) return `${Math.round(v / 1000)}k`;
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return v.toLocaleString();
}

/** Boss colours arrive as hex; the System's variables are space-separated RGB. */
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

// Short enough to sit on one line beside the dial on a 390px screen.
function readinessCopy(readiness) {
  if (readiness > 0.85) return 'Fully recovered';
  if (readiness > 0.6) return 'Cleared to train';
  if (readiness > 0.4) return 'Moderate fatigue';
  if (readiness > 0.2) return 'Heavily fatigued';
  return 'Recover today';
}
