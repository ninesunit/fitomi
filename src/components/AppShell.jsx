import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity, BookOpen, Calculator, ClipboardList, CloudOff, Dumbbell, Flame, History,
  LayoutGrid, ListChecks, LogOut, Menu, Settings, Skull, Timer, User, X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import { useWorkout } from '../context/WorkoutContext';
import { RestTimerBar } from './workout/RestTimerBar';
import { formatDuration } from '../lib/date';
import { clsx } from '../lib/clsx';

// The five destinations that live in the thumb zone.
const TABS = [
  { to: '/', label: 'Status', icon: LayoutGrid, end: true },
  { to: '/quests', label: 'Quests', icon: ListChecks },
  { to: '/workout', label: 'Train', icon: Dumbbell, primary: true },
  { to: '/raid', label: 'Raid', icon: Skull },
  { to: '/library', label: 'Codex', icon: BookOpen },
];

const MORE = [
  { to: '/routines', label: 'Routines', icon: ClipboardList },
  { to: '/profile', label: 'Hunter Profile', icon: User },
  { to: '/history', label: 'Training Log', icon: History },
  { to: '/tools', label: 'Utilities', icon: Calculator },
  { to: '/notomi', label: 'Notomi Sync', icon: Activity },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function AppShell({ children }) {
  const { profile, xp, rank, streak, offline } = useGame();
  const { active, elapsed, rest } = useWorkout();
  const { signOut } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMenuOpen(false), [location.pathname]);

  return (
    <div className="relative min-h-[100dvh]">
      <div className="grid-bg pointer-events-none fixed inset-0 opacity-30" aria-hidden />

      {/* ---------------- top status strip ---------------- */}
      <header className="sticky top-0 z-40 pad-top-safe backdrop-blur-xl">
        <div
          className="border-b"
          style={{
            background: 'linear-gradient(180deg, rgb(var(--sys-deep)/0.95), rgb(var(--sys-deep)/0.75))',
            borderColor: 'rgb(var(--sys) / 0.3)',
          }}
        >
          <div className="mx-auto flex max-w-3xl items-center gap-3 px-3 py-2">
            <Link to="/profile" className="flex shrink-0 items-center gap-2.5">
              <span
                className="flex h-9 w-9 items-center justify-center"
                style={{
                  border: `1px solid ${rank?.color || 'rgb(var(--sys))'}`,
                  background: `${rank?.color || '#7adeff'}1a`,
                  clipPath: 'polygon(7px 0,100% 0,100% calc(100% - 7px),calc(100% - 7px) 100%,0 100%,0 7px)',
                }}
              >
                <span
                  className="font-display text-sm font-bold"
                  style={{ color: rank?.color, textShadow: `0 0 10px ${rank?.glow}` }}
                >
                  {rank?.id}
                </span>
              </span>
            </Link>

            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <span className="sys-label truncate">
                  Lv {xp?.level} · {profile?.displayName || 'Hunter'}
                </span>
                <span className="sys-label tnum shrink-0">
                  {Math.round((xp?.progress || 0) * 100)}%
                </span>
              </div>
              <div className="sys-meter h-[5px]">
                <motion.div
                  className="sys-meter-fill"
                  animate={{ width: `${(xp?.progress || 0) * 100}%` }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </div>

            {streak?.current > 0 && (
              <div
                className="flex shrink-0 items-center gap-1 px-2 py-1"
                style={{
                  border: `1px solid ${streak.atRisk ? 'rgb(var(--sys-danger)/0.6)' : 'rgb(var(--sys-gold)/0.5)'}`,
                  background: streak.atRisk ? 'rgb(var(--sys-danger)/0.12)' : 'rgb(var(--sys-gold)/0.1)',
                }}
              >
                <Flame
                  size={12}
                  style={{ color: streak.atRisk ? 'rgb(var(--sys-danger))' : 'rgb(var(--sys-gold))' }}
                />
                <span className="tnum font-mono text-[11px] font-bold" style={{ color: 'rgb(var(--sys-gold))' }}>
                  {streak.current}
                </span>
              </div>
            )}

            <button
              onClick={() => setMenuOpen(true)}
              className="shrink-0 p-2 text-[rgb(var(--sys-dim))]"
              aria-label="Menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>

        {/* Live session strip — always visible while a workout is open. */}
        <AnimatePresence>
          {active && location.pathname !== '/workout' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-b"
              style={{ borderColor: 'rgb(var(--sys-good)/0.4)', background: 'rgb(var(--sys-good)/0.1)' }}
            >
              <Link to="/workout" className="mx-auto flex max-w-3xl items-center gap-2.5 px-4 py-2">
                <span className="relative flex h-2 w-2">
                  <span
                    className="absolute inline-flex h-full w-full animate-ping"
                    style={{ background: 'rgb(var(--sys-good))' }}
                  />
                  <span className="relative inline-flex h-2 w-2" style={{ background: 'rgb(var(--sys-good))' }} />
                </span>
                <span className="sys-label" style={{ color: 'rgb(var(--sys-good))' }}>
                  Session active
                </span>
                <span className="tnum ml-auto font-mono text-xs" style={{ color: 'rgb(var(--sys-good))' }}>
                  {formatDuration(elapsed)}
                </span>
                <Timer size={13} style={{ color: 'rgb(var(--sys-good))' }} />
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ---------------- content ---------------- */}
      <main className="relative mx-auto max-w-3xl px-3 pb-32 pt-3">
        {offline && (
          <div
            className="mb-3 flex items-start gap-2.5 p-3"
            style={{ border: '1px solid rgb(var(--sys-gold)/0.4)', background: 'rgb(var(--sys-gold)/0.08)' }}
          >
            <CloudOff size={15} className="mt-0.5 shrink-0" style={{ color: 'rgb(var(--sys-gold))' }} />
            <p className="text-xs leading-relaxed" style={{ color: 'rgb(var(--sys-gold))' }}>
              <span className="font-semibold">Offline.</span> Saving to this device only — your
              progress is safe and syncs when the connection returns.
            </p>
          </div>
        )}
        {children}
      </main>

      {rest && <RestTimerBar />}

      {/* ---------------- bottom tab bar ---------------- */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 pad-bottom-safe backdrop-blur-xl"
        style={{
          background: 'linear-gradient(0deg, rgb(var(--sys-deep)/0.98), rgb(var(--sys-deep)/0.86))',
          borderTop: '1px solid rgb(var(--sys) / 0.3)',
        }}
      >
        <div className="mx-auto flex max-w-md items-stretch">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                clsx(
                  'relative flex flex-1 flex-col items-center justify-center gap-1 py-2.5',
                  // 56px clears Apple's 44pt minimum with room to spare.
                  'min-h-[56px]',
                  isActive ? 'text-[rgb(var(--sys-ink))]' : 'text-[rgb(var(--sys-dim))]',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="tab-mark"
                      className="absolute inset-x-3 top-0 h-[2px]"
                      style={{ background: 'rgb(var(--sys))', boxShadow: '0 0 10px rgb(var(--sys))' }}
                    />
                  )}
                  <tab.icon
                    size={tab.primary ? 22 : 19}
                    className={isActive ? 'sys-accent' : undefined}
                    style={isActive ? { filter: 'drop-shadow(0 0 6px rgb(var(--sys)))' } : undefined}
                  />
                  <span className="font-mono text-[9px] uppercase tracking-widest">{tab.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* ---------------- settings drawer ---------------- */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
          >
            <div className="absolute inset-0 bg-[#01060f]/85 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
            <motion.nav
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 36 }}
              className="absolute right-0 top-0 flex h-full w-[78%] max-w-xs flex-col pad-top-safe"
              style={{
                background: 'linear-gradient(180deg, rgb(var(--sys-deep)/0.98), rgb(var(--sys-deep-2)/0.99))',
                borderLeft: '1px solid rgb(var(--sys) / 0.4)',
              }}
            >
              <div className="flex items-center justify-between px-4 py-4">
                <span className="sys-title text-xs">Menu</span>
                <button onClick={() => setMenuOpen(false)} className="p-1.5 text-[rgb(var(--sys-dim))]">
                  <X size={18} />
                </button>
              </div>
              <div className="sys-rule" />

              <div className="flex-1 overflow-y-auto p-3">
                {MORE.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      clsx(
                        'mb-1 flex items-center gap-3 px-3 py-3 text-sm transition-colors',
                        isActive
                          ? 'bg-[rgb(var(--sys)/0.16)] text-[rgb(var(--sys-ink))]'
                          : 'text-[rgb(var(--sys-dim))]',
                      )
                    }
                  >
                    <item.icon size={17} />
                    {item.label}
                  </NavLink>
                ))}
              </div>

              <div className="sys-rule" />
              <button
                onClick={signOut}
                className="flex items-center gap-3 px-6 py-4 text-sm pad-bottom-safe"
                style={{ color: 'rgb(var(--sys-danger))' }}
              >
                <LogOut size={17} />
                Sign out
              </button>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AppShell;
