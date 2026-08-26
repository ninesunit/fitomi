import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity, BookOpen, Calculator, CloudOff, Dumbbell, Flame, History, LayoutDashboard,
  ListChecks, LogOut, Menu, Settings, Skull, Timer, User, X, Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import { useWorkout } from '../context/WorkoutContext';
import { RankBadge } from './ui/RankBadge';
import { XpBar } from './ui/Bars';
import { RestTimerBar } from './workout/RestTimerBar';
import { formatDuration } from '../lib/date';
import { clsx } from '../lib/clsx';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/workout', label: 'Train', icon: Dumbbell },
  { to: '/quests', label: 'Quests', icon: ListChecks },
  { to: '/raid', label: 'Raid', icon: Skull },
  { to: '/library', label: 'Library', icon: BookOpen },
];

const MORE = [
  { to: '/profile', label: 'Hunter Profile', icon: User },
  { to: '/history', label: 'History', icon: History },
  { to: '/tools', label: 'Tools', icon: Calculator },
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
    <div className="min-h-screen bg-void-950">
      {/* Faint grid so the background reads as an interface, not a page. */}
      <div className="pointer-events-none fixed inset-0 bg-grid-fade bg-grid opacity-[0.35]" aria-hidden />

      {/* ---- top HUD ---- */}
      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-void-950/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
          <Link to="/" className="flex shrink-0 items-center gap-2.5">
            <RankBadge rank={rank} size={36} />
            <div className="hidden sm:block">
              <div className="font-display text-sm font-bold leading-none tracking-[0.18em] text-slate-100">
                FITOMI
              </div>
              <div className="mt-0.5 font-mono text-[10px] tracking-wider text-slate-500">
                {rank?.name} · LV {xp?.level}
              </div>
            </div>
          </Link>

          {/* XP readout doubles as the primary progress feedback everywhere. */}
          <div className="min-w-0 flex-1 px-1">
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <span className="hud-label truncate">
                {profile?.displayName || 'Hunter'}
              </span>
              <span className="tnum shrink-0 font-mono text-[10px] text-slate-500">
                {xp?.xpIntoLevel?.toLocaleString()} / {xp?.xpForLevel?.toLocaleString()}
              </span>
            </div>
            <XpBar progress={xp?.progress || 0} height="h-1.5" />
          </div>

          {streak?.current > 0 && (
            <div
              className={clsx(
                'hidden shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 xs:flex',
                streak.atRisk ? 'border-blood-500/40 bg-blood-500/10' : 'border-orange-500/30 bg-orange-500/10',
              )}
              title={streak.atRisk ? 'Streak expires soon' : `${streak.current}-day streak`}
            >
              <Flame size={14} className={streak.atRisk ? 'text-blood-400' : 'text-orange-400'} />
              <span className="tnum font-mono text-xs font-bold text-orange-200">{streak.current}</span>
            </div>
          )}

          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="shrink-0 rounded-lg border border-white/10 p-2 text-slate-300 transition hover:bg-white/5 lg:hidden"
            aria-label="Menu"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          {/* Desktop secondary nav */}
          <nav className="hidden shrink-0 items-center gap-0.5 lg:flex">
            {MORE.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  clsx(
                    'rounded-lg p-2 transition',
                    isActive ? 'bg-white/10 text-slate-100' : 'text-slate-500 hover:bg-white/5 hover:text-slate-200',
                  )
                }
                title={item.label}
              >
                <item.icon size={17} />
              </NavLink>
            ))}
            <button
              onClick={signOut}
              className="rounded-lg p-2 text-slate-500 transition hover:bg-white/5 hover:text-blood-400"
              title="Sign out"
            >
              <LogOut size={17} />
            </button>
          </nav>
        </div>

        {/* Live session banner — persistent, so you always know a session is open. */}
        <AnimatePresence>
          {active && location.pathname !== '/workout' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-mana-500/25 bg-mana-500/10"
            >
              <Link
                to="/workout"
                className="mx-auto flex max-w-6xl items-center gap-2.5 px-4 py-2 text-sm text-mana-300"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mana-400 opacity-70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-mana-400" />
                </span>
                <span className="font-medium">Session in progress</span>
                <span className="tnum ml-auto font-mono text-xs">{formatDuration(elapsed)}</span>
                <Timer size={14} />
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ---- mobile drawer ---- */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div className="absolute inset-0 bg-void-950/70 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
            <motion.nav
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 34 }}
              className="panel absolute right-0 top-0 h-full w-72 rounded-none border-y-0 border-r-0 p-4 pt-20"
            >
              <div className="mb-4 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <RankBadge rank={rank} size={44} />
                <div className="min-w-0">
                  <div className="truncate font-display font-semibold text-slate-100">
                    {profile?.displayName}
                  </div>
                  <div className="font-mono text-[11px] text-slate-500">
                    {rank?.name} · Level {xp?.level}
                  </div>
                </div>
              </div>

              <div className="space-y-0.5">
                {[...NAV, ...MORE].map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      clsx(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition',
                        isActive ? 'bg-white/10 text-slate-100' : 'text-slate-400 hover:bg-white/5',
                      )
                    }
                  >
                    <item.icon size={17} />
                    {item.label}
                  </NavLink>
                ))}
                <button
                  onClick={signOut}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-blood-400 transition hover:bg-blood-500/10"
                >
                  <LogOut size={17} />
                  Sign out
                </button>
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---- content ---- */}
      <main className="relative mx-auto max-w-6xl px-4 pb-28 pt-5 lg:pb-10">
        {offline && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-gold-500/30 bg-gold-500/10 px-4 py-3">
            <CloudOff size={16} className="mt-0.5 shrink-0 text-gold-400" />
            <p className="text-sm leading-relaxed text-gold-200">
              <span className="font-semibold">Working offline.</span> The database is unreachable, so
              everything is being saved to this device only. Your progress is safe and will sync as
              soon as the connection returns.
            </p>
          </div>
        )}
        {children}
      </main>

      {/* ---- rest timer (floats above the tab bar) ---- */}
      {rest && <RestTimerBar />}

      {/* ---- mobile tab bar ---- */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/[0.07] bg-void-950/92 backdrop-blur-xl safe-bottom lg:hidden">
        <div className="mx-auto flex max-w-lg">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                clsx(
                  'relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition',
                  isActive ? 'text-slate-100' : 'text-slate-500',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="tab-indicator"
                      className="absolute inset-x-4 top-0 h-0.5 rounded-full"
                      style={{ backgroundColor: 'rgb(var(--accent))' }}
                    />
                  )}
                  <item.icon size={19} className={isActive ? 'accent-text' : undefined} />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* ---- desktop rail ---- */}
      <nav className="fixed left-0 top-1/2 z-30 hidden -translate-y-1/2 lg:block">
        <div className="panel ml-3 flex flex-col gap-1 p-1.5">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={item.label}
              className={({ isActive }) =>
                clsx(
                  'rounded-lg p-2.5 transition',
                  isActive ? 'text-void-950' : 'text-slate-400 hover:bg-white/5 hover:text-slate-100',
                )
              }
              style={({ isActive }) => (isActive ? { backgroundColor: 'rgb(var(--accent))' } : undefined)}
            >
              <item.icon size={19} />
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

export default AppShell;
