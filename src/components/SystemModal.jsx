import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUp, Crown, Flame, Skull, Swords, Trophy, Zap } from 'lucide-react';
import { useSystem } from '../context/SystemContext';
import { useGame } from '../context/GameContext';
import { HunterAvatar } from './avatar/HunterAvatar';
import { STATS } from '../engine/constants';
import { SystemButton } from './system/SystemButton';
import { SystemType } from './system/SystemAlert';
import { PR_TYPES } from '../engine/records';
import { play } from '../lib/sound';

// ---------------------------------------------------------------------------
// The System's progression notifications.
//
// Events arrive in a burst when a workout is committed and are shown one at a
// time, each as a full System window with the [!] badge above it — the moment
// the whole theme exists for.
// ---------------------------------------------------------------------------

const CONFIG = {
  levelUp: { title: 'Level Up', icon: ArrowUp, tone: 'default', cue: 'levelUp' },
  pr: { title: 'New Record', icon: Trophy, tone: 'gold', cue: 'record' },
  shadowExtracted: { title: 'Shadow Extracted', icon: Crown, tone: 'shadow', cue: 'shadow' },
  bossDefeated: { title: 'Gate Cleared', icon: Skull, tone: 'danger', cue: 'defeat' },
  raidDamage: { title: 'Damage Dealt', icon: Swords, tone: 'danger', cue: 'damage' },
  streak: { title: 'Streak Extended', icon: Flame, tone: 'gold', cue: 'questComplete' },
};

const TONE_VAR = {
  default: undefined,
  gold: { '--sys': 'var(--sys-gold)' },
  danger: { '--sys': 'var(--sys-danger)' },
  good: { '--sys': 'var(--sys-good)' },
  shadow: { '--sys': '167 139 250' },
};

