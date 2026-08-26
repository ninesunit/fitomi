import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUp, Crown, Flame, Skull, Sword, Trophy, Zap } from 'lucide-react';
import { useSystem } from '../context/SystemContext';
import { STATS } from '../engine/constants';
import { RankBadge } from './ui/RankBadge';
import { Button } from './ui/Button';
import { PR_TYPES } from '../engine/records';

// ---------------------------------------------------------------------------
// The System window.
//
// Progression events surface here one at a time as full-screen notifications —
// the moment the whole theme exists for. The header text types itself in, the
// panel snaps open, and the content differs per event type.
// ---------------------------------------------------------------------------

function Typewriter({ text, speed = 26, className }) {
  const [shown, setShown] = useState('');

  useEffect(() => {
    setShown('');
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span className={className}>
      {shown}
      {shown.length < text.length && <span className="ml-0.5 inline-block w-2 animate-pulse">▌</span>}
    </span>
  );
}

const CONFIG = {
  levelUp: { title: 'LEVEL UP', icon: ArrowUp, color: '#26bdff' },
  pr: { title: 'NEW RECORD', icon: Trophy, color: '#fbbf24' },
  shadowExtracted: { title: 'SHADOW EXTRACTED', icon: Crown, color: '#a78bfa' },
  bossDefeated: { title: 'GATE CLEARED', icon: Skull, color: '#ef4444' },
  raidDamage: { title: 'DAMAGE DEALT', icon: Sword, color: '#f87171' },
  streak: { title: 'STREAK EXTENDED', icon: Flame, color: '#fb923c' },
};

export function SystemModal() {
  const { current, dismiss } = useSystem();
  const config = current ? CONFIG[current.type] : null;

  // Enter dismisses, so a burst of six events can be cleared without reaching
  // for the mouse mid-session.
  useEffect(() => {
    if (!current) return undefined;
    const onKey = (e) => {
      if (e.key === 'Enter' || e.key === 'Escape' || e.key === ' ') {
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
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="absolute inset-0 bg-void-950/88 backdrop-blur-md"
            onClick={dismiss}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 18 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: -10 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className="panel clip-notch relative w-full max-w-md overflow-hidden"
            style={{
              borderColor: `${config.color}66`,
              boxShadow: `0 0 0 1px ${config.color}44, 0 0 70px -14px ${config.color}`,
            }}
          >
            {/* Scanline sweep — the panel reads as a projected interface. */}
            <span
              className="pointer-events-none absolute inset-x-0 top-0 h-14 animate-scanline opacity-40"
              style={{ background: `linear-gradient(180deg, ${config.color}22, transparent)` }}
            />

            <header
              className="flex items-center gap-2.5 border-b px-5 py-3.5"
              style={{ borderColor: `${config.color}33`, background: `${config.color}12` }}
            >
              <config.icon size={18} style={{ color: config.color }} />
              <span className="font-mono text-sm font-bold tracking-[0.28em]" style={{ color: config.color }}>
                <Typewriter text={config.title} />
              </span>
              <span className="ml-auto font-mono text-[10px] tracking-widest text-slate-500">SYSTEM</span>
            </header>

            <div className="px-5 py-6">
              {current.type === 'levelUp' && <LevelUpBody event={current} color={config.color} />}
              {current.type === 'pr' && <PrBody event={current} />}
              {current.type === 'shadowExtracted' && <ShadowBody event={current} />}
              {current.type === 'bossDefeated' && <BossBody event={current} />}
              {current.type === 'raidDamage' && <DamageBody event={current} />}
              {current.type === 'streak' && <StreakBody event={current} />}
            </div>

            <footer className="border-t border-white/10 px-5 py-3.5">
              <Button variant="primary" className="w-full" onClick={dismiss}>
                Acknowledge
              </Button>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function LevelUpBody({ event, color }) {
  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.14, type: 'spring', stiffness: 260, damping: 16 }}
        className="mb-1 font-display text-6xl font-bold tnum"
        style={{ color, textShadow: `0 0 34px ${color}` }}
      >
        {event.level}
      </motion.div>
      <p className="mb-5 text-sm text-slate-400">
        You have reached level {event.level}. {event.points} stat points allocated.
      </p>

      {event.rankUp && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-5 flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3"
        >
          <RankBadge rank={event.rank} size={46} showName />
        </motion.div>
      )}

      <div className="grid grid-cols-5 gap-1.5">
        {STATS.map((stat, i) => {
          const gained = event.award?.[stat.id] || 0;
          return (
            <motion.div
              key={stat.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24 + i * 0.05 }}
              className="rounded-lg border border-white/10 bg-void-950/60 px-1 py-2"
            >
              <div className="hud-label mb-1">{stat.short}</div>
              <div
                className="tnum font-mono text-sm font-bold"
                style={{ color: gained > 0 ? color : '#475569' }}
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

function PrBody({ event }) {
  const { pr } = event;
  const meta = PR_TYPES[pr.type] || PR_TYPES.weight;
  const isCount = pr.type === 'reps';
  const format = (v) => (isCount ? Math.round(v) : `${v.toFixed(1)} kg`);

  return (
    <div className="text-center">
      <div className="hud-label mb-1.5">{meta.label}</div>
      <h3 className="mb-4 font-display text-xl font-semibold text-slate-100">{pr.name}</h3>

      <div className="mb-4 flex items-center justify-center gap-4">
        <div className="text-right">
          <div className="hud-label mb-1">Previous</div>
          <div className="tnum font-mono text-lg text-slate-500 line-through">
            {pr.previous > 0 ? format(pr.previous) : '—'}
          </div>
        </div>
        <ArrowUp size={20} className="rotate-90 text-slate-600" />
        <div className="text-left">
          <div className="hud-label mb-1">New</div>
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.16, type: 'spring', stiffness: 300 }}
            className="tnum font-mono text-2xl font-bold"
            style={{ color: meta.color, textShadow: `0 0 20px ${meta.color}88` }}
          >
            {format(pr.value)}
          </motion.div>
        </div>
      </div>

      {pr.previous > 0 && (
        <p className="text-sm text-mana-400">
          +{format(pr.delta)} ({(pr.improvement * 100).toFixed(1)}% improvement)
        </p>
      )}
      {pr.firstTime && <p className="text-sm text-slate-500">First time logged — baseline set.</p>}
      {pr.alsoBroke?.length > 0 && (
        <p className="mt-2 text-xs text-slate-500">
          Also broke: {pr.alsoBroke.map((t) => PR_TYPES[t]?.short || t).join(' · ')}
        </p>
      )}
    </div>
  );
}

function ShadowBody({ event }) {
  const { shadow } = event;
  return (
    <div className="text-center">
      <motion.svg
        viewBox="0 0 64 64"
        className="mx-auto mb-4 h-24 w-24"
        initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
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

      <h3
        className="mb-1 font-display text-2xl font-bold"
        style={{ color: `rgb(${shadow.theme.accent})`, textShadow: `0 0 24px rgb(${shadow.theme.accent} / 0.7)` }}
      >
        {shadow.name}
      </h3>
      <div className="hud-label mb-4">{shadow.title}</div>
      <p className="mb-4 text-sm italic text-slate-400">&ldquo;{shadow.flavor}&rdquo;</p>
      <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-400">
        Unlocked the <span className="font-semibold text-slate-200">{shadow.theme.name}</span> interface theme.
        Equip it from your profile.
      </div>
    </div>
  );
}

function BossBody({ event }) {
  const { boss, reward } = event;
  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 1.2, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-3"
      >
        <Skull size={56} className="mx-auto" style={{ color: boss.color }} />
      </motion.div>
      <h3 className="mb-1 font-display text-2xl font-bold" style={{ color: boss.color }}>
        {boss.name}
      </h3>
      <div className="hud-label mb-4">{boss.title} — defeated</div>
      <p className="mb-5 text-sm italic text-slate-400">&ldquo;{boss.flavor}&rdquo;</p>
      <div className="flex items-center justify-center gap-2 rounded-lg border border-gold-500/30 bg-gold-500/10 px-4 py-2.5">
        <Zap size={16} className="text-gold-400" />
        <span className="font-mono text-sm font-bold text-gold-300 tnum">+{reward.xp} XP</span>
      </div>
    </div>
  );
}

function DamageBody({ event }) {
  return (
    <div className="text-center">
      <div className="hud-label mb-2">{event.boss.name}</div>
      <motion.div
        initial={{ scale: 1.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 18 }}
        className="mb-4 font-display text-5xl font-bold tnum text-blood-400"
        style={{ textShadow: '0 0 30px rgba(239,68,68,0.8)' }}
      >
        {event.amount.toLocaleString()}
      </motion.div>
      <div className="space-y-1.5 text-left">
        {event.hits.slice(0, 5).map((hit, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.06 }}
            className="flex items-center justify-between gap-3 rounded-md bg-white/[0.03] px-3 py-1.5 text-xs"
          >
            <span className="truncate text-slate-400">
              {hit.label}
              {hit.weakness && <span className="ml-1.5 text-gold-400">WEAKNESS</span>}
            </span>
            <span className="tnum shrink-0 font-mono text-blood-400">-{hit.amount.toLocaleString()}</span>
          </motion.div>
        ))}
      </div>
      <div className="mt-4 text-xs text-slate-500 tnum">
        {Math.min(100, Math.round((event.raid.damage / event.raid.hp) * 100))}% of the gate cleared
      </div>
    </div>
  );
}

function StreakBody({ event }) {
  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 18 }}
        className="mb-2 flex items-center justify-center gap-2"
      >
        <Flame size={40} className="text-orange-400" />
        <span
          className="font-display text-5xl font-bold tnum text-orange-300"
          style={{ textShadow: '0 0 28px rgba(251,146,60,0.7)' }}
        >
          {event.current}
        </span>
      </motion.div>
      <p className="text-sm text-slate-400">
        {event.current} day{event.current === 1 ? '' : 's'} unbroken. Keep the chain alive.
      </p>
    </div>
  );
}

export default SystemModal;