export function SystemModal() {
  const { current, dismiss } = useSystem();
  const config = current ? CONFIG[current.type] : null;

  // Each event announces itself as its window opens.
  useEffect(() => {
    if (config?.cue) play(config.cue);
  }, [current?.key, config?.cue]);

  // Enter/Space/Escape all dismiss, so a burst of six can be cleared fast.
  useEffect(() => {
    if (!current) return undefined;
    const onKey = (e) => {
      if (['Enter', 'Escape', ' '].includes(e.key)) {
        e.preventDefault();
        dismiss();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [current, dismiss]);

  return (
    <AnimatePresence mode="wait">
      {current && config && (
        <motion.div
          key={current.key}
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          style={TONE_VAR[config.tone]}
        >
          <motion.div className="absolute inset-0 bg-[#01060f]/92 backdrop-blur-md" onClick={dismiss} />

          <div className="relative w-full max-w-sm">
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.6 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.05, type: 'spring', stiffness: 380, damping: 20 }}
              className="mx-auto mb-3 flex h-12 w-12 items-center justify-center"
              style={{
                border: '1px solid rgb(var(--sys) / 0.9)',
                background: 'rgb(var(--sys) / 0.14)',
                boxShadow: '0 0 26px -6px rgb(var(--sys))',
                clipPath: 'polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)',
              }}
            >
              <config.icon size={22} className="sys-accent" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scaleY: 0.03, filter: 'brightness(2.4)' }}
              animate={{ opacity: 1, scaleY: 1, filter: 'brightness(1)' }}
              exit={{ opacity: 0, scaleY: 0.03 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="sys-window sys-brackets"
            >
              <span className="sys-scan" aria-hidden />

              <header className="relative px-4 pt-4">
                <h2 className="sys-title text-center text-sm">
                  <SystemType text={config.title.toUpperCase()} speed={24} />
                </h2>
                <div className="sys-rule mt-2.5" />
              </header>

              <div className="relative px-5 py-5">
                {current.type === 'levelUp' && <LevelUp event={current} />}
                {current.type === 'pr' && <Record event={current} />}
                {current.type === 'shadowExtracted' && <Shadow event={current} />}
                {current.type === 'bossDefeated' && <Boss event={current} />}
                {current.type === 'raidDamage' && <Damage event={current} />}
                {current.type === 'streak' && <Streak event={current} />}
              </div>

              <div className="sys-rule" />
              <div className="relative p-3">
                <SystemButton variant="primary" className="w-full" onClick={dismiss}>
                  Confirm
                </SystemButton>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function LevelUp({ event }) {
  const { profile } = useGame();

  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.12, type: 'spring', stiffness: 280, damping: 16 }}
        className="sys-value sys-accent sys-glow mb-1 text-6xl leading-none"
      >
        {event.level}
      </motion.div>
      <p className="mb-5 text-sm text-[rgb(var(--sys-dim))]">
        {event.points} attribute points allocated.
      </p>

      {/* A rank up is the largest moment the app has. Show the hunter taking
          on the new rank's colour rather than naming it in a box. */}
      {event.rankUp && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mb-4 flex items-center gap-3 p-3"
          style={{ border: `1px solid ${event.rank.color}66`, background: `${event.rank.color}12` }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <HunterAvatar
              className="h-[104px] w-[62px]"
              stats={profile?.stats}
              bodyType={profile?.bodyType}
              sex={profile?.gender}
              color={event.rank.color}
            />
          </motion.div>
          <div className="min-w-0 flex-1 text-left">
            <div className="sys-label mb-1">Rank up</div>
            <div
              className="sys-value text-lg leading-tight"
              style={{ color: event.rank.color, textShadow: `0 0 14px ${event.rank.glow}` }}
            >
              {event.rank.name}
            </div>
            <div className="sys-label mt-0.5 normal-case tracking-normal">{event.rank.title}</div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-5 gap-1.5">
        {STATS.map((stat, i) => {
          const gained = event.award?.[stat.id] || 0;
          return (
            <motion.div
              key={stat.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.05 }}
              className="px-1 py-2"
              style={{ border: '1px solid rgb(var(--sys)/0.2)' }}
            >
              <div className="sys-label mb-1">{stat.short}</div>
              <div
                className="sys-value tnum text-sm"
                style={{ color: gained > 0 ? 'rgb(var(--sys))' : 'rgb(var(--sys-dim))' }}
              >
                {gained > 0 ? `+${gained}` : '—'}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function Record({ event }) {
  const { pr } = event;
  const meta = PR_TYPES[pr.type] || PR_TYPES.weight;
  const isCount = pr.type === 'reps';
  const fmt = (v) => (isCount ? Math.round(v) : `${v.toFixed(1)} kg`);

  return (
    <div className="text-center">
      <div className="sys-label mb-1">{meta.label}</div>
      <h3 className="sys-value mb-4 text-lg">{pr.name}</h3>

      <div className="flex items-center justify-center gap-4">
        <div className="text-right">
          <div className="sys-label mb-1">Previous</div>
          <div className="tnum font-mono text-base text-[rgb(var(--sys-dim))] line-through">
            {pr.previous > 0 ? fmt(pr.previous) : '—'}
          </div>
        </div>
        <ArrowUp size={18} className="rotate-90 text-[rgb(var(--sys-dim))]" />
        <div className="text-left">
          <div className="sys-label mb-1">New</div>
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.14, type: 'spring', stiffness: 300 }}
            className="sys-value sys-accent sys-glow tnum text-2xl"
          >
            {fmt(pr.value)}
          </motion.div>
        </div>
      </div>

      {pr.previous > 0 && (
        <p className="mt-4 text-sm" style={{ color: 'rgb(var(--sys-good))' }}>
          +{fmt(pr.delta)} ({(pr.improvement * 100).toFixed(1)}%)
        </p>
      )}
      {pr.firstTime && <p className="mt-4 text-sm text-[rgb(var(--sys-dim))]">First entry — baseline set.</p>}
      {pr.alsoBroke?.length > 0 && (
        <p className="mt-2 text-xs text-[rgb(var(--sys-dim))]">
          Also broke: {pr.alsoBroke.map((t) => PR_TYPES[t]?.short || t).join(' · ')}
        </p>
      )}
    </div>
  );
}

function Shadow({ event }) {
  const { shadow } = event;
  return (
    <div className="text-center">
      <motion.svg
        viewBox="0 0 64 64"
        className="mx-auto mb-4 h-20 w-20"
        initial={{ scale: 0.4, opacity: 0, rotate: -18 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 15 }}
      >
        <path
          d={shadow.sigil}
          fill={`rgb(${shadow.theme.accent} / 0.18)`}
          stroke={`rgb(${shadow.theme.accent})`}
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
      </motion.svg>
      <h3 className="sys-value sys-glow mb-1 text-xl" style={{ color: `rgb(${shadow.theme.accent})` }}>
        {shadow.name}
      </h3>
      <div className="sys-label mb-4">{shadow.title}</div>
      <p className="mb-4 text-sm italic leading-relaxed text-[rgb(var(--sys-dim))]">
        &ldquo;{shadow.flavor}&rdquo;
      </p>
      <div className="p-2.5 text-xs text-[rgb(var(--sys-dim))]" style={{ border: '1px solid rgb(var(--sys)/0.25)' }}>
        <span className="text-[rgb(var(--sys-ink))]">{shadow.theme.name}</span> interface theme unlocked.
        Equip it from your profile.
      </div>
    </div>
  );
}

function Boss({ event }) {
  const { boss, reward } = event;
  return (
    <div className="text-center">
      <motion.div initial={{ scale: 1.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mb-3">
        <Skull size={48} className="mx-auto" style={{ color: boss.color }} />
      </motion.div>
      <h3 className="sys-value mb-1 text-xl" style={{ color: boss.color }}>
        {boss.name}
      </h3>
      <div className="sys-label mb-4">{boss.title} — defeated</div>
      <p className="mb-4 text-sm italic leading-relaxed text-[rgb(var(--sys-dim))]">
        &ldquo;{boss.flavor}&rdquo;
      </p>
      <div
        className="flex items-center justify-center gap-2 px-4 py-2.5"
        style={{ border: '1px solid rgb(var(--sys-gold)/0.5)', background: 'rgb(var(--sys-gold)/0.1)' }}
      >
        <Zap size={15} style={{ color: 'rgb(var(--sys-gold))' }} />
        <span className="sys-value tnum text-sm" style={{ color: 'rgb(var(--sys-gold))' }}>
          +{reward.xp} XP
        </span>
      </div>
    </div>
  );
}

function Damage({ event }) {
  return (
    <div className="text-center">
      <div className="sys-label mb-2">{event.boss.name}</div>
      <motion.div
        initial={{ scale: 1.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 18 }}
        className="sys-value sys-accent sys-glow mb-4 text-5xl tnum"
      >
        {event.amount.toLocaleString()}
      </motion.div>
      <div className="space-y-1.5 text-left">
        {event.hits.slice(0, 5).map((hit, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08 + i * 0.05 }}
            className="flex items-center justify-between gap-3 px-2.5 py-1.5 text-xs"
            style={{ border: '1px solid rgb(var(--sys)/0.15)' }}
          >
            <span className="truncate text-[rgb(var(--sys-dim))]">
              {hit.label}
              {hit.weakness && <span className="ml-1.5" style={{ color: 'rgb(var(--sys-gold))' }}>WEAK</span>}
            </span>
            <span className="tnum shrink-0 font-mono sys-accent">-{hit.amount.toLocaleString()}</span>
          </motion.div>
        ))}
      </div>
      <div className="mt-4 text-xs tnum text-[rgb(var(--sys-dim))]">
        {Math.min(100, Math.round((event.raid.damage / event.raid.hp) * 100))}% of the gate cleared
      </div>
    </div>
  );
}

function Streak({ event }) {
  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 18 }}
        className="mb-2 flex items-center justify-center gap-2"
      >
        <Flame size={34} className="sys-accent" />
        <span className="sys-value sys-accent sys-glow text-5xl tnum">{event.current}</span>
      </motion.div>
      <p className="text-sm text-[rgb(var(--sys-dim))]">
        {event.current} day{event.current === 1 ? '' : 's'} unbroken.
      </p>
    </div>
  );
}

export default SystemModal;
